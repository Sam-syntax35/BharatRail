# 🚆 BharatRail — Microservices Railway Reservation System

BharatRail is a production-grade, highly scalable, microservices-based railway booking platform designed to replicate real-world reservation flows (inspired by IRCTC). It implements event-driven communication via Kafka, caching via Redis, lookups via Elasticsearch, and transactional sagas for distributed booking states.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Microservices Catalog](#-microservices-catalog)
- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Docker Configuration](#-docker-configuration)
- [Seeding & Syncing Pipeline](#-seeding--syncing-pipeline)
- [Environment Configurations](#-environment-configurations)
- [License](#-license)

---

## 🎯 Overview

The system handles concurrent seat selections, secure payments, search indexing, ticket printing, and ticket cancellation with refund tracking. It illustrates design patterns including:
*   **Database-per-service**: Complete isolation of PostgreSQL databases.
*   **Event-Driven Communication**: Kafka for async state synchronization.
*   **Distributed Locking**: Redis-based holds for seat locking.
*   **Distributed Transactions**: Saga orchestration pattern for ticket bookings and cancellations.
*   **Full-Text Search**: Elasticsearch indexing for fast auto-complete stations and trains lookups.

---

## 🏗️ Architecture

```
                      ┌──────────────┐
                      │  Web Browser │
                      └──────┬───────┘
                             │ (Port 3000)
                      ┌──────▼───────┐
                      │ API Gateway  │ (Port 4000)
                      └──────┬───────┘
                             │
     ┌──────────────┬────────┼────────┬──────────────┐
     │              │        │        │              │
┌────▼─────┐   ┌────▼─────┐ ┌▼──────┐┌▼─────────┐ ┌──▼───────┐
│  User    │   │  Admin   │ │Search ││ Booking  │ │ Payment  │
│ Service  │   │ Service  │ │Service││ Service  │ │ Service  │
│(Port4001)│   │(Port4003)│ │(P4002)││(Port4005)│ │(Port4006)│
└────┬─────┘   └────┬─────┘ └▲──────┘└┬─────────┘ └──┬───────┘
     │ (Redis)      │        │       │ (Redis)       │
     └──────────────┼────────┼───────┼───────────────┘
                    │        │       │
                    └──────┐ │ ┌─────┘
                      ┌────▼─┴─▼────┐
                      │    Kafka    │ (Message Broker)
                      └──────┬──────┘
                             │
                      ┌──────▼───────┐
                      │  Inventory   │ (Port 4007)
                      └──────────────┘
```

---

## 🛠️ Tech Stack

*   **Runtime**: Node.js (v18+) / Express.js
*   **Databases**: PostgreSQL (Prisma ORM)
*   **Caching & Locks**: Redis Stack
*   **Message Queue**: Apache Kafka (KafkaJS)
*   **Search Engine**: Elasticsearch
*   **Frontend**: React (Vite, CSS Modules)
*   **Payments**: Razorpay Gateway (Test Mode)
*   **Notifications**: SendGrid SMTP

---

## 📦 Microservices Catalog

1.  **API Gateway (Port 4000)**: Single entry point handling routing, auth middleware, and rate limiting.
2.  **User Service (Port 4001)**: User accounts, JWT token rotation, Google OAuth, and Redis-backed session stores.
3.  **Search Service (Port 4002)**: Instantly queries Elasticsearch indices for stations and trains.
4.  **Admin Service (Port 4003)**: Manages stations, trains, seat maps, routes, and schedules.
5.  **Notification Service (Port 4004)**: Consumes Kafka triggers to send email OTPs and ticket receipts.
6.  **Booking Service (Port 4005)**: Coordinates seat allocation, handles booking statuses, and initiates payment webhooks.
7.  **Payment Service (Port 4006)**: Validates signatures and maps payment callbacks for Razorpay.
8.  **Inventory Service (Port 4007)**: Manages real-time seat lock segments and station sequence stops.

---

## ⚡ Features

*   **Authentication**: OTP-based login, refresh token rotation, and Google OAuth.
*   **Seat Selection & Hold**: Locks seats for 10 minutes during payment checkout.
*   **Payment signatures**: Integrates Razorpay with verification hooks.
*   **Search**: Full text autocomplete for Indian station names/codes.
*   **Cancellation**: Allows users to cancel seats, frees up slots, and registers refunds.
*   **Admin Panel**: Provides forms to add trains, stations, routes, and schedules.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js >= 18.0.0
*   Docker & Docker Compose

### Installation

1. Clone the repository and install root workspace components:
```bash
git clone https://github.com/Sam-syntax35/BharatRail.git
cd irctc-backend
npm install
```

2. Generate environment configs:
Copy the `.env.example` templates in each service directory to `.env` and fill in your keys (see [Environment Configurations](#-environment-configurations)).

---

## 🐳 Docker Configuration

Spin up all infrastructure systems (PostgreSQL, Kafka, Redis, Elasticsearch):
```bash
docker compose up -d
```

Verify service check points:
*   PostgreSQL: `localhost:5432`
*   Redis Stack: `localhost:6379` (RedisInsight: `http://localhost:8001`)
*   Kafka Broker: `localhost:9093`
*   Elasticsearch: `localhost:9200`

---

## 🧬 Seeding & Syncing Pipeline

To populate the database with realistic Indian Railway data:

1. **Deploy database migrations**:
Run Prisma migrations in the services:
```bash
# In admin-service
npx prisma migrate deploy
# In inventory-service
npx prisma migrate deploy
# In user-service
npx prisma migrate deploy
# In booking-service
npx prisma migrate deploy
# In payment-service
npx prisma migrate deploy
```

2. **Run Seeder**:
Seed 105 authentic Indian Railway stations (NDLS, LKO, SBC, etc.), 200 unique trains, seat maps, corridors, and 30 days of schedules:
```bash
npm run seed
```

*To customize schedule range:*
```bash
DAYS=90 npm run seed
```

---

## 🔐 Environment Configurations

Make sure to create `.env` files in each service directory based on their respective `.env.example` template:

*   **API Gateway**: Defines secrets for JWT tokens (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) and service URL parameters.
*   **Payment Service**: Requires Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
*   **Notification Service**: Requires SendGrid SMTP credentials (`SENDGRID_API_KEY`, `MAIL_SEND`).
*   **User Service**: Mapped to Google Client Credentials (`GOOGLE_CLIENT_ID`).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.