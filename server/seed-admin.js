/**
 * Seed script — creates or updates the admin account.
 * Usage: node seed-admin.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User.js';

dotenv.config();

const ADMIN_EMAIL    = 'nikhilsah905@gmail.com';
const ADMIN_PASSWORD = 'nikhil@6789';
const ADMIN_NAME     = 'Nikhil Sah';

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to:', mongoose.connection.host);

  // Remove old admin if exists
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    await existing.deleteOne();
    console.log('🗑  Removed existing account for', ADMIN_EMAIL);
  }

  // Create fresh admin — the pre-save hook will hash the password
  const admin = new User({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'Admin',
    available: true,
    skills: [],
  });
  await admin.save();

  console.log('');
  console.log('✅ Admin account created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email    :', ADMIN_EMAIL);
  console.log('  Password :', ADMIN_PASSWORD);
  console.log('  Role     : Admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
