"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import {
    IconHome,
    IconSettings,
    IconCalendarCheck,
    IconFileText,
    IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    accessKey: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
}

export default function BottomNavigation() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isAdmin = session?.user?.role === "ADMIN";
    const pageAccess = session?.user?.pageAccess || [];

    // Define all available navigation items with their access key
    const allNavItems: NavItem[] = [
        {
            label: "Home",
            href: "/dashboard",
            accessKey: "dashboard",
            icon: <IconHome className="w-6 h-6" stroke={1.5} />,
            activeIcon: <IconHome className="w-6 h-6" stroke={2} />,
        },
        {
            label: "Vehicles",
            href: "/all-entries",
            accessKey: "all-entries",
            icon: <IconFileText className="w-6 h-6" stroke={1.5} />,
            activeIcon: <IconFileText className="w-6 h-6" stroke={2} />,
        },
        {
            label: "Directory",
            href: "/employees",
            accessKey: "employees",
            icon: <IconUsers className="w-6 h-6" stroke={1.5} />,
            activeIcon: <IconUsers className="w-6 h-6" stroke={2} />,
        },
        {
            label: "Attendance",
            href: "/employee-attendance",
            accessKey: "employee-attendance",
            icon: <IconCalendarCheck className="w-6 h-6" stroke={1.5} />,
            activeIcon: <IconCalendarCheck className="w-6 h-6" stroke={2} />,
        },
        {
            label: "Settings",
            href: "/settings",
            accessKey: "settings",
            icon: <IconSettings className="w-6 h-6" stroke={1.5} />,
            activeIcon: <IconSettings className="w-6 h-6" stroke={2} />,
        },
    ];

    // Filter items based on page access (admins see all, settings always visible)
    const navItems = allNavItems.filter((item) => {
        if (isAdmin) return true;
        if (item.accessKey === "settings") return true;
        return pageAccess.includes(item.accessKey);
    });

    // Show exactly 5 items for bottom nav
    const displayItems = navItems.slice(0, 5);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-[100] lg:hidden",
                "px-4 pb-2",
                "safe-area-bottom"
            )}
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 8px)",
            }}
        >
            {/* Floating Glass Container */}
            <div
                className={cn(
                    "relative mx-auto max-w-md overflow-hidden",
                    "bg-white/70 dark:bg-gray-900/70",
                    "backdrop-blur-xl backdrop-saturate-150",
                    "rounded-2xl",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
                    "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                    "border border-white/20 dark:border-white/10"
                )}
            >
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/5 pointer-events-none" />

                {/* Subtle gradient accent at top */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] rounded-full"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(224, 30, 31, 0.5), rgba(254, 165, 25, 0.5), transparent)"
                    }}
                />

                <div className="flex items-center justify-around px-2 py-2">
                    {displayItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center",
                                    "w-14 py-1.5",
                                    "transition-all duration-200 ease-out",
                                    "group"
                                )}
                            >
                                {/* Active Pill Background */}
                                {isActive && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute inset-x-1 top-0 h-full rounded-xl bg-gradient-to-br from-[#E01E1F]/10 to-[#FEA519]/10"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    className="relative z-10"
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ duration: 0.1 }}
                                >
                                    <span
                                        className={cn(
                                            "transition-all duration-200",
                                            isActive
                                                ? "text-[#E01E1F]"
                                                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                        )}
                                    >
                                        {isActive ? item.activeIcon : item.icon}
                                    </span>
                                </motion.div>

                                {/* Label */}
                                <motion.span
                                    className={cn(
                                        "mt-0.5 text-[10px] font-medium",
                                        "transition-all duration-200",
                                        isActive
                                            ? "text-[#E01E1F] font-semibold"
                                            : "text-gray-400 dark:text-gray-500"
                                    )}
                                    animate={{
                                        opacity: isActive ? 1 : 0.8,
                                    }}
                                >
                                    {item.label}
                                </motion.span>

                                {/* Active Dot */}
                                {isActive && (
                                    <motion.div
                                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#E01E1F]"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 25,
                                            delay: 0.05,
                                        }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
