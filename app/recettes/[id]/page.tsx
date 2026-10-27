import { prisma } from "@/lib/prisma";
import { getMemberFromCookie } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CommentSection from "@/components/comment/CommentSection";
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

  return (
    <div className="mx-auto max-w-4xl">
      {recipe.photos.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={`/api/photos/${recipe.photos[0].filename}`}
            alt={recipe.title}
            className="max-h-80 w-full object-cover"
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading mb-2 text-3xl font-semibold leading-tight md:text-5xl">
            {recipe.title}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-muted">
            <Avatar name={recipe.author.name} size={28} />
            <span className="font-medium" style={{ color: memberInk(recipe.author.name) }}>
              {recipe.author.name}
            </span>
            <span aria-hidden="true">&middot;</span>
            {new Date(recipe.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {isAuthor && (
          <Link
            href={`/recettes/${recipe.id}/modifier`}
            className="inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-ink px-5 font-semibold transition-colors hover:bg-ink hover:text-page"
          >
            Modifier
          </Link>
        )}
      </div>

      <div className="grid gap-8 border-t border-line pt-6 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
        <section aria-labelledby="ingredients-title">
          <h2 id="ingredients-title" className="font-heading mb-3 text-2xl font-semibold">
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

        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="font-heading mb-3 text-2xl font-semibold">
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
      </div>

      <CommentSection
        recipeId={recipe.id}
        comments={recipe.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))}
        currentMemberId={member.id}
        recipe={{
          title: recipe.title,
          ingredients: recipe.ingredients.map((i) => ({
            quantity: i.quantity,
            unit: i.unit,
            name: i.name,
          })),
          steps: recipe.steps,
        }}
      />
    </div>
  );
}
