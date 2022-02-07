-- CreateTable
CREATE TABLE "profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "partners" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "partner_contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partner_id" INTEGER NOT NULL,
    "profile_id" INTEGER NOT NULL,
    CONSTRAINT "partner_contacts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partner_contacts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
