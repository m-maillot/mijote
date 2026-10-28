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

const SITE_NAME = "Ludlow Family's Cookbook";
const DEFAULT_FROM = `${SITE_NAME} <noreply@famille.fr>`;

// Palette et typographie alignées sur le site (app/globals.css)
const EMAIL_FONT_BODY = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const EMAIL_FONT_HEADING = "Lora, Georgia, 'Times New Roman', serif";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout({
  intro,
  heading,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  intro: string;
  heading?: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}) {
  return `
    <div style="background: #fff8f0; padding: 24px 12px; font-family: ${EMAIL_FONT_BODY};">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e6d5c3; border-radius: 12px; overflow: hidden;">
        <div style="padding: 20px 28px; border-bottom: 1px solid #e6d5c3; background: #fff8f0;">
          <span style="font-family: ${EMAIL_FONT_HEADING}; font-size: 24px; font-weight: 600; color: #b71c1c;">
            ${SITE_NAME}
          </span>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #5d4037;">${intro}</p>
          ${
            heading
              ? `<h2 style="margin: 0 0 24px; font-family: ${EMAIL_FONT_HEADING}; font-size: 26px; line-height: 1.25; font-weight: 600; color: #3e2723;">${heading}</h2>`
              : ""
          }
          <a href="${buttonUrl}"
             style="display: inline-block; background: #c62828; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
            ${buttonLabel}
          </a>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid #e6d5c3; background: #f3e6d5;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #5d4037;">${footer}</p>
        </div>
      </div>
    </div>
  `;
}

const MEMBER_FOOTER = `Vous recevez cet email car vous faites partie de ${SITE_NAME}.`;

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
    select: { email: true },
  });

  console.log(`[Email] ${members.length} membre(s) avec email trouvé(s)`);
  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi à ${member.email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || DEFAULT_FROM,
        to: member.email,
        subject: `Nouvelle recette : ${recipeTitle}`,
        html: emailLayout({
          intro: `<strong>${escapeHtml(authorName)}</strong> a ajouté une nouvelle recette :`,
          heading: escapeHtml(recipeTitle),
          buttonLabel: "Voir la recette",
          buttonUrl: recipeUrl,
          footer: MEMBER_FOOTER,
        }),
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
    select: { email: true },
  });

  console.log(`[Email] ${members.length} membre(s) avec email trouvé(s)`);
  if (members.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3010";

  for (const member of members) {
    if (!member.email) continue;

    const recipeUrl = `${appUrl}/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi notification modification à ${member.email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || DEFAULT_FROM,
        to: member.email,
        subject: `Recette modifiée : ${recipeTitle}`,
        html: emailLayout({
          intro: `<strong>${escapeHtml(authorName)}</strong> a mis à jour la recette :`,
          heading: escapeHtml(recipeTitle),
          buttonLabel: "Voir la recette",
          buttonUrl: recipeUrl,
          footer: MEMBER_FOOTER,
        }),
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
    select: { email: true, name: true },
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

    const recipeUrl = `${appUrl}/recettes/${recipeId}`;

    try {
      console.log(`[Email] Envoi notification commentaire à ${member.email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || DEFAULT_FROM,
        to: member.email,
        subject: `Nouvelle suggestion sur : ${recipeTitle}`,
        html: emailLayout({
          intro: `<strong>${escapeHtml(authorName)}</strong> a proposé une ${fieldLabel} sur :`,
          heading: escapeHtml(recipeTitle),
          buttonLabel: "Voir la suggestion",
          buttonUrl: recipeUrl,
          footer: MEMBER_FOOTER,
        }),
      });
      console.log(`[Email] Envoyé avec succès à ${member.email}`);
    } catch (err) {
      console.error(`[Email] Erreur envoi à ${member.email}:`, err);
    }
  }
}

export async function sendLoginLink(email: string, name: string, link: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP non configuré, lien de connexion pour ${email} : ${link}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || DEFAULT_FROM,
      to: email,
      subject: `Votre lien de connexion à ${SITE_NAME}`,
      html: emailLayout({
          intro: `Bonjour ${escapeHtml(name)}, voici votre lien de connexion :`,
          
          buttonLabel: "Me connecter",
          buttonUrl: link,
          footer: "Ce lien est valable 15 minutes et ne peut servir qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        }),
    });
  } catch (err) {
    console.error(`[Email] Erreur envoi du lien de connexion à ${email}:`, err);
  }
}
