require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function provisionDemoUser() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'false') return;
  const email = String(process.env.DEMO_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  if (!email.includes('@') || password.length < 12) throw new Error('Valid demo email and a 12+ character demo password are required');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email,password,name,email_verified,role)
     VALUES($1,$2,'Runtime Administrator',true,'admin')
     ON CONFLICT(email) DO UPDATE SET
       password=EXCLUDED.password,email_verified=true,role='admin',updated_at=NOW()`,
    [email, passwordHash],
  );
  console.log('Runtime demo administrator reconciled.');
}

provisionDemoUser()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
