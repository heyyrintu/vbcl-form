import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Restore a deleted record
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    // Restore by setting deletedAt to null
    const restoredRecord = await prisma.record.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json(restoredRecord);
  } catch (error) {
    console.error("Error restoring record:", error);
    return NextResponse.json(
      { error: "Failed to restore record" },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete a single record
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    // Delete employee assignments first
    await prisma.employeeAssignment.deleteMany({
      where: { recordId: id },
    });

    // Permanently delete the record
    await prisma.record.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error permanently deleting record:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete record" },
      { status: 500 }
    );
  }
}
