import { prisma } from "./prisma";

const THRESHOLD = parseInt(process.env.APPROVAL_THRESHOLD || "2", 10);

export async function checkAndApplyApproval(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { votes: true },
  });

  if (!comment || comment.status !== "PENDING") return;

  const approveCount = comment.votes.filter((v) => v.approve).length;

  if (approveCount >= THRESHOLD) {
    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { status: "APPROVED" },
      });

      if (comment.field === "TITLE") {
        await tx.recipe.update({
          where: { id: comment.recipeId },
          data: { title: comment.body },
        });
      } else if (comment.field === "STEPS") {
        await tx.recipe.update({
          where: { id: comment.recipeId },
          data: { steps: comment.body },
        });
      } else if (comment.field === "INGREDIENTS") {
        // body contains JSON array of ingredients
        try {
          const ingredients = JSON.parse(comment.body) as Array<{
            quantity: string;
            unit: string;
            name: string;
          }>;
          await tx.ingredient.deleteMany({ where: { recipeId: comment.recipeId } });
          await tx.ingredient.createMany({
            data: ingredients.map((ing, i) => ({
              recipeId: comment.recipeId,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              name: ing.name,
              order: i,
            })),
          });
        } catch {
          // If JSON parse fails, skip ingredient update
        }
      }
    });
  }
}
