import { prisma } from "@/lib/prisma";
import { getMemberFromCookie } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CommentSection from "@/components/comment/CommentSection";

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
    <div className="max-w-3xl mx-auto">
      {recipe.photos.length > 0 && (
        <div className="mb-6 rounded-xl overflow-hidden">
          <img
            src={`/uploads/${recipe.photos[0].filename}`}
            alt={recipe.title}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-hand)] text-5xl text-brown mb-2">
            {recipe.title}
          </h1>
          <p className="text-brown-light">
            par <span className="font-[family-name:var(--font-hand)] text-xl">{recipe.author.name}</span>
            {" "}&middot;{" "}
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
            className="bg-cream-dark text-brown px-4 py-2 rounded-xl font-[family-name:var(--font-hand)] text-lg hover:bg-brown hover:text-cream transition-colors"
          >
            Modifier
          </Link>
        )}
      </div>

      <div className="notebook-bg rounded-xl bg-white/50 border border-cream-dark" style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", backgroundPositionY: "calc(0.75rem + 2rem)" }}>
        <div className="notebook-margin">
          <h2 className="notebook-line font-[family-name:var(--font-hand)] text-3xl text-red" style={{ lineHeight: "2.5rem" }}>
            Ingrédients
          </h2>
          <ul>
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="notebook-line font-[family-name:var(--font-hand)] text-xl text-brown flex items-baseline gap-2" style={{ lineHeight: "2.5rem" }}>
                <span className="text-red">*</span>
                <span>
                  {ing.quantity && <span className="font-semibold">{ing.quantity}</span>}
                  {ing.unit && <span className="text-brown-light"> {ing.unit}</span>}
                  {(ing.quantity || ing.unit) && " "}
                  {ing.name}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="notebook-line font-[family-name:var(--font-hand)] text-3xl text-red mt-[2.5rem]" style={{ lineHeight: "2.5rem" }}>
            Préparation
          </h2>
          <ol>
            {steps.map((step, i) => (
              <li key={i} className="notebook-line font-[family-name:var(--font-hand)] text-xl text-brown flex items-baseline gap-3" style={{ lineHeight: "2.5rem" }}>
                <span className="font-[family-name:var(--font-hand)] text-2xl text-red font-bold min-w-[2rem]">
                  {i + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
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
