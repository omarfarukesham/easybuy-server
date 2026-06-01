/**
 * Seeds a single OWNER admin, only if no admins exist yet.
 * Credentials come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 *
 * Run:  npm run seed:admin   (or)   node seed/admin.js
 *
 * Self-contained on purpose: defines its own Admin schema so it can run under
 * plain `node` without the TypeScript toolchain. The schema mirrors
 * src/models/Admin.ts — keep them in sync.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager'], default: 'manager' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Admin = mongoose.model('Admin', AdminSchema);

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/easybuy';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in the environment.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const count = await Admin.countDocuments();
  if (count > 0) {
    console.log(`Admins already exist (${count}). Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    email: email.toLowerCase(),
    passwordHash,
    name: 'Owner',
    role: 'owner',
  });

  console.log(`Created owner admin: ${admin.email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
