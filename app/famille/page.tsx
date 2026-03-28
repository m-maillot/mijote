"use client";

import { useState, useEffect } from "react";

interface Member {
  id: string;
  name: string;
  email: string | null;
  token: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { recipes: number };
}

export default function FamillePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");

  function loadMembers() {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers);
  }

  useEffect(() => { loadMembers(); }, []);

  function getLink(token: string) {
    return `${window.location.origin}/api/auth?token=${token}`;
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setEmail("");
      loadMembers();
    } catch {
      alert("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEmail(memberId: string) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmailValue.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setEditingEmail(null);
      loadMembers();
    } catch {
      alert("Erreur lors de la mise à jour");
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(getLink(token));
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-hand)] text-4xl text-brown mb-8">
        La famille
      </h1>

      {/* Invite form */}
      <div className="bg-white/70 rounded-xl p-5 border border-cream-dark mb-8 max-w-lg">
        <h2 className="font-[family-name:var(--font-hand)] text-2xl text-brown mb-3">
          Inviter un membre
        </h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-hand flex-1"
              placeholder="Prénom..."
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-hand flex-1"
              placeholder="Email (optionnel)"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-brown text-cream px-5 py-2 rounded-xl font-[family-name:var(--font-hand)] text-lg hover:bg-brown-light transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Inviter
          </button>
        </form>
      </div>

      {/* Members list */}
      <div className="space-y-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white/60 rounded-xl p-4 border border-cream-dark"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="font-[family-name:var(--font-hand)] text-2xl text-brown">
                  {m.name}
                </p>
                {m.isAdmin && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber/20 text-amber">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-brown-light">
                {m._count.recipes} recette{m._count.recipes > 1 ? "s" : ""}
                {" "}&middot;{" "}
                Membre depuis {new Date(m.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 mb-2">
              {editingEmail === m.id ? (
                <>
                  <input
                    type="email"
                    value={editEmailValue}
                    onChange={(e) => setEditEmailValue(e.target.value)}
                    className="text-sm bg-white/80 rounded-lg px-3 py-1 flex-1 border border-cream-dark outline-none"
                    placeholder="email@exemple.fr"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEmail(m.id)}
                    className="text-xs bg-green text-cream px-3 py-1 rounded-lg hover:bg-green-light transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingEmail(null)}
                    className="text-xs text-brown-light hover:text-brown transition-colors"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-brown-light">
                    {m.email || "Pas d'email"}
                  </span>
                  <button
                    onClick={() => { setEditingEmail(m.id); setEditEmailValue(m.email || ""); }}
                    className="text-xs text-brown-light hover:text-brown transition-colors underline"
                  >
                    {m.email ? "Modifier" : "Ajouter"}
                  </button>
                </>
              )}
            </div>

            {/* Connection link */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getLink(m.token)}
                className="text-xs bg-cream/80 rounded-lg px-3 py-1.5 flex-1 select-all text-brown-light border border-cream-dark"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => copyLink(m.token)}
                className="text-xs bg-brown text-cream px-3 py-1.5 rounded-lg hover:bg-brown-light transition-colors whitespace-nowrap"
              >
                Copier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
