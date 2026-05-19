# 🎨 Real-Time Collaborative Whiteboard

A full-stack, real-time collaborative whiteboard application supporting both 2D drawings and interactive 3D elements. Built with React, Konva, Three.js, Yjs, and an Express/SQLite backend.

## ✨ Features
* **Real-time Collaboration:** See other users' cursors and updates instantly via WebSockets and Yjs CRDTs.
* **2D Drawing Tools:** Freehand drawing, shapes (rectangles, ellipses), text boxes, sticky notes, and arrows.
* **Interactive 3D Elements:** Place and interact with 3D models (Spinning Cubes, Particle Clouds, Torus Knots, etc.) directly on the 2D canvas.
* **Media Support:** Drag and drop images directly onto the board.
* **Persistence:** All whiteboard data is automatically persisted using a local SQLite database.
* **Infinite Canvas:** Pan and zoom freely around an infinite workspace.
* **Export/Import:** Save your whiteboard state as a JSON file and import it later.

---

## 🛠️ Tech Stack
* **Frontend:** React, Vite, TailwindCSS, Zustand
* **Canvas Engine:** React-Konva (2D), Three.js (3D)
* **Real-Time Sync:** Yjs, y-websocket, y-protocols
* **Backend:** Node.js, Express, `ws` (WebSockets)
* **Database:** SQLite (`better-sqlite3`)

---

## 🚀 Getting Started

Follow these stepwise instructions to set up the project locally.

### 1. Prerequisites
Make sure you have Node.js installed (v18 or higher is recommended).

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root of your project directory based on `.env.example` (or simply create one with the following defaults):
```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```
*(The SQLite database will automatically be created in a `data/` folder inside the project).*

### 4. Running the Development Server
You can run both the frontend (Vite) and the backend (Express/WebSocket) concurrently using:
```bash
npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend & WebSockets:** `http://localhost:3001`

---

## 📦 Production Build & Deployment

To deploy the application in a production environment, follow these steps:

### 1. Build the Frontend
Compile the React application into optimized static assets:
```bash
npm run build
```
This command generates a `dist/` folder containing the optimized frontend code.

### 2. Configure Production Environment
Ensure your `.env` file is configured correctly for your production server:
```env
PORT=80
CLIENT_ORIGIN=https://your-domain.com
```

### 3. Start the Production Server
Start the Node.js server in production mode. This will serve the static files from the `dist/` folder and start the WebSocket synchronization server simultaneously:
```bash
npm start
```
*Note: The `start` script uses `cross-env NODE_ENV=production` automatically to ensure maximum security and performance.*

---

## 🔒 Security Measures Implemented
* **DDoS & Rate Limiting:** API endpoints are protected using `express-rate-limit` and maximum payload sizes.
* **CSWSH Protection:** WebSocket connections strictly validate the `Origin` header against `CLIENT_ORIGIN`.
* **XSS & Prototype Pollution Prevention:** Strict schema validation during JSON imports and image URL sanitization.
* **Path Traversal Protection:** Board IDs are strictly sanitized.

---

## 📝 License
This project is for educational and portfolio purposes.
