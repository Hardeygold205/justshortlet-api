import { prisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/hash.js";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your env before running this",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      provider: "local",
      role: "SUPER_ADMIN",
      emailVerified: true,
      profile: {
        create: {
          firstName: "Super",
          lastName: "Admin",
          username: "superadmin1",
        },
      },
    },
  });

  console.log("Super admin created:", admin.id, admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
