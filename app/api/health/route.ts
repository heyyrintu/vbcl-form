import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Health check endpoint for Coolify
export async function GET() {
  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    // Still return 200 but indicate database issue
    // This allows the app to start even if DB has issues initially
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

