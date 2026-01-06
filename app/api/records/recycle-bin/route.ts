import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch all deleted records (recycle bin)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const records = await prisma.record.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
      include: {
        employeeAssignments: {
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
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching deleted records:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted records" },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete old records (7+ days)
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find records to delete
    const recordsToDelete = await prisma.record.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: sevenDaysAgo,
        },
      },
      select: { id: true },
    });

    const recordIds = recordsToDelete.map(r => r.id);

    if (recordIds.length > 0) {
      // Delete employee assignments first
      await prisma.employeeAssignment.deleteMany({
        where: { recordId: { in: recordIds } },
      });

      // Permanently delete records
      await prisma.record.deleteMany({
        where: { id: { in: recordIds } },
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: recordIds.length,
    });
  } catch (error) {
    console.error("Error permanently deleting records:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete records" },
      { status: 500 }
    );
  }
}
