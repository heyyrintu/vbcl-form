-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmployeeAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "splitCount" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeAssignment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_name_key" ON "Employee"("name");

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
