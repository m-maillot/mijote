import { prisma } from "@/lib/prisma";
import { getMemberFromCookie } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import SuggestionModal from "@/components/comment/SuggestionModal";
import SuggestionList from "@/components/comment/SuggestionList";
import FamilyNotes from "@/components/comment/FamilyNotes";
import IngredientList from "@/components/recipe/IngredientList";
import Avatar from "@/components/ui/Avatar";
import { memberInk } from "@/lib/memberInk";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberFromCookie();
  if (!member) redirect("/");

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      ingredients: { orderBy: { order: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true } },
          votes: { select: { memberId: true, approve: true } },
        },
      },
    },
  });

  if (!recipe) notFound();

  const isAuthor = recipe.authorId === member.id;
  const steps = recipe.steps.split("\n").filter(Boolean);

  const threshold = parseInt(process.env.APPROVAL_THRESHOLD || "2", 10);
  const snapshot = {
    title: recipe.title,
    ingredients: recipe.ingredients.map((i) => ({
      quantity: i.quantity,
      unit: i.unit,
      name: i.name,
    })),
    steps: recipe.steps,
  };
  const comments = recipe.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const date = new Date(recipe.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1040px]">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/recettes"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-danger"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <span className="md:hidden">Recettes</span>
          <span className="hidden md:inline">Toutes les recettes</span>
        </Link>
        {isAuthor ? (
          <Link
            href={`/recettes/${recipe.id}/modifier`}
            className="inline-flex min-h-11 items-center font-semibold underline md:rounded-lg md:border-[1.5px] md:border-ink md:px-[18px] md:no-underline"
          >
            Modifier
          </Link>
        ) : (
          <SuggestionModal recipeId={recipe.id} recipe={snapshot} threshold={threshold} />
        )}
      </div>

      <h1 className="font-heading text-[34px] font-semibold leading-10 md:text-[52px] md:leading-[60px]">
        {recipe.title}
      </h1>
      <div
        className="mt-2 flex items-center gap-2.5 font-medium"
        style={{ color: memberInk(recipe.author.name) }}
      >
        <Avatar name={recipe.author.name} size={28} />
        Recette de {recipe.author.name}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-y border-line py-4 text-muted">
        <span>
          Pour {recipe.servings} personne{recipe.servings > 1 ? "s" : ""}
        </span>
        <span>Ajoutée le {date}</span>
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-x-12 gap-y-8">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-8 md:max-w-[380px]">
          <div className="photo-placeholder h-[190px] overflow-hidden rounded-[10px] md:h-[260px]">
            {recipe.photos.length > 0 && (
              <img
                src={`/api/photos/${recipe.photos[0].filename}`}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <section aria-labelledby="ingredients-title">
            <h2 id="ingredients-title" className="font-heading mb-3 text-2xl font-semibold md:text-[26px]">
              Ingrédients
            </h2>
            <IngredientList
              ingredients={recipe.ingredients.map((i) => ({
                id: i.id,
                quantity: i.quantity,
                unit: i.unit,
                name: i.name,
              }))}
            />
          </section>
        </div>

        <div className="min-w-0 flex-[2_1_420px]">
          <section aria-labelledby="steps-title">
            <h2 id="steps-title" className="font-heading mb-3 text-2xl font-semibold md:text-[26px]">
              Préparation
            </h2>
            <ol>
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4 border-b border-line py-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-page"
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <SuggestionList
            suggestions={comments.filter((c) => c.field !== "GENERAL")}
            currentMemberId={member.id}
            recipe={snapshot}
            threshold={threshold}
          />
          <FamilyNotes
            recipeId={recipe.id}
            notes={comments.filter((c) => c.field === "GENERAL")}
          />
        </div>
      </div>
    </div>
  );
}
