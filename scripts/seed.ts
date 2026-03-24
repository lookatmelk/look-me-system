import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function seed() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  const adminEmail = 'admin@lookatme.com';
  // Generate a strong random password
  const rawPassword = crypto.randomBytes(8).toString('hex') + 'A1!'; // Ensures complexity
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);
  
  // Generate a secure 32-byte hex for NextAuth
  const authSecret = crypto.randomBytes(32).toString('hex');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Check if they already exist, if so we don't duplicate, but for simplicity we append
  // A robust script would replace, but append is safe since Next.js uses the last defined or first defined depending on parser (dotenv uses first, but let's just append for now, or replace).
  // Actually dotenv uses the first defined variable. We should remove existing ones if any.
  
  let lines = envContent.split('\n');
  lines = lines.filter(line => !line.startsWith('AUTH_SECRET=') && !line.startsWith('ADMIN_EMAIL=') && !line.startsWith('ADMIN_PASSWORD_HASH='));
  
  lines.push(`AUTH_SECRET=${authSecret}`);
  lines.push(`ADMIN_EMAIL=${adminEmail}`);
  // Escape $ signs so Next.js dotenv-expand doesn't mangle the bcrypt hash
  const escapedHash = passwordHash.replace(/\$/g, '\\$');
  lines.push(`ADMIN_PASSWORD_HASH=${escapedHash}`);

  fs.writeFileSync(envPath, lines.join('\n'));
  
  console.log('✅ Seed successful!');
  console.log('--- ADMIN CREDENTIALS ---');
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${rawPassword}`);
  console.log('-------------------------');
  console.log('Please restart your Next.js development server to apply the new .env.local variables.');
}

seed().catch(console.error);
