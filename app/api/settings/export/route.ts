import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Export all records as JSON (can be converted to CSV on client)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "records"; // records, employees, attendance

        if (type === "records") {
            const records = await prisma.record.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    employeeAssignments: {
                        include: {
                            employee: {
                                select: {
                                    name: true,
                                    role: true,
                                    employeeId: true,
                                },
                            },
                        },
                    },
                },
            });

            // Transform for export
            const exportData = records.map((record) => ({
                id: record.id,
                date: record.date,
                shift: record.shift,
                status: record.status,
                supervisor: record.dronaSupervisor,
                binNo: record.binNo,
                modelNo: record.modelNo,
                chassisNo: record.chassisNo,
                type: record.type,
                vehicleCount: record.srNoVehicleCount,
                electrician: record.electrician,
                fitter: record.fitter,
                painter: record.painter,
                helper: record.helper,
                inTime: record.inTime,
                outTime: record.outTime,
                remarks: record.remarks,
                createdAt: record.createdAt,
                completedAt: record.completedAt,
            }));

            return NextResponse.json({ type: "records", data: exportData, count: exportData.length });
        }

        if (type === "employees") {
            const employees = await prisma.employee.findMany({
                orderBy: { name: "asc" },
            });

            const exportData = employees.map((emp) => ({
                employeeId: emp.employeeId,
                name: emp.name,
                role: emp.role,
                isActive: emp.isActive,
                createdAt: emp.createdAt,
            }));

            return NextResponse.json({ type: "employees", data: exportData, count: exportData.length });
        }

        if (type === "attendance") {
            const attendance = await prisma.employeeAttendance.findMany({
                orderBy: { date: "desc" },
                include: {
                    employee: {
                        select: {
                            name: true,
                            role: true,
                            employeeId: true,
                        },
                    },
                },
            });

            const exportData = attendance.map((att) => ({
                date: att.date,
                shift: att.shift,
                employeeId: att.employee.employeeId,
                employeeName: att.employee.name,
                role: att.employee.role,
                createdAt: att.createdAt,
            }));

            return NextResponse.json({ type: "attendance", data: exportData, count: exportData.length });
        }

        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
