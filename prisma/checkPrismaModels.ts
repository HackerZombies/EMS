import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModels() {
  console.log("Available models in Prisma Client:");
  console.log(Object.keys(prisma));
}

checkModels()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
