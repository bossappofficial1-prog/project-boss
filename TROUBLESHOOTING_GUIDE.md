# 🚨 Troubleshooting Guide for Project Boss Deployment

## 📋 Quick Reference

### Common Issues & Solutions

#### 1. SSH Connection Failed During Deployment
**Symptoms:**
- GitHub Actions workflow fails at "Deploy to staging" step
- Error: "Connection refused" or "Permission denied"

**Solutions:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/staging_deploy_key -o StrictHostKeyChecking=no user@your-staging-server

# Check SSH key permissions
chmod 600 ~/.ssh/staging_deploy_key

# Verify GitHub Secrets are set correctly:
# - STAGING_SSH_PRIVATE_KEY (full private key content)
# - STAGING_SSH_HOST (server IP or domain)
# - STAGING_SSH_USER (server username)
# - STAGING_SSH_PORT (usually 22)
```

#### 2. Docker Build Failed
**Symptoms:**
- Build step fails in GitHub Actions
- Error messages about missing dependencies or build context

**Solutions:**
```bash
# Test build locally first
docker-compose -f docker-compose.dev.yml build

# Check for build context issues
docker build -f consumer/Dockerfile ./consumer

# Clear Docker cache if needed
docker system prune -f
docker volume prune -f
```

#### 3. Services Won't Start
**Symptoms:**
- Containers fail to start after deployment
- Health checks fail

**Solutions:**
```bash
# Check service logs
docker-compose logs -f [service-name]

# Verify environment variables
cat .env.dev  # or .env.prod

# Check port conflicts
netstat -tulpn | grep :[port-number]

# Test individual services
docker-compose up -d db
docker-compose up -d redis
docker-compose up -d rabbitmq
```

#### 4. Database Connection Failed
**Symptoms:**
- Backend service fails to connect to PostgreSQL
- Error: "Connection refused" or authentication failed

**Solutions:**
```bash
# Check database container status
docker-compose ps db

# Test database connection
docker-compose exec db psql -U postgres -d boss_dev

# Verify DATABASE_URL in environment
echo $DATABASE_URL

# Reset database if needed
docker-compose down -v
docker-compose up -d db
```

#### 5. Domain Not Working
**Symptoms:**
- Domain doesn't resolve or shows wrong content
- SSL certificate errors

**Solutions:**
```bash
# Test DNS resolution
nslookup your-domain.com

# Check domain configuration
./test-domains.sh

# Verify Traefik labels in docker-compose.yml
docker-compose ps
docker inspect [container-name] | grep -A 5 "Labels"

# Check SSL certificates
certbot certificates
```

## 🔍 Detailed Debugging Steps

### Step 1: Check GitHub Actions Logs
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select the failed workflow run
4. Check each job's logs for error messages

### Step 2: Test Locally First
```bash
# Run local staging test
./test-staging-local.sh

# Check individual service logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Step 3: Verify Configuration Files
```bash
# Check environment files
ls -la .env*

# Validate Docker Compose
docker-compose -f docker-compose.dev.yml config

# Check GitHub workflows
ls -la .github/workflows/
```

### Step 4: Network and Port Testing
```bash
# Check open ports
netstat -tulpn

# Test service connectivity
curl http://localhost:4444/health
curl http://localhost:3000
curl http://localhost:3001

# Check Docker networks
docker network ls
docker network inspect [network-name]
```

## 🛠️ Advanced Troubleshooting

### Database Issues
```bash
# Access database directly
docker-compose exec db psql -U postgres -d boss_dev

# Check database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db

# Run database migrations
docker-compose exec backend npm run prisma:migrate
```

### Redis Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Clear Redis data
docker-compose exec redis redis-cli FLUSHALL
```

### RabbitMQ Issues
```bash
# Access RabbitMQ management
open http://localhost:15672 (guest/guest)

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Reset RabbitMQ
docker-compose down -v
docker-compose up -d rabbitmq
```

### SSL/TLS Issues
```bash
# Check certificate status
certbot certificates

# Renew certificates
certbot renew

# Manual certificate generation
certbot certonly --standalone -d your-domain.com

# Check certificate files
ls -la /etc/letsencrypt/live/your-domain.com/
```

## 📊 Monitoring Commands

### Service Health
```bash
# Check all services
docker-compose ps

# Monitor resource usage
docker stats

# Check container logs
docker-compose logs -f --tail=100
```

### Application Monitoring
```bash
# Backend health check
curl http://localhost:4444/health

# Database connection test
docker-compose exec backend npm run test:db

# API endpoint test
curl http://localhost:4444/api/v1/status
```

### System Monitoring
```bash
# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top -n 1

# Network connections
netstat -antp
```

## 🚀 Recovery Procedures

### Complete Reset (Development)
```bash
# Stop all services
docker-compose down -v

# Remove all containers and images
docker system prune -a -f
docker volume prune -f

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
docker-compose exec backend npm run prisma:migrate
```

### Staging Server Reset
```bash
# Connect to staging server
ssh user@staging-server

# Stop all services
cd /opt/project-boss
docker-compose down -v

# Pull latest changes
git pull origin develop

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps
```

### Emergency Rollback
```bash
# Rollback to previous commit
git log --oneline -10
git checkout [previous-commit-hash]
git push origin develop --force

# Or rollback specific deployment
# Use GitHub Actions to redeploy previous version
```

## 📞 Getting Help

### Check These First:
1. **GitHub Actions Logs** - Most issues are visible here
2. **Service Logs** - `docker-compose logs -f [service-name]`
3. **Environment Variables** - Verify `.env` files
4. **Network Configuration** - Check ports and DNS

### Useful Resources:
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt Documentation](https://certbot.eff.org/docs/)

### When to Ask for Help:
- After trying all troubleshooting steps above
- When you have detailed error logs
- When local testing works but staging fails
- When you need help with specific service configuration

## 🎯 Prevention Tips

1. **Always test locally first** before pushing to staging
2. **Use meaningful commit messages** for easier rollback
3. **Keep environment variables** synchronized
4. **Monitor resource usage** regularly
5. **Backup important data** before major changes
6. **Document custom configurations** and changes

---

**Last Updated**: $(date)
**Version**: 1.0
