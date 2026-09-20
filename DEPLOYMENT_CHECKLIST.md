# CampusConnect — Production Deployment Checklist & Operations Runbook

This document is the official guide and checklist for deploying **CampusConnect** (Spring Boot 3.2.5 + Java 21 backend, React + Vite frontend, MySQL database) to cloud infrastructure.

---

## 1. Required Environment Variables

### Backend Environment Variables (`prod` Profile)

| Variable | Required? | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **YES** | `prod` | Activates production profile with strict validations. |
| `PORT` | Optional | `8080` | Port for the HTTP server (automatically supplied by Render/Railway/Heroku). |
| `DB_URL` | **YES** | `jdbc:mysql://host:port/dbname?useSSL=true&serverTimezone=UTC` | Hosted MySQL JDBC connection URL. |
| `DB_USERNAME` | **YES** | `db_user` | Hosted MySQL database username. |
| `DB_PASSWORD` | **YES** | `StrongDbPass#2024!` | Hosted MySQL database password. |
| `JWT_SECRET` | **YES** | `a-64-character-hex-or-base64-random-string` | 256-bit cryptographically secure signing secret. |
| `JWT_EXPIRATION` | Optional | `86400000` | Token expiration in milliseconds (default: 24 hours). |
| `CORS_ALLOWED_ORIGINS` | **YES** | `https://campusconnect.vercel.app` | Comma-separated list of allowed frontend domain(s). |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Optional | `validate` (`update` on 1st run) | Hibernate schema mode. Set to `update` on first deployment to auto-create tables, then switch to `validate`. |
| `APP_SEEDER_ENABLED` | Optional | `false` | Must remain `false` in production (or `true` only on first boot to seed initial admin/faculty). |
| `APP_SEEDER_ADMIN_PASSWORD` | Optional | `StrongAdminPass2024!` | Password used if seeding initial admin user. |
| `APP_UPLOAD_DIR` | Optional | `uploads/study-materials` | Directory path for local file storage. |

### Frontend Environment Variables (Vite Build / Vercel)

| Variable | Required? | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **YES** | `https://campusconnect-backend.onrender.com/api` | Full URL to the backend `/api` path. |

---

## 2. JWT Secret Generation

Never use development fallback keys or dictionary words for signing JWTs. Generate a 256-bit (or 512-bit) cryptographically random secret before deployment.

### Option A: Using OpenSSL (Linux / Mac / Git Bash)
```bash
openssl rand -base64 48
```

### Option B: Using PowerShell (Windows)
```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Set the generated output as the `JWT_SECRET` environment variable in your cloud platform dashboard.

---

## 3. Database Setup (Hosted MySQL)

CampusConnect requires MySQL 8.x. Compatible free/low-cost hosted providers:
- **Aiven for MySQL** (Free tier available)
- **Railway MySQL** (1-click provision)
- **Clever Cloud** (Free MySQL tier)
- **AWS RDS / DigitalOcean Managed Databases**

### Initial Database Initialization Steps:
1. Create an empty database called `campus_connect_db` on your cloud provider (e.g., Aiven / Railway).
2. For the **first deployment**, set the environment variable in your cloud dashboard:
   - `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
   - *(Optional)* `APP_SEEDER_ENABLED=true` and `APP_SEEDER_ADMIN_PASSWORD=YourCustomPassword` if you wish to seed initial Admin & Faculty accounts.
3. Once the backend boots and successfully generates all tables, edit your cloud dashboard environment variables:
   - Set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` (or remove the variable, as `validate` is the production default).
   - Set `APP_SEEDER_ENABLED=false`.
4. This ensures that in subsequent production restarts and deployments, Hibernate will strictly validate tables without executing destructive `DROP` or `ALTER` operations on live user data.

---

## 4. File Storage Warning (Ephemeral Filesystems)

> [!WARNING]
> Free and serverless cloud containers (Render Free, Railway without volumes, Heroku, AWS ECS Fargate) use **ephemeral disks**.
> Any files uploaded to `uploads/study-materials` on local disk will be wiped when the container sleeps, restarts, or deploys an update.

### Recommended Solutions for Production Files:
1. **Persistent Volume**: Attach a persistent disk to your service container (e.g. Railway Volume mounted to `/app/uploads` or Render Disk mounted to `/app/uploads`).
2. **Cloud Object Storage (S3 / Cloudinary)**: The backend code implements `StorageService` interface (`com.campusconnect.service.StorageService`). You can provide an S3/Cloudinary implementation without changing existing controllers or business logic.

---

## 5. Backend Deployment (Step-by-Step)

### Option A: Deploying via Docker (Render / Railway / Fly.io)
1. Push your repository to GitHub.
2. In your cloud dashboard (e.g. **Render**):
   - Choose **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Set **Root Directory** to `campus-connect-backend`.
   - Set **Environment** to `Docker`.
   - Set **Branch** to `main`.
3. Add Environment Variables in the service settings:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `DB_URL=jdbc:mysql://<host>:<port>/<database>?useSSL=true&serverTimezone=UTC`
   - `DB_USERNAME=<your_db_username>`
   - `DB_PASSWORD=<your_db_password>`
   - `JWT_SECRET=<your_generated_jwt_secret>`
   - `CORS_ALLOWED_ORIGINS=https://<your-frontend-app>.vercel.app`
   - `APP_SEEDER_ENABLED=false`
