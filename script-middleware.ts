import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unrestrictedAllPartners = await prisma.partner.findMany({
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

  const unrestrictedProfile = await prisma.profile.findUnique({
    where: { id: 1 },
  });

  if (unrestrictedProfile === null) {
    throw new Error(`Unable to find profile.`);
  }

  prisma.$use(async (params, next) => {
    console.dir({ params }, { depth: null });

    if (params.action.startsWith(`find`)) {
      let where = {};

      if (params.model === `Partner`) {
        where = {
          partnerContacts: {
            some: {
              profileID: unrestrictedProfile.id,
            },
          },
        } as Prisma.PartnerWhereInput;
      }

      if (Object.keys(where).length > 0) {
        if (params.args === undefined) {
          params.args = { where };
        } else if (`where` in params.args) {
          if (
            Object.keys(params.args.where).length === 1 &&
            `AND` in params.args.where
          ) {
            params.args.where.AND.push(where);
          } else {
            params.args.where = {
              AND: [params.args.where, where],
            };
          }
        } else {
          params.args.where = where;
        }
      }
    }

    console.dir({ params }, { depth: null });

    return await next(params);
  });

  const partners = await prisma.partner.findMany();

  console.dir({ unrestrictedProfile, partners });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
