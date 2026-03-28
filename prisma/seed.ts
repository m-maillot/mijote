import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mamie = await prisma.member.upsert({
    where: { token: "mamie-token-secret" },
    update: {},
    create: { name: "Mamie Jeanne", token: "mamie-token-secret", isAdmin: true },
  });

  const papa = await prisma.member.upsert({
    where: { token: "papa-token-secret" },
    update: {},
    create: { name: "Papa Michel", token: "papa-token-secret" },
  });

  const maman = await prisma.member.upsert({
    where: { token: "maman-token-secret" },
    update: {},
    create: { name: "Maman Sophie", token: "maman-token-secret" },
  });

  await prisma.recipe.upsert({
    where: { id: "recipe-gratin-1" },
    update: {},
    create: {
      id: "recipe-gratin-1",
      title: "Gratin dauphinois de Mamie",
      steps: [
        "Préchauffer le four à 180°C",
        "Éplucher et couper les pommes de terre en fines rondelles",
        "Frotter un plat à gratin avec les gousses d'ail coupées en deux, puis le beurrer",
        "Disposer les rondelles de pommes de terre en couches dans le plat",
        "Mélanger la crème et le lait, assaisonner avec sel, poivre et muscade",
        "Verser le mélange sur les pommes de terre",
        "Enfourner pour 1h15 à 1h30, jusqu'à ce que le dessus soit bien doré",
      ].join("\n"),
      authorId: mamie.id,
      ingredients: {
        create: [
          { quantity: "1", unit: "kg", name: "pommes de terre", order: 0 },
          { quantity: "50", unit: "cl", name: "crème fraîche épaisse", order: 1 },
          { quantity: "25", unit: "cl", name: "lait", order: 2 },
          { quantity: "2", unit: "gousses", name: "ail", order: 3 },
          { quantity: "", unit: "", name: "noix de muscade", order: 4 },
          { quantity: "", unit: "", name: "sel et poivre", order: 5 },
          { quantity: "30", unit: "g", name: "beurre", order: 6 },
        ],
      },
    },
  });

  await prisma.recipe.upsert({
    where: { id: "recipe-tarte-2" },
    update: {},
    create: {
      id: "recipe-tarte-2",
      title: "Tarte aux pommes à l'ancienne",
      steps: [
        "Étaler la pâte dans un moule à tarte beurré",
        "Éplucher et couper 3 pommes en morceaux, les faire compoter avec 30g de sucre et le beurre",
        "Étaler la compote sur la pâte",
        "Éplucher et couper les 3 pommes restantes en fines lamelles",
        "Disposer les lamelles en rosace sur la compote",
        "Saupoudrer du reste de sucre et du sucre vanillé",
        "Enfourner 35 minutes à 200°C",
        "À la sortie du four, badigeonner de confiture d'abricot tiédie",
      ].join("\n"),
      authorId: maman.id,
      ingredients: {
        create: [
          { quantity: "1", unit: "", name: "pâte brisée maison", order: 0 },
          { quantity: "6", unit: "", name: "pommes Golden", order: 1 },
          { quantity: "80", unit: "g", name: "sucre", order: 2 },
          { quantity: "50", unit: "g", name: "beurre", order: 3 },
          { quantity: "1", unit: "sachet", name: "sucre vanillé", order: 4 },
          { quantity: "2", unit: "c. à soupe", name: "confiture d'abricot", order: 5 },
        ],
      },
    },
  });

  await prisma.recipe.upsert({
    where: { id: "recipe-boeuf-3" },
    update: {},
    create: {
      id: "recipe-boeuf-3",
      title: "Boeuf bourguignon du dimanche",
      steps: [
        "La veille, couper la viande en gros cubes et la faire mariner dans le vin avec les oignons émincés et le bouquet garni",
        "Le jour même, égoutter la viande et la faire revenir dans une cocotte avec un peu d'huile",
        "Ajouter les lardons, les faire dorer",
        "Saupoudrer de farine, mélanger",
        "Verser la marinade filtrée, ajouter les carottes coupées en rondelles",
        "Laisser mijoter à feu doux pendant 3 heures",
        "Ajouter les champignons 30 minutes avant la fin de la cuisson",
        "Servir avec des pommes de terre vapeur ou des pâtes fraîches",
      ].join("\n"),
      authorId: papa.id,
      ingredients: {
        create: [
          { quantity: "1,5", unit: "kg", name: "boeuf (paleron ou macreuse)", order: 0 },
          { quantity: "1", unit: "bouteille", name: "vin rouge de Bourgogne", order: 1 },
          { quantity: "200", unit: "g", name: "lardons", order: 2 },
          { quantity: "3", unit: "", name: "carottes", order: 3 },
          { quantity: "2", unit: "", name: "oignons", order: 4 },
          { quantity: "250", unit: "g", name: "champignons de Paris", order: 5 },
          { quantity: "2", unit: "c. à soupe", name: "farine", order: 6 },
          { quantity: "1", unit: "", name: "bouquet garni", order: 7 },
          { quantity: "", unit: "", name: "sel et poivre", order: 8 },
        ],
      },
    },
  });

  console.log("Seed terminé !");
  console.log(`\nLiens d'accès :`);
  console.log(`  Mamie Jeanne : http://localhost:3010/api/auth?token=mamie-token-secret`);
  console.log(`  Papa Michel  : http://localhost:3010/api/auth?token=papa-token-secret`);
  console.log(`  Maman Sophie : http://localhost:3010/api/auth?token=maman-token-secret`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
