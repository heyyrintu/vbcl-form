"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const routeTitles: Record<string, string> = {
  "/": "Home",
  "/dashboard": "VBCL Alwar Dashboard",
  "/all-entries": "All Entries",
  "/employees": "All Employees",
  "/employee-attendance": "Employee Attendance",
  "/admin/users": "Admin Users",
  "/settings": "Settings",
  "/login": "Login",
  "/register": "Register",
};

const routeSubtitles: Record<string, string> = {
  "/all-entries": "Monitor production flow, track vehicle status, and manage daily entries with ease.",
};

export default function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "VBCL Tracker";

  return (
    <div
      className={cn(
        "py-3 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur-md relative",
        className
      )}
      style={{
        background:
          "linear-gradient(to right, rgba(224, 30, 31, 0.2), rgba(254, 165, 25, 0.2))",
      }}
    >
      <div className="flex items-center justify-between md:justify-start md:gap-6 relative max-w-full">
        {/* Logo - Always visible */}
        <div className="flex-shrink-0">
          <Image
            src="https://cdn.dribbble.com/userupload/46214984/file/75afac5029c85450d04825f19761f18e.png?resize=752x265&vertical=center"
            alt="VBCL Logo"
            width={100}
            height={35}
            className="h-6 sm:h-8 md:h-10 w-auto object-contain"
            priority
          />
        </div>
        
        {/* Title - Responsive positioning */}
        <div className="flex-1 flex justify-center md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
          <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-600 drop-shadow-sm text-center px-2">
            <span className="hidden sm:inline">{title}</span>
            <span className="sm:hidden">
              {title.length > 20 ? title.split(' ')[0] : title}
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}
