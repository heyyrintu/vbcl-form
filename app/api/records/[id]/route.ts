import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCurrentMonthRange } from "@/lib/utils";
import { syncRecordToSheet } from "@/lib/googleSheets";
import { assignEmployeesToRecord } from "@/lib/employeeUtils";
import { generateSerialNumber } from "@/lib/serialNumberUtils";

// In-memory cache for idempotency keys
const idempotencyCache = new Map<string, { response: any; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// GET - Fetch single record by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const record = await prisma.record.findUnique({
      where: { id },
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

    if (!record || record.deletedAt) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching record:", error);
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}

// PATCH - Update record (save, submit, or cancel)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Check for idempotency key
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const cacheKey = `${id}:${idempotencyKey}`;
      const cached = idempotencyCache.get(cacheKey);
      if (cached) {
        console.log(`Duplicate PATCH request detected with key: ${idempotencyKey}`);
        return NextResponse.json(cached.response);
      }
    }
    
    const data = await request.json();

    // Fetch the current record
    const existingRecord = await prisma.record.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Handle different actions
    if (data.action === "submit" && existingRecord.status === "PENDING") {
      // Calculate monthly counter
      const { startOfMonth, endOfMonth } = getCurrentMonthRange();
      
      const maxRecord = await prisma.record.findFirst({
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: {
          srNoVehicleCount: "desc",
        },
      });

      const newCount = (maxRecord?.srNoVehicleCount || 0) + 1;

      // Calculate hours (outTime - inTime)
      let hours: number | null = null;
      const inTime = data.inTime !== undefined ? data.inTime : existingRecord.inTime;
      const outTime = data.outTime !== undefined ? data.outTime : existingRecord.outTime;
      
      if (inTime && outTime) {
        const inDate = new Date(inTime);
        const outDate = new Date(outTime);
        const diffMs = outDate.getTime() - inDate.getTime();
        hours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
      }

      // Update to completed
      const updatedRecord = await prisma.record.update({
        where: { id },
        data: {
          status: "COMPLETED",
          srNoVehicleCount: newCount,
          completedAt: new Date(),
          hours,
          // Update any other fields from the request
          dronaSupervisor: data.dronaSupervisor || existingRecord.dronaSupervisor,
          shift: data.shift || existingRecord.shift,
          date: data.date !== undefined ? data.date : existingRecord.date,
          inTime: data.inTime !== undefined ? data.inTime : existingRecord.inTime,
          outTime: data.outTime !== undefined ? data.outTime : existingRecord.outTime,
          binNo: data.binNo || existingRecord.binNo,
          modelNo: data.modelNo || existingRecord.modelNo,
          chassisNo: data.chassisNo || existingRecord.chassisNo,
          type: data.type || existingRecord.type,
          electrician: data.electrician !== undefined ? data.electrician : existingRecord.electrician,
          fitter: data.fitter !== undefined ? data.fitter : existingRecord.fitter,
          painter: data.painter !== undefined ? data.painter : existingRecord.painter,
          helper: data.helper !== undefined ? data.helper : existingRecord.helper,
          productionInchargeFromVBCL: data.productionInchargeFromVBCL !== undefined ? data.productionInchargeFromVBCL : existingRecord.productionInchargeFromVBCL,
          remarks: data.remarks !== undefined ? data.remarks : existingRecord.remarks,
        },
      });

      // Update employee assignments if provided
      if (data.employeeIds && Array.isArray(data.employeeIds) && updatedRecord.date && updatedRecord.shift) {
        await assignEmployeesToRecord(
          updatedRecord.id,
          data.employeeIds,
          updatedRecord.date,
          updatedRecord.shift
        );
      }

      // Sync to Google Sheets
      const syncResult = await syncRecordToSheet(updatedRecord);
      
      return NextResponse.json({ 
        record: updatedRecord,
        sheetSyncSuccess: syncResult.success,
        sheetSyncError: syncResult.error,
        sheetSyncNotConfigured: syncResult.notConfigured,
      });
    } else if (data.action === "cancel" && existingRecord.status === "COMPLETED") {
      // Move back to pending
      const updatedRecord = await prisma.record.update({
        where: { id },
        data: {
          status: "PENDING",
          srNoVehicleCount: null,
          completedAt: null,
        },
      });

      // Remove employee assignments when cancelling
      await prisma.employeeAssignment.deleteMany({
        where: { recordId: id },
      });

      return NextResponse.json(updatedRecord);
    } else if (data.action === "save" || !data.action) {
      // Regular update (save)
      // Generate serial number if date changed and exists
      let serialNo = existingRecord.serialNo;
      const newDate = data.date !== undefined ? data.date : existingRecord.date;
      if (newDate && (!existingRecord.serialNo || data.date !== existingRecord.date)) {
        serialNo = await generateSerialNumber(newDate);
      }
      
      const updatedRecord = await prisma.record.update({
        where: { id },
        data: {
          serialNo,
          dronaSupervisor: data.dronaSupervisor !== undefined ? data.dronaSupervisor : existingRecord.dronaSupervisor,
          shift: data.shift !== undefined ? data.shift : existingRecord.shift,
          date: data.date !== undefined ? data.date : existingRecord.date,
          inTime: data.inTime !== undefined ? data.inTime : existingRecord.inTime,
          outTime: data.outTime !== undefined ? data.outTime : existingRecord.outTime,
          binNo: data.binNo !== undefined ? data.binNo : existingRecord.binNo,
          modelNo: data.modelNo !== undefined ? data.modelNo : existingRecord.modelNo,
          chassisNo: data.chassisNo !== undefined ? data.chassisNo : existingRecord.chassisNo,
          type: data.type !== undefined ? data.type : existingRecord.type,
          electrician: data.electrician !== undefined ? data.electrician : existingRecord.electrician,
          fitter: data.fitter !== undefined ? data.fitter : existingRecord.fitter,
          painter: data.painter !== undefined ? data.painter : existingRecord.painter,
          helper: data.helper !== undefined ? data.helper : existingRecord.helper,
          productionInchargeFromVBCL: data.productionInchargeFromVBCL !== undefined ? data.productionInchargeFromVBCL : existingRecord.productionInchargeFromVBCL,
          remarks: data.remarks !== undefined ? data.remarks : existingRecord.remarks,
        },
      });

      // Update employee assignments if provided
      if (data.employeeIds && Array.isArray(data.employeeIds) && updatedRecord.date && updatedRecord.shift) {
        await assignEmployeesToRecord(
          updatedRecord.id,
          data.employeeIds,
          updatedRecord.date,
          updatedRecord.shift
        );
      }

      // Cache the response for idempotency
      if (idempotencyKey) {
        const cacheKey = `${id}:${idempotencyKey}`;
        idempotencyCache.set(cacheKey, {
          response: updatedRecord,
          timestamp: Date.now(),
        });
      }

      return NextResponse.json(updatedRecord);
    }

    return NextResponse.json(
      { error: "Invalid action or status transition" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a record (move to recycle bin)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Soft delete by setting deletedAt
    await prisma.record.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}

