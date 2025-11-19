"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconTable,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const pathname = usePathname();
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "All Entries",
      href: "/all-entries",
      icon: (
        <IconTable className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0" />
      ),
      onClick: () => signOut({ callbackUrl: "/login" }),
    },
  ];

  const [open, setOpen] = useState(false);

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
                onClick={link.onClick}
                isActive={pathname === link.href}
              />
            ))}
          </div>
        </div>
        <div>
          <SidebarLink
            link={{
              label: "VBCL Alwar",
              href: "#",
              icon: (
                <img
                  src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
                  alt="VBCL Alwar"
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ),
            }}
            isActive={false}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

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

