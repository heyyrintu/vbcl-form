-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "dronaSupervisor" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "date" TEXT,
    "inTime" TEXT,
    "outTime" TEXT,
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
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAssignment" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "splitCount" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_name_role_key" ON "Employee"("name", "role");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_date_shift_idx" ON "EmployeeAttendance"("date", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAttendance_employeeId_date_shift_key" ON "EmployeeAttendance"("employeeId", "date", "shift");

-- CreateIndex
CREATE INDEX "EmployeeAssignment_employeeId_idx" ON "EmployeeAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAssignment_recordId_idx" ON "EmployeeAssignment"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAssignment_recordId_employeeId_key" ON "EmployeeAssignment"("recordId", "employeeId");

-- AddForeignKey
ALTER TABLE "EmployeeAttendance" ADD CONSTRAINT "EmployeeAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAssignment" ADD CONSTRAINT "EmployeeAssignment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAssignment" ADD CONSTRAINT "EmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

