import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Cron job to clean up deleted records older than 7 days
// Can be called manually or set up with a scheduler like Vercel Cron or external service
export async function GET(request: Request) {
  try {
    // Optional: Add authentication for cron endpoint
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const recordIds = recordsToDelete.map((r) => r.id);

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
      message: `Successfully deleted ${recordIds.length} old records`,
    });
  } catch (error) {
    console.error("Error in cleanup cron job:", error);
    return NextResponse.json(
      { error: "Failed to cleanup old records" },
      { status: 500 }
    );
  }
}
