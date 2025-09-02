#!/bin/bash

# Domain Configuration Test Script
# Test domain routing and SSL configuration

set -e

echo "🌐 Testing Domain Configuration..."
echo "==================================="

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

# Test domain resolution
test_domain_resolution() {
    local domain=$1
    print_step "Testing DNS resolution for $domain..."

    if nslookup "$domain" >/dev/null 2>&1; then
        local ip=$(nslookup "$domain" 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}')
        print_status "✅ $domain resolves to $ip"
        return 0
    else
        print_error "❌ $domain DNS resolution failed"
        return 1
    fi
}

# Test HTTPS connection
test_https_connection() {
    local domain=$1
    local service_name=$2
    print_step "Testing HTTPS connection to $domain ($service_name)..."

    if curl -s -I "https://$domain" >/dev/null 2>&1; then
        local status=$(curl -s -I "https://$domain" | head -1 | cut -d' ' -f2)
        if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
            print_status "✅ $service_name HTTPS connection successful (Status: $status)"
            return 0
        else
            print_warning "⚠️  $service_name HTTPS connection returned status $status"
            return 1
        fi
    else
        print_error "❌ $service_name HTTPS connection failed"
        return 1
    fi
}

# Test SSL certificate
test_ssl_certificate() {
    local domain=$1
    local service_name=$2
    print_step "Testing SSL certificate for $domain ($service_name)..."

    if openssl s_client -connect "$domain:443" -servername "$domain" </dev/null >/dev/null 2>&1; then
        local expiry=$(openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d'=' -f2)
        if [ -n "$expiry" ]; then
            print_status "✅ $service_name SSL certificate valid (Expires: $expiry)"
            return 0
        else
            print_warning "⚠️  $service_name SSL certificate found but expiry date unknown"
            return 1
        fi
    else
        print_error "❌ $service_name SSL certificate validation failed"
        return 1
    fi
}

# Determine environment (production or development)
if [ "$NODE_ENV" = "production" ] || [ -f ".env.prod" ]; then
    ENVIRONMENT="production"
    BACKEND_DOMAIN="api.bossapp.id"
    FRONTEND_DOMAIN="dashboard.bossapp.id"
    FRONTEND_CUSTOMER_DOMAIN="bossapp.id"
elif [ "$NODE_ENV" = "development" ] || [ -f ".env.dev" ]; then
    ENVIRONMENT="development"
    BACKEND_DOMAIN="api-dev.bossapp.id"
    FRONTEND_DOMAIN="dashboard-dev.bossapp.id"
    FRONTEND_CUSTOMER_DOMAIN="dev.bossapp.id"
else
    print_warning "Environment not specified, testing both production and development domains..."
    ENVIRONMENT="both"
fi

echo ""
print_status "Testing environment: $ENVIRONMENT"
echo ""

# Test domains based on environment
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "both" ]; then
    echo "🏭 PRODUCTION ENVIRONMENT TESTS"
    echo "================================="

    # Test production domains
    test_domain_resolution "bossapp.id"
    test_domain_resolution "api.bossapp.id"
    test_domain_resolution "dashboard.bossapp.id"

    echo ""
    test_https_connection "api.bossapp.id" "Backend API"
    test_https_connection "dashboard.bossapp.id" "Dashboard Frontend"
    test_https_connection "bossapp.id" "Customer Frontend"

    echo ""
    test_ssl_certificate "api.bossapp.id" "Backend API"
    test_ssl_certificate "dashboard.bossapp.id" "Dashboard Frontend"
    test_ssl_certificate "bossapp.id" "Customer Frontend"

    echo ""
fi

if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "both" ]; then
    echo "🛠️  DEVELOPMENT ENVIRONMENT TESTS"
    echo "==================================="

    # Test development domains
    test_domain_resolution "dev.bossapp.id"
    test_domain_resolution "api-dev.bossapp.id"
    test_domain_resolution "dashboard-dev.bossapp.id"

    echo ""
    test_https_connection "api-dev.bossapp.id" "Backend API (Dev)"
    test_https_connection "dashboard-dev.bossapp.id" "Dashboard Frontend (Dev)"
    test_https_connection "dev.bossapp.id" "Customer Frontend (Dev)"

    echo ""
    test_ssl_certificate "api-dev.bossapp.id" "Backend API (Dev)"
    test_ssl_certificate "dashboard-dev.bossapp.id" "Dashboard Frontend (Dev)"
    test_ssl_certificate "dev.bossapp.id" "Customer Frontend (Dev)"

    echo ""
fi

# Test local development ports if in development mode
if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "both" ]; then
    echo "🏠 LOCAL DEVELOPMENT TESTS"
    echo "==========================="

    print_step "Testing local development ports..."
    if curl -s http://localhost:4444 >/dev/null 2>&1; then
        print_status "✅ Backend API local (http://localhost:4444)"
    else
        print_warning "⚠️  Backend API local not accessible"
    fi

    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_status "✅ Dashboard Frontend local (http://localhost:3000)"
    else
        print_warning "⚠️  Dashboard Frontend local not accessible"
    fi

    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        print_status "✅ Customer Frontend local (http://localhost:3001)"
    else
        print_warning "⚠️  Customer Frontend local not accessible"
    fi

    echo ""
fi

# Summary
echo "📋 TEST SUMMARY"
echo "==============="
print_status "Domain configuration testing completed!"
echo ""
print_info "Next steps:"
echo "1. Configure DNS records for all domains"
echo "2. Set up SSL certificates (Let's Encrypt recommended)"
echo "3. Update environment variables in .env files"
echo "4. Deploy services with proper domain configuration"
echo "5. Test all endpoints after deployment"
echo ""
print_info "Useful commands:"
echo "• View Traefik dashboard: http://your-server-ip:8080"
echo "• Check SSL certificates: certbot certificates"
echo "• Renew SSL certificates: certbot renew"
echo "• View service logs: docker-compose logs -f [service-name]"
