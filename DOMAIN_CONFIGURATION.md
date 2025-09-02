# Domain Configuration Guide

## Domain Structure

### Production Environment
- **Backend API**: `api.bossapp.id`
- **Dashboard (Frontend)**: `dashboard.bossapp.id`
- **Customer Frontend**: `bossapp.id`

### Development Environment
- **Backend API**: `api-dev.bossapp.id`
- **Dashboard (Frontend)**: `dashboard-dev.bossapp.id`
- **Customer Frontend**: `dev.bossapp.id`

## DNS Configuration

### Production DNS Records
```
bossapp.id      A     YOUR_SERVER_IP
api.bossapp.id      A     YOUR_SERVER_IP
dashboard.bossapp.id A     YOUR_SERVER_IP
```

### Development DNS Records
```
dev.bossapp.id          A     YOUR_DEV_SERVER_IP
api-dev.bossapp.id      A     YOUR_DEV_SERVER_IP
dashboard-dev.bossapp.id A     YOUR_DEV_SERVER_IP
```

## SSL/TLS Configuration

### Let's Encrypt (Recommended for Production)
```bash
# Install certbot
sudo apt install certbot

# Get SSL certificates for all domains
sudo certbot certonly --standalone -d bossapp.id -d api.bossapp.id -d dashboard.bossapp.id

# For development (self-signed certificates)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/dev.bossapp.id.key \
  -out /etc/ssl/certs/dev.bossapp.id.crt \
  -subj "/C=ID/ST=State/L=City/O=Organization/CN=dev.bossapp.id"
```

## Traefik Configuration

### Production docker-compose.yml Labels
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend.rule=Host(\`api.bossapp.id\`)"
  - "traefik.http.routers.backend.entrypoints=websecure"
  - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
  - "traefik.http.services.backend.loadbalancer.server.port=4444"
```

### Development docker-compose.dev.yml Labels
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend-dev.rule=Host(\`api-dev.bossapp.id\`)"
  - "traefik.http.routers.backend-dev.entrypoints=websecure"
  - "traefik.http.routers.backend-dev.tls.certresolver=letsencrypt"
  - "traefik.http.services.backend-dev.loadbalancer.server.port=4444"
```

## Environment Variables

### Production (.env.prod)
```bash
# Domain Configuration
BACKEND_DOMAIN=api.bossapp.id
FRONTEND_DOMAIN=dashboard.bossapp.id
FRONTEND_CUSTOMER_DOMAIN=bossapp.id

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/bossapp.id/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/bossapp.id/privkey.pem
```

### Development (.env.dev)
```bash
# Domain Configuration
BACKEND_DOMAIN=api-dev.bossapp.id
FRONTEND_DOMAIN=dashboard-dev.bossapp.id
FRONTEND_CUSTOMER_DOMAIN=dev.bossapp.id

# SSL Configuration (self-signed for development)
SSL_CERT_PATH=/etc/ssl/certs/dev.bossapp.id.crt
SSL_KEY_PATH=/etc/ssl/private/dev.bossapp.id.key
```

## Deployment Commands

### Production Deployment
```bash
# Copy production environment file
cp .env.prod .env

# Deploy with production configuration
docker-compose -f docker-compose.yml --env-file .env.prod up -d
```

### Development Deployment
```bash
# Copy development environment file
cp .env.dev .env

# Deploy with development configuration
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

## Nginx Configuration (Alternative to Traefik)

If you prefer to use Nginx instead of Traefik:

### /etc/nginx/sites-available/bossapp.id
```nginx
# Upstream servers
upstream backend_api {
    server backend:4444;
}

upstream frontend_dashboard {
    server frontend:3000;
}

upstream frontend_customer {
    server frontend-customer:3000;
}

# Production server blocks
server {
    listen 80;
    server_name bossapp.id api.bossapp.id dashboard.bossapp.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bossapp.id;

    ssl_certificate /etc/letsencrypt/live/bossapp.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bossapp.id/privkey.pem;

    location / {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name dashboard.bossapp.id;

    ssl_certificate /etc/letsencrypt/live/bossapp.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bossapp.id/privkey.pem;

    location / {
        proxy_pass http://frontend_dashboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name bossapp.id;

    ssl_certificate /etc/letsencrypt/live/bossapp.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bossapp.id/privkey.pem;

    location / {
        proxy_pass http://frontend_customer;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Testing

### Test Domain Resolution
```bash
# Test production domains
curl -I https://api.bossapp.id/health
curl -I https://dashboard.bossapp.id
curl -I https://bossapp.id

# Test development domains
curl -I https://api-dev.bossapp.id/health
curl -I https://dashboard-dev.bossapp.id
curl -I https://dev.bossapp.id
```

### SSL Certificate Testing
```bash
# Check SSL certificate validity
openssl s_client -connect api.bossapp.id:443 -servername api.bossapp.id < /dev/null

# Check certificate expiration
openssl s_client -connect api.bossapp.id:443 -servername api.bossapp.id 2>/dev/null | openssl x509 -noout -dates
```

## Monitoring

### Health Check Endpoints
- Backend: `https://api.bossapp.id/health`
- Frontend Dashboard: `https://dashboard.bossapp.id/api/health`
- Frontend Customer: `https://bossapp.id/api/health`

### Log Monitoring
```bash
# View service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f frontend-customer

# View Traefik logs
docker-compose logs -f traefik
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Ensure DNS records are properly configured
   - Check certificate validity: `certbot certificates`
   - Renew certificates: `certbot renew`

2. **Domain Not Resolving**
   - Check DNS propagation: `dig bossapp.id`
   - Verify DNS records with your domain registrar
   - Clear DNS cache: `sudo systemd-resolve --flush-caches`

3. **Traefik Routing Issues**
   - Check Traefik dashboard: `http://your-server-ip:8080`
   - Verify labels in docker-compose files
   - Check container logs: `docker-compose logs traefik`

4. **CORS Issues**
   - Update CORS_ORIGINS in environment variables
   - Restart services after configuration changes

## Security Considerations

1. **SSL/TLS**: Always use HTTPS in production
2. **Firewall**: Configure UFW/firewall to only allow necessary ports
3. **Environment Variables**: Never commit sensitive data to git
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Monitoring**: Set up proper logging and monitoring
6. **Backups**: Regular database and configuration backups
