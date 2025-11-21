-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Record" (
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
    "productionInchargeFromVBCL" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
