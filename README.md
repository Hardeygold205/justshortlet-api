# auth-service-api
# 🚀 Auth Service (Backend API)

A modular, production-ready authentication and user management API built with **Node.js, Express, PostgreSQL, and Redis**.  

This project demonstrates a scalable backend architecture with support for **multiple authentication strategies**, **JWT-based sessions**, and **role-ready access control**.

---

## 📌 Features

### 🔐 Authentication
- Email & Password authentication
- Email OTP (passwordless) authentication (structure ready)
- Social authentication support (Google, Apple, Facebook - backend structure)
- JWT Access & Refresh Token system
- Redis-backed session management
- Logout with token invalidation

### 👤 User Management
- Get current user (`/me`)
- Update user profile
- Delete user
- Get all users with pagination & search
- Get single user by ID

### ⚙️ Backend Architecture
- Modular structure (Auth & User modules separated)
- Request validation using Zod
- Centralized error handling
- Clean service-controller separation
- Scalable API design

### 🔎 Advanced Features
- Pagination (page, limit)
- Search (name, email, username)
- Role-ready system (e.g. user, landlord, agent, admin)
- Redis integration for session/token handling

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL (Neon)  
- **Caching / Sessions:** Redis  
- **Validation:** Zod  
- **Authentication:** JWT (Access & Refresh Tokens)  
- **Other Tools:** Docker (optional), Git, Linux  

---

## 📂 Project Structure
src/
config/
db.js
redis.js
env.js

constants/
status.js

middlewares/
auth.middleware.js
error.middleware.js
validate.middleware.js

modules/
auth/
auth.controller.js
auth.service.js
auth.routes.js
auth.schema.js

user/
  user.controller.js
  user.service.js
  user.routes.js
  user.schema.js

utils/
jwt.js
hash.js
response.js
AppError.js

app.js
index.js


---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/express-auth-service.git
cd express-auth-service
2. Install dependencies
yarn install
# or
npm install
3. Setup environment variables

Create a .env file:

PORT=3000

DATABASE_URL=your_postgres_connection_string

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
4. Run the server
yarn dev

Server will run on:

http://localhost:3000

📡 API Endpoints
🔐 Auth Routes
Method	Endpoint	Description
POST	/api/auth/register	Register with email/password
POST	/api/auth/login	Login with email/password
POST	/api/auth/provider	Social login (Google/Apple/Facebook)
POST	/api/auth/email-otp/request	Request OTP
POST	/api/auth/email-otp/verify	Verify OTP
POST	/api/auth/refresh-token	Refresh access token
POST	/api/auth/logout	Logout user
👤 User Routes
Method	Endpoint	Description
GET	/api/users	Get all users (pagination + search)
GET	/api/users/me	Get current user
GET	/api/users/:id	Get user by ID
PATCH	/api/users/me	Update profile
DELETE	/api/users/me	Delete account
🔎 Pagination & Search Example
GET /api/users?page=1&limit=10&search=john

Response:

{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 100,
      "totalPages": 10,
      "currentPage": 1
    }
  }
}
🔐 Authentication Flow
Email/Password
User registers or logs in
Backend issues:
Access Token (short-lived)
Refresh Token (stored in Redis)
Token Refresh
Client sends refresh token
Backend verifies and issues new access token
Logout
Refresh token removed from Redis
Session invalidated
🧠 Design Decisions
Modular architecture for scalability
Redis for session management instead of in-memory storage
JWT for stateless authentication
Zod for schema validation
Separation of auth logic vs user domain
🚧 Future Improvements
Refresh token rotation
Role-based access control (RBAC middleware)
Soft delete (instead of hard delete)
Email service for OTP (e.g. Resend, SendGrid)
Social auth provider verification (Google, Apple)
Rate limiting per user/IP
API documentation (Swagger)
📜 License

This project is open-source and available under the MIT License.

👨‍💻 Author

Hadi Ademola S.

Portfolio: https://hadiademola.com
GitHub: https://github.com/Hardeygold205
LinkedIn: https://linkedin.com/in/Hardeygold205

---
