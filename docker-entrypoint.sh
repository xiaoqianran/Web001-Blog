#!/bin/sh
set -e

# Ensure content directory exists and is writable by the app user
# (bind-mounted volumes often arrive as root-owned)
mkdir -p /app/content/posts
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs /app/content 2>/dev/null || true
  exec su-exec nextjs node server.js
fi

exec node server.js
