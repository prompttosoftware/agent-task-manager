#!/bin/bash

# Set environment variables if not already set
export PORT=${PORT:-3000}
export DATABASE_PATH=${DATABASE_PATH:-./data/task_manager.db}

# Start the application using pm2
pm run build
pm2 start pm2.config.js --env production
