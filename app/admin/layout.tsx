import { redirect } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-[#f8f9fc] overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="absolute inset-0 bg-neutral-100/50 pointer-events-none" />
                <div className="relative z-10 min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
