#!/bin/bash

# Stop any existing instance
pm2 stop agent-task-manager || true

# Start the application using pm2
pm2 start pm2.config.js

# Display pm2 status
pm2 status