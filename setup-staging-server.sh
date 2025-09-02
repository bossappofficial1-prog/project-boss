#!/bin/bash

# 🚀 Project Boss Staging Server Setup Script
# Run this script on your staging server to prepare it for deployment

set -e

echo "🚀 Starting Project Boss Staging Server Setup..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as regular user with sudo access."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git htop vim nano ufw

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_warning "Please logout and login again for Docker group changes to take effect"
else
    print_status "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose already installed"
fi

# Setup SSH directory
print_status "Setting up SSH directory..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Frontend
sudo ufw allow 4444  # Backend
sudo ufw allow 5432  # PostgreSQL (if needed externally)
sudo ufw --force reload

# Create deployment directory
print_status "Creating deployment directory..."
sudo mkdir -p /opt/project-boss-staging
sudo chown $USER:$USER /opt/project-boss-staging

# Setup environment file
print_status "Setting up environment file..."
cd /opt/project-boss-staging

if [ ! -f ".env" ]; then
    cat > .env << EOF
# Database Configuration
DB_DATABASE=project_boss_staging
DB_USER=staging_user
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Docker Configuration
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password

# Application Configuration
NODE_ENV=staging
BASE_URL=https://staging.yourdomain.com
JWT_SECRET=CHANGE_THIS_JWT_SECRET

# Add other environment variables as needed
EOF
    print_warning "Please edit /opt/project-boss-staging/.env with your actual values"
else
    print_status "Environment file already exists"
fi

# Test Docker installation
print_status "Testing Docker installation..."
if docker run --rm hello-world &> /dev/null; then
    print_status "Docker is working correctly"
else
    print_error "Docker test failed"
    exit 1
fi

# Setup swap space (recommended for small VPS)
print_status "Setting up swap space..."
if [ ! -f "/swapfile" ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    print_status "Swap space created (2GB)"
else
    print_status "Swap space already exists"
fi

# Install monitoring tools
print_status "Installing monitoring tools..."
sudo apt install -y htop iotop ncdu

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/project-boss << EOF
/opt/project-boss-staging/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Create logs directory
mkdir -p /opt/project-boss-staging/logs

# Final instructions
echo ""
echo "================================================="
echo "🎉 STAGING SERVER SETUP COMPLETED!"
echo "================================================="
echo ""
echo "📋 Next steps:"
echo "1. Logout and login again for Docker group changes"
echo "2. Add your SSH public key to ~/.ssh/authorized_keys"
echo "3. Edit /opt/project-boss-staging/.env with actual values"
echo "4. Test SSH connection from GitHub Actions"
echo "5. Push code to 'develop' branch to trigger deployment"
echo ""
echo "🔧 Useful commands:"
echo "• Check status: cd /opt/project-boss-staging && docker compose ps"
echo "• View logs: cd /opt/project-boss-staging && docker compose logs -f"
echo "• Restart: cd /opt/project-boss-staging && docker compose restart"
echo ""
echo "📚 Documentation: Check GITHUB_ACTIONS_SETUP.md for detailed instructions"
echo ""
echo "✅ Setup complete! Your staging server is ready for deployment."
