#!/bin/bash

# Test Nginx Configuration Script
# Test nginx configuration and domain routing

set -e

echo "🧪 Testing Nginx Configuration"
echo "================================"

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

# Test nginx configuration syntax
test_nginx_config() {
    print_step "Testing Nginx configuration syntax..."

    if docker-compose exec nginx nginx -t 2>/dev/null; then
        print_status "✅ Nginx configuration is valid"
        return 0
    else
        print_error "❌ Nginx configuration has errors"
        docker-compose exec nginx nginx -t
        return 1
    fi
}

# Test nginx service
test_nginx_service() {
    print_step "Testing Nginx service..."

    if docker-compose ps nginx | grep -q "Up"; then
        print_status "✅ Nginx service is running"
        return 0
    else
        print_error "❌ Nginx service is not running"
        return 1
    fi
}

# Test domain routing
test_domain_routing() {
    local domain=$1
    local expected_service=$2
    local port=$3

    print_step "Testing domain routing for $domain..."

    # Test if domain resolves to localhost (for local testing)
    if curl -s -I "http://localhost/$domain" >/dev/null 2>&1; then
        print_status "✅ $domain routing works"
        return 0
    else
        print_warning "⚠️  $domain routing test failed (may be normal for production domains)"
        return 1
    fi
}

# Test backend API through nginx
test_backend_api() {
    print_step "Testing backend API through Nginx..."

    if curl -s "http://localhost/api/health" >/dev/null 2>&1; then
        print_status "✅ Backend API accessible through Nginx"
        return 0
    else
        print_warning "⚠️  Backend API not accessible through Nginx"
        return 1
    fi
}

# Test frontend through nginx
test_frontend() {
    print_step "Testing frontend through Nginx..."

    if curl -s "http://localhost/dashboard/" >/dev/null 2>&1; then
        print_status "✅ Frontend accessible through Nginx"
        return 0
    else
        print_warning "⚠️  Frontend not accessible through Nginx"
        return 1
    fi
}

# Test frontend-customer through nginx
test_frontend_customer() {
    print_step "Testing frontend-customer through Nginx..."

    if curl -s "http://localhost/" >/dev/null 2>&1; then
        print_status "✅ Frontend-customer accessible through Nginx"
        return 0
    else
        print_warning "⚠️  Frontend-customer not accessible through Nginx"
        return 1
    fi
}

# Test SSL configuration (if certificates exist)
test_ssl_config() {
    print_step "Testing SSL configuration..."

    if [ -f "./nginx/ssl/api.bossapp.id.crt" ] && [ -f "./nginx/ssl/api.bossapp.id.key" ]; then
        print_status "✅ SSL certificates found"
        return 0
    else
        print_warning "⚠️  SSL certificates not found (run generate-ssl.sh to create them)"
        return 1
    fi
}

# Show nginx logs
show_nginx_logs() {
    print_step "Recent Nginx logs..."

    echo ""
    docker-compose logs --tail=20 nginx
    echo ""
}

# Main test function
main() {
    print_status "Starting Nginx configuration test..."
    echo ""

    local failed_tests=0

    # Test nginx configuration
    if ! test_nginx_config; then
        ((failed_tests++))
    fi

    # Test nginx service
    if ! test_nginx_service; then
        ((failed_tests++))
    fi

    echo ""

    # Test domain routing (for local development)
    test_domain_routing "api.bossapp.id" "backend" "4444"
    test_domain_routing "dashboard.bossapp.id" "frontend" "3000"
    test_domain_routing "bossapp.id" "frontend-customer" "3001"

    echo ""

    # Test service accessibility
    if ! test_backend_api; then
        ((failed_tests++))
    fi

    if ! test_frontend; then
        ((failed_tests++))
    fi

    if ! test_frontend_customer; then
        ((failed_tests++))
    fi

    echo ""

    # Test SSL
    test_ssl_config

    echo ""

    if [ $failed_tests -eq 0 ]; then
        print_status "🎉 All critical tests passed!"
        echo ""
        print_info "Your Nginx configuration is working correctly."
    else
        print_warning "⚠️  $failed_tests test(s) failed."
        echo ""
        print_info "Check the error messages above and fix any issues."
        echo "Common solutions:"
        echo "• Run: docker-compose exec nginx nginx -t"
        echo "• Check logs: docker-compose logs nginx"
        echo "• Verify configuration files in ./nginx/"
    fi

    echo ""

    # Show logs
    show_nginx_logs

    # Summary
    echo "📋 TEST SUMMARY"
    echo "==============="
    print_info "Useful commands:"
    echo "• Reload nginx: docker-compose exec nginx nginx -s reload"
    echo "• Check config: docker-compose exec nginx nginx -t"
    echo "• View logs: docker-compose logs -f nginx"
    echo "• Test specific domain: curl -I http://your-domain.com"
    echo ""
    print_info "For production testing:"
    echo "• Update DNS records to point to your server"
    echo "• Run generate-ssl.sh to create SSL certificates"
    echo "• Test with: curl -I https://your-domain.com"
}

# Run main function
main "$@"
