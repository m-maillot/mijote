import { prisma } from "@/lib/prisma";
import { getMemberFromCookie } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import RecipeForm from "@/components/recipe/RecipeForm";

export default async function ModifierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberFromCookie();
  if (!member) redirect("/");

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: { orderBy: { order: "asc" } } },
  });
  if (!recipe) notFound();
  if (recipe.authorId !== member.id) redirect(`/recettes/${id}`);

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-semibold md:text-4xl">
        Modifier la recette
      </h1>
      <RecipeForm
        initialData={{
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.ingredients.map((i) => ({
            quantity: i.quantity || "",
            unit: i.unit || "",
            name: i.name,
          })),
          steps: recipe.steps,
        }}
      />
    </div>
  );
}
