import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RecettesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      photos: { take: 1 },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-hand)] text-4xl text-brown">
          Toutes les recettes
        </h1>
        <Link
          href="/recettes/nouveau"
          className="bg-brown text-cream px-5 py-2 rounded-xl font-[family-name:var(--font-hand)] text-xl hover:bg-brown-light transition-colors"
        >
          + Nouvelle recette
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-[family-name:var(--font-hand)] text-3xl text-brown-light mb-4">
            Le carnet est vide...
          </p>
          <p className="text-brown-light">
            Soyez le premier à ajouter une recette de famille !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, i) => (
            <Link
              key={recipe.id}
              href={`/recettes/${recipe.id}`}
              className="recipe-card bg-white/80 rounded-xl p-5 shadow-md border border-cream-dark block"
              style={{ transform: `rotate(${(i % 3 - 1) * 0.8}deg)` }}
            >
              {recipe.photos[0] && (
                <div className="mb-3 rounded-lg overflow-hidden h-40 bg-cream-dark">
                  <img
                    src={`/uploads/${recipe.photos[0].filename}`}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h2 className="font-[family-name:var(--font-hand)] text-2xl text-brown mb-1">
                {recipe.title}
              </h2>
              <p className="text-sm text-brown-light">
                par {recipe.author.name}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-brown-light/70">
                <span>
                  {new Date(recipe.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {recipe._count.comments > 0 && (
                  <span>{recipe._count.comments} commentaire{recipe._count.comments > 1 ? "s" : ""}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
