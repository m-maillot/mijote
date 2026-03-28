import nodemailer from "nodemailer";
import { prisma } from "./prisma";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function notifyNewRecipe(
  recipeId: string,
  recipeTitle: string,
  authorName: string
) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[Email] SMTP non configuré, notification ignorée");
    return;
  }

  const members = await prisma.member.findMany({
    where: { email: { not: null } },
    select: { email: true, token: true },
  });

  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/api/auth?token=${member.token}&redirect=/recettes/${recipeId}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "Carnet de Recettes <noreply@famille.fr>",
        to: member.email,
        subject: `Nouvelle recette : ${recipeTitle}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="font-family: 'Brush Script MT', cursive; color: #3E2723; font-size: 28px;">
              Carnet de Recettes
            </h1>
            <p style="color: #5D4037;">
              <strong>${authorName}</strong> a ajouté une nouvelle recette :
            </p>
            <h2 style="font-family: 'Brush Script MT', cursive; color: #C62828; font-size: 24px;">
              ${recipeTitle}
            </h2>
            <a href="${recipeUrl}"
               style="display: inline-block; background: #3E2723; color: #FFF8F0; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 16px;">
              Voir la recette
            </a>
            <p style="color: #a1887f; font-size: 12px; margin-top: 20px;">
              Vous recevez cet email car vous faites partie du carnet de recettes familial.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`[Email] Erreur envoi à ${member.email}:`, err);
    }
  }
}
