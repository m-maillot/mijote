import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.member.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    console.log("Aucun compte admin trouvé.");
    process.exit(1);
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  console.log(`Compte admin : ${admin.name}`);
  console.log(`Lien de connexion : ${appUrl}/api/auth?token=${admin.token}`);
}

main()
  .catch((e) => {
    console.error("Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
