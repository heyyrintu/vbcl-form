import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assignEmployeesToRecord } from "@/lib/employeeUtils";
import { generateSerialNumber } from "@/lib/serialNumberUtils";

// In-memory cache for idempotency keys (for duplicate prevention)
// In production, use Redis or database table
const idempotencyCache = new Map<string, { response: any; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old idempotency keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// GET - Fetch all records (with optional status filter)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status, deletedAt: null } : { deletedAt: null };

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
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for idempotency key
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached) {
        // Return cached response for duplicate request
        console.log(`Duplicate request detected with key: ${idempotencyKey}`);
        return NextResponse.json(cached.response, { status: 201 });
      }
    }

    const data = await request.json();

    // Validate required fields
    if (!data.dronaSupervisor || !data.shift || !data.binNo || !data.modelNo || !data.chassisNo || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate serial number if date is provided
    let serialNo: string | null = null;
    if (data.date) {
      serialNo = await generateSerialNumber(data.date);
    }

    const record = await prisma.record.create({
      data: {
        status: "PENDING",
        serialNo,
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

    // Cache the response for idempotency
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        response: record,
        timestamp: Date.now(),
      });
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

