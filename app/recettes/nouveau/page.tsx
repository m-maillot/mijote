import RecipeForm from "@/components/recipe/RecipeForm";

export default function NouvellePage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-hand)] text-4xl text-brown mb-8">
        Nouvelle recette
      </h1>
      <RecipeForm />
    </div>
  );
}
