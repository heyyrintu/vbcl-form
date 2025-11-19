import { prisma } from "@/lib/db";

/**
 * Recalculates split counts for all employees assigned to records on a given date and shift.
 * If an employee is assigned to multiple records on the same date/shift, their split count
 * will be distributed evenly (e.g., 0.5 if assigned to 2 records, 0.33 if assigned to 3).
 * 
 * @param date - Date in YYYY-MM-DD format
 * @param shift - "Day Shift" or "Night Shift"
 */
export async function recalculateSplitCounts(
  date: string,
  shift: string
): Promise<void> {
  // Get all records for this date and shift
  const records = await prisma.record.findMany({
    where: {
      date,
      shift,
    },
    include: {
      employeeAssignments: {
        include: {
          employee: true,
        },
      },
    },
  });

  if (records.length === 0) {
    return;
  }

  // Get all unique employees across all these records
  const employeeMap = new Map<string, number>();

  records.forEach((record) => {
    record.employeeAssignments.forEach((assignment) => {
      const count = employeeMap.get(assignment.employeeId) || 0;
      employeeMap.set(assignment.employeeId, count + 1);
    });
  });

  // Update split counts for all assignments
  const updatePromises: Promise<any>[] = [];

  records.forEach((record) => {
    record.employeeAssignments.forEach((assignment) => {
      const totalAssignments = employeeMap.get(assignment.employeeId) || 1;
      const splitCount = 1 / totalAssignments;

      updatePromises.push(
        prisma.employeeAssignment.update({
          where: {
            id: assignment.id,
          },
          data: {
            splitCount,
          },
        })
      );
    });
  });

  await Promise.all(updatePromises);

  // Now recalculate the employee counts (electrician, fitter, painter, helper) for all affected records
  // Categorize by role
  const recordUpdatePromises = records.map(async (record) => {
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        recordId: record.id,
      },
      include: {
        employee: {
          select: {
            role: true,
          },
        },
      },
    });

    // Sum split counts by role
    const roleCounts = {
      electrician: 0,
      fitter: 0,
      painter: 0,
      helper: 0,
    };

    assignments.forEach((assignment) => {
      const role = assignment.employee.role.toLowerCase();
      if (role === "electrician") {
        roleCounts.electrician += assignment.splitCount;
      } else if (role === "fitter") {
        roleCounts.fitter += assignment.splitCount;
      } else if (role === "painter") {
        roleCounts.painter += assignment.splitCount;
      } else if (role === "helper") {
        roleCounts.helper += assignment.splitCount;
      }
    });

    // Update the record with role-specific counts
    return prisma.record.update({
      where: {
        id: record.id,
      },
      data: {
        electrician: Math.round(roleCounts.electrician * 100) / 100, // Keep 2 decimal places
        fitter: Math.round(roleCounts.fitter * 100) / 100,
        painter: Math.round(roleCounts.painter * 100) / 100,
        helper: Math.round(roleCounts.helper * 100) / 100,
      },
    });
  });

  await Promise.all(recordUpdatePromises);
}

/**
 * Get the total employee count for a record based on its assignments
 * 
 * @param recordId - The ID of the record
 * @returns Total employee count (sum of split counts)
 */
export async function getEmployeeCountForRecord(
  recordId: string
): Promise<number> {
  const assignments = await prisma.employeeAssignment.findMany({
    where: {
      recordId,
    },
  });

  return assignments.reduce((sum, a) => sum + a.splitCount, 0);
}

/**
 * Get employees assigned to a specific record with their split counts
 * 
 * @param recordId - The ID of the record
 * @returns Array of employees with their split counts
 */
export async function getEmployeesForRecord(recordId: string) {
  const assignments = await prisma.employeeAssignment.findMany({
    where: {
      recordId,
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return assignments.map((a) => ({
    id: a.employee.id,
    employeeId: a.employee.employeeId,
    name: a.employee.name,
    role: a.employee.role,
    splitCount: a.splitCount,
  }));
}

/**
 * Assign employees to a record and recalculate split counts
 * 
 * @param recordId - The ID of the record
 * @param employeeIds - Array of employee IDs to assign
 * @param date - Date in YYYY-MM-DD format
 * @param shift - "Day Shift" or "Night Shift"
 */
export async function assignEmployeesToRecord(
  recordId: string,
  employeeIds: string[],
  date: string,
  shift: string
): Promise<void> {
  // First, remove any existing assignments for this record
  await prisma.employeeAssignment.deleteMany({
    where: {
      recordId,
    },
  });

  // Create new assignments
  const assignmentPromises = employeeIds.map((employeeId) =>
    prisma.employeeAssignment.create({
      data: {
        recordId,
        employeeId,
        splitCount: 1.0, // Will be recalculated
      },
    })
  );

  await Promise.all(assignmentPromises);

  // Recalculate split counts for all records on this date/shift
  await recalculateSplitCounts(date, shift);
}

