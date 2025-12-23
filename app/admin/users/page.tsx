"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconUsers,
    IconEdit,
    IconTrash,
    IconEye,
    IconX,
    IconLoader2,
    IconSearch,
    IconShieldCheck,
    IconUser,
    IconRefresh,
    IconKey,
    IconAlertCircle,
    IconDotsVertical,
    IconPlus,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    username: string;
    role: string;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalType, setModalType] = useState<"view" | "edit" | "delete" | "create" | null>(null);
    const [editForm, setEditForm] = useState({ username: "", role: "", password: "" });
    const [createForm, setCreateForm] = useState({ username: "", password: "", role: "USER" });
    const [actionLoading, setActionLoading] = useState(false);
    const [createError, setCreateError] = useState("");

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users");
            if (!res.ok) {
                if (res.status === 403) {
                    setError("Access denied. Admin privileges required.");
                    return;
                }
                throw new Error("Failed to fetch users");
            }
            const data = await res.json();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, []);

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
        fetchUsers();
    }, [session, status, router, fetchUsers]);

    const openModal = (user: User, type: "view" | "edit" | "delete") => {
        setSelectedUser(user);
        setModalType(type);
        if (type === "edit") {
            setEditForm({ username: user.username, role: user.role, password: "" });
        }
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalType(null);
        setEditForm({ username: "", role: "", password: "" });
        setCreateForm({ username: "", password: "", role: "USER" });
        setCreateError("");
    };

    const openCreateModal = () => {
        setModalType("create");
        setCreateForm({ username: "", password: "", role: "USER" });
        setCreateError("");
    };

    const handleCreate = async () => {
        if (!createForm.username.trim()) {
            setCreateError("Username is required");
            return;
        }
        if (!createForm.password || createForm.password.length < 6) {
            setCreateError("Password must be at least 6 characters");
            return;
        }
        setActionLoading(true);
        setCreateError("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create user");
            }
            await fetchUsers();
            closeModal();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : "Failed to create user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: editForm.username || undefined,
                    role: editForm.role || undefined,
                    password: editForm.password || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update user");
            }
            await fetchUsers();
            closeModal();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete user");
            }
            await fetchUsers();
            closeModal();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleString("en-IN", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-red-500/20 animate-pulse" />
                    <IconLoader2 className="h-8 w-8 animate-spin text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-neutral-500 font-medium animate-pulse">Loading secure user data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
                    <IconAlertCircle size={40} className="text-red-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Resticted</h2>
                    <p className="text-neutral-500 max-w-md">{error}</p>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-3 bg-[#E01E1F] text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Return to Safety
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-orange-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center shadow-lg shadow-red-500/20">
                            <IconUsers className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900">
                            User <span className="text-red-600">Control</span>
                        </h1>
                    </div>
                    <p className="text-neutral-500 font-medium ml-1">Administrate system access and user profiles</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find a user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-3 w-64 lg:w-80 rounded-2xl bg-white border border-neutral-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none font-medium shadow-sm"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="p-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-600 transition-all shadow-sm active:scale-95"
                        title="Refresh Data"
                    >
                        <IconRefresh size={22} className={cn(loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] hover:opacity-90 rounded-2xl text-white font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
                    >
                        <IconPlus size={20} />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview (Optional, but looks premium) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    label="Total Users"
                    value={users.length}
                    icon={<IconUsers className="text-blue-500" />}
                    bg="bg-blue-50"
                />
                <StatsCard
                    label="Active Admins"
                    value={users.filter(u => u.role === 'ADMIN').length}
                    icon={<IconShieldCheck className="text-purple-500" />}
                    bg="bg-purple-50"
                />
                <StatsCard
                    label="Recently Active"
                    value={users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).getTime() > Date.now() - 86400000).length}
                    icon={<IconUser className="text-emerald-500" />}
                    bg="bg-emerald-50"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-neutral-200 shadow-xl shadow-neutral-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-wider">Identity</th>
                                <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-wider text-center">Security Role</th>
                                <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-wider">Last Activity</th>
                                <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-wider">Account Age</th>
                                <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredUsers.map((user, idx) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                    className="group hover:bg-red-50/30 transition-all duration-300 cursor-pointer"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-lg group-hover:scale-110 transition-transform">
                                                    {user.username.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
                                                    user.lastLoginAt && new Date(user.lastLoginAt).getTime() > Date.now() - 3600000 ? "bg-emerald-500" : "bg-neutral-300"
                                                )} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-neutral-900 group-hover:text-red-600 transition-colors">{user.username}</div>
                                                <div className="text-xs font-mono text-neutral-400">UID-{user.id.slice(0, 6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold leading-none ring-1 ring-inset",
                                                user.role === "ADMIN"
                                                    ? "bg-purple-50 text-purple-700 ring-purple-600/20"
                                                    : "bg-blue-50 text-blue-700 ring-blue-600/20"
                                            )}>
                                                {user.role === "ADMIN" ? <IconShieldCheck size={14} /> : <IconUser size={14} />}
                                                {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-medium text-neutral-700">{formatDate(user.lastLoginAt)}</div>
                                        {user.lastLoginAt && <div className="text-[10px] text-neutral-400 uppercase tracking-tighter">System Pulse</div>}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-medium text-neutral-700">{formatDate(user.createdAt)}</div>
                                        <div className="text-[10px] text-neutral-400 uppercase tracking-tighter">Onboarding</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionButton
                                                icon={<IconEye size={18} />}
                                                onClick={() => openModal(user, "view")}
                                                color="hover:bg-blue-50 hover:text-blue-600"
                                            />
                                            <ActionButton
                                                icon={<IconEdit size={18} />}
                                                onClick={() => openModal(user, "edit")}
                                                color="hover:bg-amber-50 hover:text-amber-600"
                                            />
                                            <ActionButton
                                                icon={<IconTrash size={18} />}
                                                onClick={() => openModal(user, "delete")}
                                                color="hover:bg-red-50 hover:text-red-600"
                                                disabled={user.id === session?.user?.id}
                                            />
                                        </div>
                                        <div className="group-hover:hidden text-neutral-300 flex justify-end">
                                            <IconDotsVertical size={20} />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="py-20 text-center space-y-3">
                            <div className="inline-flex h-20 w-20 rounded-full bg-neutral-50 items-center justify-center text-neutral-300">
                                <IconSearch size={40} />
                            </div>
                            <p className="text-neutral-500 font-medium">No users found matching your search</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {modalType && (modalType === "create" || selectedUser) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-white"
                        >
                            {/* Modal Header */}
                            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center",
                                        modalType === 'delete' ? 'bg-red-50 text-red-500' : modalType === 'create' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
                                    )}>
                                        {modalType === 'view' && <IconEye size={22} />}
                                        {modalType === 'edit' && <IconEdit size={22} />}
                                        {modalType === 'delete' && <IconTrash size={22} />}
                                        {modalType === 'create' && <IconPlus size={22} />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-neutral-900">
                                        {modalType === "view" && "Profile Identity"}
                                        {modalType === "edit" && "Modify Access"}
                                        {modalType === "delete" && "Terminate Access"}
                                        {modalType === "create" && "Create New User"}
                                    </h2>
                                </div>
                                <button onClick={closeModal} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400">
                                    <IconX size={24} />
                                </button>
                            </div>

                            <div className="px-8 py-6">
                                {modalType === "view" && selectedUser && (
                                    <div className="grid grid-cols-1 gap-6">
                                        <ProfileItem label="Global Username" value={selectedUser.username} icon={<IconUser size={18} />} />
                                        <ProfileItem label="Security Tier" value={selectedUser.role} icon={<IconShieldCheck size={18} />} />
                                        <ProfileItem label="Last Heartbeat" value={formatDate(selectedUser.lastLoginAt)} icon={<IconRefresh size={18} />} />
                                        <ProfileItem label="Created At" value={formatDate(selectedUser.createdAt)} icon={<IconKey size={18} />} />
                                    </div>
                                )}

                                {modalType === "edit" && (
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">Identity Tag</label>
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">Access Level</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['USER', 'ADMIN'].map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setEditForm({ ...editForm, role: r })}
                                                        className={cn(
                                                            "px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2",
                                                            editForm.role === r
                                                                ? "border-red-500 bg-red-50 text-red-600 shadow-md shadow-red-500/10"
                                                                : "border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-neutral-200"
                                                        )}
                                                    >
                                                        {r === 'ADMIN' ? <IconShieldCheck size={18} /> : <IconUser size={18} />}
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">New Credential <span className="text-neutral-400 font-normal">(Leave blank if unchanged)</span></label>
                                            <input
                                                type="password"
                                                value={editForm.password}
                                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={actionLoading}
                                            className="w-full mt-6 py-4 bg-[#E01E1F] hover:bg-[#C01818] text-white font-bold rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {actionLoading ? <IconLoader2 className="animate-spin" /> : <IconShieldCheck />}
                                            Commit Changes
                                        </button>
                                    </div>
                                )}

                                {modalType === "delete" && selectedUser && (
                                    <div className="space-y-8">
                                        <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-3">
                                            <div className="flex items-center gap-3 text-red-600">
                                                <IconAlertCircle size={24} />
                                                <span className="font-bold">Irreversible Action</span>
                                            </div>
                                            <p className="text-red-700/80 font-medium text-sm leading-relaxed">
                                                You are about to permanently delete <strong className="text-red-700 underline underline-offset-4">{selectedUser.username}</strong>. This user will lose all system access immediately.
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={closeModal}
                                                className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl transition-all active:scale-[0.98]"
                                            >
                                                Abort
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={actionLoading}
                                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                {actionLoading && <IconLoader2 className="animate-spin" size={18} />}
                                                Delete User
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modalType === "create" && (
                                    <div className="space-y-5">
                                        {createError && (
                                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                                                <IconAlertCircle size={18} />
                                                {createError}
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">Username</label>
                                            <input
                                                type="text"
                                                value={createForm.username}
                                                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">Password <span className="text-neutral-400 font-normal">(min 6 chars)</span></label>
                                            <input
                                                type="password"
                                                value={createForm.password}
                                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-neutral-700 ml-1">Access Level</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['USER', 'ADMIN'].map((r) => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setCreateForm({ ...createForm, role: r })}
                                                        className={cn(
                                                            "px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2",
                                                            createForm.role === r
                                                                ? "border-red-500 bg-red-50 text-red-600 shadow-md shadow-red-500/10"
                                                                : "border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-neutral-200"
                                                        )}
                                                    >
                                                        {r === 'ADMIN' ? <IconShieldCheck size={18} /> : <IconUser size={18} />}
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            disabled={actionLoading}
                                            className="w-full mt-6 py-4 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] hover:opacity-90 text-white font-bold rounded-2xl shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {actionLoading ? <IconLoader2 className="animate-spin" /> : <IconPlus />}
                                            Create User
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatsCard({ label, value, icon, bg }: { label: string; value: number | string; icon: React.ReactNode, bg: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", bg)}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-neutral-900 leading-none">{value}</div>
                <div className="text-sm font-bold text-neutral-400 mt-1 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function ActionButton({ icon, onClick, color, disabled }: { icon: React.ReactNode, onClick: () => void, color: string, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90",
                color
            )}
        >
            {icon}
        </button>
    );
}

function ProfileItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="text-neutral-400 mt-1">{icon}</div>
            <div className="space-y-1">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{label}</div>
                <div className="text-neutral-900 font-bold">{value}</div>
            </div>
        </div>
    );
}
