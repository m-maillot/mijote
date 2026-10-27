import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import LoginForm from "./LoginForm";

const ERRORS: Record<string, string> = {
  lien: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
  google: "La connexion avec Google a échoué. Réessayez.",
  inconnu: "Cette adresse n'est pas dans le carnet. Demandez à un administrateur de vous inviter.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getMemberFromCookie()) redirect("/recettes");

  const { error } = await searchParams;

  return (
    <LoginForm
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      initialError={error ? ERRORS[error] ?? "" : ""}
    />
  );
}
