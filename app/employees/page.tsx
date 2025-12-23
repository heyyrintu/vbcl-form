"use client";

import EmployeeTable from "@/components/EmployeeTable";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className={cn("flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300")}>
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Subtle Grid Pattern Overlay */}
        <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
          {/* Hero Section */}
          <div className="relative mb-8 sm:mb-10 p-[1px] rounded-3xl overflow-hidden group" style={{ background: 'linear-gradient(to right, rgba(224, 30, 31, 0.7), rgba(254, 165, 25, 0.7))' }}>
            <div className="relative h-full w-full rounded-3xl overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-lg rounded-3xl transition-all duration-500 group-hover:shadow-2xl group-hover:bg-white/50 dark:group-hover:bg-gray-900/50" />

            {/* Decorative Gradient Blobs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-60 animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl opacity-60 animate-pulse delay-1000" />

              <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <Users className="w-3 h-3" />
                  Employee Management
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                  All <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Employees</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
                  View and manage all employees with their roles, IDs, and assignment history.
                </p>
              </div>
              </div>
            </div>
          </div>

          {/* Employee Table */}
          <div className="relative z-10 pb-20 md:pb-0">
            <EmployeeTable />
          </div>
        </div>
      </main>
    </div>
  );
}

