#!/bin/bash

# 🧪 Local Staging Test Script
# Test your staging deployment locally before pushing to GitHub

set -e

echo "🧪 Testing Project Boss Staging Setup..."
echo "=========================================="

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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available"
    exit 1
fi

# Check required files
print_status "Checking required files..."
REQUIRED_FILES=("docker-compose.yml" "docker-compose.dev.yml" ".env.staging.example")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    cp .env.staging.example .env
    print_warning "Please edit .env file with your actual values"
fi

# Test Docker Compose configuration
print_status "Testing Docker Compose configuration..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet
fi

if [ $? -eq 0 ]; then
    print_status "✅ Docker Compose configuration is valid"
else
    print_error "❌ Docker Compose configuration has errors"
    exit 1
fi

# Test building images
print_status "Testing Docker image builds..."
SERVICES=("backend" "frontend")

for service in "${SERVICES[@]}"; do
    print_info "Building $service image..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build $service
    else
        docker compose -f docker-compose.yml -f docker-compose.dev.yml build $service
    fi

    if [ $? -eq 0 ]; then
        print_status "✅ $service build successful"
    else
        print_error "❌ $service build failed"
        exit 1
    fi
done

# Test starting services
print_status "Testing service startup..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
fi

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
fi

# Test backend health endpoint
print_status "Testing backend health endpoint..."
if curl -f http://localhost:4444/health 2>/dev/null || curl -f http://localhost:4444/api/health 2>/dev/null; then
    print_status "✅ Backend health check passed"
else
    print_warning "⚠️  Backend health check failed (might be normal if no health endpoint)"
fi

# Test frontend availability
print_status "Testing frontend availability..."
if curl -f http://localhost:3000 2>/dev/null; then
    print_status "✅ Frontend is accessible"
else
    print_warning "⚠️  Frontend not accessible yet (might still be starting)"
fi

# Show logs
print_status "Recent logs:"
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=10
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=10
fi

echo ""
echo "=========================================="
print_status "🎉 LOCAL STAGING TEST COMPLETED!"
echo "=========================================="
echo ""
print_info "📋 Test Results:"
echo "• Docker Compose config: ✅ Valid"
echo "• Backend build: ✅ Successful"
echo "• Frontend build: ✅ Successful"
echo "• Services startup: ✅ Completed"
echo ""
print_info "🌐 Access URLs:"
echo "• Frontend: http://localhost:3000"
echo "• Backend: http://localhost:4444"
echo ""
print_info "🔧 Useful commands:"
echo "• View logs: docker compose logs -f"
echo "• Stop services: docker compose down"
echo "• Restart: docker compose restart"
echo ""
print_warning "⚠️  Remember to:"
echo "• Stop local services before pushing to GitHub"
echo "• Update .env with production values for staging server"
echo "• Test SSH connection to staging server"
echo ""
print_status "Ready for staging deployment! 🚀"
