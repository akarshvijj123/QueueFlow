# QueueFlow

**QueueFlow** is a modern, lightweight digital queue-management solution designed for high-footfall organizations such as hospitals, clinics, banks, government services, and customer care centers.

---

## 🚀 Features

- **Digital Tokens**: Give customers digital tokens accessible on any mobile device.
- **Live Queue Tracking**: Customers track position, people ahead, and estimated wait times in real-time.
- **Operational Admin Dashboard**: Counter operators can **Call Next**, **Pause Queue**, **Resume Queue**, and add walk-in tokens with instant visual updates.
- **Real-Time Cross-Tab State Sync**: Admin queue controls sync seamlessly across browser tabs via `localStorage` state management.
- **Pure CSS Analytics**: Built-in throughput statistics, hourly volume bar charts, and wait time breakdowns without external charting dependencies.
- **Zero Build / Framework-Free**: Built strictly with standard HTML, CSS, and Vanilla JavaScript. Fast, easy, and ready to deploy anywhere.

---

## 🎨 Design System

- **Clean & Trustworthy Aesthetics**: Built with an off-white background, dark navy text, crisp teal/emerald main accents (`#0d9488`), and clean status badges (Green / Amber / Red).
- **No Heavy Frameworks**: No React, Vite, Node, Tailwind, or Bootstrap required.

---

## 📁 Project Structure

```
QueueFlow/
├── index.html        # Landing page with realistic hero queue ticket display
├── customer.html     # Mobile-friendly customer queue token generator & live status
├── admin.html        # Operational staff dashboard for counter operators
├── analytics.html    # Service analytics & hourly queue volume throughput reports
├── style.css         # Unified stylesheet (Design system tokens, components, responsive layout)
└── script.js        # Central state manager & real-time local storage synchronization
```

---

## 🛠️ How to Run Locally

Because QueueFlow requires zero build process, you can run it instantly using any of the following methods:

### Method 1: Direct File Opening
Double-click `index.html` to open it directly in any modern web browser.

### Method 2: Python HTTP Server
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your web browser.

---

## 🎬 Showcase Demo Flow

1. Open `index.html` to view the homepage and hero queue card.
2. Click **Join a Queue** to open `customer.html`.
3. Select **General Consultation** and click **Get Digital Token** (Generates token `A-024`).
4. Open `admin.html` in another tab or window.
5. Click **CALL NEXT** to advance the queue from `A-018` to `A-019`. Watch the waiting count drop and current token update.
6. Return to `customer.html` to watch your position and estimated wait time update live!
7. Open `analytics.html` to inspect peak hour queue volume and service statistics.

---

## 🌐 Deployment

Deployable instantly to **GitHub Pages**, **Netlify**, or **Vercel** with zero configuration required.
