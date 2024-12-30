module.exports = {
  apps: [
    {
      name: 'ticket-frontend',
      script: 'npm',
      args: 'run dev',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 5080
      }
    },
    {
      name: 'ticket-backend',
      script: 'ts-node',
      args: '--project tsconfig.server.json ./server/index.ts',
      watch: ['server'],
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'development',
        PORT: 5181
      }
    }
  ]
}; 