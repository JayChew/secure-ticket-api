# 📦 Secure Support Ticket API

A secure RESTful API for managing customer support tickets with JWT authentication, role-based access control (RBAC), and Dockerized deployment.

---

## 🚀 Tech Stack

- Node.js + TypeScript
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Docker / Docker Compose

---

## 🧱 Architecture Overview

- Layered architecture: Routes → Controllers → Services
- Stateless authentication using JWT
- Authorization via RBAC (admin/user) and resource ownership
- Centralized error handling and request validation

---

## ⚙️ Getting Started

### 1️⃣ Environment Variables

Create .env from .env.example:

```bash
PORT=3000
DATABASE_URL=postgresql://app:app@db:5432/support
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1h
```

### 2️⃣ Run with Docker

```bash
docker compose up --build
```

API will be available at:

```bash
http://localhost:3000
```

Health check:

```bash
GET /health
```

## 🔐 Authentication Flow

1. User registers and logs in
2. Server issues a JWT access token
3. Client includes token in Authorization: Bearer <token>
4. Protected routes verify token and enforce authorization rules

## 📌 API Endpoints

### 🔑 Auth

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| POST   | `/auth/register` | Register a new user          |
| POST   | `/auth/login`    | Login and receive JWT        |
| GET    | `/auth/me`       | Get current user (protected) |

### 🎫 Tickets

| Method | Endpoint              | Access                                  |
| ------ | --------------------- | --------------------------------------- |
| POST   | `/tickets`            | Authenticated user                      |
| GET    | `/tickets`            | User: own tickets<br>Admin: all tickets |
| GET    | `/tickets/:id`        | Owner or Admin                          |
| PATCH  | `/tickets/:id/status` | **Admin only**                          |

### 🧪 cURL Examples

#### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

Response:

```bash
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Create Ticket

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Pipe leakage report",
    "description": "Observed leakage near joint A12."
  }'
```

#### Admin: Update Ticket Status

```bash
curl -X PATCH http://localhost:3000/tickets/<TICKET_ID>/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

## 🔐 Security Considerations

- Passwords are hashed using bcrypt
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Input validation using Zod
- Sensitive configuration via environment variables

## 🧠 Design Decisions

- RESTful API chosen for simplicity and predictability
- Prisma ORM for type safety and migration management
- Dockerized setup for environment consistency and CI/CD readiness

## 🧪 Notes for Interview

This project demonstrates:

- Secure API design
- Authorization strategies
- Clean architecture
- Production-oriented setup

## Database Migrations (CI/CD)

This project follows a production-friendly migration strategy:

- **Local development:** `npx prisma migrate dev`
- **CI/CD / Production:** `npx prisma migrate deploy`

Migrations are intentionally **not** executed during Docker image build, because image builds should be deterministic and must not depend on external services like a database. Instead, migrations are applied during the deployment pipeline.
