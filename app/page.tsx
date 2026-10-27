"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanToken = token.trim();
    if (!cleanToken) return;

    const res = await fetch(`/api/members/me?token=${encodeURIComponent(cleanToken)}`);
    if (res.ok) {
      router.push(`/recettes?token=${encodeURIComponent(cleanToken)}`);
    } else {
      setError("Lien invalide. Demandez votre lien à un membre de la famille.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading mb-2 text-5xl font-semibold text-danger md:text-6xl">
          Mijoté
        </h1>
        <p className="mb-10 text-lg text-muted">
          Les recettes de la famille
        </p>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <label htmlFor="token" className="block font-medium">
              Collez votre lien d&apos;accès ou entrez votre code
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Votre code d'accès"
              className="field"
              autoFocus
            />
            {error && (
              <p role="alert" className="text-sm text-danger">{error}</p>
            )}
            <button
              type="submit"
              className="min-h-12 w-full rounded-lg bg-primary font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Ouvrir le carnet
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-muted">
          Pas encore de code ? Demandez à un membre de la famille de vous inviter.
        </p>
      </div>
    </main>
  );
}
