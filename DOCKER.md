# SellMatic - Docker Setup Guide

This guide explains how to build and run the SellMatic application using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Ensure your `.env` file has the required environment variables (see below)

## Files Added

- **Dockerfile** - Multi-stage build for optimized image
- **docker-compose.yml** - Orchestrates PostgreSQL and Node.js services
- **.dockerignore** - Excludes unnecessary files from the image
- **entrypoint.sh** - Handles database migrations on startup
- **.env.docker** - Template for Docker environment variables

## Environment Variables

Before running Docker, ensure your `.env` file includes:

```env
NODE_ENV=production
PHONE_NUMBER_ID=1116743694855563
WABA_ID=2026622041611361
WHATSAPP_TOKEN=your_actual_token
OPENAI_API_KEY=your_actual_key
VERIFY_TOKEN=sellmatic_verify_token_123
PORT=1999
```

The `DATABASE_URL` is automatically set by docker-compose.yml to:
```
postgresql://postgres:uche1nna2@postgres:5432/sellmatic
```

## Quick Start

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will:
1. Build the Docker image
2. Start PostgreSQL container
3. Run database migrations automatically
4. Start the Node.js application on port 1999

### For Production Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

The `-d` flag runs in detached mode.

### View Logs

```bash
docker-compose logs -f app
```

To see PostgreSQL logs:
```bash
docker-compose logs -f postgres
```

## Useful Commands

### Stop Containers

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Database)

```bash
docker-compose down -v
```

### Rebuild the Image

```bash
docker-compose build --no-cache
```

### Run a Command in the Container

```bash
docker-compose exec app npm run seed
```

### Access PostgreSQL from Host

```bash
psql postgresql://postgres:uche1nna2@localhost:5432/sellmatic
```

## What Happens on Startup

1. PostgreSQL container starts and initializes the database
2. Docker waits for PostgreSQL to be healthy
3. Entrypoint script runs Prisma migrations
4. Node.js application starts on port 1999
5. Webhook endpoint is available at `http://localhost:1999/webhook`

## Seeding Data

To seed the database with test data after containers are running:

```bash
docker-compose exec app npm run seed
```

Or uncomment the seed line in `entrypoint.sh` for automatic seeding on startup.

## Testing the Webhook

Once running, test the webhook endpoint:

```bash
curl -X POST http://localhost:1999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "metadata": { "phone_number_id": "1116743694855563" },
          "messages": [{
            "from": "2348145559189",
            "type": "text",
            "text": { "body": "Hi what do you sell?" }
          }]
        }
      }]
    }]
  }'
```

## Troubleshooting

### Port Already in Use

If port 1999 or 5432 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3000:1999"  # Map to different host port
```

### Database Connection Issues

Check if PostgreSQL is healthy:

```bash
docker-compose exec postgres pg_isready
```

### Rebuild Everything

```bash
docker-compose down -v
docker-compose up --build
```

## Production Considerations

1. **Secrets Management** - Use environment variables or secret management tools instead of `.env`
2. **Database Backups** - Configure volume backups for `postgres_data`
3. **Logging** - Configure centralized logging (e.g., ELK stack)
4. **Monitoring** - Set up health checks and alerts
5. **SSL/TLS** - Use reverse proxy (nginx) for HTTPS
6. **Database Credentials** - Change the default PostgreSQL password in production

## Docker Network

Services communicate via the `sellmatic-network` bridge network:
- App connects to PostgreSQL at hostname `postgres`
- PostgreSQL listens on internal port 5432
