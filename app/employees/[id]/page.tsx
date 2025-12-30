"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    User,
    Briefcase,
    Calendar,
    Save,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Check,
    X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { cn } from "@/lib/utils";

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    attendanceStats: {
        present: number;
        workingDays: number;
    };
}

interface AttendanceData {
    month: string;
    attendanceMap: Record<string, { day: boolean; night: boolean; id: string; createdAt: string }>;
    summary: {
        present: number;
        absent: number;
        workingDays: number;
    };
}

const onroleRoles = ["Supervisor", "Manager", "Assistant Manager", "Senior Associate", "Associate"];
const offroleRoles = ["Painter", "Fitter", "Electrician", "Helper"];

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [attendance, setAttendance] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Return navigation parameters
    const returnDate = searchParams.get('returnDate');
    const returnShift = searchParams.get('returnShift');
    const fromPage = searchParams.get('from');

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editType, setEditType] = useState<"onrole" | "offrole">("offrole");

    // Month navigation
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Return to attendance page with preserved state
    const handleReturnToAttendance = () => {
        const params = new URLSearchParams();
        if (returnDate) params.set('date', returnDate);
        if (returnShift) params.set('shift', returnShift);
        
        const url = `/employee-attendance${params.toString() ? `?${params.toString()}` : ''}`;
        router.push(url);
    };

    useEffect(() => {
        fetchEmployee();
    }, [id, selectedMonth]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch employee details
            const empRes = await fetch(`/api/employees/${id}?month=${selectedMonth}`);
            if (!empRes.ok) {
                if (empRes.status === 404) {
                    setError("Employee not found");
                    return;
                }
                throw new Error("Failed to fetch employee");
            }
            const empData = await empRes.json();
            setEmployee(empData);

            // Set edit form values
            setEditName(empData.name);
            setEditRole(empData.role);
            setEditType(empData.isActive ? "onrole" : "offrole");

            // Fetch attendance
            const attRes = await fetch(`/api/employees/${id}/attendance?month=${selectedMonth}`);
            if (attRes.ok) {
                const attData = await attRes.json();
                setAttendance(attData);
            }
        } catch (err) {
            console.error("Error fetching employee:", err);
            setError("Failed to load employee data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            setError("Name cannot be empty");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccessMessage("");

            const res = await fetch(`/api/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    role: editRole,
                    isActive: editType === "onrole",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to update employee");
                return;
            }

            setEmployee((prev) => prev ? { ...prev, ...data } : null);
            setSuccessMessage("Profile updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error updating employee:", err);
            setError("Failed to update employee");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const res = await fetch(`/api/employees/${id}?hard=true`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to delete employee");
                return;
            }

            router.push("/employees");
        } catch (err) {
            console.error("Error deleting employee:", err);
            setError("Failed to delete employee");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const navigateMonth = (direction: "prev" | "next") => {
        const [year, month] = selectedMonth.split("-").map(Number);
        let newYear = year;
        let newMonth = month + (direction === "next" ? 1 : -1);

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
    };

    const getRoleOptions = () => {
        return editType === "onrole" ? onroleRoles : offroleRoles;
    };

    // Reset role when type changes if current role is not valid
    useEffect(() => {
        const validRoles = editType === "onrole" ? onroleRoles : offroleRoles;
        if (!validRoles.includes(editRole) && employee) {
            setEditRole(validRoles[0]);
        }
    }, [editType]);

    if (loading) {
        return (
            <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
                <AppSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E01E1F] mx-auto" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading employee...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !employee) {
        return (
            <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
                <AppSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <p className="mt-4 text-gray-900 dark:text-white font-bold text-lg">{error}</p>
                        <button
                            onClick={() => router.push("/employees")}
                            className="mt-4 px-4 py-2 bg-[#E01E1F] text-white rounded-lg font-medium hover:bg-[#C01818] transition-colors"
                        >
                            Back to Employees
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <AppSidebar />

            <main className="flex-1 overflow-y-auto relative">
                <AppHeader />
                <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
                        {fromPage === 'attendance' ? (
                            <>
                                <button
                                    onClick={handleReturnToAttendance}
                                    className="text-gray-600 dark:text-gray-400 hover:text-[#DE1C1C] dark:hover:text-[#FEA519] transition-colors font-medium"
                                    aria-label="Return to attendance page"
                                >
                                    Attendance Summary
                                </button>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-900 dark:text-white font-medium">{employee?.name}</span>
                                {returnDate && returnShift && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                        {returnDate} • {returnShift} Shift
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push("/employees")}
                                    className="text-gray-600 dark:text-gray-400 hover:text-[#DE1C1C] dark:hover:text-[#FEA519] transition-colors font-medium"
                                    aria-label="Return to employee directory"
                                >
                                    Employee Directory
                                </button>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-900 dark:text-white font-medium">{employee?.name}</span>
                            </>
                        )}
                    </nav>
                    
                    {/* Back Button */}
                    <button
                        onClick={fromPage === 'attendance' ? handleReturnToAttendance : () => router.push("/employees")}
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                        aria-label={fromPage === 'attendance' ? 'Return to attendance summary' : 'Back to employee directory'}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">
                            {fromPage === 'attendance' ? 'Back to Attendance Summary' : 'Back to Employee Directory'}
                        </span>
                    </button>

                    {/* Header Card */}
                    <div className="relative mb-6 p-[1px] rounded-2xl overflow-hidden" style={{ background: "linear-gradient(to right, rgba(224, 30, 31, 0.7), rgba(254, 165, 25, 0.7))" }}>
                        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-red-500/20">
                                    {employee?.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{employee?.employeeId}</p>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{employee?.name}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                            employee?.isActive
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                        )}>
                                            {employee?.isActive ? "Onrole" : "Offrole"}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{employee?.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            <button onClick={() => setError("")} className="ml-auto">
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Edit Profile */}
                        <div className="space-y-6">
                            {/* Edit Profile Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-[#E01E1F]" />
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Name
                                        </label>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Employee Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Employee Type
                                        </label>
                                        <div className="flex gap-3">
                                            <label className={cn(
                                                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all",
                                                editType === "onrole"
                                                    ? "border-[#E01E1F] bg-red-50 dark:bg-red-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                            )}>
                                                <input
                                                    type="radio"
                                                    name="editType"
                                                    checked={editType === "onrole"}
                                                    onChange={() => setEditType("onrole")}
                                                    className="sr-only"
                                                />
                                                <span className={cn("text-sm font-medium", editType === "onrole" ? "text-[#E01E1F]" : "text-gray-600 dark:text-gray-400")}>
                                                    Onrole
                                                </span>
                                            </label>
                                            <label className={cn(
                                                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all",
                                                editType === "offrole"
                                                    ? "border-[#FEA519] bg-orange-50 dark:bg-orange-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                            )}>
                                                <input
                                                    type="radio"
                                                    name="editType"
                                                    checked={editType === "offrole"}
                                                    onChange={() => setEditType("offrole")}
                                                    className="sr-only"
                                                />
                                                <span className={cn("text-sm font-medium", editType === "offrole" ? "text-[#FEA519]" : "text-gray-600 dark:text-gray-400")}>
                                                    Offrole
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={editRole}
                                            onChange={(e) => setEditRole(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            disabled={saving}
                                        >
                                            {getRoleOptions().map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl transition-all disabled:opacity-70"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6">
                                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Permanently delete this employee and all associated records.
                                </p>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Employee
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Attendance */}
                        <div className="space-y-6">
                            {/* Attendance Summary */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-[#E01E1F]" />
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attendance</h2>
                                    </div>

                                    {/* Month Navigation */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigateMonth("prev")}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                                            {new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                        </span>
                                        <button
                                            onClick={() => navigateMonth("next")}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                {attendance && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-center">
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {attendance.summary.present}
                                            </div>
                                            <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Present</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-center">
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {attendance.summary.absent}
                                            </div>
                                            <div className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">Absent</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-center">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {attendance.summary.workingDays}
                                            </div>
                                            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Working Days</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Calendar */}
                            {attendance && (
                                <AttendanceCalendar
                                    month={selectedMonth}
                                    attendanceMap={attendance.attendanceMap}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Employee</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete <strong>{employee?.name}</strong>? This action cannot be undone and will remove all associated attendance records.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-70"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
