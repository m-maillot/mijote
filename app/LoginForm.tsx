"use client";

import { useState } from "react";

export default function LoginForm({
  googleEnabled,
  initialError,
}: {
  googleEnabled: boolean;
  initialError: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(initialError);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Adresse email invalide ou service indisponible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading mb-2 text-4xl font-semibold text-danger md:text-5xl">
          Ludlow Family&apos;s Cookbook
        </h1>
        <p className="mb-10 text-lg text-muted">Les recettes de la famille</p>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm md:p-8">
          {sent ? (
            <p role="status" className="text-left">
              Si cette adresse est dans le carnet, un lien de connexion vient de lui être envoyé.
              Il est valable 15 minutes.
            </p>
          ) : (
            <div className="space-y-4 text-left">
              {googleEnabled && (
                <>
                  <a
                    href="/api/auth/google"
                    className="flex min-h-12 w-full items-center justify-center rounded-lg border border-line bg-page font-semibold transition-colors hover:bg-surface"
                  >
                    Continuer avec Google
                  </a>
                  <p className="text-center text-sm text-muted">ou</p>
                </>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="email" className="block font-medium">
                  Recevoir un lien de connexion par email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="field"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="min-h-12 w-full rounded-lg bg-primary font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  Envoyer le lien
                </button>
              </form>
              {error && (
                <p role="alert" className="text-sm text-danger">{error}</p>
              )}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-muted">
          Pas encore membre ? Demandez à un administrateur de vous inviter.
        </p>
      </div>
    </main>
  );
}
