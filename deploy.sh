#!/bin/bash
# Deploy script for both Frontend (Next.js) and Backend (Strapi) on Contabo VPS
# Run this after pulling changes from GitHub

set -e  # Exit on error

echo "🚀 Starting full deployment (Frontend + Backend)..."

# Configuration
PROJECT_DIR="/var/www/coupon-website"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# ============================================
# BACKEND DEPLOY
# ============================================
echo ""
echo "🔧 === BACKEND DEPLOY ==="
cd "$BACKEND_DIR"

echo "📦 Installing backend dependencies..."
npm install --production=false

echo "🔨 Building Strapi backend..."
npm run build

echo "🔄 Restarting Strapi via PM2..."
pm2 restart coupon-backend --update-env

# ============================================
# FRONTEND DEPLOY
# ============================================
echo ""
echo "🎨 === FRONTEND DEPLOY ==="
cd "$FRONTEND_DIR"

echo "📦 Installing frontend dependencies..."
npm install --production=false

echo "🔨 Building Next.js frontend..."
npm run build

echo "🔄 Restarting Next.js via PM2..."
pm2 restart coupon-frontend --update-env

# ============================================
# HEALTH CHECKS
# ============================================
echo ""
echo "✅ Waiting for services to be ready..."
sleep 8

# Backend health check
if curl -f -s http://localhost:1337/api/stores?pagination[pageSize]=1 > /dev/null; then
    echo "✅ Backend (Strapi) is healthy!"
else
    echo "⚠️  Backend health check failed. Check logs:"
    echo "   pm2 logs coupon-backend"
    exit 1
fi

# Frontend health check
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend (Next.js) is healthy!"
else
    echo "⚠️  Frontend health check failed. Check logs:"
    echo "   pm2 logs coupon-frontend"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Services:"
echo "   Frontend: https://freediscountcoupons.com  (port 3000)"
echo "   Backend:  https://api.freediscountcoupons.com  (port 1337)"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs coupon-frontend    # Frontend logs"
echo "   pm2 logs coupon-backend     # Backend logs"
echo "   pm2 status                  # Check status"
echo "   pm2 monit                   # Monitor resources"
echo "   ./deploy.sh                 # Redeploy"