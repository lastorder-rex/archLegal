const bcrypt = require('bcryptjs');

const password = 'tkddn76!@#';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Password hash for migration:');
  console.log(hash);
});
