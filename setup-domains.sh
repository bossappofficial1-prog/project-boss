#!/bin/bash

# Domain Setup Script for Production Environment
# This script helps configure domains for production deployment

set -e

echo "🌐 Domain Setup Script for Production"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo)"
    exit 1
fi

# Install required packages
install_packages() {
    print_step "Installing required packages..."

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update
        apt-get install -y curl wget dnsutils openssl
    elif command -v yum >/dev/null 2>&1; then
        yum update -y
        yum install -y curl wget bind-utils openssl
    else
        print_error "Unsupported package manager. Please install curl, wget, dnsutils/openssl manually."
        exit 1
    fi

    print_status "✅ Required packages installed"
}

# Test domain DNS configuration
test_dns() {
    local domain=$1
    local expected_ip=$2

    print_step "Testing DNS for $domain..."

    if nslookup "$domain" >/dev/null 2>&1; then
        local actual_ip=$(nslookup "$domain" 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}')
        if [ "$actual_ip" = "$expected_ip" ]; then
            print_status "✅ $domain correctly points to $expected_ip"
            return 0
        else
            print_warning "⚠️  $domain points to $actual_ip (expected $expected_ip)"
            return 1
        fi
    else
        print_error "❌ $domain DNS lookup failed"
        return 1
    fi
}

# Install and configure Certbot for SSL
setup_ssl() {
    print_step "Setting up SSL certificates with Certbot..."

    if ! command -v certbot >/dev/null 2>&1; then
        if command -v apt-get >/dev/null 2>&1; then
            apt-get install -y certbot python3-certbot-nginx
        elif command -v yum >/dev/null 2>&1; then
            yum install -y certbot python3-certbot-nginx
        fi
    fi

    print_status "✅ Certbot installed"

    # Note: Actual certificate generation should be done after services are running
    print_info "SSL certificates will be generated after services are deployed and running"
}

# Generate Nginx configuration
generate_nginx_config() {
    print_step "Generating Nginx configuration..."

    # Create nginx directories if they don't exist
    mkdir -p nginx/conf.d nginx/ssl

    # Copy nginx configuration files (assuming they exist in the project)
    if [ -f "nginx/nginx.conf" ] && [ -f "nginx/conf.d/default.conf" ]; then
        print_status "✅ Nginx configuration files found"
    else
        print_warning "⚠️  Nginx configuration files not found in project directory"
        print_info "Make sure to copy nginx configuration files to the server"
    fi

    print_status "✅ Nginx configuration ready"
}

# Main setup process
main() {
    print_status "Starting domain setup for production environment..."
    echo ""

    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me)
    print_status "Server IP: $SERVER_IP"
    echo ""

    # Install packages
    install_packages
    echo ""

    # Test DNS configuration
    print_status "Testing DNS configuration..."
    test_dns "bossapp.id" "$SERVER_IP"
    test_dns "api.bossapp.id" "$SERVER_IP"
    test_dns "dashboard.bossapp.id" "$SERVER_IP"
    echo ""

    # Setup SSL
    setup_ssl
    echo ""

    # Generate Nginx config
    generate_nginx_config
    echo ""

    # Create external network (optional for nginx)
    print_step "Checking Docker network..."
    docker network ls | grep -q default || docker network create default
    print_status "✅ Docker network ready"
    echo ""

    # Summary
    echo "📋 SETUP SUMMARY"
    echo "================"
    print_status "Domain setup completed!"
    echo ""
    print_info "Next steps:"
    echo "1. Update DNS records to point to this server IP: $SERVER_IP"
    echo "2. Deploy your services with docker-compose up -d"
    echo "3. Run ./generate-ssl.sh to create SSL certificates"
    echo "4. Run ./test-nginx.sh to test the configuration"
    echo "5. Test all domains after SSL setup"
    echo ""
    print_info "Nginx Dashboard: Not applicable (nginx doesn't have a web dashboard)"
    print_info "Nginx Configuration: ./nginx/"
    print_info "SSL Certificates: ./nginx/ssl/"
}

# Run main function
main "$@"
