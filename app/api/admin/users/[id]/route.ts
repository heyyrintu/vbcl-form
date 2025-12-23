import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user details
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                role: true,
                pageAccess: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { username, role, password, pageAccess } = body;

        // Build update data object
        const updateData: { username?: string; role?: string; password?: string; pageAccess?: string[] } = {};

        if (username) {
            // Check if username is already taken by another user
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id }
                },
            });

            if (existingUser) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
            updateData.username = username;
        }

        if (role && (role === "USER" || role === "ADMIN")) {
            updateData.role = role;
        }

        if (password) {
            if (password.length < 8) {
                return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update page access if provided
        if (Array.isArray(pageAccess)) {
            const validPages = ["dashboard", "employees", "all-entries", "employee-attendance", "admin"];
            updateData.pageAccess = pageAccess.filter((p: string) => validPages.includes(p));
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true,
                pageAccess: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Prevent self-deletion
        if (session.user.id === id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
