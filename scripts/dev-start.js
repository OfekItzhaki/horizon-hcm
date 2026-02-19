const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Horizon-HCM Development Environment...\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Running setup...');
  execSync('npm run setup', { stdio: 'inherit' });
}

// Start Docker services
console.log('🐳 Starting Docker services (PostgreSQL, Redis, Seq)...');
try {
  execSync('docker-compose up -d', { stdio: 'inherit' });
  console.log('✅ Docker services started successfully\n');
} catch (error) {
  console.error('❌ Failed to start Docker services');
  console.error('   Make sure Docker is installed and running');
  process.exit(1);
}

// Wait for services to be healthy
console.log('⏳ Waiting for services to be ready...');
let retries = 30;
while (retries > 0) {
  try {
    execSync('docker-compose ps --services --filter "status=running"', {
      stdio: 'pipe',
    });
    break;
  } catch (error) {
    retries--;
    if (retries === 0) {
      console.error('❌ Services failed to start');
      process.exit(1);
    }
    // Wait 1 second
    execSync('timeout /t 1 /nobreak > nul', { stdio: 'pipe' });
  }
}

console.log('✅ All services are ready\n');

console.log('📋 Service URLs:');
console.log('   PostgreSQL: localhost:5432');
console.log('   Redis: localhost:6379');
console.log('   Seq (Logs): http://localhost:5341\n');

console.log('🎯 Next steps:');
console.log('   1. Run migrations: npm run prisma:migrate');
console.log('   2. Start the app: npm run start:dev');
console.log('   3. View API docs: http://localhost:3001/api/docs\n');
