import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get today's date in IST
function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split("T")[0];
}

// Helper function to get yesterday's date in IST
function getYesterdayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    istDate.setDate(istDate.getDate() - 1);
    return istDate.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get("filter") || "today"; // total, today, yesterday
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        let dateFilter: { gte?: string; lte?: string } | undefined;

        // Determine date range based on filter
        if (filter === "today") {
            const today = getTodayIST();
            dateFilter = { gte: today, lte: today };
        } else if (filter === "yesterday") {
            const yesterday = getYesterdayIST();
            dateFilter = { gte: yesterday, lte: yesterday };
        } else if (filter === "total") {
            // No date filter for total - get all employees
            dateFilter = undefined;
        } else if (fromDate || toDate) {
            // Use page date filter
            dateFilter = {};
            if (fromDate) dateFilter.gte = fromDate;
            if (toDate) dateFilter.lte = toDate;
        }

        let stats;

        if (filter === "total" && !fromDate && !toDate) {
            // Count from Employee table directly
            const [total, onrole, fitter, painter, electrician, helper] = await Promise.all([
                prisma.employee.count(),
                prisma.employee.count({ where: { isActive: true } }),
                prisma.employee.count({ where: { role: "Fitter" } }),
                prisma.employee.count({ where: { role: "Painter" } }),
                prisma.employee.count({ where: { role: "Electrician" } }),
                prisma.employee.count({ where: { role: "Helper" } }),
            ]);

            stats = { total, onrole, fitter, painter, electrician, helper };
        } else {
            // Count unique employees from EmployeeAssignment based on records in date range
            const recordsInRange = await prisma.record.findMany({
                where: dateFilter ? { date: dateFilter } : {},
                select: { id: true },
            });

            const recordIds = recordsInRange.map((r) => r.id);

            if (recordIds.length === 0) {
                stats = { total: 0, onrole: 0, fitter: 0, painter: 0, electrician: 0, helper: 0 };
            } else {
                // Get unique employees assigned to these records
                const assignments = await prisma.employeeAssignment.findMany({
                    where: { recordId: { in: recordIds } },
                    include: { employee: true },
                    distinct: ["employeeId"],
                });

                const uniqueEmployees = assignments.map((a) => a.employee);

                const total = uniqueEmployees.length;
                const onrole = uniqueEmployees.filter((e) => e.isActive).length;
                const fitter = uniqueEmployees.filter((e) => e.role === "Fitter").length;
                const painter = uniqueEmployees.filter((e) => e.role === "Painter").length;
                const electrician = uniqueEmployees.filter((e) => e.role === "Electrician").length;
                const helper = uniqueEmployees.filter((e) => e.role === "Helper").length;

                stats = { total, onrole, fitter, painter, electrician, helper };
            }
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Failed to fetch manpower stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch manpower stats" },
            { status: 500 }
        );
    }
}
