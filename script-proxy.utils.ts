import { PrismaClient } from "@prisma/client";
import { ConditionalPick } from "type-fest";

type TFindFunction = (args?: {
  where?: {
    AND?: any;
  };
}) => any;

const createPrismaFindOperationProxy = <TFunction extends TFindFunction>(
  fn: TFunction,
  where: NonNullable<NonNullable<Parameters<TFunction>[0]>[`where`]>
) =>
  new Proxy(fn, {
    apply(target, thisArg, argArray) {
      let [args] = argArray as [
        {
          where?: {
            AND?: unknown;
          };
        }
      ];

      if (args === undefined) {
        args = { where };
      } else if (`where` in args && args.where !== undefined) {
        if (Object.keys(args.where).length === 1 && `AND` in args.where) {
          if (Array.isArray(args.where.AND)) {
            args.where.AND = [...args.where.AND, where];
          } else {
            args.where.AND = [args.where.AND, where];
          }
        } else {
          args.where = {
            AND: [args.where, where],
          };
        }
      } else {
        args.where = where;
      }

      return Reflect.apply(target, thisArg, [args]);
    },
  });

interface Delegate {
  findFirst: TFindFunction;
  findMany: TFindFunction;
}

const createPrismaFindOperationsProxies = <
  TFindFirstFunction extends TFindFunction,
  TFindManyFunction extends TFindFunction
>(
  delegate: {
    findFirst: TFindFirstFunction;
    findMany: TFindManyFunction;
  },
  where: NonNullable<NonNullable<Parameters<TFindFirstFunction>[0]>[`where`]>
) => ({
  findFirst: createPrismaFindOperationProxy(delegate.findFirst, where),
  findMany: createPrismaFindOperationProxy(delegate.findMany, where),
});

const createPrismaDelegateProxy = <
  TFindFirstFunction extends TFindFunction,
  TFindManyFunction extends TFindFunction
>(
  delegate: {
    findFirst: TFindFirstFunction;
    findMany: TFindManyFunction;
  },
  where: NonNullable<NonNullable<Parameters<TFindFirstFunction>[0]>[`where`]>
) => {
  const findProxies = createPrismaFindOperationsProxies(delegate, where);
  const delegateProxy = new Proxy(delegate, {
    get(target, propertyKey, receiver) {
      if (propertyKey === `findFirst`) {
        return findProxies.findFirst;
      }

      if (propertyKey === `findMany`) {
        return findProxies.findMany;
      }

      return Reflect.get(target, propertyKey, receiver);
    },
  });

  return delegateProxy;
};

type DelegateWhereMap = {
  [TKey in keyof ConditionalPick<
    PrismaClient,
    Delegate
  >]?: PrismaClient[TKey] extends Delegate
    ? NonNullable<Parameters<PrismaClient[TKey][`findFirst`]>[0]> extends {
        where?: infer TWhere;
      }
      ? TWhere
      : never
    : never;
};

export const createPrismaProxy = (
  unrestrictedPrisma: PrismaClient,
  delegateMap: DelegateWhereMap
) => {
  const prismaDelegateProxies = Object.fromEntries(
    Object.entries(delegateMap).map(([key, where]) => [
      key,
      createPrismaDelegateProxy(
        // @ts-expect-error
        unrestrictedPrisma[key],
        where
      ),
    ])
  );

  const prisma = new Proxy(unrestrictedPrisma, {
    get(target, propertyKey, receiver) {
      if (propertyKey in prismaDelegateProxies) {
        return Reflect.get(prismaDelegateProxies, propertyKey, receiver);
      }

      return Reflect.get(target, propertyKey, receiver);
    },
  });

  return prisma;
};
