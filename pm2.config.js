// pm2.config.js
module.exports = {
  apps: [
    {
      name: 'agent-task-manager',
      script: 'dist/index.js',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DATABASE_PATH: process.env.DATABASE_PATH || './data/task_manager.db'
      }
    }
  ]
};
