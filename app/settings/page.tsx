"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    IconSettings,
    IconKey,
    IconDownload,
    IconMoon,
    IconSun,
    IconLoader2,
    IconCheck,
    IconAlertCircle,
    IconUser,
    IconDatabase,
    IconUsers,
    IconCalendar,
    IconClipboardList,
    IconInfoCircle,
    IconDeviceMobile,
    IconCircleCheck,
    IconLogout,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";

// Type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Theme state
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Export state
    const [exportLoading, setExportLoading] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState("");

    // PWA Install state
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/login");
        }
    }, [session, status, router]);

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        }
    }, []);

    // PWA Install prompt detection
    useEffect(() => {
        // Detect iOS device
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(iOS);

        // Check if already installed
        const checkInstalled = () => {
            if (window.matchMedia("(display-mode: standalone)").matches) {
                setIsPWAInstalled(true);
            }
            // Also check iOS standalone mode
            if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) {
                setIsPWAInstalled(true);
            }
        };
        checkInstalled();

        // Check if prompt was already captured globally (by ServiceWorkerRegistration)
        const globalPrompt = (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
        if (globalPrompt) {
            setInstallPrompt(globalPrompt);
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            // Also store globally for other components
            (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt = e as BeforeInstallPromptEvent;
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsPWAInstalled(true);
            setInstallPrompt(null);
            // Clear global prompt
            (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt = undefined;
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            setPasswordError("Please fill in all fields");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        try {
            const res = await fetch("/api/settings/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPasswordError(data.error || "Failed to change password");
                return;
            }

            setPasswordSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(""), 3000);
        } catch {
            setPasswordError("Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleExport = async (type: "records" | "employees" | "attendance") => {
        setExportLoading(type);
        setExportSuccess("");

        try {
            const res = await fetch(`/api/settings/export?type=${type}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            // Convert to CSV
            const csvContent = convertToCSV(data.data);
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${type}_export_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportSuccess(`${type} exported successfully! (${data.count} records)`);
            setTimeout(() => setExportSuccess(""), 3000);
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleInstallApp = async () => {
        if (!installPrompt) return;

        setIsInstalling(true);
        try {
            await installPrompt.prompt();
            const choiceResult = await installPrompt.userChoice;
            if (choiceResult.outcome === "accepted") {
                setIsPWAInstalled(true);
            }
            setInstallPrompt(null);
        } catch (error) {
            console.error("Install error:", error);
        } finally {
            setIsInstalling(false);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login", redirect: true });
    };

    const convertToCSV = (data: Record<string, unknown>[]) => {
        if (data.length === 0) return "";
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(","),
            ...data.map((row) =>
                headers.map((header) => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const strValue = String(value ?? "");
                    if (strValue.includes(",") || strValue.includes('"')) {
                        return `"${strValue.replace(/"/g, '""')}"`;
                    }
                    return strValue;
                }).join(",")
            ),
        ];
        return csvRows.join("\n");
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <IconLoader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300")}>
            <AppHeader />
            
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-y-auto relative z-10">
                {/* 
              Fixed decorative background
              - Positioned using CSS background-position for precise alignment
              - Remains fixed while content scrolls (see .app-fixed-bg)
              - Viewport-relative sizing ensures responsive composition
            */}
                <div className="app-fixed-bg" aria-hidden="true" />

                <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-10">
                    {/* Mobile Profile Section with Logout */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 shadow-sm"
                    >
                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-red-500/20 flex-shrink-0">
                                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white truncate">
                                        {session?.user?.name || "User"}
                                    </div>
                                    <div className={cn(
                                        "text-xs sm:text-sm font-medium capitalize",
                                        session?.user?.role === "ADMIN" ? "text-purple-500" : "text-neutral-500 dark:text-neutral-400"
                                    )}>
                                        {session?.user?.role?.toLowerCase() || "user"}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full xs:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800 font-medium flex-shrink-0"
                            >
                                <IconLogout size={18} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4"
                    >
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center shadow-lg shadow-red-500/20">
                            <IconSettings className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Settings</h1>
                            <p className="text-neutral-500 dark:text-neutral-400">Manage your account and app preferences</p>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Change Password */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                                    <IconKey size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Change Password</h2>
                            </div>

                            {passwordError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <IconAlertCircle size={18} />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                                    <IconCheck size={18} />
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={passwordLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {passwordLoading ? <IconLoader2 className="animate-spin" size={20} /> : <IconKey size={20} />}
                                    {passwordLoading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </motion.div>

                        {/* Theme Toggle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
                                    {theme === "light" ? <IconSun size={22} /> : <IconMoon size={22} />}
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Appearance</h2>
                            </div>

                            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                                Choose your preferred color scheme for the application.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => theme === "dark" && toggleTheme()}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                        theme === "light"
                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                            : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300"
                                    )}
                                >
                                    <div className="h-16 w-16 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                                        <IconSun size={28} className="text-amber-500" />
                                    </div>
                                    <span className={cn("font-bold", theme === "light" ? "text-red-600" : "text-neutral-500 dark:text-neutral-400")}>
                                        Light
                                    </span>
                                </button>

                                <button
                                    onClick={() => theme === "light" && toggleTheme()}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                        theme === "dark"
                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                            : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300"
                                    )}
                                >
                                    <div className="h-16 w-16 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-sm">
                                        <IconMoon size={28} className="text-indigo-400" />
                                    </div>
                                    <span className={cn("font-bold", theme === "dark" ? "text-red-600" : "text-neutral-500 dark:text-neutral-400")}>
                                        Dark
                                    </span>
                                </button>
                            </div>

                            {/* Account Info */}
                            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-600 dark:to-neutral-700 flex items-center justify-center">
                                        <IconUser size={20} className="text-neutral-600 dark:text-neutral-300" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-neutral-900 dark:text-white">{session?.user?.name}</div>
                                        <div className={cn(
                                            "text-xs font-medium",
                                            session?.user?.role === "ADMIN" ? "text-purple-500" : "text-neutral-500"
                                        )}>
                                            {session?.user?.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Export Data */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm lg:col-span-2"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                                    <IconDownload size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Export Data</h2>
                            </div>

                            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                                Download your data as CSV files for backup or analysis.
                            </p>

                            {exportSuccess && (
                                <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                                    <IconCheck size={18} />
                                    {exportSuccess}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ExportCard
                                    title="Vehicle Records"
                                    description="All vehicle entries and details"
                                    icon={<IconClipboardList size={24} />}
                                    onClick={() => handleExport("records")}
                                    loading={exportLoading === "records"}
                                />
                                <ExportCard
                                    title="Employees"
                                    description="All employee data"
                                    icon={<IconUsers size={24} />}
                                    onClick={() => handleExport("employees")}
                                    loading={exportLoading === "employees"}
                                />
                                <ExportCard
                                    title="Attendance"
                                    description="Attendance records"
                                    icon={<IconCalendar size={24} />}
                                    onClick={() => handleExport("attendance")}
                                    loading={exportLoading === "attendance"}
                                />
                            </div>
                        </motion.div>

                        {/* System Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm lg:col-span-2"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                                    <IconInfoCircle size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">System Information</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <InfoCard label="App Version" value="1.0.0" />
                                <InfoCard label="Database" value="PostgreSQL" />
                                <InfoCard label="Framework" value="Next.js 16" />
                                <InfoCard label="Status" value="Online" status="success" />
                            </div>
                        </motion.div>

                        {/* Download App */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm lg:col-span-2"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#E01E1F]/20 to-[#FEA519]/20 flex items-center justify-center text-[#E01E1F]">
                                    <IconDeviceMobile size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Download App</h2>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                {/* App Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center shadow-lg shadow-red-500/20">
                                        <IconSettings className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900 dark:text-white text-lg">VBCL Tracker</h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Install for faster access & offline support</p>
                                    </div>
                                </div>

                                {/* Install Button */}
                                <div className="w-full sm:w-auto">
                                    {isPWAInstalled ? (
                                        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 font-semibold">
                                            <IconCircleCheck size={20} />
                                            App Installed
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={installPrompt ? handleInstallApp : () => {
                                                    if (isIOS) {
                                                        alert("📱 Install on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to confirm");
                                                    } else {
                                                        alert("📱 Install this app:\n\n• Android Chrome: Tap the menu (⋮) → 'Add to Home screen' or 'Install app'\n\n• Desktop Chrome/Edge: Click the install icon in the address bar\n\n• Firefox: Menu → 'Install'");
                                                    }
                                                }}
                                                disabled={isInstalling}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                                            >
                                                {isInstalling ? (
                                                    <IconLoader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <IconDownload size={20} />
                                                )}
                                                {isInstalling ? "Installing..." : "Install App"}
                                            </button>
                                            {!installPrompt && (
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center sm:text-left">
                                                    {isIOS ? "Tap for iOS installation steps" : "Tap for installation steps"}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-neutral-600 dark:text-neutral-400">Offline access</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="text-neutral-600 dark:text-neutral-400">Faster loading</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                                        <span className="text-neutral-600 dark:text-neutral-400">Push notifications</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                                        <span className="text-neutral-600 dark:text-neutral-400">Full screen</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
}

function ExportCard({ title, description, icon, onClick, loading }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    loading: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all text-left group disabled:opacity-50"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-red-500 transition-colors">
                    {loading ? <IconLoader2 className="animate-spin" size={20} /> : icon}
                </div>
                <IconDownload size={18} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
            </div>
            <div className="font-bold text-neutral-900 dark:text-white">{title}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{description}</div>
        </button>
    );
}

function InfoCard({ label, value, status }: { label: string; value: string; status?: "success" | "warning" | "error" }) {
    return (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
            <div className="flex items-center gap-2">
                {status && (
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        status === "success" && "bg-green-500",
                        status === "warning" && "bg-amber-500",
                        status === "error" && "bg-red-500"
                    )} />
                )}
                <span className="font-bold text-neutral-900 dark:text-white">{value}</span>
            </div>
        </div>
    );
}
