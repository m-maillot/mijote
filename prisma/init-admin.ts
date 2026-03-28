import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminName) {
    console.log("[Init] ADMIN_NAME non défini, pas de création de compte admin.");
    return;
  }

  const existingAdmin = await prisma.member.findFirst({ where: { isAdmin: true } });
  if (existingAdmin) {
    console.log(`[Init] Un compte admin existe déjà : ${existingAdmin.name}`);
    return;
  }

  const token = uuid();
  await prisma.member.create({
    data: {
      name: adminName,
      email: adminEmail || null,
      token,
      isAdmin: true,
    },
  });

  console.log(`[Init] Compte admin créé !`);
  console.log(`  Nom   : ${adminName}`);
  console.log(`  Email : ${adminEmail || "(non défini)"}`);
  console.log(`  Token : ${token}`);
  console.log(`  Lien  : ${process.env.APP_URL || "http://localhost:3000"}/api/auth?token=${token}`);
}

main()
  .catch((e) => {
    console.error("[Init] Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
