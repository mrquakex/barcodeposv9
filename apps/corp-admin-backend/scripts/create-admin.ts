import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'superadmin@barcodepos.trade';
  const password = process.env.ADMIN_PASSWORD || 'elwerci12';
  const name = process.env.ADMIN_NAME || 'Super Admin';

  // Check if admin already exists
  const existing = await prisma.corpAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.corpAdmin.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'CORP_ADMIN',
      isActive: true
    }
  });

  console.log('Admin created successfully:');
  console.log('Email:', admin.email);
  console.log('Role:', admin.role);
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('Error creating admin:', error);
  process.exit(1);
});

