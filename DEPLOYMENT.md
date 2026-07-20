# 🚀 Cloud Deployment & DevOps Guide — BharatRail

This guide outlines the production deployment architecture, environment configurations, container build commands, and a step-by-step checklist to deploy the BharatRail microservices platform to cloud infrastructure (such as AWS ECS/EKS, Google Cloud GKE/Run, or Azure AKS).

---

## 🏗️ Production Architecture

In a production environment:
1.  **Orchestrator**: Services run in containerized tasks (Kubernetes or ECS) behind an Application Load Balancer.
2.  **Managed Databases**: 
    *   **PostgreSQL**: Hosted on AWS RDS / GCP Cloud SQL with separate schemas/databases for each service.
    *   **Redis**: Hosted on AWS ElastiCache / GCP Memorystore.
    *   **Elasticsearch**: Hosted on Elastic Cloud or AWS OpenSearch.
    *   **Kafka**: Hosted on AWS MSK / Confluent Cloud.
3.  **Frontend**: Static assets built with Vite and served globally via Nginx, accelerated by a CDN (Cloudflare or CloudFront).

---

## 🐳 Container Build Commands

Each microservice contains a production-ready, multi-stage Dockerfile designed for slim image sizes and dependency layer caching.

### 1. Build Microservices (example using `user-service`)
```bash
docker build -t bharatrail-user-service:v1.0.0 ./user-service
```

### 2. Build Frontend (React + Nginx bundle)
```bash
docker build -t bharatrail-frontend:v1.0.0 ./frontend
```

---

## 🔐 Service Environment Variables Reference

Ensure these variables are injected into your container orchestration environments (never hardcode values in Dockerfiles).

### 1. API Gateway (`api-gateway`)
*   `PORT`: Port gateway listens on (default `4000`).
*   `NODE_ENV`: Set to `production`.
*   `ALLOWED_ORIGINS`: CORS whitelist (comma-separated).
*   `REDIS_URL`: URL to Redis cluster (e.g. `redis://:pass@redis-host:6379`).
*   `JWT_ACCESS_SECRET`: 64-character signing secret for access tokens.
*   `JWT_REFRESH_SECRET`: 64-character signing secret for refresh tokens.
*   `USER_SERVICE_URL`: Internally routing URL to User Service (e.g. `http://user-service:4001`).
*   `SEARCH_SERVICE_URL`: Internally routing URL to Search Service (e.g. `http://search-service:4002`).
*   `BOOKING_SERVICE_URL`: Internally routing URL to Booking Service (e.g. `http://booking-service:4005`).
*   `NOTIFICATION_SERVICE_URL`: Internally routing URL to Notification Service (e.g. `http://notification-service:4004`).
*   `PAYMENT_SERVICE_URL`: Internally routing URL to Payment Service (e.g. `http://payment-service:4006`).

### 2. User Service (`user-service`)
*   `PORT`: Port service listens on (default `4001`).
*   `DATABASE_URL`: Connection string to the User database.
*   `REDIS_URL`: Connection string to Redis.
*   `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Signing secrets (must match gateway).
*   `OTP_HMAC_SECRET`: HMAC key used to generate/validate OTP strings.
*   `GOOGLE_CLIENT_ID`: Google Client ID credential for OAuth callback.
*   `INTERNAL_SERVICE_KEY`: SHA-256 key for verifying intra-service calls.

### 3. Search Service (`search-service`)
*   `PORT`: Port service listens on (default `4002`).
*   `ELASTICSEARCH_URL`: Endpoint for Elasticsearch Cluster (e.g. `https://es-cluster:9200`).
*   `KAFKA_BROKER`: Kafka Bootstrap server address (e.g. `kafka-broker:9092`).
*   `ES_RECREATE_INDICES`: Set to `false` in production.

### 4. Admin Service (`admin-service`)
*   `PORT`: Port service listens on (default `4003`).
*   `DATABASE_URL`: Connection string to the Admin database.
*   `KAFKA_BROKER`: Kafka Bootstrap server address.
*   `INTERNAL_SERVICE_KEY`: Intra-service SHA-256 verification key.

### 5. Notification Service (`notification-service`)
*   `PORT`: Port service listens on (default `4004`).
*   `KAFKA_BROKER`: Kafka Bootstrap server address.
*   `SENDGRID_API_KEY`: API key from SendGrid SMTP.
*   `MAIL_SEND`: Authenticated sender email.

### 6. Booking Service (`booking-service`)
*   `PORT`: Port service listens on (default `4005`).
*   `DATABASE_URL`: Connection string to the Booking database.
*   `REDIS_URL`: Connection string to Redis.
*   `KAFKA_BROKER`: Kafka Bootstrap server address.
*   `INVENTORY_SERVICE_URL` / `PAYMENT_SERVICE_URL` / `USER_SERVICE_URL` / `ADMIN_SERVICE_URL`: Internal microservice addresses.
*   `INTERNAL_SERVICE_KEY`: Intra-service verification key.

### 7. Payment Service (`payment-service`)
*   `PORT`: Port service listens on (default `4006`).
*   `DATABASE_URL`: Connection string to the Payment database.
*   `KAFKA_BROKER`: Kafka Bootstrap server address.
*   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: Razorpay client keys.
*   `RAZORPAY_WEBHOOK_SECRET`: Signature matching webhook secret.

### 8. Inventory Service (`inventory-service`)
*   `PORT`: Port service listens on (default `4007`).
*   `DATABASE_URL`: Connection string to the Inventory database.
*   `KAFKA_BROKER`: Kafka Bootstrap server address.
*   `INTERNAL_SERVICE_KEY`: Intra-service verification key.

---

## 📋 Cloud Deployment Checklist

Follow this checklist step-by-step during a release cycle:

- [ ] **Step 1: Network & Security Isolation**
  * Configure VPC, private subnets, and security groups. Ensure databases (Postgres, Redis) are not publicly exposed and accept connections only from container security groups.

- [ ] **Step 2: Provision Cloud Managed Services**
  * Provision PostgreSQL databases (AWS RDS / Cloud SQL).
  * Provision Redis clusters, Confluent Kafka/MSK, and Elasticsearch instances.
  * Retrieve secure connection strings and add them to your secure parameter stores (such as AWS Systems Manager Parameter Store or Secrets Manager).

- [ ] **Step 3: Pre-deployment Schema Migration**
  * Set temporary database connection strings on a helper VM and run the deploy commands:
    ```bash
    npx prisma migrate deploy
    ```
  * Verify that all service tables are populated.

- [ ] **Step 4: Seed Core Production Datasets**
  * Run the master seeder on the admin/inventory databases to seed stations, trains, and routes:
    ```bash
    npm run seed
    ```

- [ ] **Step 5: Build & Push Images**
  * Build the Docker images using the multi-stage Dockerfiles.
  * Tag and push the images to your Private Container Registry (ECR/GCR).

- [ ] **Step 6: Deploy Microservices**
  * Deploy task definitions (ECS) or manifests (Kubernetes) for all 8 microservices.
  * Inject the reference environment variables.
  * Configure horizontal auto-scaling and target health checks.

- [ ] **Step 7: Deploy Frontend**
  * Upload static assets built from the `frontend` folder to a secure file container (AWS S3 bucket / GCP Cloud Storage).
  * Configure CDN endpoints pointing to the bucket to route static traffic, and set proxy rules to route `/api/*` requests to the API Gateway.
