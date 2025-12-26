import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch attendance for specific date/shift
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const shift = searchParams.get("shift"); // "Day" or "Night"

    if (!date || !shift) {
      return NextResponse.json(
        { error: "Date and shift are required" },
        { status: 400 }
      );
    }

    // Fetch attendance records with employee details and their assignments in one query
    const attendanceRecords = await prisma.employeeAttendance.findMany({
      where: {
        date,
        shift,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            role: true,
            assignments: {
              where: {
                record: {
                  date,
                  shift: shift === "Day" ? "Day Shift" : "Night Shift",
                },
              },
              select: {
                splitCount: true,
                record: {
                  select: {
                    id: true,
                    binNo: true,
                    modelNo: true,
                    chassisNo: true,
                    srNoVehicleCount: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        employee: {
          name: "asc",
        },
      },
    });

    // Transform the data to match the expected format
    const attendanceWithAssignments = attendanceRecords.map((attendance) => ({
      id: attendance.id,
      employeeId: attendance.employeeId,
      date: attendance.date,
      shift: attendance.shift,
      employee: {
        id: attendance.employee.id,
        employeeId: attendance.employee.employeeId,
        name: attendance.employee.name,
        role: attendance.employee.role,
      },
      vehicleEntries: attendance.employee.assignments.map((a) => ({
        recordId: a.record.id,
        binNo: a.record.binNo,
        modelNo: a.record.modelNo,
        chassisNo: a.record.chassisNo,
        srNoVehicleCount: a.record.srNoVehicleCount,
        splitCount: a.splitCount,
      })),
    }));

    const response = NextResponse.json(attendanceWithAssignments);
    
    // Add cache headers for better performance (cache for 30 seconds)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee attendance" },
      { status: 500 }
    );
  }
}

// POST - Save/update attendance records
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.date || !data.shift || !Array.isArray(data.employeeIds)) {
      return NextResponse.json(
        { error: "Date, shift, and employeeIds array are required" },
        { status: 400 }
      );
    }

    const { date, shift, employeeIds } = data;

    // Validate shift value
    if (shift !== "Day" && shift !== "Night") {
      return NextResponse.json(
        { error: "Shift must be either 'Day' or 'Night'" },
        { status: 400 }
      );
    }

    // First, remove any existing attendance for this date/shift that are not in the new list
    await prisma.employeeAttendance.deleteMany({
      where: {
        date,
        shift,
        employeeId: {
          notIn: employeeIds,
        },
      },
    });

    // Then, create or update attendance records for all employees in the list
    const attendancePromises = employeeIds.map((employeeId: string) =>
      prisma.employeeAttendance.upsert({
        where: {
          employeeId_date_shift: {
            employeeId,
            date,
            shift,
          },
        },
        update: {},
        create: {
          employeeId,
          date,
          shift,
        },
      })
    );

    await Promise.all(attendancePromises);

    // Fetch the updated attendance records
    const updatedAttendance = await prisma.employeeAttendance.findMany({
      where: {
        date,
        shift,
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
      orderBy: {
        employee: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    console.error("Error saving employee attendance:", error);
    return NextResponse.json(
      { error: "Failed to save employee attendance" },
      { status: 500 }
    );
  }
}

