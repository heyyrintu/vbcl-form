import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/admin/users - Fetch all users (admin only)
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                pageAccess: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password for security
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST /api/admin/users - Create a new user (admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.username || typeof data.username !== "string") {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        if (!data.password || typeof data.password !== "string") {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        if (data.password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Validate role
        const validRoles = ["USER", "ADMIN"];
        const role = data.role && validRoles.includes(data.role) ? data.role : "USER";

        // Check if username already exists
        const existing = await prisma.user.findUnique({
            where: { username: data.username.trim() },
        });

        if (existing) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: data.username.trim(),
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

