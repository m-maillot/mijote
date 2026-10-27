export interface Vote {
  memberId: string;
  approve: boolean;
}

export interface IngredientItem {
  quantity?: string | null;
  unit?: string | null;
  name: string;
}

export interface CommentData {
  id: string;
  body: string;
  field: string;
  status: string;
  createdAt: string;
  author: { id: string; name: string };
  votes: Vote[];
}

export interface RecipeSnapshot {
  title: string;
  ingredients: IngredientItem[];
  steps: string;
}
