# NEXUS Response — Crowd-Sourced Disaster Management Platform

NEXUS Response is a modern, real-time web application designed to coordinate disaster alert responses and resource allocation between Citizens, Volunteers, and Administrators. By leveraging real-time socket communication, interactive maps, and role-based workflows, the platform streamlines relief efforts during critical incidents.

🚀 **Live Deployment Link:** [Insert Live Deployment Link Here]

---

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Getting Started (Local Development)](#getting-started-local-development)
5. [Getting Started (Docker)](#getting-started-docker)
6. [Seeding the Admin Account](#seeding-the-admin-account)
7. [API Endpoints](#api-endpoints)
8. [Real-time Events (WebSockets)](#real-time-events-websockets)

---

## Key Features

### 👤 Citizen Role
- **Disaster Incident Reporting:** Create geolocated disaster reports with details and photos.
- **Resource Requests:** Ask for vital aid like food, water, medical supplies, and shelter.
- **Live Verification Cycle:** Approve and mark resource requests as resolved once received (eliminates false status updates).

### 🤝 Volunteer Role
- **Real-Time Map Alerts:** View local incidents and pending requests on an interactive map.
- **Mission Check-ins:** Check in to aid locations within a 500m geofence radius.
- **Availability Toggle:** Quickly update active status and skills list for assignment matchmaking.

### 👑 Administrator Role
- **Overview & Analytics:** Dynamic dashboard displaying status charts, active volunteer lists, and incident distributions.
- **Broadcast System:** Send real-time priority alerts to all logged-in volunteers.
- **Resource Management:** Assign tasks and monitor request-verification workflows.

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Premium UI, state routing, and responsive dashboard layouts. |
| **Styling** | Vanilla CSS | Tailored dark mode theme with rich glassmorphic elements. |
| **Mapping** | Leaflet / React-Leaflet | Open-source interactive map styling and geolocation. |
| **Backend** | Node.js (Express) | Scalable REST API with custom routing middleware. |
| **Database** | MongoDB (Mongoose) | Flexible NoSQL document models for users, tasks, and reports. |
| **Real-time** | Socket.io | Bidirectional WebSocket communication for live notifications. |
| **Container** | Docker & Docker Compose | Host-networking setup for instant platform orchestration. |

---

## Project Architecture

```
Disaster Management/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable modules (Layout, UI, Maps, Dashboard)
│   │   ├── context/            # Authentication & State management
│   │   ├── pages/              # Views (Admin, Citizen, Volunteer, Login, Register)
│   │   ├── services/           # Socket & API HTTP integration layer
│   │   └── utils/              # Local storage helpers
│   ├── Dockerfile
│   └── package.json
│
├── server/                     # Backend Application
│   ├── config/                 # DB and Socket.io setups
│   ├── controllers/            # Controller handlers
│   ├── models/                 # MongoDB Mongoose schemas
│   ├── routes/                 # Express route handlers
│   ├── uploads/                # Local media storage directory
│   ├── Dockerfile
│   ├── seed-admin.js           # Admin DB seeding script
│   └── package.json
│
└── docker-compose.yml          # Container configuration (with host networking)
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB (running on default port `27017`)

### 1. Set Up the Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables (`.env`):
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/ldarcp
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```

### 2. Set Up the Client
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure client environment:
   Make sure you have your backend connection endpoint matching the server API url (defaults to `http://localhost:5001`).
4. Start the frontend:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Getting Started (Docker)

To run the entire suite under containerization (useful for Linux hosts):

1. Make sure your local MongoDB instance is running on port `27017`.
2. Stop any local running servers on ports `5001` or `5173`.
3. In the root directory, run:
   ```bash
   sudo docker compose up --build -d
   ```
4. Open the application at [http://localhost:5173](http://localhost:5173).

---

## Seeding the Admin Account

To log in as an administrator, you need to run the admin seed script. 

### Local Development:
```bash
cd server
node seed-admin.js
```

### Docker Deployment:
```bash
sudo docker compose exec server node seed-admin.js
```

**Credentials Created:**
- **Email:** `nikhilsah905@gmail.com`
- **Password:** `nikhil@2857`
- **Role:** Admin

---

## API Endpoints

### Auth Routing (`/api/auth`)
* `POST /register` — Register a new Citizen or Volunteer.
* `POST /login` — Log in to existing account.
* `GET /me` — Fetch currently authenticated session profile.

### Disaster Reports (`/api/disasters`)
* `GET /` — Fetch all reports.
* `POST /` — Create a report (supports image file uploads via `multer`).

### Resource Requests (`/api/requests`)
* `GET /` — Fetch active requests.
* `POST /` — Create a request.
* `PATCH /:id/status` — Update task status.
* `PATCH /:id/verify` — Verify/complete request (Citizen only).

---

## Real-time Events (WebSockets)

WebSocket endpoints are managed by Socket.io and trigger instant notifications:
- `auth:join` — Join a room matching the user's role (e.g. `Admin`, `Volunteer`).
- `disaster:new` — Emits when a new report is created to notify admins/volunteers.
- `request:new` — Emits when aid requests are created.
- `broadcast:alert` — Admin alert pushed instantly to all active volunteer screens.
