import { PrismaClient, Role, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SingSlot database seeding (Idempotent)...');

  // Enforce Twelve-Factor environment credentials (R-02, R-12)
  const staffPassword = process.env.STAFF_PASSWORD;
  const customerPassword = process.env.CUSTOMER_PASSWORD;

  if (!staffPassword || !customerPassword) {
    throw new Error(
      'FATAL: Both STAFF_PASSWORD and CUSTOMER_PASSWORD environment variables must be defined before seeding.'
    );
  }

  // 1. Seed Users (Preserve existing passwordHash if user already exists to ensure true idempotency)
  const seedUsers = [
    {
      email: 'staff@singslot.local',
      fullName: 'Cashier Staff',
      phone: '0812345678',
      role: Role.STAFF,
      rawPassword: staffPassword
    },
    {
      email: 'customer1@singslot.local',
      fullName: 'Alice Customer',
      phone: '0898765432',
      role: Role.CUSTOMER,
      rawPassword: customerPassword
    },
    {
      email: 'customer2@singslot.local',
      fullName: 'Bob Customer',
      phone: '0855554444',
      role: Role.CUSTOMER,
      rawPassword: customerPassword
    }
  ];

  for (const item of seedUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: item.email }
    });

    if (existing) {
      // Idempotent: Update profile fields only, preserve existing passwordHash
      await prisma.user.update({
        where: { email: item.email },
        data: {
          fullName: item.fullName,
          phone: item.phone,
          role: item.role
        }
      });
    } else {
      // New user: hash password once with bcrypt 10 rounds
      const passwordHash = await bcrypt.hash(item.rawPassword, 10);
      await prisma.user.create({
        data: {
          email: item.email,
          fullName: item.fullName,
          phone: item.phone,
          role: item.role,
          passwordHash
        }
      });
    }
  }
  console.log(`✅ Seeded/Verified ${seedUsers.length} demo users (1 Staff, 2 Customers).`);

  // 2. Seed 9 Rooms
  const rooms = [
    { roomNumber: 'S01', type: RoomType.SMALL, capacity: 4, description: 'Cozy private room for up to 4 guests' },
    { roomNumber: 'S02', type: RoomType.SMALL, capacity: 4, description: 'Cozy private room for up to 4 guests' },
    { roomNumber: 'S03', type: RoomType.SMALL, capacity: 4, description: 'Cozy private room for up to 4 guests' },
    { roomNumber: 'M01', type: RoomType.MEDIUM, capacity: 8, description: 'Standard party room for up to 8 guests' },
    { roomNumber: 'M02', type: RoomType.MEDIUM, capacity: 8, description: 'Standard party room for up to 8 guests' },
    { roomNumber: 'M03', type: RoomType.MEDIUM, capacity: 8, description: 'Standard party room for up to 8 guests' },
    { roomNumber: 'L01', type: RoomType.LARGE, capacity: 12, description: 'VIP Luxury suite for up to 12 guests' },
    { roomNumber: 'L02', type: RoomType.LARGE, capacity: 12, description: 'VIP Luxury suite for up to 12 guests' },
    { roomNumber: 'L03', type: RoomType.LARGE, capacity: 12, description: 'VIP Luxury suite for up to 12 guests' }
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {
        type: room.type,
        capacity: room.capacity,
        description: room.description,
        isActive: true
      },
      create: room
    });
  }
  console.log(`✅ Seeded/Verified ${rooms.length} karaoke rooms (3 Small, 3 Medium, 3 Large).`);
  console.log('🎉 Idempotent seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
