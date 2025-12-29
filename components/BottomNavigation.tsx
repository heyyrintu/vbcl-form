"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import {
    IconBrandTabler,
    IconSettings,
    IconUserBolt,
    IconTable,
    IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    accessKey: string;
    icon: React.ReactNode;
}

export default function BottomNavigation() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isAdmin = session?.user?.role === "ADMIN";
    const pageAccess = session?.user?.pageAccess || [];

    // Define all available navigation items with their access key
    // Settings is placed before Admin to ensure it always appears in the 5-item limit
    const allNavItems: NavItem[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            accessKey: "dashboard",
            icon: <IconBrandTabler className="w-5 h-5" />,
        },
        {
            label: "Entries",
            href: "/all-entries",
            accessKey: "all-entries",
            icon: <IconTable className="w-5 h-5" />,
        },
        {
            label: "Employees",
            href: "/employees",
            accessKey: "employees",
            icon: <IconUsers className="w-5 h-5" />,
        },
        {
            label: "Attendance",
            href: "/employee-attendance",
            accessKey: "employee-attendance",
            icon: <IconUserBolt className="w-5 h-5" />,
        },
        {
            label: "Settings",
            href: "/settings",
            accessKey: "settings",
            icon: <IconSettings className="w-5 h-5" />,
        },
    ];

    // Filter items based on page access (admins see all, settings always visible)
    const navItems = allNavItems.filter((item) => {
        if (isAdmin) return true;
        if (item.accessKey === "settings") return true;
        return pageAccess.includes(item.accessKey);
    });

    // Show exactly 5 items for bottom nav (Dashboard, Entries, Employees, Attendance, Settings)
    const displayItems = navItems.slice(0, 5);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-[100] lg:hidden",
                "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
                "border-t border-gray-200/50 dark:border-gray-700/50",
                "safe-area-bottom"
            )}
            style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            {/* Gradient accent line at top */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                    background:
                        "linear-gradient(to right, rgba(224, 30, 31, 0.8), rgba(254, 165, 25, 0.8))",
                }}
            />

            {/* Glassmorphism background effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-white/60 dark:from-gray-900/90 dark:to-gray-900/60 -z-10" />

            <div className="flex items-center justify-around px-2 py-1">
                {displayItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center",
                                "min-w-[56px] py-2 px-1 rounded-xl",
                                "transition-all duration-300 ease-out",
                                "group"
                            )}
                        >
                            {/* Active Background Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeNavBg"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, rgba(224, 30, 31, 0.15), rgba(254, 165, 25, 0.15))",
                                    }}
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35,
                                    }}
                                />
                            )}

                            {/* Icon Container */}
                            <motion.div
                                className={cn(
                                    "relative z-10 flex items-center justify-center",
                                    "w-10 h-10 rounded-full",
                                    "transition-all duration-300",
                                    isActive
                                        ? "bg-gradient-to-r from-[#E01E1F] to-[#FEA519] shadow-lg shadow-[#E01E1F]/30"
                                        : "group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                                )}
                                whileTap={{ scale: 0.9 }}
                            >
                                <span
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive
                                            ? "text-white"
                                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                                    )}
                                >
                                    {item.icon}
                                </span>
                            </motion.div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-0.5 text-[10px] font-medium leading-tight",
                                    "transition-colors duration-300",
                                    isActive
                                        ? "text-transparent bg-clip-text bg-gradient-to-r from-[#E01E1F] to-[#FEA519] font-semibold"
                                        : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                                {item.label}
                            </span>

                            {/* Active Dot Indicator */}
                            {isActive && (
                                <motion.div
                                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-gradient-to-r from-[#E01E1F] to-[#FEA519]"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
