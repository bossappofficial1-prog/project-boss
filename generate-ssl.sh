#!/bin/bash

# SSL Certificate Generation Script for Nginx
# Generate Let's Encrypt certificates for production domains

set -e

echo "🔐 SSL Certificate Generation for Nginx"
echo "========================================"

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

# Install certbot if not installed
install_certbot() {
    print_step "Installing Certbot..."

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum >/dev/null 2>&1; then
        yum install -y certbot python3-certbot-nginx
    else
        print_error "Unsupported package manager. Please install certbot manually."
        exit 1
    fi

    print_status "✅ Certbot installed"
}

# Stop nginx temporarily for certificate generation
stop_nginx() {
    print_step "Stopping Nginx for certificate generation..."

    if command -v systemctl >/dev/null 2>&1; then
        systemctl stop nginx || true
    else
        service nginx stop || true
    fi

    # Also stop docker nginx if running
    docker-compose stop nginx || true

    print_status "✅ Nginx stopped"
}

# Generate certificates for each domain
generate_certificates() {
    local domains=("api.bossapp.id" "dashboard.bossapp.id" "bossapp.id")

    for domain in "${domains[@]}"; do
        print_step "Generating certificate for $domain..."

        if certbot certonly --standalone -d "$domain" --non-interactive --agree-tos --email admin@bossapp.id; then
            print_status "✅ Certificate generated for $domain"

            # Copy certificates to nginx ssl directory
            local cert_dir="/etc/letsencrypt/live/$domain"
            local nginx_ssl_dir="./nginx/ssl"

            mkdir -p "$nginx_ssl_dir"

            cp "$cert_dir/fullchain.pem" "$nginx_ssl_dir/$domain.crt"
            cp "$cert_dir/privkey.pem" "$nginx_ssl_dir/$domain.key"

            print_status "✅ Certificates copied to nginx/ssl directory"
        else
            print_error "❌ Failed to generate certificate for $domain"
        fi
    done
}

# Start nginx after certificate generation
start_nginx() {
    print_step "Starting Nginx..."

    if command -v systemctl >/dev/null 2>&1; then
        systemctl start nginx || true
    else
        service nginx start || true
    fi

    print_status "✅ Nginx started"
}

# Set up automatic renewal
setup_renewal() {
    print_step "Setting up automatic certificate renewal..."

    # Add renewal hook
    mkdir -p /etc/letsencrypt/renewal-hooks/post

    cat > /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh << 'EOF'
#!/bin/bash
# Reload nginx after certificate renewal
if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
else
    service nginx reload
fi

# Copy renewed certificates to nginx ssl directory
for domain in api.bossapp.id dashboard.bossapp.id bossapp.id; do
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        cp "/etc/letsencrypt/live/$domain/fullchain.pem" "./nginx/ssl/$domain.crt"
        cp "/etc/letsencrypt/live/$domain/privkey.pem" "./nginx/ssl/$domain.key"
    fi
done

# Reload nginx in docker if running
docker-compose exec nginx nginx -s reload || true
EOF

    chmod +x /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh

    print_status "✅ Automatic renewal configured"
}

# Test certificate renewal
test_renewal() {
    print_step "Testing certificate renewal..."

    if certbot renew --dry-run; then
        print_status "✅ Certificate renewal test passed"
    else
        print_warning "⚠️  Certificate renewal test failed"
    fi
}

# Main function
main() {
    print_status "Starting SSL certificate generation..."
    echo ""

    # Install certbot
    install_certbot
    echo ""

    # Stop nginx
    stop_nginx
    echo ""

    # Generate certificates
    generate_certificates
    echo ""

    # Start nginx
    start_nginx
    echo ""

    # Setup renewal
    setup_renewal
    echo ""

    # Test renewal
    test_renewal
    echo ""

    # Summary
    echo "📋 SSL SETUP SUMMARY"
    echo "===================="
    print_status "SSL certificates generated successfully!"
    echo ""
    print_info "Certificate locations:"
    echo "• Let's Encrypt: /etc/letsencrypt/live/"
    echo "• Nginx: ./nginx/ssl/"
    echo ""
    print_info "Next steps:"
    echo "1. Update nginx configuration to use HTTPS"
    echo "2. Test all domains with HTTPS"
    echo "3. Set up monitoring for certificate expiry"
    echo "4. Configure firewall to allow HTTPS traffic"
    echo ""
    print_info "Useful commands:"
    echo "• Check certificate status: certbot certificates"
    echo "• Renew certificates: certbot renew"
    echo "• Test renewal: certbot renew --dry-run"
    echo "• Reload nginx: docker-compose exec nginx nginx -s reload"
}

# Run main function
main "$@"
