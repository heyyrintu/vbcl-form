import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCurrentMonthRange } from "@/lib/utils";
import { syncRecordToSheet } from "@/lib/googleSheets";
import { assignEmployeesToRecord } from "@/lib/employeeUtils";

// GET - Fetch all records (with optional status filter)
export async function GET(request: Request) {
  try {
    const session = await auth({
      headers: request.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const records = await prisma.record.findMany({
      where,
      orderBy: [
        { status: "asc" }, // PENDING first, then COMPLETED
        { updatedAt: "desc" },
      ],
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
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

// POST - Create new pending record
export async function POST(request: Request) {
  try {
    const session = await auth({
      headers: request.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.dronaSupervisor || !data.shift || !data.binNo || !data.modelNo || !data.chassisNo || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const record = await prisma.record.create({
      data: {
        status: "PENDING",
        dronaSupervisor: data.dronaSupervisor,
        shift: data.shift,
        date: data.date || null,
        inTime: data.inTime || null,
        outTime: data.outTime || null,
        binNo: data.binNo,
        modelNo: data.modelNo,
        chassisNo: data.chassisNo,
        type: data.type,
        electrician: data.electrician || 0,
        fitter: data.fitter || 0,
        painter: data.painter || 0,
        helper: data.helper || 0,
        productionInchargeFromVBCL: data.productionInchargeFromVBCL || "",
        remarks: data.remarks || null,
      },
    });

    // Assign employees if provided
    if (data.employeeIds && Array.isArray(data.employeeIds) && data.employeeIds.length > 0 && data.date && data.shift) {
      await assignEmployeesToRecord(
        record.id,
        data.employeeIds,
        data.date,
        data.shift
      );
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}

