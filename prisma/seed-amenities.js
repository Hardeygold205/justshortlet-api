import { prisma } from "../src/config/prisma.js";

const amenities = [
  { name: "WiFi", slug: "wifi", category: "Basic", icon: "wifi" },
  { name: "Smart TV", slug: "smart-tv", category: "Entertainment", icon: "tv" },
  {
    name: "PlayStation 5",
    slug: "ps5",
    category: "Entertainment",
    icon: "gamepad",
  },
  { name: "Netflix", slug: "netflix", category: "Entertainment", icon: "film" },
  { name: "Air Conditioning", slug: "ac", category: "Basic", icon: "wind" },
  { name: "Kitchen", slug: "kitchen", category: "Kitchen", icon: "utensils" },
  {
    name: "Generator/Backup Power",
    slug: "generator",
    category: "Safety",
    icon: "zap",
  },
  { name: "Pool", slug: "pool", category: "Outdoor", icon: "waves" },
  { name: "Parking", slug: "parking", category: "Basic", icon: "car" },
  {
    name: "Washing Machine",
    slug: "washer",
    category: "Kitchen",
    icon: "shirt",
  },
];

async function main() {
  for (const a of amenities) {
    await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: {},
      create: a,
    });
  }
  console.log(`Seeded ${amenities.length} amenities.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
