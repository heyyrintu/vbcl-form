-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("createdAt", "employeeId", "id", "name", "role", "updatedAt") SELECT "createdAt", "employeeId", "id", "name", "role", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");
CREATE UNIQUE INDEX "Employee_name_role_key" ON "Employee"("name", "role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
