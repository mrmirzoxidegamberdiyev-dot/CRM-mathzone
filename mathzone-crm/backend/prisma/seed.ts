import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  
  const hashedAdmin = await bcrypt.hash('admin123', SALT_ROUNDS);
  const hashedReception = await bcrypt.hash('1234', SALT_ROUNDS);
  const hashedTeacher = await bcrypt.hash('1234', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@mathzone.uz',
      password: hashedAdmin,
      name: 'Behruz Berdiyev',
      role: 'ADMINISTRATOR',
      avatar: 'BB'
    }
  });

  await prisma.user.upsert({
    where: { username: 'reception' },
    update: {},
    create: {
      username: 'reception',
      email: 'reception@mathzone.uz',
      password: hashedReception,
      name: 'Malika Yusupova',
      role: 'RECEPTION',
      avatar: 'MY'
    }
  });

  await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      email: 'teacher@mathzone.uz',
      password: hashedTeacher,
      name: 'Jasur Nazarov',
      role: 'TEACHER',
      avatar: 'JN'
    }
  });

  console.log('✅ Seed data created successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
