-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "dronaSupervisor" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "srNoVehicleCount" INTEGER,
    "binNo" TEXT NOT NULL,
    "modelNo" TEXT NOT NULL,
    "chassisNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "electrician" INTEGER NOT NULL DEFAULT 0,
    "fitter" INTEGER NOT NULL DEFAULT 0,
    "painter" INTEGER NOT NULL DEFAULT 0,
    "helper" INTEGER NOT NULL DEFAULT 0,
    "productionInchargeFromVBCL" TEXT NOT NULL DEFAULT '',
    "remarks" TEXT,
    "completedAt" DATETIME
);
INSERT INTO "new_Record" ("binNo", "chassisNo", "completedAt", "createdAt", "dronaSupervisor", "electrician", "fitter", "helper", "id", "modelNo", "painter", "productionInchargeFromVBCL", "remarks", "shift", "srNoVehicleCount", "status", "type", "updatedAt") SELECT "binNo", "chassisNo", "completedAt", "createdAt", "dronaSupervisor", "electrician", "fitter", "helper", "id", "modelNo", "painter", "productionInchargeFromVBCL", "remarks", "shift", "srNoVehicleCount", "status", "type", "updatedAt" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
