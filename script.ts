import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// async function main() {
//   const result = await prisma.projects.create({
//     data: { projectName: "Pro1", maxBudget: 1000, minBudget: 500 },
//   });
//   console.log(result);
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
