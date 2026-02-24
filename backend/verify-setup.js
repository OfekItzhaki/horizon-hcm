#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Horizon-HCM Setup Verification\n');
console.log('='.repeat(50));

const checks = [];

// Check 1: Node.js version
console.log('\n1️⃣  Checking Node.js version...');
try {
  const nodeVersion = process.version;
  console.log(`   ✅ Node.js ${nodeVersion}`);
  checks.push({ name: 'Node.js', status: 'pass', details: nodeVersion });
} catch (error) {
  console.log('   ❌ Node.js not found');
  checks.push({ name: 'Node.js', status: 'fail', details: error.message });
}

// Check 2: Dependencies
console.log('\n2️⃣  Checking dependencies...');
try {
  const packageJson = require('./package.json');
  const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
  if (nodeModulesExists) {
    console.log('   ✅ node_modules exists');
    checks.push({ name: 'Dependencies', status: 'pass', details: 'Installed' });
  } else {
    console.log('   ❌ node_modules not found - run: npm install');
    checks.push({ name: 'Dependencies', status: 'fail', details: 'Not installed' });
  }
} catch (error) {
  console.log('   ❌ Error checking dependencies');
  checks.push({ name: 'Dependencies', status: 'fail', details: error.message });
}

// Check 3: Prisma Client
console.log('\n3️⃣  Checking Prisma Client...');
try {
  const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('   ✅ Prisma Client generated');
    checks.push({ name: 'Prisma Client', status: 'pass', details: 'Generated' });
  } else {
    console.log('   ❌ Prisma Client not found - run: npm run prisma:generate');
    checks.push({ name: 'Prisma Client', status: 'fail', details: 'Not generated' });
  }
} catch (error) {
  console.log('   ❌ Error checking Prisma Client');
  checks.push({ name: 'Prisma Client', status: 'fail', details: error.message });
}

// Check 4: JWT Keys
console.log('\n4️⃣  Checking JWT keys...');
try {
  const privateKeyPath = path.join(__dirname, 'certs', 'private.pem');
  const publicKeyPath = path.join(__dirname, 'certs', 'public.pem');
  
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log('   ✅ JWT keys exist');
    console.log('      - certs/private.pem');
    console.log('      - certs/public.pem');
    checks.push({ name: 'JWT Keys', status: 'pass', details: 'Generated' });
  } else {
    console.log('   ❌ JWT keys not found - run: npm run setup');
    checks.push({ name: 'JWT Keys', status: 'fail', details: 'Not generated' });
  }
} catch (error) {
  console.log('   ❌ Error checking JWT keys');
  checks.push({ name: 'JWT Keys', status: 'fail', details: error.message });
}

// Check 5: Environment file
console.log('\n5️⃣  Checking environment configuration...');
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDatabase = envContent.includes('DATABASE_URL=');
    const hasRedis = envContent.includes('REDIS_HOST=');
    
    console.log('   ✅ .env file exists');
    if (hasDatabase) {
      console.log('   ✅ DATABASE_URL configured');
    } else {
      console.log('   ⚠️  DATABASE_URL not configured');
    }
    if (hasRedis) {
      console.log('   ✅ REDIS_HOST configured');
    } else {
      console.log('   ⚠️  REDIS_HOST not configured');
    }
    checks.push({ name: 'Environment', status: 'pass', details: '.env exists' });
  } else {
    console.log('   ❌ .env file not found - run: npm run setup');
    checks.push({ name: 'Environment', status: 'fail', details: '.env missing' });
  }
} catch (error) {
  console.log('   ❌ Error checking environment');
  checks.push({ name: 'Environment', status: 'fail', details: error.message });
}

// Check 6: Redis
console.log('\n6️⃣  Checking Redis connection...');
try {
  execSync('docker exec redis redis-cli ping', { stdio: 'pipe' });
  console.log('   ✅ Redis is running (PONG)');
  checks.push({ name: 'Redis', status: 'pass', details: 'Running on port 6379' });
} catch (error) {
  console.log('   ❌ Redis not running');
  console.log('      Run: docker run -d --name redis -p 6379:6379 redis:7-alpine');
  checks.push({ name: 'Redis', status: 'fail', details: 'Not running' });
}

// Check 7: Database Connection
console.log('\n7️⃣  Checking database connection...');
try {
  execSync('npx prisma db pull --force', { stdio: 'pipe', timeout: 10000 });
  console.log('   ✅ Database connection successful');
  checks.push({ name: 'Database', status: 'pass', details: 'Connected' });
} catch (error) {
  console.log('   ❌ Database connection failed');
  console.log('      Check DATABASE_URL in .env');
  console.log('      See DATABASE_CONNECTION_GUIDE.md for help');
  checks.push({ name: 'Database', status: 'fail', details: 'Connection failed' });
}

// Check 8: TypeScript compilation
console.log('\n8️⃣  Checking TypeScript compilation...');
try {
  execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
  console.log('   ✅ TypeScript compilation successful');
  checks.push({ name: 'Build', status: 'pass', details: 'Compiled successfully' });
} catch (error) {
  console.log('   ❌ TypeScript compilation failed');
  console.log('      Run: npm run build');
  checks.push({ name: 'Build', status: 'fail', details: 'Compilation errors' });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary\n');

const passed = checks.filter(c => c.status === 'pass').length;
const failed = checks.filter(c => c.status === 'fail').length;
const total = checks.length;

console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Ready to start the application.');
  console.log('\n📋 Next steps:');
  console.log('   1. Run migrations: npm run prisma:migrate dev');
  console.log('   2. Start app: npm run start:dev');
  console.log('   3. Open Swagger: http://localhost:3001/api\n');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
  console.log('📚 Documentation:');
  console.log('   - DEPLOYMENT_CHECKLIST.md');
  console.log('   - DATABASE_CONNECTION_GUIDE.md');
  console.log('   - SETUP_STATUS.md\n');
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
