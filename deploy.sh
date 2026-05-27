#!/bin/bash
set -e

# ============================================
#  Training Survey — Remote Deploy Script
#  Usage: bash deploy.sh
# ============================================

SERVER="root@srv1100100.hstgr.cloud"
REMOTE_DIR="/home/web/trainingsurvey"

echo ""
echo "🚀 Deploying Training Survey to ${SERVER}..."
echo "============================================"

ssh "$SERVER" bash -s <<'EOF'
set -e

echo ""
echo "📂 Setting up /home/web path..."
mkdir -p /home/web
cd /home/web

if [ ! -d "trainingsurvey" ]; then
  echo "📥 Cloning project repository..."
  git clone https://github.com/mizae1234/trainingsurvey.git
  cd trainingsurvey
else
  echo "📥 Pulling latest code..."
  cd trainingsurvey
  git pull origin main
fi

echo ""
echo "🐳 Rebuilding Docker image..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "⏳ Waiting for container..."
sleep 5

if docker ps --filter "name=trainingsurvey-app" --filter "status=running" -q | grep -q .; then
    echo ""
    echo "✅ Deploy successful!"
    docker logs --tail 5 trainingsurvey-app
else
    echo ""
    echo "❌ Container failed!"
    docker logs --tail 20 trainingsurvey-app
    exit 1
fi
EOF

echo ""
echo "🎉 Training Survey deployed successfully!"
echo "🌐 Domain Map: http://trnsurvey.popcorn-creator.com (Please ensure reverse proxy points to port 3021)"
echo ""
