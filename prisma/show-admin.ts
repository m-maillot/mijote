import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.member.findMany({ where: { isAdmin: true } });
  if (admins.length === 0) {
    console.log("Aucun compte admin trouvé.");
    process.exit(1);
  }

  for (const admin of admins) {
    console.log(`Compte admin : ${admin.name} <${admin.email ?? "pas d'email"}>`);
  }
}

main()
  .catch((e) => {
    console.error("Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
