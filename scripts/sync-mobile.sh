#!/usr/bin/env bash
set -e

echo "Building production frontend web bundle..."
npm run build

echo "Syncing changes to native platforms..."
npx cap sync

echo "Mobile projects synced successfully."
