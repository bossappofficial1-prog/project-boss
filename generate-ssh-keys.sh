#!/bin/bash

# SSH Key Generation and Setup Script for GitHub Actions Staging Deployment
# This script helps you generate SSH keys and prepare them for GitHub secrets

set -e

echo "� GitHub Actions SSH Key Setup for Staging Deployment"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if ssh-keygen is available
if ! command -v ssh-keygen &> /dev/null; then
    print_error "ssh-keygen is not installed. Please install OpenSSH client first."
    exit 1
fi

# Create .ssh directory if it doesn't exist
SSH_DIR="$HOME/.ssh"
if [ ! -d "$SSH_DIR" ]; then
    print_status "Creating SSH directory: $SSH_DIR"
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
fi

# Generate SSH key pair
KEY_NAME="staging_deploy_key"
PRIVATE_KEY_PATH="$SSH_DIR/$KEY_NAME"
PUBLIC_KEY_PATH="$SSH_DIR/${KEY_NAME}.pub"

if [ -f "$PRIVATE_KEY_PATH" ]; then
    print_warning "SSH key already exists at $PRIVATE_KEY_PATH"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Using existing SSH key"
    else
        print_status "Generating new SSH key pair..."
        ssh-keygen -t rsa -b 4096 -C "github-actions-staging-deploy" -f "$PRIVATE_KEY_PATH" -N ""
    fi
else
    print_status "Generating new SSH key pair..."
    ssh-keygen -t rsa -b 4096 -C "github-actions-staging-deploy" -f "$PRIVATE_KEY_PATH" -N ""
fi

# Display the public key
print_step "Copy this PUBLIC KEY to your staging server's ~/.ssh/authorized_keys:"
echo
echo -e "${GREEN}======================================== PUBLIC KEY ========================================${NC}"
cat "$PUBLIC_KEY_PATH"
echo -e "${GREEN}=========================================================================================${NC}"
echo

# Display the private key for GitHub secret
print_step "Copy this PRIVATE KEY to GitHub secret 'STAGING_SSH_PRIVATE_KEY':"
echo
echo -e "${YELLOW}======================================= PRIVATE KEY =======================================${NC}"
cat "$PRIVATE_KEY_PATH"
echo -e "${YELLOW}=========================================================================================${NC}"
echo

# Set correct permissions
chmod 600 "$PRIVATE_KEY_PATH"
chmod 644 "$PUBLIC_KEY_PATH"

print_status "SSH key permissions set correctly"

# Test SSH connection if staging server details are provided
read -p "Do you want to test SSH connection to your staging server? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    read -p "Enter staging server IP/domain: " STAGING_HOST
    read -p "Enter SSH username: " STAGING_USER
    read -p "Enter SSH port (default 22): " -i "22" STAGING_PORT

    print_status "Testing SSH connection..."
    if ssh -i "$PRIVATE_KEY_PATH" -p "$STAGING_PORT" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$STAGING_USER@$STAGING_HOST" "echo 'SSH connection successful!'" 2>/dev/null; then
        print_status "✅ SSH connection test successful!"
    else
        print_error "❌ SSH connection test failed!"
        print_warning "Make sure to:"
        print_warning "1. Add the public key to your staging server's ~/.ssh/authorized_keys"
        print_warning "2. Ensure the SSH service is running on the staging server"
        print_warning "3. Check that the firewall allows SSH connections"
    fi
fi

echo
print_status "Setup complete! Next steps:"
echo "1. Add the PRIVATE KEY to GitHub secret: STAGING_SSH_PRIVATE_KEY"
echo "2. Add the PUBLIC KEY to your staging server's ~/.ssh/authorized_keys"
echo "3. Set up other required GitHub secrets (DOCKER_USERNAME, DOCKER_PASSWORD, etc.)"
echo "4. Run the staging server setup script on your server"
echo
print_warning "Remember to never commit the private key to your repository!"
