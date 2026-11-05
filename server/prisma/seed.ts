import { PrismaClient, Role, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SingSlot database seeding (Idempotent)...');

  // 1. Password hashing (bcrypt 10 rounds per NFR-01)
  const defaultPasswordHash = await bcrypt.hash('Pass1234!', 10);

  // 2. Seed Users
  const users = [
    {
      email: 'staff@singslot.local',
      fullName: 'Cashier Staff',
      phone: '0812345678',
      role: Role.STAFF,
      passwordHash: defaultPasswordHash
    },
    {
      email: 'customer1@singslot.local',
      fullName: 'Alice Customer',
      phone: '0898765432',
      role: Role.CUSTOMER,
      passwordHash: defaultPasswordHash
    },
    {
      email: 'customer2@singslot.local',
      fullName: 'Bob Customer',
      phone: '0855554444',
      role: Role.CUSTOMER,
      passwordHash: defaultPasswordHash
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        passwordHash: user.passwordHash
      },
      create: user
    });
  }
  console.log(`✅ Seeded ${users.length} demo users (1 Staff, 2 Customers).`);

  // 3. Seed 9 Rooms
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
  console.log(`✅ Seeded ${rooms.length} karaoke rooms (3 Small, 3 Medium, 3 Large).`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
