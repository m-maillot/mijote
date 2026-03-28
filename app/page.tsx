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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-[family-name:var(--font-hand)] text-6xl md:text-7xl text-brown mb-2">
          Carnet de Recettes
        </h1>
        <p className="font-[family-name:var(--font-hand)] text-2xl text-brown-light mb-10">
          Les recettes de la famille
        </p>

        <div className="bg-white/70 rounded-2xl p-8 shadow-lg border border-cream-dark">
          <p className="text-sm text-brown-light mb-4">
            Collez votre lien d&apos;accès ou entrez votre code :
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Votre code d'accès..."
              className="input-hand w-full text-center"
              autoFocus
            />
            {error && (
              <p className="text-red text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-brown text-cream py-3 rounded-xl font-[family-name:var(--font-hand)] text-xl hover:bg-brown-light transition-colors"
            >
              Ouvrir le carnet
            </button>
          </form>
        </div>

        <p className="mt-8 text-xs text-brown-light/60">
          Pas encore de code ? Demandez à un membre de la famille de vous inviter.
        </p>
      </div>
    </main>
  );
}
