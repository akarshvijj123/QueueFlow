/**
 * QueueFlow - Central Application Logic & Local State Sync
 */

(function () {
  'use strict';

  // Default state payload
  const DEFAULT_STATE = {
    orgName: 'CityCare Hospital',
    department: 'General Consultation',
    currentlyServing: {
      token: 'A-018',
      name: 'Marcus Vance',
      service: 'General Consultation',
      counter: 'Desk 3',
      calledAt: '10:42 AM'
    },
    waitingList: [
      { token: 'A-019', name: 'Elena Rostova', service: 'General Consultation', waitMinutes: 14, status: 'Waiting' },
      { token: 'A-020', name: 'David Chen', service: 'General Consultation', waitMinutes: 12, status: 'Waiting' },
      { token: 'A-021', name: 'Sarah Jenkins', service: 'Pharmacy', waitMinutes: 10, status: 'Waiting' },
      { token: 'A-022', name: 'Michael Chang', service: 'Laboratory', waitMinutes: 8, status: 'Waiting' },
      { token: 'A-023', name: 'Priya Sharma', service: 'General Consultation', waitMinutes: 5, status: 'Waiting' }
    ],
    completedCount: 86,
    averageWaitMinutes: 17,
    isPaused: false,
    nextSequenceNum: 24, // Produces A-024 for demo customer
    myTicket: null // Stores current customer session token if joined
  };

  // State Manager
  window.QueueFlowApp = {
    getState: function () {
      try {
        const stored = localStorage.getItem('queueflow_state');
        if (!stored) {
          this.saveState(DEFAULT_STATE);
          return DEFAULT_STATE;
        }
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Could not read state from localStorage', e);
        return DEFAULT_STATE;
      }
    },

    saveState: function (state) {
      try {
        localStorage.setItem('queueflow_state', JSON.stringify(state));
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('queueflow_state_change', { detail: state }));
      } catch (e) {
        console.warn('Could not save state to localStorage', e);
      }
    },

    resetState: function () {
      this.saveState(DEFAULT_STATE);
      return DEFAULT_STATE;
    },

    // Actions
    callNext: function () {
      const state = this.getState();
      if (state.isPaused) {
        alert('Queue is currently paused. Please resume the queue before calling the next customer.');
        return false;
      }
      if (state.waitingList.length === 0) {
        alert('No more customers waiting in the queue!');
        return false;
      }

      // Shift first item from waiting list
      const nextCustomer = state.waitingList.shift();
      state.completedCount += 1;
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      state.currentlyServing = {
        token: nextCustomer.token,
        name: nextCustomer.name,
        service: nextCustomer.service,
        counter: 'Desk 3',
        calledAt: timeStr
      };

      // Decrease wait minutes for remaining customers
      state.waitingList.forEach(item => {
        if (item.waitMinutes > 2) {
          item.waitMinutes -= 2;
        }
      });

      this.saveState(state);
      return true;
    },

    togglePause: function () {
      const state = this.getState();
      state.isPaused = !state.isPaused;
      this.saveState(state);
      return state.isPaused;
    },

    joinQueue: function (serviceName, customerName) {
      const state = this.getState();
      const seq = state.nextSequenceNum++;
      const token = `A-0${seq}`;
      const name = customerName || 'Demo Customer';

      // Calculated estimated wait (approx 3 mins per person ahead)
      const peopleAhead = state.waitingList.length;
      const estWait = Math.max(3, (peopleAhead + 1) * 3);

      const newTicket = {
        token: token,
        name: name,
        service: serviceName || 'General Consultation',
        waitMinutes: estWait,
        status: 'Waiting'
      };

      state.waitingList.push(newTicket);
      state.myTicket = newTicket;
      this.saveState(state);
      return newTicket;
    },

    leaveQueue: function () {
      const state = this.getState();
      if (state.myTicket) {
        const userToken = state.myTicket.token;
        state.waitingList = state.waitingList.filter(item => item.token !== userToken);
        state.myTicket = null;
        this.saveState(state);
      }
    }
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function () {
    // Ensure state exists
    const state = QueueFlowApp.getState();

    // Setup tab synchronization
    window.addEventListener('storage', function (e) {
      if (e.key === 'queueflow_state') {
        const newState = JSON.parse(e.newValue);
        updateUI(newState);
      }
    });

    window.addEventListener('queueflow_state_change', function (e) {
      updateUI(e.detail);
    });

    // Page Specific Initializers
    initPageViews(state);
  });

  function updateUI(state) {
    if (document.body.classList.contains('page-customer')) {
      renderCustomerPage(state);
    } else if (document.body.classList.contains('page-admin')) {
      renderAdminPage(state);
    } else if (document.body.classList.contains('page-landing')) {
      renderLandingHeroTicket(state);
    } else if (document.body.classList.contains('page-analytics')) {
      renderAnalyticsPage(state);
    }
  }

  function initPageViews(state) {
    if (document.body.classList.contains('page-customer')) {
      setupCustomerPage(state);
    } else if (document.body.classList.contains('page-admin')) {
      setupAdminPage(state);
    } else if (document.body.classList.contains('page-landing')) {
      renderLandingHeroTicket(state);
      setupLandingInteractions();
    } else if (document.body.classList.contains('page-analytics')) {
      renderAnalyticsPage(state);
    }
  }

  // ==========================================
  // LANDING PAGE LOGIC
  // ==========================================
  function renderLandingHeroTicket(state) {
    const heroNowServing = document.getElementById('hero-now-serving');
    const heroUserToken = document.getElementById('hero-user-token');
    const heroPeopleAhead = document.getElementById('hero-people-ahead');
    const heroEstWait = document.getElementById('hero-est-wait');

    if (heroNowServing) heroNowServing.textContent = state.currentlyServing ? state.currentlyServing.token : '---';
    if (heroUserToken) heroUserToken.textContent = state.myTicket ? state.myTicket.token : 'A-024';

    if (heroPeopleAhead) {
      let ahead = 6;
      if (state.myTicket) {
        const idx = state.waitingList.findIndex(i => i.token === state.myTicket.token);
        ahead = idx >= 0 ? idx : 0;
      }
      heroPeopleAhead.textContent = ahead;
    }

    if (heroEstWait) {
      let ahead = 6;
      if (state.myTicket) {
        const idx = state.waitingList.findIndex(i => i.token === state.myTicket.token);
        ahead = idx >= 0 ? idx : 0;
      }
      heroEstWait.textContent = `${ahead * 3} min`;
    }
  }

  function setupLandingInteractions() {
    // Quick Demo Action buttons
    const demoJoinBtn = document.getElementById('hero-join-demo-btn');
    if (demoJoinBtn) {
      demoJoinBtn.addEventListener('click', function () {
        // Pre-join demo token A-024
        const state = QueueFlowApp.getState();
        if (!state.myTicket) {
          QueueFlowApp.joinQueue('General Consultation', 'Demo User');
        }
        window.location.href = 'customer.html';
      });
    }
  }

  // ==========================================
  // CUSTOMER PAGE LOGIC
  // ==========================================
  function setupCustomerPage(state) {
    const joinForm = document.getElementById('customer-join-form');
    const leaveBtn = document.getElementById('btn-leave-queue');
    const simAdvanceBtn = document.getElementById('btn-sim-advance');

    // Service selector buttons
    const serviceBtns = document.querySelectorAll('.service-option-btn');
    let selectedService = 'General Consultation';

    serviceBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        serviceBtns.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedService = this.getAttribute('data-service');
      });
    });

    if (joinForm) {
      joinForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameInput = document.getElementById('customer-name-input');
        const customerName = nameInput ? nameInput.value.trim() : 'Customer';
        QueueFlowApp.joinQueue(selectedService, customerName);
      });
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to leave the queue? Your token will be cancelled.')) {
          QueueFlowApp.leaveQueue();
        }
      });
    }

    if (simAdvanceBtn) {
      simAdvanceBtn.addEventListener('click', function () {
        QueueFlowApp.callNext();
      });
    }

    renderCustomerPage(state);
  }

  function renderCustomerPage(state) {
    const joinSection = document.getElementById('customer-join-section');
    const statusSection = document.getElementById('customer-status-section');

    const tokenNumEl = document.getElementById('cust-token-num');
    const serviceTagEl = document.getElementById('cust-service-tag');
    const nowServingEl = document.getElementById('cust-now-serving');
    const positionEl = document.getElementById('cust-position');
    const aheadEl = document.getElementById('cust-people-ahead');
    const estWaitEl = document.getElementById('cust-est-wait');
    const progressFill = document.getElementById('cust-progress-fill');
    const progressText = document.getElementById('cust-progress-text');
    const notifBanner = document.getElementById('cust-notification');

    // If user has not joined yet, show join form or offer preset A-024
    if (!state.myTicket) {
      if (joinSection) joinSection.style.display = 'block';
      if (statusSection) statusSection.style.display = 'none';
      return;
    }

    // Customer is in queue!
    if (joinSection) joinSection.style.display = 'none';
    if (statusSection) statusSection.style.display = 'block';

    const myToken = state.myTicket.token;
    if (tokenNumEl) tokenNumEl.textContent = myToken;
    if (serviceTagEl) serviceTagEl.textContent = state.myTicket.service;

    const currentlyServingToken = state.currentlyServing ? state.currentlyServing.token : 'None';
    if (nowServingEl) nowServingEl.textContent = currentlyServingToken;

    // Is it currently serving user's token?
    if (currentlyServingToken === myToken) {
      if (positionEl) positionEl.textContent = 'NOW';
      if (aheadEl) aheadEl.textContent = '0';
      if (estWaitEl) estWaitEl.textContent = '0 min';
      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'Turn reached!';

      if (notifBanner) {
        notifBanner.className = 'notification-banner success';
        notifBanner.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <div><strong>IT'S YOUR TURN!</strong> Please proceed to Desk 3 immediately.</div>
        `;
      }
      return;
    }

    // Find position in waiting list
    const posIndex = state.waitingList.findIndex(item => item.token === myToken);

    if (posIndex === -1) {
      // Token completed or removed
      if (positionEl) positionEl.textContent = 'Done';
      if (aheadEl) aheadEl.textContent = '0';
      if (estWaitEl) estWaitEl.textContent = '0 min';
      if (progressFill) progressFill.style.width = '100%';

      if (notifBanner) {
        notifBanner.className = 'notification-banner success';
        notifBanner.innerHTML = `<div>Your service session has been completed. Thank you!</div>`;
      }
      return;
    }

    const peopleAhead = posIndex;
    const position = posIndex + 1;
    const estMinutes = Math.max(2, (peopleAhead + 1) * 3);

    if (positionEl) positionEl.textContent = position;
    if (aheadEl) aheadEl.textContent = peopleAhead;
    if (estWaitEl) estWaitEl.textContent = `${estMinutes} min`;

    // Progress percentage calculation
    const totalQueueLength = Math.max(10, state.waitingList.length + 5);
    const progressPercent = Math.min(95, Math.max(10, Math.round(((totalQueueLength - peopleAhead) / totalQueueLength) * 100)));
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${peopleAhead} people remaining before your turn`;

    // Notification banners
    if (notifBanner) {
      if (peopleAhead <= 2) {
        notifBanner.className = 'notification-banner warning';
        notifBanner.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div><strong>Your turn is approaching!</strong> Please stay nearby Desk 3.</div>
        `;
      } else {
        notifBanner.className = 'notification-banner info';
        notifBanner.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>You are in the queue. We will notify you when your turn is close.</div>
        `;
      }
    }
  }

  // ==========================================
  // ADMIN DASHBOARD LOGIC
  // ==========================================
  function setupAdminPage(state) {
    const btnCallNext = document.getElementById('admin-btn-call-next');
    const btnTogglePause = document.getElementById('admin-btn-toggle-pause');
    const btnAddWalkin = document.getElementById('admin-btn-add-walkin');
    const btnResetDemo = document.getElementById('admin-btn-reset-demo');

    if (btnCallNext) {
      btnCallNext.addEventListener('click', function () {
        QueueFlowApp.callNext();
      });
    }

    if (btnTogglePause) {
      btnTogglePause.addEventListener('click', function () {
        QueueFlowApp.togglePause();
      });
    }

    if (btnAddWalkin) {
      btnAddWalkin.addEventListener('click', function () {
        const name = prompt('Enter Walk-in Customer Name:', 'Walk-in Customer');
        if (name) {
          QueueFlowApp.joinQueue('General Consultation', name);
        }
      });
    }

    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', function () {
        if (confirm('Reset queue demo state to default values?')) {
          QueueFlowApp.resetState();
        }
      });
    }

    renderAdminPage(state);
  }

  function renderAdminPage(state) {
    // Stat counters
    const countWaiting = document.getElementById('admin-stat-waiting');
    const countServing = document.getElementById('admin-stat-serving');
    const countCompleted = document.getElementById('admin-stat-completed');
    const countAvgWait = document.getElementById('admin-stat-avg-wait');

    if (countWaiting) countWaiting.textContent = state.waitingList.length;
    if (countServing) countServing.textContent = state.currentlyServing ? '1' : '0';
    if (countCompleted) countCompleted.textContent = state.completedCount;
    if (countAvgWait) countAvgWait.textContent = `${state.averageWaitMinutes} min`;

    // Currently serving display
    const servingTokenEl = document.getElementById('admin-serving-token');
    const servingNameEl = document.getElementById('admin-serving-name');
    const servingServiceEl = document.getElementById('admin-serving-service');
    const servingTimeEl = document.getElementById('admin-serving-time');

    if (state.currentlyServing) {
      if (servingTokenEl) servingTokenEl.textContent = state.currentlyServing.token;
      if (servingNameEl) servingNameEl.textContent = state.currentlyServing.name;
      if (servingServiceEl) servingServiceEl.textContent = state.currentlyServing.service;
      if (servingTimeEl) servingTimeEl.textContent = state.currentlyServing.calledAt;
    } else {
      if (servingTokenEl) servingTokenEl.textContent = '---';
      if (servingNameEl) servingNameEl.textContent = 'None';
      if (servingServiceEl) servingServiceEl.textContent = '-';
      if (servingTimeEl) servingTimeEl.textContent = '-';
    }

    // Queue Pause Status indicator & Toggle Button text
    const btnTogglePause = document.getElementById('admin-btn-toggle-pause');
    const statusBadge = document.getElementById('admin-queue-status-badge');

    if (statusBadge) {
      if (state.isPaused) {
        statusBadge.className = 'badge badge-amber';
        statusBadge.innerHTML = `<span class="badge-dot"></span> QUEUE PAUSED`;
      } else {
        statusBadge.className = 'badge badge-green';
        statusBadge.innerHTML = `<span class="badge-dot"></span> QUEUE ACTIVE`;
      }
    }

    if (btnTogglePause) {
      if (state.isPaused) {
        btnTogglePause.className = 'btn btn-warning btn-sm';
        btnTogglePause.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg> RESUME QUEUE`;
      } else {
        btnTogglePause.className = 'btn btn-secondary btn-sm';
        btnTogglePause.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> PAUSE QUEUE`;
      }
    }

    // Render Queue Table
    const tableBody = document.getElementById('admin-queue-table-body');
    if (!tableBody) return;

    if (state.waitingList.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No customers currently waiting in queue.
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    state.waitingList.forEach((item, index) => {
      const isUserToken = state.myTicket && state.myTicket.token === item.token;
      const highlightBg = isUserToken ? 'style="background-color: var(--accent-teal-light);"' : '';

      rowsHtml += `
        <tr ${highlightBg}>
          <td class="token-cell">
            ${item.token} ${isUserToken ? '<span class="badge badge-blue" style="font-size: 0.7rem;">DEMO USER</span>' : ''}
          </td>
          <td><strong>${item.name}</strong></td>
          <td>${item.service}</td>
          <td>${item.waitMinutes} min</td>
          <td><span class="badge badge-amber"><span class="badge-dot"></span> Waiting</span></td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;
  }

  // ==========================================
  // ANALYTICS PAGE LOGIC
  // ==========================================
  function renderAnalyticsPage(state) {
    const totalCustomersEl = document.getElementById('analytics-total-customers');
    const avgWaitEl = document.getElementById('analytics-avg-wait');

    if (totalCustomersEl) totalCustomersEl.textContent = state.completedCount;
    if (avgWaitEl) avgWaitEl.textContent = `${state.averageWaitMinutes} min`;

    // Dynamic bar chart interactions or filter setup
    const timeFilter = document.getElementById('analytics-time-filter');
    if (timeFilter) {
      timeFilter.addEventListener('change', function () {
        // Simple visual refresh simulation
        const bars = document.querySelectorAll('.bar-fill');
        bars.forEach(bar => {
          const currentH = parseFloat(bar.style.height || '50%');
          const newH = Math.min(100, Math.max(20, currentH + (Math.random() * 20 - 10)));
          bar.style.height = `${newH}%`;
        });
      });
    }
  }

})();
