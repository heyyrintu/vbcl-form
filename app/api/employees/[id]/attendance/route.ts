import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Fetch attendance records for employee in a given month
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month"); // YYYY-MM format

        if (!month) {
            return NextResponse.json(
                { error: "Month parameter is required (YYYY-MM format)" },
                { status: 400 }
            );
        }

        // Validate employee exists
        const employee = await prisma.employee.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Calculate date range for the month
        const [year, monthNum] = month.split("-").map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        // Fetch attendance records
        const attendanceRecords = await prisma.employeeAttendance.findMany({
            where: {
                employeeId: id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: "asc" },
        });

        // Transform to a map for easy calendar display
        const attendanceMap: Record<string, { day: boolean; night: boolean; id: string; createdAt: string }> = {};

        attendanceRecords.forEach((record) => {
            if (!attendanceMap[record.date]) {
                attendanceMap[record.date] = { day: false, night: false, id: "", createdAt: "" };
            }
            if (record.shift === "Day") {
                attendanceMap[record.date].day = true;
                attendanceMap[record.date].id = record.id;
                attendanceMap[record.date].createdAt = record.createdAt.toISOString();
            } else if (record.shift === "Night") {
                attendanceMap[record.date].night = true;
                attendanceMap[record.date].id = record.id;
                attendanceMap[record.date].createdAt = record.createdAt.toISOString();
            }
        });

        // Calculate summary stats
        const uniqueDaysPresent = Object.keys(attendanceMap).length;

        // Calculate working days (excluding Sundays)
        let workingDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthNum - 1, day);
            if (date.getDay() !== 0) { // Not Sunday
                workingDays++;
            }
        }

        return NextResponse.json({
            month,
            attendanceMap,
            summary: {
                present: uniqueDaysPresent,
                absent: workingDays - uniqueDaysPresent,
                workingDays,
            },
        });
    } catch (error) {
        console.error("Error fetching employee attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee attendance" },
            { status: 500 }
        );
    }
}

// PATCH - Update attendance (only within 72 hours)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();

        if (!data.date || !data.shift) {
            return NextResponse.json(
                { error: "Date and shift are required" },
                { status: 400 }
            );
        }

        // Validate employee exists
        const employee = await prisma.employee.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Check 72-hour rule
        const attendanceDate = new Date(data.date);
        const now = new Date();
        const hoursDiff = (now.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 72) {
            return NextResponse.json(
                { error: "Attendance can only be edited within 72 hours of the date" },
                { status: 403 }
            );
        }

        // Validate shift
        if (data.shift !== "Day" && data.shift !== "Night") {
            return NextResponse.json(
                { error: "Shift must be 'Day' or 'Night'" },
                { status: 400 }
            );
        }

        if (data.action === "add") {
            // Add attendance record
            const attendance = await prisma.employeeAttendance.upsert({
                where: {
                    employeeId_date_shift: {
                        employeeId: id,
                        date: data.date,
                        shift: data.shift,
                    },
                },
                update: {},
                create: {
                    employeeId: id,
                    date: data.date,
                    shift: data.shift,
                },
            });
            return NextResponse.json(attendance);
        } else if (data.action === "remove") {
            // Remove attendance record
            await prisma.employeeAttendance.deleteMany({
                where: {
                    employeeId: id,
                    date: data.date,
                    shift: data.shift,
                },
            });
            return NextResponse.json({ message: "Attendance removed" });
        } else {
            return NextResponse.json(
                { error: "Action must be 'add' or 'remove'" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error updating employee attendance:", error);
        return NextResponse.json(
            { error: "Failed to update employee attendance" },
            { status: 500 }
        );
    }
}
