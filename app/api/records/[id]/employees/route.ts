import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch employees for a specific record
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth({
      headers: request.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        recordId: id,
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

    const employees = assignments.map((assignment) => ({
      id: assignment.employee.id,
      employeeId: assignment.employee.employeeId,
      name: assignment.employee.name,
      role: assignment.employee.role,
    }));

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees for record:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

