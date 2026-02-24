const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Horizon-HCM...\n');

// Step 1: Generate JWT keys
console.log('1️⃣  Generating JWT keys...');
try {
  execSync('node scripts/generate-keys.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to generate JWT keys');
  process.exit(1);
}

// Step 2: Check .env file
console.log('\n2️⃣  Checking environment configuration...');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Copying from .env.example...');
  fs.copyFileSync(
    path.join(process.cwd(), '.env.example'),
    envPath
  );
  console.log('✅ .env file created. Please update it with your configuration.');
} else {
  console.log('✅ .env file exists');
}

// Step 3: Generate Prisma clients
console.log('\n3️⃣  Generating Prisma clients...');
try {
  console.log('   Generating auth package Prisma client...');
  execSync(
    'npx prisma generate --schema=./node_modules/@ofeklabs/horizon-auth/prisma/schema.prisma',
    { stdio: 'inherit' }
  );
  
  console.log('   Generating Horizon-HCM Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to generate Prisma clients');
  process.exit(1);
}

console.log('\n✅ Setup complete!\n');
console.log('📋 Next steps:');
console.log('   1. Update .env with your database and Redis configuration');
console.log('   2. Start Redis: docker run -d -p 6379:6379 redis:alpine');
console.log('   3. Run migrations: npm run prisma:migrate');
console.log('   4. Start the app: npm run start:dev\n');
