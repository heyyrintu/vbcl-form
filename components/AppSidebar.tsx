"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import {
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconTable,
  IconUsers,
  IconLogout,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";
  const pageAccess = session?.user?.pageAccess || [];

  // Define all available links with their access key
  const allLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      accessKey: "dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "All Entries",
      href: "/all-entries",
      accessKey: "all-entries",
      icon: (
        <IconTable className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "All Employees",
      href: "/employees",
      accessKey: "employees",
      icon: (
        <IconUsers className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Employee Attendance",
      href: "/employee-attendance",
      accessKey: "employee-attendance",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0" />
      ),
    },
    // Admin-only link
    ...(isAdmin ? [{
      label: "Admin Users",
      href: "/admin/users",
      accessKey: "admin",
      icon: (
        <IconShieldCheck className="h-5 w-5 shrink-0" />
      ),
    }] : []),
    {
      label: "Settings",
      href: "/settings",
      accessKey: "settings", // Always visible
      icon: (
        <IconSettings className="h-5 w-5 shrink-0" />
      ),
    },
  ];

  // Filter links based on page access (admins see all, settings always visible)
  const links = allLinks.filter((link) => {
    if (isAdmin) return true; // Admins see all links
    if (link.accessKey === "settings") return true; // Settings always visible
    return pageAccess.includes(link.accessKey);
  });

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                isActive={pathname === link.href}
              />
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
          <UserProfile
            name={session?.user?.name || session?.user?.email || "User"}
            role={session?.user?.role || "USER"}
            image={session?.user?.image}
            onLogout={handleLogout}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const UserProfile = ({ name, role, image, onLogout }: { name: string; role: string; image?: string | null; onLogout: () => void }) => {
  const { open, animate } = useSidebar();

  return (
    <div className={cn(
      "flex items-center gap-2 group/sidebar py-2 rounded-lg transition-all duration-300",
      open ? "px-2" : "justify-start px-2"
    )}>
      <div className="shrink-0 relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-8 w-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border border-neutral-300 dark:border-neutral-600">
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex flex-1 flex-col overflow-hidden items-start justify-center ml-1"
      >
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate w-full text-ellipsis">
          {name}
        </span>
        <span className={cn(
          "text-[10px] truncate w-full",
          role === "ADMIN" ? "text-purple-500" : "text-neutral-500"
        )}>
          {role}
        </span>
      </motion.div>

      <motion.button
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        onClick={onLogout}
        className="ml-auto p-1.5 rounded-md hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors"
        title="Logout"
      >
        <IconLogout size={18} />
      </motion.button>
    </div>
  );
};

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-3 py-2 text-sm font-normal"
    >
      <img
        src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
        alt="VBCL Alwar Logo"
        className="h-12 w-12 shrink-0 object-contain"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-neutral-700 dark:text-neutral-200"
      >
        VBCL Alwar
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center justify-center py-2 text-sm font-normal"
    >
      <img
        src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
        alt="VBCL Alwar Logo"
        className="h-12 w-12 shrink-0 object-contain"
      />
    </Link>
  );
};
