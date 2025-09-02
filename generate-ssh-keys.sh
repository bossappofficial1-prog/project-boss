#!/bin/bash

# 🔑 SSH Key Generation Script for GitHub Actions
# This script generates SSH key pair for staging server deployment

set -e

echo "🔑 Generating SSH Key Pair for GitHub Actions..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if SSH key already exists
KEY_NAME="github_actions_staging"
KEY_PATH="$HOME/.ssh/${KEY_NAME}"

if [ -f "${KEY_PATH}" ]; then
    print_warning "SSH key ${KEY_NAME} already exists at ${KEY_PATH}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Keeping existing SSH key"
        exit 0
    fi
fi

# Generate SSH key pair
print_status "Generating SSH key pair..."
ssh-keygen -t ed25519 -C "github-actions-staging" -f "${KEY_PATH}" -N ""

# Set correct permissions
chmod 600 "${KEY_PATH}"
chmod 644 "${KEY_PATH}.pub"

print_status "SSH key pair generated successfully!"
echo ""
echo "=================================================="
print_info "PUBLIC KEY (Add this to your staging server):"
echo "=================================================="
cat "${KEY_PATH}.pub"
echo ""
echo "=================================================="
print_info "PRIVATE KEY (Add this to GitHub Secrets):"
echo "=================================================="
cat "${KEY_PATH}"
echo ""
echo "=================================================="
echo ""
print_warning "⚠️  IMPORTANT SECURITY NOTES:"
echo "• Keep the private key secure and never commit it to git"
echo "• Add the public key to your staging server's ~/.ssh/authorized_keys"
echo "• Add the private key to GitHub Secrets as STAGING_SSH_PRIVATE_KEY"
echo "• Test the SSH connection before running GitHub Actions"
echo ""
print_info "📋 GitHub Secrets to add:"
echo "STAGING_SSH_PRIVATE_KEY = (paste the private key above)"
echo ""
print_info "🖥️  Test SSH connection:"
echo "ssh -i ${KEY_PATH} user@your-staging-server.com"
echo ""
print_status "SSH key generation completed! 🎉"
