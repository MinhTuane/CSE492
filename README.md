# MBServices - Motorbike Services Platform

Fullstack web application for premium motorbike dealer and service workshop.

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Backend   | Spring Boot 3.5 (Java 21)     |
| Frontend  | React 18 + Vite + TailwindCSS |
| Chatbot   | Flask + Google Gemini AI       |
| Database  | SQL Server (local) / PostgreSQL (Docker) |
| Storage   | Cloudinary                     |
| Payments  | VNPay, ZaloPay, Momo           |

## Quick Start

### 1. Clone & Configure

```bash
git clone <repo-url>
cd CSE492-main
```

Copy the environment template and fill in your secrets:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp chatbot-service/.env.example chatbot-service/.env
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8091/api
- **Chatbot**: http://localhost:5000
- **Swagger UI**: http://localhost:8091/api/swagger-ui.html

### 3. Run Locally (development)

**Backend:**
```bash
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Chatbot:**
```bash
cd chatbot-service
pip install -r requirements.txt
python app.py
```

## Production Deployment

1. Set all environment variables in `.env` with real credentials
2. Activate the production Spring profile:
   ```bash
   SPRING_PROFILES_ACTIVE=prod docker compose up --build -d
   ```
3. Update callback URLs (VNPay, ZaloPay, Momo) to your public domain
4. Update CORS allowed origins to your frontend domain

## Project Structure

```
├── src/                    # Spring Boot backend
│   └── main/java/com/capstone/mbservices/
│       ├── config/         # Security, CORS, WebSocket, DataSeeder
│       ├── controller/     # REST API endpoints
│       ├── dto/            # Request/Response DTOs
│       ├── entity/         # JPA entities
│       ├── enums/          # Status enums
│       ├── exception/      # Global exception handling
│       ├── repository/     # Spring Data repositories
│       ├── service/        # Business logic
│       └── utils/          # Utility classes
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API service layer
│   │   ├── store/          # Zustand state management
│   │   └── utils/          # Helper functions
│   ├── nginx.conf          # Production Nginx config
│   └── Dockerfile
├── chatbot-service/        # Flask AI chatbot microservice
├── docker-compose.yml      # Multi-service orchestration
└── .env.example            # Environment variable template
```
