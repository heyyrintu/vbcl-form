"use client";

import EmployeeTable from "@/components/EmployeeTable";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300")}>
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {/* Subtle Grid Pattern Overlay */}
          <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
            {/* Employee Table */}
            <div className="relative z-10 pb-20 md:pb-0">
              <EmployeeTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

