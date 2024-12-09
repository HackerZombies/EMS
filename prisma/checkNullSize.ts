import prisma from '@prisma/client';

async function checkNullSize() {
  const filesWithNullSize = await prisma.digilocker.findMany({
    where: {
      size: null,
    },
  });

  console.log("Files with null size:", filesWithNullSize);
}

checkNullSize()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
