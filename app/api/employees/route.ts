import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch all employees (with optional search query)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const employees = await prisma.employee.findMany({
      where,
      orderBy: {
        employeeId: "asc",
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(employees);
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

    if (!data.role || !["Electrician", "Fitter", "Painter", "Helper"].includes(data.role)) {
      return NextResponse.json(
        { error: "Valid role is required (Electrician, Fitter, Painter, Helper)" },
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
    const existingEmployee = await prisma.employee.findFirst({
      where: { 
        name: normalizedName,
        role: data.role
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Employee with this name and role already exists" },
        { status: 400 }
      );
    }

    // Generate employee ID - Format: DLPL/{role_code}/{number}
    type RoleType = "Electrician" | "Fitter" | "Painter" | "Helper";
    const roleCodeMap: Record<RoleType, string> = {
      "Electrician": "E",
      "Fitter": "F",
      "Painter": "P",
      "Helper": "H"
    };
    const roleCode = roleCodeMap[data.role as RoleType];

    // Get the highest number used globally across all employees
    const allEmployees = await prisma.employee.findMany({
      select: { employeeId: true },
      orderBy: { employeeId: "desc" },
    });

    let nextNumber = 1;
    if (allEmployees.length > 0) {
      // Extract all numbers from employee IDs and find the max
      const numbers = allEmployees
        .map(emp => {
          const match = emp.employeeId.match(/DLPL\/[A-Z]\/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const employeeId = `DLPL/${roleCode}/${String(nextNumber).padStart(2, '0')}`;

    // Create the employee
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name: normalizedName,
        role: data.role,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

