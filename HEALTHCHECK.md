# Health Check Configuration

This application includes a comprehensive health check system for production deployments.

## Health Check Endpoint

**URL:** `/api/health`

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T10:45:00.000Z",
  "database": "connected"
}
```

**Response (Degraded):**
```json
{
  "status": "degraded",
  "timestamp": "2025-12-29T10:45:00.000Z",
  "database": "disconnected",
  "error": "Connection error message"
}
```

## Docker Health Check

The Dockerfile includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Parameters:
- **interval**: 30 seconds between checks
- **timeout**: 10 seconds max for each check
- **start-period**: 40 seconds grace period on startup
- **retries**: 3 consecutive failures before marking unhealthy

## Deployment Platforms

### Coolify
Coolify will automatically detect the health check from the Dockerfile. No additional configuration needed.

### Railway
Add this to your `railway.toml`:
```toml
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 10
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3
```

### Render
Add this to your `render.yaml`:
```yaml
services:
  - type: web
    name: alwar-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
```

### Vercel
Vercel automatically monitors your application. The health endpoint is available but not used for routing decisions.

### Docker Compose
Use the included `docker-compose.yml`:
```bash
docker-compose up -d
```

Check health status:
```bash
docker-compose ps
```

## Manual Testing

Test the health check locally:
```bash
curl http://localhost:3000/api/health
```

Expected output:
```json
{"status":"healthy","timestamp":"...","database":"connected"}
```

## Monitoring

The health check verifies:
1. ✅ Application is running
2. ✅ Database connection is active
3. ✅ Prisma client is initialized

## Troubleshooting

### Health Check Failing

1. **Check logs:**
   ```bash
   docker logs <container-name>
   ```

2. **Verify database connection:**
   - Ensure `DATABASE_URL` environment variable is set
   - Check database is accessible from container

3. **Test endpoint manually:**
   ```bash
   docker exec <container-name> curl http://localhost:3000/api/health
   ```

### Container Restarting

If the container keeps restarting due to failed health checks:
1. Increase `start-period` in Dockerfile
2. Check application startup time
3. Verify all environment variables are set

## Production Recommendations

1. **Set up monitoring:** Use tools like Datadog, New Relic, or Sentry
2. **Configure alerts:** Get notified when health checks fail
3. **Use load balancer:** Configure health check at load balancer level
4. **Database pooling:** Ensure proper connection pooling to avoid timeouts
5. **Graceful shutdown:** Handle SIGTERM signals properly

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
```

## Build and Deploy

### Local Docker Build
```bash
docker build -t alwar-app .
docker run -p 3000:3000 --env-file .env alwar-app
```

### Docker Compose
```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f
```

### Production Deployment
1. Push code to GitHub
2. Platform (Coolify/Railway/Render) will auto-detect Dockerfile
3. Health check will be automatically configured
4. Monitor deployment logs for health check status
