"use client";

import { useState, useEffect } from "react";
import { memberInk } from "@/lib/memberInk";

interface Member {
  id: string;
  name: string;
  email: string | null;
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setName("");
      setEmail("");
      loadMembers();
    } catch (err) {
      alert((err as Error).message || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEmail(memberId: string) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmailValue.trim() }),
      });
      if (!res.ok) throw new Error();
      setEditingEmail(null);
      loadMembers();
    } catch {
      alert("Erreur lors de la mise à jour");
    }
  }

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-semibold md:text-4xl">
        La famille
      </h1>

      {/* Invite form */}
      <div className="bg-surface rounded-xl p-5 border border-line mb-8 max-w-lg">
        <h2 className="font-heading mb-3 text-xl font-semibold">
          Inviter un membre
        </h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field flex-1"
              placeholder="Prénom"
              aria-label="Prénom"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field flex-1"
              placeholder="Email"
              aria-label="Email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="min-h-12 whitespace-nowrap rounded-lg bg-primary px-6 font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
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
            className="bg-surface rounded-xl p-4 border border-line"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-heading text-xl font-semibold" style={{ color: memberInk(m.name) }}>
                  {m.name}
                </p>
                {m.isAdmin && (
                  <span className="text-sm px-2.5 py-0.5 rounded-full bg-warning/20 text-warning">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
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
                    className="field flex-1 text-sm"
                    placeholder="email@exemple.fr"
                    aria-label="Email"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEmail(m.id)}
                    className="min-h-11 rounded-lg bg-success-solid px-4 text-sm font-semibold text-on-primary transition-colors hover:opacity-90"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingEmail(null)}
                    className="min-h-11 px-2 text-sm text-muted transition-colors hover:text-ink"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted">
                    {m.email || "Pas d'email : ne peut pas se connecter"}
                  </span>
                  <button
                    onClick={() => { setEditingEmail(m.id); setEditEmailValue(m.email || ""); }}
                    className="min-h-11 px-2 text-sm text-muted underline transition-colors hover:text-ink"
                  >
                    Modifier
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
