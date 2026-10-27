import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminName || !adminEmail) {
    console.log("[Init] ADMIN_NAME ou ADMIN_EMAIL non défini, pas de création de compte admin.");
    return;
  }

  // L'email est l'identifiant de connexion : le compte admin est celui de ADMIN_EMAIL.
  const admin = await prisma.member.upsert({
    where: { email: adminEmail },
    update: { isAdmin: true },
    create: { name: adminName, email: adminEmail, isAdmin: true },
  });

  console.log(`[Init] Compte admin prêt : ${admin.name} <${adminEmail}>`);
}

main()
  .catch((e) => {
    console.error("[Init] Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
