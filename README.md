# CampusConnect — College Management Platform

CampusConnect is an enterprise-grade full-stack college management platform featuring role-based portals for **Students**, **Faculty**, and **Administrators**.

---

## 🏛️ System Overview & Features

- **Authentication & Security**: Stateless JWT authentication with BCrypt password hashing, role-based method authorization (`@PreAuthorize`), and automated token expiration handling.
- **Student Portal**: Course enrollment, attendance tracking with statistics, assignment submissions, class timetable, study material downloads, announcements, messaging, and academic analytics.
- **Faculty Portal**: Course management, attendance marking & reporting, assignment creation & grading, timetable view, study material uploads, announcements, and student messaging.
- **Admin Portal**: System-wide dashboard, student and faculty directories, course catalog, attendance reports, announcements broadcasting, timetable schedule management, and institution-wide analytics.

---

## 🛠️ Technology Stack

- **Backend**:
  - Java 21 (Eclipse Temurin)
  - Spring Boot 3.2.5 (Spring Web, Spring Data JPA, Spring Security, Validation)
  - MySQL 8.x Database
  - JJWT (JSON Web Token 0.12.5)
  - Maven 3.9+
  - JUnit 5 & Mockito
- **Frontend**:
  - React 18
  - Vite 5
  - React Router 6 (SPA with client-side protected routes)
  - Axios (centralized client with request/response interceptors)
  - Modern Responsive CSS

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Java 21 JDK** installed (`java -version`)
- **Maven 3.8+** installed (`mvn -version`)
- **Node.js 18+** & npm installed (`node -v`)
- **MySQL 8.x Server** running on `localhost:3306`

### 2. Database Setup
Create the local MySQL database:
```sql
CREATE DATABASE IF NOT EXISTS campus_connect_db;
```

### 3. Backend Setup
```bash
cd campus-connect-backend

# Run the backend (default active profile is 'dev')
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.
The development profile will automatically:
- Connect to local MySQL (`localhost:3306/campus_connect_db` with `root`/`root` or your env overrides).
- Auto-generate/update database tables (`ddl-auto=update`).
- Seed initial demo accounts (`app.seeder.enabled=true`):
  - **Admin**: `admin@campusconnect.com` / `admin123`
  - **Faculty**: `faculty@campusconnect.com` / `faculty123`
  - **Student**: `student@campusconnect.com` / `student123`

### 4. Frontend Setup
```bash
cd campus-connect-frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```bash
cd campus-connect-backend
mvn clean test
```
Runs the automated test suite including:
- Health check endpoint verification (`/api/health`)
- JWT token generation, signature validation, tampering, and expiration tests
- File storage, path traversal protection, and extension whitelist checks
- CORS allowed origins parsing
- Production configuration safety validator checks
- Authentication controller responses

### Build Production Artifacts
```bash
# Backend JAR:
cd campus-connect-backend
mvn clean package

# Frontend Bundle:
cd campus-connect-frontend
npm run build
```

---

## 🌐 Production Deployment

Refer to the detailed [DEPLOYMENT_CHECKLIST.md](file:///c:/Users/SyedJunaid/Desktop/CampusConnect/DEPLOYMENT_CHECKLIST.md) for full instructions.

### Summary of Production Deployment:
1. **Database**: Provision a hosted MySQL database on Aiven, Railway, or AWS RDS.
2. **Backend**:
   - Deploy container with provided `Dockerfile` or run JAR with `SPRING_PROFILES_ACTIVE=prod`.
   - Provide mandatory environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`.
   - Set health check path to `/api/health`.
3. **Frontend**:
   - Deploy `campus-connect-frontend` to **Vercel** or **Netlify**.
   - Set `VITE_API_URL` to `https://<your-backend-domain>/api`.
   - `vercel.json` and `_redirects` are already configured for SPA routing.

---

## 🔒 Security Best Practices

- **Zero Hardcoded Secrets**: Production strictly validates and enforces environment variables.
- **Non-Destructive Hibernate in Prod**: Production uses `spring.jpa.hibernate.ddl-auto=validate`.
- **Sanitized Errors**: No internal stack traces, database schema details, or passwords are leaked in error responses.
- **Protected File Storage**: Strict path traversal checks (`..` protection) and MIME-type whitelisting on file uploads.
