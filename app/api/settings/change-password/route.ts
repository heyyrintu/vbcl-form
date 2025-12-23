import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST - Change password for current user
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.currentPassword || !data.newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (data.newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            data.currentPassword,
            user.password
        );

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
