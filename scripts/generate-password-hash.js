// Script to generate password hash
// Run this once: node scripts/generate-password-hash.js

const bcrypt = require('bcryptjs');

const password = 'charityMax123';

bcrypt.hash(password, 10).then((hash) => {
  console.log('Password hash generated:');
  console.log(hash);
  console.log('\nAdd this to your .env.local file as:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
});
