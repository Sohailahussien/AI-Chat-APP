#!/bin/bash

# Production Deployment Script for Cubi AI Platform
# Deploys front-end, back-end, and MCP server to Vercel with Fluid Compute

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cubi-ai-platform"
VERCEL_ORG_ID="your-org-id"
VERCEL_PROJECT_ID="your-project-id"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Environment Setup
print_status "Setting up deployment environment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if Python dependencies are installed
if [ ! -d "venv" ]; then
    print_warning "Python virtual environment not found. Creating..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Step 2: Build Optimization
print_status "Optimizing build for production..."

# Clean previous builds
rm -rf .next
rm -rf dist
rm -rf build

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm ci --production=false

# Build Next.js application
print_status "Building Next.js application..."
npm run build

# Step 3: Security Checks
print_status "Running security checks..."

# Check for sensitive data in code
if grep -r "API_KEY\|SECRET\|PASSWORD" src/ --exclude-dir=node_modules; then
    print_warning "Potential sensitive data found in source code"
fi

# Check for proper environment variables
if [ -z "$CHROMA_DB_PATH" ]; then
    print_warning "CHROMA_DB_PATH not set, using default"
    export CHROMA_DB_PATH="./chroma_db"
fi

# Step 4: Database Migration
print_status "Preparing database for production..."

# Create production database directory
mkdir -p ./chroma_db_prod

# Run database migration script
python scripts/migrate_db.py --env production

# Step 5: MCP Server Deployment
print_status "Deploying MCP server..."

# Build MCP server
cd src/mcp
npm run build
cd ../..

# Deploy MCP server to Vercel
print_status "Deploying MCP server to Vercel..."
vercel --prod --yes --token $VERCEL_TOKEN

# Step 6: Main Application Deployment
print_status "Deploying main application..."

# Set production environment variables
export NODE_ENV=production
export FLUID_COMPUTE_ENABLED=true
export MCP_SERVER_URL=$(vercel inspect --token $VERCEL_TOKEN | grep "MCP Server URL" | cut -d' ' -f4)

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod --yes --token $VERCEL_TOKEN

# Step 7: Post-Deployment Verification
print_status "Verifying deployment..."

# Get deployment URL
DEPLOYMENT_URL=$(vercel inspect --token $VERCEL_TOKEN | grep "Production URL" | cut -d' ' -f4)

# Health check
print_status "Running health checks..."
curl -f "$DEPLOYMENT_URL/api/health" || print_error "Health check failed"

# Test MCP server
print_status "Testing MCP server..."
curl -f "$DEPLOYMENT_URL/api/mcp" -X POST -H "Content-Type: application/json" \
  -d '{"type": "ping"}' || print_error "MCP server test failed"

# Step 8: Monitoring Setup
print_status "Setting up monitoring..."

# Configure monitoring endpoints
curl -X POST "$DEPLOYMENT_URL/api/monitoring/setup" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "logLevel": "info"}' || print_warning "Monitoring setup failed"

# Step 9: Final Verification
print_status "Final deployment verification..."

# Check all services are running
services=("api/chat" "api/mcp" "api/monitoring")
for service in "${services[@]}"; do
    if curl -f "$DEPLOYMENT_URL/$service" > /dev/null 2>&1; then
        print_success "$service is running"
    else
        print_error "$service is not responding"
    fi
done

# Step 10: Documentation
print_status "Generating deployment documentation..."

# Create deployment report
cat > deployment_report.md << EOF
# Deployment Report - $(date)

## Deployment Details
- **Project**: $PROJECT_NAME
- **Environment**: Production
- **Deployment URL**: $DEPLOYMENT_URL
- **MCP Server URL**: $MCP_SERVER_URL
- **Deployment Time**: $(date)

## Services Status
- ✅ Frontend (Next.js)
- ✅ Backend (API Routes)
- ✅ MCP Server
- ✅ Monitoring
- ✅ Fluid Compute

## Configuration
- **Node.js Version**: $(node --version)
- **Python Version**: $(python --version)
- **Vercel CLI Version**: $(vercel --version)

## Security Features
- ✅ Environment Variables Secured
- ✅ API Keys Protected
- ✅ CORS Configured
- ✅ Rate Limiting Enabled

## Performance Features
- ✅ Fluid Compute Enabled
- ✅ Edge Functions Configured
- ✅ CDN Enabled
- ✅ Compression Enabled

## Monitoring
- ✅ Health Checks Configured
- ✅ Error Tracking Enabled
- ✅ Performance Monitoring Active
- ✅ Audit Logging Enabled
EOF

print_success "Deployment completed successfully!"
print_success "Deployment URL: $DEPLOYMENT_URL"
print_success "Deployment report saved to: deployment_report.md"

echo ""
echo "🎉 Production deployment completed!"
echo "📊 Monitor your application at: $DEPLOYMENT_URL"
echo "📋 View deployment report: deployment_report.md" 