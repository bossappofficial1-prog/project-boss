# 🚀 GitHub Actions Setup untuk Project Boss

Panduan lengkap setup CI/CD dengan GitHub Actions untuk environment staging dan production.

## 📋 Prerequisites

- GitHub Repository dengan akses admin
- VPS Server untuk staging environment
- Docker Hub account
- SSH access ke staging server

## 🏗️ Branch Strategy

```
main     ← Production (manual deploy)
develop  ← Development (auto deploy to staging)
staging  ← Testing branch (optional)
```

## ⚙️ Setup GitHub Secrets

Pergi ke: **Settings → Secrets and variables → Actions**

### Docker Hub Secrets
```
DOCKER_USERNAME     # Docker Hub username
DOCKER_PASSWORD     # Docker Hub password/token
```

### Staging Server Secrets
```
STAGING_VPS_HOST           # IP/domain staging server
STAGING_VPS_USER           # SSH username (ubuntu/ec2-user)
STAGING_SSH_PRIVATE_KEY    # Private SSH key (paste seluruh key)
STAGING_SSH_PORT          # SSH port (default: 22)
STAGING_DEPLOY_PATH       # Path deployment (/opt/project-boss-staging)
```

### Application Secrets (Staging)
```
DB_DATABASE                # Database name untuk staging
DB_USER                   # Database username
DB_PASSWORD               # Database password
JWT_SECRET                # JWT secret key
GOOGLE_CLIENT_ID          # Google OAuth client ID
GOOGLE_CLIENT_SECRET      # Google OAuth client secret
MIDTRANS_SERVER_KEY       # Midtrans server key
MIDTRANS_CLIENT_KEY       # Midtrans client key
SMTP_USER                 # Email username
SMTP_PASS                 # Email app password
```

### Optional Secrets
```
SLACK_WEBHOOK_URL         # Untuk notifikasi Slack
```

## 🖥️ Setup Staging Server

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Setup SSH Access
```bash
# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
echo "your_public_key_here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Create Deployment Directory
```bash
sudo mkdir -p /opt/project-boss-staging
sudo chown $USER:$USER /opt/project-boss-staging
```

### 4. Setup Environment Variables
```bash
cd /opt/project-boss-staging
cp .env.staging.example .env
# Edit .env dengan nilai yang sesuai
nano .env
```

## 🔄 Workflow Overview

### CI Workflow (ci.yml)
- **Trigger**: Push/PR ke `develop`, `staging`, `main`
- **Jobs**:
  - Build & Test semua services
  - Security scan dengan Trivy
  - Docker build test

### Staging Deployment (staging.yml)
- **Trigger**: Push ke `develop` branch
- **Jobs**:
  - Build & push Docker images
  - Deploy ke staging server
  - Post-deployment health checks
  - Slack notifications

### Production Deployment (deploy.yml)
- **Trigger**: Push ke `main` branch
- **Jobs**:
  - Build & push production images
  - Deploy ke production server
  - Database migrations
  - Health checks

## 🚀 Cara Penggunaan

### Development Workflow
1. **Develop**: Kerja di branch `develop`
2. **Push**: Setiap push ke `develop` otomatis deploy ke staging
3. **Test**: Test aplikasi di staging environment
4. **Merge**: Merge ke `main` untuk production

### Manual Deployment
```bash
# Deploy staging manual
gh workflow run staging.yml

# Deploy production manual
gh workflow run deploy.yml
```

## 📊 Monitoring & Logs

### GitHub Actions Logs
- Pergi ke **Actions** tab di repository
- Klik workflow run untuk melihat logs detail

### Server Logs
```bash
# Lihat container logs
cd /opt/project-boss-staging
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Lihat container status
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

## 🔧 Troubleshooting

### Common Issues

**SSH Connection Failed**
```bash
# Test SSH connection
ssh -i ~/.ssh/your_private_key ubuntu@your-staging-server.com

# Check SSH key format (harus include -----BEGIN OPENSSH PRIVATE KEY-----)
```

**Docker Build Failed**
```bash
# Check Docker build logs
docker build --no-cache -t test ./backend

# Check disk space
df -h
```

**Deployment Failed**
```bash
# Check deployment logs
cd /opt/project-boss-staging
cat staging-deploy.sh
./staging-deploy.sh
```

## 📞 Support

Jika ada masalah:
1. Check GitHub Actions logs
2. Check server logs
3. Verify semua secrets sudah benar
4. Test manual deployment

## 🔒 Security Best Practices

- ✅ Gunakan SSH keys instead of passwords
- ✅ Store secrets di GitHub Secrets
- ✅ Regular rotate SSH keys dan passwords
- ✅ Use environment-specific secrets
- ✅ Monitor access logs
- ✅ Regular backup database

---

**Happy Deploying! 🚀**
