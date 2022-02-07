# Prisma Proxy

When setting up an application's core querying, we typically would want to introduce some middleware to filter out records a user shouldn't see. Currently, the only way to do this in Prisma is to pass some middleware to `PrismaClient.$use()`. This causes every query to be ran through the middleware, whether you want it to be restricted or not.

## Using Proxies

By using Node proxies, we can achieve the same effect of Prisma's middlewares, to alter the args and forward it to the core client. Proxies allow us to wrap the logic of an object's properties or functions themselves, which makes it a perfect solution for keeping the same client while altering the args only when necessary.

## `createPrismaProxy()` Example

We can easily pass the Prisma client and an object map with the delegate name (such as `profile`, `partner`, or `partnerContact`) and the corresponding where input (such as `ProfileWhereInput`, `PartnerWhereInput`, or `PartnerContactWhereInput`).

### Schema

```js
model Profile {
  id              Int              @id @default(autoincrement())
  partnerContacts PartnerContact[]
}

model Partner {
  id              Int              @id @default(autoincrement())
  partnerContacts PartnerContact[]
}

model PartnerContact {
  id        Int     @id @default(autoincrement())
  partner   Partner @relation(fields: [partnerID], references: [id])
  partnerID Int
  profile   Profile @relation(fields: [profileID], references: [id])
  profileID Int
}
```

### Usage

```ts
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
```

Everytime we call `prisma.partner.findMany()`, the proxy will merge our where input object into the args before passing it to the original function. We can use `unrestrictedPrisma` directly if we want to avoid our middleware.