4. Set Health Check Path: `/api/health`.
5. Click **Create Web Service**.

### Option B: Deploying with Prebuilt JAR (AWS EC2 / Virtual Server)
```bash
# Build production JAR
cd campus-connect-backend
mvn clean package -DskipTests

# Run with production environment variables
export SPRING_PROFILES_ACTIVE=prod
export DB_URL="jdbc:mysql://localhost:3306/campus_connect_db?useSSL=false"
export DB_USERNAME="cc_user"
export DB_PASSWORD="secure_password"
export JWT_SECRET="your-generated-jwt-secret-at-least-32-chars"
export CORS_ALLOWED_ORIGINS="https://yourdomain.com"
export APP_SEEDER_ENABLED="false"
export PORT="8080"

java -jar target/campus-connect-backend-0.0.1-SNAPSHOT.jar
```

---

## 6. Frontend Deployment (Vercel / Netlify)

Deploying the React + Vite frontend to **Vercel**:

1. Log into [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. In project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `campus-connect-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://<your-backend-service>.onrender.com/api` (ensure it includes `/api` and no trailing slash)
5. Click **Deploy**.
6. Note your generated Vercel domain (e.g., `https://campusconnect-six.vercel.app`) and ensure this URL is added to the backend's `CORS_ALLOWED_ORIGINS` variable!

---

## 7. Post-Deployment Verification Checklist

Execute these smoke tests immediately after deploying:

- [ ] **1. Health Check Verification**:
  Open `https://<backend-url>/api/health` in your browser.
  - Expected: HTTP `200 OK`
  - Body: `{"status":"UP"}`
- [ ] **2. CORS Verification**:
  Open DevTools -> Network tab on your frontend. Initiate a login request.
  - Confirm request header `Origin: https://your-frontend.vercel.app`.
  - Confirm response header `Access-Control-Allow-Origin: https://your-frontend.vercel.app`.
  - Confirm no CORS errors appear in console.
- [ ] **3. Authentication & Roles**:
  - Register a new Student account from `/register/student`.
  - Log in and verify redirection to `/dashboard`.
  - Verify token is saved in localStorage.
  - Try accessing faculty/admin tabs to verify 403 Forbidden protection.
- [ ] **4. SPA Routing / Refresh Test**:
  - Log in and navigate to `/dashboard`.
  - Press browser refresh (`F5` or `Ctrl+R`).
  - Verify page reloads correctly and does **not** return a 404 error (handled by `vercel.json` rewrites).
- [ ] **5. File Upload Verification**:
  - Log in as Faculty/Admin and upload a study material (`.pdf`).
  - Log in as Student enrolled in that course and download the file.
  - Verify file downloads intact.
- [ ] **6. Security Sanitization**:
  - Make a request with invalid parameters (e.g. invalid JSON).
  - Verify response does **not** contain SQL exceptions, stack traces, or server file paths.

---

## 8. Rollback and Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| Backend fails to start on Render/Railway | Missing production env variable (`DB_URL`, `JWT_SECRET`) | Check container logs. `ProductionConfigValidator` prints the exact missing variable name. |
| Frontend displays `Network Error` | `VITE_API_URL` incorrect or backend sleeping | Check Network tab in DevTools. Ensure `VITE_API_URL` has `https://` and `/api`. |
| Browser blocks API with CORS error | Frontend URL missing from `CORS_ALLOWED_ORIGINS` | Add the exact frontend URL (including `https://` and no trailing slash) to `CORS_ALLOWED_ORIGINS`. |
| 404 Not Found on browser refresh | SPA rewrite rules missing | Ensure `vercel.json` is located in `campus-connect-frontend/vercel.json`. |
| Database connection timeout | MySQL host security group / IP allowlist | In cloud MySQL (Aiven/Railway), allow connections from all IPs (`0.0.0.0/0`) or platform IP range. |
