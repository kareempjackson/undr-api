# GhostPay Backend

This is the backend service for GhostPay - Anonymous payments for adult creators.

## Docker Setup

The backend service is fully dockerized for easy setup and deployment.

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git (to clone the repository)

### Quick Start

To quickly start the backend service:

```bash
# Start all services
./start-backend.sh

# View logs
docker-compose logs -f backend

# Stop all services
./stop-backend.sh
```

### Manual Setup

If you prefer to run commands manually:

1. Build the Docker images:

   ```bash
   docker-compose build
   ```

2. Start the services:

   ```bash
   docker-compose up -d
   ```

3. Stop the services:
   ```bash
   docker-compose down
   ```

### Environment Variables

The service uses the following environment variables, defined in the `.env` file:

- `NODE_ENV`: Environment (development, production)
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `DATABASE_URL`: Connection string for the database
- `BACKEND_PORT`: Port for the backend API (default: 3001)
- `JWT_SECRET`: Secret key for JWT token generation
- `FRONTEND_URL`: URL of the frontend application
- `ADMIN_URL`: URL of the admin panel
- And many more related to SMTP, Stripe, etc.

### Docker Services

The Docker Compose setup includes:

1. **Backend**: NestJS application running on Node.js
2. **PostgreSQL**: Database for storing application data

### Development with Docker

For development purposes, the Docker setup mounts local directories into the container, enabling hot-reloading.

To run in development mode:

```bash
docker-compose up
```

This will start the services and show logs in the console.

### Production Deployment

For production deployment, consider setting proper environment variables and security measures:

1. Create a production-specific `.env` file
2. Set `NODE_ENV=production`
3. Use strong, unique passwords for database and JWT
4. Consider setting up a reverse proxy (like Nginx) for SSL termination
