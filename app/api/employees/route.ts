"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Fetch all employees (with optional search query)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const employees = await prisma.employee.findMany({
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { employeeId: { contains: search, mode: "insensitive" } },
          ],
        }
        : undefined,
      orderBy: { employeeId: "asc" },
    });

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      role: emp.role,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST - Create new employee
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || typeof data.name !== "string") {
      return NextResponse.json(
        { error: "Employee name is required" },
        { status: 400 }
      );
    }

    // All valid roles (Onrole + Offrole)
    const validRoles = [
      // Onrole roles
      "Supervisor", "Manager", "Assistant Manager", "Senior Associate", "Associate",
      // Offrole roles
      "Painter", "Fitter", "Electrician", "Helper", "Senior Operator", "Fitter-RSO"
    ];

    if (!data.role || !validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: `Valid role is required. Allowed: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Trim and normalize the name
    const normalizedName = data.name.trim();

    if (normalizedName.length === 0) {
      return NextResponse.json(
        { error: "Employee name cannot be empty" },
        { status: 400 }
      );
    }

    // Check if employee with this name and role already exists
    const existing = await prisma.employee.findFirst({
      where: {
        name: normalizedName,
        role: data.role,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Employee with this name and role already exists" },
        { status: 400 }
      );
    }

    // Generate employee ID - Format: DLPL/{role_code}/{number}
    const roleCodeMap: Record<string, string> = {
      // Onrole roles
      "Supervisor": "S",
      "Manager": "M",
      "Assistant Manager": "AM",
      "Senior Associate": "SA",
      "Associate": "A",
      // Offrole roles
      "Electrician": "E",
      "Fitter": "F",
      "Painter": "P",
      "Helper": "H",
      "Senior Operator": "SO",
      "Fitter-RSO": "FR",
    };
    const roleCode = roleCodeMap[data.role] || "X";

    // Get the highest number used globally across all employees
    const allEmployees = await prisma.employee.findMany({
      select: { employeeId: true },
      orderBy: { employeeId: "desc" },
    });

    let nextNumber = 1;
    if (allEmployees.length > 0) {
      const numbers = allEmployees
        .map((emp) => {
          const match = String(emp.employeeId).match(/DLPL\/[A-Z]+\/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => num > 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const employeeId = `DLPL/${roleCode}/${String(nextNumber).padStart(2, '0')}`;

    // Determine isActive based on request (defaults to true for onrole, false for offrole)
    const isActive = typeof data.isActive === "boolean" ? data.isActive : true;

    // Create the employee
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name: normalizedName,
        role: data.role,
        isActive,
      },
    });

    return NextResponse.json(
      {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        createdAt: employee.createdAt.toISOString(),
        updatedAt: employee.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
