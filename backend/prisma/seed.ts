import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Work', color: '#3B82F6', description: 'Work-related activities' },
  { name: 'Personal', color: '#10B981', description: 'Personal tasks and errands' },
  { name: 'Learning', color: '#8B5CF6', description: 'Learning and education' },
  { name: 'Health', color: '#EF4444', description: 'Health and fitness activities' },
  { name: 'Social', color: '#F59E0B', description: 'Social interactions' },
  { name: 'Other', color: '#6B7280', description: 'Other activities' },
];

async function main() {
  console.log('Seeding database...');

  // Create categories
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  console.log('Seeded 6 categories');

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  });

  console.log(`Created demo user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
