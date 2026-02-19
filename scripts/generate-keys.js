const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Ensure certs directory exists
const certsDir = path.join(process.cwd(), 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Write keys to files
fs.writeFileSync(path.join(certsDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(certsDir, 'public.pem'), publicKey);

console.log('✅ JWT keys generated successfully!');
console.log('   - certs/private.pem');
console.log('   - certs/public.pem');
