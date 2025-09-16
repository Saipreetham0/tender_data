#!/bin/bash

# scripts/rollback-optimized-routes.sh - Rollback script to restore original routes

echo "🔄 Rolling back to original tender API routes..."

# Find the most recent backup directory
BASE_PATH="src/app/api/tenders"
BACKUP_DIR=$(find "$BASE_PATH" -name "backups-*" -type d | sort | tail -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No backup directory found. Cannot rollback."
    exit 1
fi

echo "📁 Using backup directory: $BACKUP_DIR"

# Define the routes to rollback
declare -a routes=("basar" "ongole" "rkvalley" "sklm" "nuzvidu" "rgukt")

for route in "${routes[@]}"
do
    ROUTE_DIR="$BASE_PATH/$route"
    BACKUP_FILE="$BACKUP_DIR/route-$route-original.ts"

    if [ -f "$BACKUP_FILE" ]; then
        echo "🔄 Restoring $route route..."
        cp "$BACKUP_FILE" "$ROUTE_DIR/route.ts"
        echo "  ✅ Restored original $route route"
    else
        echo "  ⚠️  No backup found for $route route"
    fi
done

echo ""
echo "✅ Rollback completed!"
echo "  - All routes restored to original scraping versions"
echo "  - Performance will be slower but functionality maintained"
echo ""
echo "📝 Note: You may want to stop the centralized scraper after rollback"