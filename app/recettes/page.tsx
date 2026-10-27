import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { memberInk } from "@/lib/memberInk";

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">
          Toutes les recettes
        </h1>
        <Link
          href="/recettes/nouveau"
          className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          + Nouvelle recette
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-heading mb-4 text-2xl font-semibold text-muted">
            Le carnet est vide
          </p>
          <p className="text-muted">
            Soyez le premier à ajouter une recette de famille !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recettes/${recipe.id}`}
              className="block overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-lg"
            >
              <div className="photo-placeholder h-28 md:h-40">
                {recipe.photos[0] && (
                  <img
                    src={`/api/photos/${recipe.photos[0].filename}`}
                    alt={recipe.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-3 md:p-4">
                <h2 className="font-heading text-base font-semibold leading-snug md:text-xl">
                  {recipe.title}
                </h2>
                <p
                  className="text-sm font-medium"
                  style={{ color: memberInk(recipe.author.name) }}
                >
                  par {recipe.author.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-sm text-muted">
                  <span>
                    {new Date(recipe.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {recipe._count.comments > 0 && (
                    <span>
                      {recipe._count.comments} commentaire{recipe._count.comments > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
