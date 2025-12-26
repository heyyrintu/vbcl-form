"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
    IconArrowLeft,
    IconUser,
    IconShieldCheck,
    IconKey,
    IconLoader2,
    IconTrash,
    IconDeviceFloppy,
    IconAlertCircle,
    IconCheck,
    IconX,
    IconLayoutDashboard,
    IconUsers,
    IconClipboardList,
    IconCalendar,
    IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    username: string;
    role: string;
    pageAccess: string[];
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

const ALL_PAGES = [
    { id: "dashboard", label: "Dashboard", icon: IconLayoutDashboard, description: "Main dashboard with stats" },
    { id: "employees", label: "Employees", icon: IconUsers, description: "Employee management" },
    { id: "all-entries", label: "All Entries", icon: IconClipboardList, description: "Vehicle entry records" },
    { id: "employee-attendance", label: "Attendance", icon: IconCalendar, description: "Attendance tracker" },
    { id: "admin", label: "Admin Panel", icon: IconSettings, description: "User management (ADMIN only)" },
];

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session, status } = useSession();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Edit form state
    const [editUsername, setEditUsername] = useState("");
    const [editRole, setEditRole] = useState("USER");
    const [editPassword, setEditPassword] = useState("");
    const [editPageAccess, setEditPageAccess] = useState<string[]>([]);

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/login");
            return;
        }
        if (session.user.role !== "ADMIN") {
            setError("Access denied. Admin privileges required.");
            setLoading(false);
            return;
        }
        fetchUser();
    }, [session, status, id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`/api/admin/users/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError("User not found");
                    return;
                }
                throw new Error("Failed to fetch user");
            }
            const data = await res.json();
            setUser(data);
            setEditUsername(data.username);
            setEditRole(data.role);
            setEditPageAccess(data.pageAccess || []);
        } catch (err) {
            console.error("Error fetching user:", err);
            setError("Failed to load user data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editUsername.trim()) {
            setError("Username cannot be empty");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: editUsername.trim(),
                    role: editRole,
                    password: editPassword || undefined,
                    pageAccess: editPageAccess,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to update user");
                return;
            }

            setUser(data);
            setEditPassword("");
            setSuccess("Profile updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error updating user:", err);
            setError("Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to delete user");
                return;
            }

            router.push("/admin/users");
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Failed to delete user");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const togglePageAccess = (pageId: string) => {
        setEditPageAccess((prev) =>
            prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
        );
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <IconLoader2 className="w-10 h-10 animate-spin text-red-500 mx-auto" />
                    <p className="mt-4 text-neutral-500 font-medium">Loading user profile...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <IconAlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <p className="mt-4 text-neutral-900 font-bold text-xl">{error}</p>
                    <button
                        onClick={() => router.push("/admin/users")}
                        className="mt-6 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-4 lg:p-10">
            {/* 
              Fixed decorative background
              - Positioned using CSS background-position for precise alignment
              - Remains fixed while content scrolls (see .app-fixed-bg)
              - Viewport-relative sizing ensures responsive composition
            */}
            <div className="app-fixed-bg" aria-hidden="true" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/admin/users")}
                    className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
                >
                    <IconArrowLeft size={20} />
                    Back to All Users
                </button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-white rounded-[2.5rem] border border-neutral-200 p-8 shadow-sm overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#E01E1F] to-[#FEA519]" />
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-red-500/20">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-neutral-900">{user?.username}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold",
                                    user?.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-600"
                                        : "bg-blue-100 text-blue-600"
                                )}>
                                    {user?.role === "ADMIN" ? <IconShieldCheck size={16} /> : <IconUser size={16} />}
                                    {user?.role}
                                </span>
                                <span className="text-neutral-400 text-sm">
                                    Joined {new Date(user?.createdAt || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Messages */}
                {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
                        <IconAlertCircle size={20} className="text-red-500" />
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <button onClick={() => setError("")} className="ml-auto">
                            <IconX size={18} className="text-red-500" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-2">
                        <IconCheck size={20} className="text-green-500" />
                        <p className="text-sm text-green-600 font-medium">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Edit Profile */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2rem] border border-neutral-200 p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <IconUser size={22} />
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900">Edit Profile</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-neutral-700 ml-1">Username</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-neutral-700 ml-1">Access Level</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {["USER", "ADMIN"].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setEditRole(r)}
                                            className={cn(
                                                "px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2",
                                                editRole === r
                                                    ? "border-red-500 bg-red-50 text-red-600 shadow-md shadow-red-500/10"
                                                    : "border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-neutral-200"
                                            )}
                                        >
                                            {r === "ADMIN" ? <IconShieldCheck size={18} /> : <IconUser size={18} />}
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-neutral-700 ml-1">
                                    New Password <span className="text-neutral-400 font-normal">(leave blank to keep)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                />
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold rounded-2xl shadow-xl shadow-red-500/30 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <IconLoader2 className="animate-spin" /> : <IconDeviceFloppy />}
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>

                    {/* Page Access */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[2rem] border border-neutral-200 p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                <IconKey size={22} />
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900">Page Access</h2>
                        </div>

                        <p className="text-sm text-neutral-500 mb-4">
                            Control which pages this user can access. Unchecked pages will show "Access Denied".
                        </p>

                        <div className="space-y-3">
                            {ALL_PAGES.map((page) => {
                                const isChecked = editPageAccess.includes(page.id);
                                const Icon = page.icon;
                                const isAdminOnly = page.id === "admin";

                                return (
                                    <label
                                        key={page.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                            isChecked
                                                ? "border-green-500 bg-green-50"
                                                : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => togglePageAccess(page.id)}
                                            className="sr-only"
                                        />
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            isChecked ? "bg-green-100 text-green-600" : "bg-neutral-100 text-neutral-400"
                                        )}>
                                            <Icon size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-bold", isChecked ? "text-neutral-900" : "text-neutral-500")}>
                                                    {page.label}
                                                </span>
                                                {isAdminOnly && (
                                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                                                        Admin Only
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-400 mt-0.5">{page.description}</p>
                                        </div>
                                        <div className={cn(
                                            "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                                            isChecked ? "bg-green-500 text-white" : "bg-neutral-200"
                                        )}>
                                            {isChecked && <IconCheck size={16} />}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2rem] border border-red-200 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                            <IconTrash size={22} />
                        </div>
                        <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4">
                        Permanently delete this user account. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-3 border-2 border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors"
                    >
                        Delete User Account
                    </button>
                </motion.div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <IconTrash size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">Delete User</h3>
                        </div>
                        <p className="text-neutral-500 mb-6">
                            Are you sure you want to delete <strong className="text-neutral-900">{user?.username}</strong>? This action is permanent.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl font-bold transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {deleting && <IconLoader2 className="animate-spin" size={18} />}
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
