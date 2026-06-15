# Docker Deployment Guide

## Quick Start

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| MySQL | `okane-mysql` | `3306` | Database |
| Backend | `okane-backend` | `8080` | Spring MVC API |
| Nginx | `okane-nginx` | `80` | Angular frontend + reverse proxy |

## Access Points

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api
- **API via Nginx proxy**: http://localhost/api

## Environment Variables

Create a `.env` file in the project root to override defaults:

```env
# Database
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-very-long-and-secure-random-secret-key-here

# Frontend origins (comma-separated)
FRONTEND_ALLOWED_ORIGINS=https://yourdomain.com
```

## Production Checklist

1. **Change default passwords**: Update `DB_PASSWORD` and `JWT_SECRET`
2. **Use HTTPS**: Replace port 80 with 443 and add SSL certificates
3. **Enable firewall**: Only expose ports 80/443 and 8080 (if needed directly)
4. **Database backups**: Set up regular `mysqldump` backups
5. **Logs**: Configure log rotation for Docker containers
6. **Health checks**: The backend has a health endpoint at `/api/health`

## SSL / HTTPS (Production)

For production with HTTPS, mount your certificates into the nginx container:

```yaml
# In docker-compose.yml, add to nginx service:
volumes:
  - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem:ro
  - ./ssl/key.pem:/etc/nginx/ssl/key.pem:ro
```

And update `nginx.conf` to listen on 443 with SSL.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check MySQL is healthy: `docker-compose ps` |
| Frontend shows 404 | Nginx is serving SPA routes — check `nginx.conf` |
| API calls fail | Check CORS: `FRONTEND_ALLOWED_ORIGINS` must include your domain |
| Database connection error | Verify `DB_URL` hostname matches service name (`mysql`) |
