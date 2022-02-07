import { PrismaClient } from "@prisma/client";
import { createPrismaProxy } from "./script-proxy.utils";

const unrestrictedPrisma = new PrismaClient();
const prisma = createPrismaProxy(unrestrictedPrisma, {
  partner: {
    partnerContacts: {
      some: {
        profileID: 1,
      },
    },
  },
});

async function main() {
  const unrestrictedAllPartners = await unrestrictedPrisma.partner.findMany({
    include: {
      partnerContacts: {
        select: {
          id: true,
          profile: true,
        },
      },
    },
  });

  console.dir({ unrestrictedAllPartners }, { depth: null });

  const unrestrictedProfile = await unrestrictedPrisma.profile.findUnique({
    where: { id: 1 },
  });

  if (unrestrictedProfile === null) {
    throw new Error(`Unable to find profile.`);
  }

  const partners = await prisma.partner.findMany();

  console.dir({ unrestrictedProfile, partners });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await unrestrictedPrisma.$disconnect();
  });
