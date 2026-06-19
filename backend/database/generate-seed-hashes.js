// Script to generate bcrypt hashes for demo passwords
// Run: node backend/database/generate-seed-hashes.js

const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password';
  
  console.log('Generating bcrypt hashes for demo password: "password"');
  console.log('================================================\n');
  
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Bcrypt Hash for "password":\n${hash}\n`);
    
    console.log('Use this hash in seed.sql for all demo users.');
    console.log('Example INSERT statement:');
    console.log(`INSERT INTO users (name, email, password_hash, role, phone, is_active) VALUES`);
    console.log(`('Ananya Rao', 'admin@orbem.local', '${hash}', 'Admin / Owner', '+91 98765 10001', 1);`);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHashes();
