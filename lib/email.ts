import nodemailer from "nodemailer";
import { prisma } from "./prisma";

// Singleton : une seule connexion SMTP réutilisée
let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  console.log(`[Email] Config SMTP: host=${host}, port=${process.env.SMTP_PORT}, user=${process.env.SMTP_USER}, from=${process.env.SMTP_FROM}`);
  if (!host) return null;

  if (!_transporter) {
    console.log("[Email] Création du transporter SMTP (singleton)");
    _transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,         // Réutilise les connexions SMTP
      maxConnections: 3,  // Max 3 connexions en parallèle
      rateDelta: 1000,    // 1 email par seconde max
      rateLimit: 1,
    });
  }

  return _transporter;
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

  console.log(`[Email] ${members.length} membre(s) avec email trouvé(s)`);
  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/api/auth?token=${member.token}&redirect=/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi à ${member.email}...`);
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
      console.log(`[Email] Envoyé avec succès à ${member.email}`);
    } catch (err) {
      console.error(`[Email] Erreur envoi à ${member.email}:`, err);
    }
  }
}

export async function notifyRecipeUpdated(
  recipeId: string,
  recipeTitle: string,
  authorName: string
) {
  console.log(`[Email] Notification modification recette "${recipeTitle}" par ${authorName}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[Email] SMTP non configuré, notification ignorée");
    return;
  }

  const members = await prisma.member.findMany({
    where: { email: { not: null } },
    select: { email: true, token: true },
  });

  console.log(`[Email] ${members.length} membre(s) avec email trouvé(s)`);
  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/api/auth?token=${member.token}&redirect=/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi notification modification à ${member.email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "Carnet de Recettes <noreply@famille.fr>",
        to: member.email,
        subject: `Recette modifiée : ${recipeTitle}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="font-family: 'Brush Script MT', cursive; color: #3E2723; font-size: 28px;">
              Carnet de Recettes
            </h1>
            <p style="color: #5D4037;">
              <strong>${authorName}</strong> a mis à jour la recette :
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
      console.log(`[Email] Envoyé avec succès à ${member.email}`);
    } catch (err) {
      console.error(`[Email] Erreur envoi à ${member.email}:`, err);
    }
  }
}

export async function notifyNewComment(
  recipeId: string,
  recipeTitle: string,
  authorName: string,
  field: string
) {
  console.log(`[Email] Notification nouveau commentaire sur "${recipeTitle}" par ${authorName} (champ: ${field})`);
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[Email] SMTP non configuré, notification ignorée");
    return;
  }

  const members = await prisma.member.findMany({
    where: { email: { not: null } },
    select: { email: true, token: true, name: true },
  });

  console.log(`[Email] ${members.length} membre(s) avec email trouvé(s)`);
  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";
  const fieldLabels: Record<string, string> = {
    GENERAL: "commentaire",
    TITLE: "modification du titre",
    INGREDIENTS: "modification des ingrédients",
    STEPS: "modification des étapes",
  };
  const fieldLabel = fieldLabels[field] || "commentaire";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/api/auth?token=${member.token}&redirect=/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi notification commentaire à ${member.email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "Carnet de Recettes <noreply@famille.fr>",
        to: member.email,
        subject: `Nouvelle suggestion sur : ${recipeTitle}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="font-family: 'Brush Script MT', cursive; color: #3E2723; font-size: 28px;">
              Carnet de Recettes
            </h1>
            <p style="color: #5D4037;">
              <strong>${authorName}</strong> a proposé une ${fieldLabel} sur :
            </p>
            <h2 style="font-family: 'Brush Script MT', cursive; color: #C62828; font-size: 24px;">
              ${recipeTitle}
            </h2>
            <a href="${recipeUrl}"
               style="display: inline-block; background: #3E2723; color: #FFF8F0; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 16px;">
              Voir la suggestion
            </a>
            <p style="color: #a1887f; font-size: 12px; margin-top: 20px;">
              Vous recevez cet email car vous faites partie du carnet de recettes familial.
            </p>
          </div>
        `,
      });
      console.log(`[Email] Envoyé avec succès à ${member.email}`);
    } catch (err) {
      console.error(`[Email] Erreur envoi à ${member.email}:`, err);
    }
  }
}
