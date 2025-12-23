import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Fetch single employee with attendance stats
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

        const employee = await prisma.employee.findUnique({
            where: { id },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Calculate attendance stats for the month
        let attendanceStats = { present: 0, workingDays: 0 };

        if (month) {
            const [year, monthNum] = month.split("-").map(Number);
            const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
            const endDate = `${year}-${String(monthNum).padStart(2, "0")}-31`;

            // Count unique days present (employee can be present in both shifts)
            const attendanceRecords = await prisma.employeeAttendance.findMany({
                where: {
                    employeeId: id,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    date: true,
                },
                distinct: ["date"],
            });

            attendanceStats.present = attendanceRecords.length;

            // Calculate working days (excluding Sundays)
            const daysInMonth = new Date(year, monthNum, 0).getDate();
            let workingDays = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, monthNum - 1, day);
                if (date.getDay() !== 0) { // Not Sunday
                    workingDays++;
                }
            }
            attendanceStats.workingDays = workingDays;
        }

        return NextResponse.json({
            id: employee.id,
            employeeId: employee.employeeId,
            name: employee.name,
            role: employee.role,
            isActive: employee.isActive,
            createdAt: employee.createdAt.toISOString(),
            updatedAt: employee.updatedAt.toISOString(),
            attendanceStats,
        });
    } catch (error) {
        console.error("Error fetching employee:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee" },
            { status: 500 }
        );
    }
}

// PATCH - Update employee
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

        // Validate the employee exists
        const existing = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Build update data
        const updateData: { name?: string; role?: string; isActive?: boolean } = {};

        if (data.name !== undefined) {
            const trimmedName = data.name.trim();
            if (trimmedName.length === 0) {
                return NextResponse.json(
                    { error: "Name cannot be empty" },
                    { status: 400 }
                );
            }
            updateData.name = trimmedName;
        }

        if (data.role !== undefined) {
            const validRoles = [
                "Supervisor", "Manager", "Assistant Manager", "Senior Associate", "Associate",
                "Painter", "Fitter", "Electrician", "Helper"
            ];
            if (!validRoles.includes(data.role)) {
                return NextResponse.json(
                    { error: "Invalid role" },
                    { status: 400 }
                );
            }
            updateData.role = data.role;
        }

        if (data.isActive !== undefined) {
            updateData.isActive = Boolean(data.isActive);
        }

        // Check for duplicate name+role combination
        if (updateData.name || updateData.role) {
            const checkName = updateData.name || existing.name;
            const checkRole = updateData.role || existing.role;

            const duplicate = await prisma.employee.findFirst({
                where: {
                    name: checkName,
                    role: checkRole,
                    id: { not: id },
                },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: "Employee with this name and role already exists" },
                    { status: 400 }
                );
            }
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            id: employee.id,
            employeeId: employee.employeeId,
            name: employee.name,
            role: employee.role,
            isActive: employee.isActive,
            createdAt: employee.createdAt.toISOString(),
            updatedAt: employee.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return NextResponse.json(
            { error: "Failed to update employee" },
            { status: 500 }
        );
    }
}

// DELETE - Delete employee (soft delete by default, hard delete with ?hard=true)
export async function DELETE(
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
        const hardDelete = searchParams.get("hard") === "true";

        const existing = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        if (hardDelete) {
            // Hard delete - removes employee and all related records
            await prisma.employee.delete({
                where: { id },
            });
            return NextResponse.json({ message: "Employee permanently deleted" });
        } else {
            // Soft delete - just set isActive to false
            await prisma.employee.update({
                where: { id },
                data: { isActive: false },
            });
            return NextResponse.json({ message: "Employee deactivated" });
        }
    } catch (error) {
        console.error("Error deleting employee:", error);
        return NextResponse.json(
            { error: "Failed to delete employee" },
            { status: 500 }
        );
    }
}
