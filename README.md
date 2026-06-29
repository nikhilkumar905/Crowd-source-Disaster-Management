# NEXUS Response — Crowd-Sourced Disaster Management Platform

NEXUS Response is a modern, real-time web application designed to coordinate disaster alert responses and resource allocation between Citizens, Volunteers, and Administrators. By leveraging real-time socket communication, interactive maps, and role-based workflows, the platform streamlines relief efforts during critical incidents.

🚀 **Live Deployment Link:** [[ Live Deployment Link ](https://crowd-source-disaster-management.vercel.app/)]

---

## Table of Contents
1. [Key Features In-Depth](#key-features-in-depth)
2. [Security Architecture & Features](#security-architecture--features)
3. [Tech Stack](#tech-stack)
4. [Project Architecture](#project-architecture)
5. [Getting Started (Local Development for Windows)](#getting-started-local-development-for-windows)
6. [Getting Started (Docker for Windows)](#getting-started-docker-for-windows)
7. [Seeding the Admin Account](#seeding-the-admin-account)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Real-time Events (WebSockets)](#real-time-events-websockets)

---

## Key Features In-Depth

### 👤 Citizen Role
* **Disaster Incident Reporting:** Create geolocated disaster reports with categories, descriptions, severity, and photo uploads (via multipart/form-data upload support).
* **Resource Requests:** Ask for vital aid like food, water, medical supplies, search & rescue, and shelter.
* **Live Verification Cycle:** Approve and mark resource requests as resolved once received. Only the Citizen who created the request can close it, which eliminates fake status updates by malicious actors or mistakes by volunteers.

### 🤝 Volunteer Role
* **Interactive Live Map Alerts:** View local incidents and pending requests on a Leaflet-powered map.
* **Geofenced Check-ins:** Check in to aid locations within a 500m geofence radius. The application uses client-side GPS coordinates to verify physical proximity before allowing status updates.
* **Availability Toggle:** Quickly update active status and skills list for automated assignment matchmaking.

### 👑 Administrator Role
* **Overview & Analytics Dashboard:** Dynamic dashboard displaying real-time status charts, active volunteer lists, and incident distributions.
* **Broadcast System:** Send real-time priority alerts to all active volunteer screens simultaneously via WebSockets.
* **Resource Management:** Assign tasks and monitor request-verification workflows.

---

## Security Architecture & Features

To ensure data integrity, user privacy, and server stability, the platform implements several layers of security:

1. **Environment Variables Separation (.env)**
   * Sensitive credentials (database passwords, private keys, API secrets) are kept out of source code.
   * `.env` files are ignored in Git using `.gitignore` rules to prevent credentials leaks. A template file `.env.example` is provided to define required keys.
2. **Password Hashing (bcrypt)**
   * All passwords are encrypted using bcrypt hashing before being stored in the database.
   * Secure comparisons are performed during login transactions without decrypting the passwords.
3. **JSON Web Tokens (JWT) Session Protection**
   * Sessions are stateless and secured using cryptographically signed JSON Web Tokens.
   * Middleware validates client tokens on every request to protected routes.
4. **Role-Based Access Control (RBAC)**
   * Endpoint protection middleware ensures only users with the correct roles (`Admin`, `Volunteer`, `Citizen`) can access or mutate sensitive database entries.
5. **CORS (Cross-Origin Resource Sharing) Configuration**
   * Configured to only allow requests originating from verified client URLs. Unauthorized external origins are blocked.

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
| **Container** | Docker & Docker Compose | Containerized system with host-networking setups. |

---

## Project Architecture

```text
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

## Getting Started (Local Development for Windows)

Follow these step-by-step instructions to run the project locally on your Windows machine using Command Prompt (CMD) or PowerShell.

### Prerequisites
* **Node.js** (v18 or higher recommended). Download from [nodejs.org](https://nodejs.org/).
* **MongoDB Community Server** (running locally on port `27017`) **OR** a **MongoDB Atlas Cloud Database**. Download from [mongodb.com](https://www.mongodb.com/try/download/community).

---

### Step 1: Set Up the Server

1. Open a Command Prompt or PowerShell window, and navigate to the project directory:
   ```cmd
   cd "C:\path\to\Disaster Management"
   ```
2. Navigate to the `server` folder:
   ```cmd
   cd server
   ```
3. Install the dependencies:
   ```cmd
   npm install
   ```
4. Create your local configuration file from the example template:
   ```cmd
   copy .env.example .env
   ```
5. Open the newly created `server\.env` file in your editor (e.g., VS Code or Notepad) and update your configuration:
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
6. Start the backend server process:
   ```cmd
   npm run dev
   ```
   *You should see a message indicating the server is running on port 5001 and connected to the database successfully.*

---

### Step 2: Set Up the Client

1. Open a **new, separate** Command Prompt or PowerShell window.
2. Navigate to the `client` folder:
   ```cmd
   cd "C:\path\to\Disaster Management\client"
   ```
3. Install dependencies:
   ```cmd
   npm install
   ```
4. Start the frontend client dev server:
   ```cmd
   npm run dev
   ```
5. Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## Getting Started (Docker for Windows)

You can run the entire suite using Docker Desktop without installing Node.js or MongoDB locally.

### Prerequisites
* **Docker Desktop** installed and running on Windows. Download from [docker.com](https://www.docker.com/products/docker-desktop/).
* Make sure your WSL 2 backend or Hyper-V is enabled and working in Docker settings.

---

### Step-by-Step Run:

1. Open your Command Prompt or PowerShell window in the root directory:
   ```cmd
   cd "C:\path\to\Disaster Management"
   ```
2. Navigate to the `server` folder, copy the environment file, and edit it:
   ```cmd
   cd server
   copy .env.example .env
   cd ..
   ```
3. Ensure no local servers or databases are occupying ports `5001` or `5173`.
4. Start the containers using Docker Compose:
   ```cmd
   docker compose up --build -d
   ```
   *(Note: No `sudo` is needed on Windows).*
5. Open your web browser to access the client: **[http://localhost:5173](http://localhost:5173)**

---

## Seeding the Admin Account

To access the administrator features, you must populate the database with the default admin account.

### For Local Development:
1. Open a command window in the `server` folder:
   ```cmd
   cd "C:\path\to\Disaster Management\server"
   ```
2. Execute the seeding script:
   ```cmd
   node seed-admin.js
   ```

### For Docker Deployments:
1. From the root directory, execute the script inside the running server container:
   ```cmd
   docker compose exec server node seed-admin.js
   ```

**Default Credentials Created:**
* **Email:** `nikhilsah905@gmail.com`
* **Password:** `nikhil@6789`
* **Role:** Admin

---

## API Endpoints Reference

### Auth Routing (`/api/auth`)
* `POST /register` — Register a new Citizen or Volunteer.
* `POST /login` — Log in to an existing account.
* `GET /me` — Fetch the currently authenticated session profile.

### Disaster Reports (`/api/disasters`)
* `GET /` — Fetch all reports.
* `POST /` — Create an incident report (supports image file uploads via `multer`).

### Resource Requests (`/api/requests`)
* `GET /` — Fetch active requests.
* `POST /` — Create a request.
* `PATCH /:id/status` — Update task status.
* `PATCH /:id/verify` — Verify/complete request (Citizen only).

---

## Real-time Events (WebSockets)

WebSocket connections are managed by Socket.io and trigger instant, bidirectional updates:
* `auth:join` — Join a room matching the user's role (e.g. `Admin`, `Volunteer`).
* `disaster:new` — Emits when a new report is created to notify admins/volunteers.
* `request:new` — Emits when aid requests are created.
* `broadcast:alert` — Admin alert pushed instantly to all active volunteer screens.
