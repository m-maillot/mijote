import RecipeForm from "@/components/recipe/RecipeForm";

export default function NouvellePage() {
  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-semibold md:text-4xl">
        Nouvelle recette
      </h1>
      <RecipeForm />
    </div>
  );
}
