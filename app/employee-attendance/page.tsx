"use client";

import { useCallback, useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  Clock,
  Save,
  CheckSquare,
  Square,
  Search,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

// Role configuration for styling and grouping
const ROLE_CONFIG: Record<string, { color: string; bgColor: string; order: number }> = {
  "Supervisor": { color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30", order: 1 },
  "Manager": { color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", order: 2 },
  "Assistant Manager": { color: "text-indigo-700 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", order: 3 },
  "Senior Associate": { color: "text-cyan-700 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", order: 4 },
  "Associate": { color: "text-teal-700 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30", order: 5 },
  "Electrician": { color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", order: 6 },
  "Fitter": { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30", order: 7 },
  "Painter": { color: "text-pink-700 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/30", order: 8 },
  "Helper": { color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-700/30", order: 9 },
};

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto relative z-10 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-gray-600 dark:text-gray-400 text-lg">Loading...</span>
        </div>
      </main>
    </div>
  );
}

// Main page wrapper with Suspense
export default function EmployeeAttendancePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmployeeAttendanceContent />
    </Suspense>
  );
}

// Inner component that uses useSearchParams
function EmployeeAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Date and Shift state
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? dayjs(dateParam) : dayjs();
  });
  const [selectedShift, setSelectedShift] = useState<"Day" | "Night">(() => {
    const shiftParam = searchParams.get("shift");
    return (shiftParam === "Night" ? "Night" : "Day") as "Day" | "Night";
  });

  // Employee data
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Loading states
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all employees
  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setAllEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Fetch existing attendance for date/shift
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;

    setLoadingAttendance(true);
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const response = await fetch(
        `/api/employee-attendance?date=${dateStr}&shift=${selectedShift}`
      );

      if (response.ok) {
        const data = await response.json();
        const presentIds = new Set<string>(
          data.map((record: { employee: { id: string } }) => record.employee.id)
        );
        setSelectedEmployeeIds(presentIds);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedDate, selectedShift]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (allEmployees.length > 0) {
      fetchAttendance();
    }
  }, [fetchAttendance, allEmployees.length]);

  // Filter and group employees
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || emp.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [allEmployees, searchTerm, roleFilter]);

  // Group employees by role
  const groupedEmployees = useMemo(() => {
    const groups: Record<string, Employee[]> = {};
    filteredEmployees.forEach((emp) => {
      if (!groups[emp.role]) {
        groups[emp.role] = [];
      }
      groups[emp.role].push(emp);
    });

    // Sort roles by configured order
    return Object.entries(groups).sort(([roleA], [roleB]) => {
      const orderA = ROLE_CONFIG[roleA]?.order ?? 99;
      const orderB = ROLE_CONFIG[roleB]?.order ?? 99;
      return orderA - orderB;
    });
  }, [filteredEmployees]);

  // Get unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    return [...new Set(allEmployees.map((emp) => emp.role))].sort((a, b) => {
      const orderA = ROLE_CONFIG[a]?.order ?? 99;
      const orderB = ROLE_CONFIG[b]?.order ?? 99;
      return orderA - orderB;
    });
  }, [allEmployees]);

  // Check if all filtered employees are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredEmployees.length === 0) return false;
    return filteredEmployees.every((emp) => selectedEmployeeIds.has(emp.id));
  }, [filteredEmployees, selectedEmployeeIds]);

  // Check if no filtered employees are selected
  const noneFilteredSelected = useMemo(() => {
    return filteredEmployees.every((emp) => !selectedEmployeeIds.has(emp.id));
  }, [filteredEmployees, selectedEmployeeIds]);

  // Toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  // Select all visible employees
  const selectAll = () => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      filteredEmployees.forEach((emp) => newSet.add(emp.id));
      return newSet;
    });
    setHasChanges(true);
  };

  // Deselect all visible employees
  const deselectAll = () => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      filteredEmployees.forEach((emp) => newSet.delete(emp.id));
      return newSet;
    });
    setHasChanges(true);
  };

  // Select all employees in a specific role
  const selectRole = (role: string) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      filteredEmployees
        .filter((emp) => emp.role === role)
        .forEach((emp) => newSet.add(emp.id));
      return newSet;
    });
    setHasChanges(true);
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!selectedDate) return;

    setSaving(true);
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const response = await fetch("/api/employee-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          shift: selectedShift,
          employeeIds: Array.from(selectedEmployeeIds),
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        // Show success toast-like notification
        const successEl = document.getElementById("save-success");
        if (successEl) {
          successEl.classList.remove("opacity-0", "translate-y-2");
          successEl.classList.add("opacity-100", "translate-y-0");
          setTimeout(() => {
            successEl.classList.remove("opacity-100", "translate-y-0");
            successEl.classList.add("opacity-0", "translate-y-2");
          }, 2000);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const presentCount = selectedEmployeeIds.size;
  const totalCount = allEmployees.length;
  const absentCount = totalCount - presentCount;

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300"
      )}
    >
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AppHeader />
        <BGPattern
          variant="grid"
          mask="fade-edges"
          size={24}
          fill="rgba(222, 28, 28, 0.1)"
          className="absolute inset-0 pointer-events-none dark:opacity-30"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
          {/* Controls Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 mb-6">
            {/* Quick Stats - Horizontal Layout */}
            <div className="flex justify-center gap-8 sm:gap-16 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {/* Present Stat */}
              <div className="flex flex-col items-center">
                <UserCheck className="w-7 h-7 text-green-500 mb-1" />
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {presentCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Present</div>
              </div>
              
              {/* Divider */}
              <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />
              
              {/* Absent Stat */}
              <div className="flex flex-col items-center">
                <UserX className="w-7 h-7 text-red-500 mb-1" />
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {absentCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
              </div>
            </div>

            {/* Filter Controls - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {/* Date Picker */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "0.5rem",
                            backgroundColor: "white",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#d1d5db",
                            },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              {/* Shift Selector */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4" />
                  Shift
                </label>
                <Select
                  value={selectedShift}
                  onValueChange={(value: "Day" | "Night") => setSelectedShift(value)}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day Shift</SelectItem>
                    <SelectItem value="Night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Search className="w-4 h-4" />
                  Search
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9 bg-white dark:bg-gray-800"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="w-4 h-4" />
                  Filter by Role
                </label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Actions - Buttons Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Select/Deselect buttons on left */}
              <button
                onClick={selectAll}
                disabled={allFilteredSelected}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 border",
                  allFilteredSelected
                    ? "bg-green-500 text-white border-green-600 cursor-default"
                    : "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                )}
              >
                <CheckSquare className="w-4 h-4 flex-shrink-0" />
                <span>Select All</span>
              </button>
              <button
                onClick={deselectAll}
                disabled={noneFilteredSelected}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 border",
                  noneFilteredSelected
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-default"
                    : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Square className="w-4 h-4 flex-shrink-0" />
                <span>Deselect All</span>
              </button>
              
              {/* Spacer */}
              <div className="flex-1" />
              
              {/* Save button on right */}
              <Button
                onClick={handleSaveAttendance}
                disabled={saving || !selectedDate}
                variant="gradient"
                className="gap-2 px-5 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Attendance"}
                {hasChanges && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </Button>
            </div>
          </div>

          {/* Success Toast */}
          <div
            id="save-success"
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 opacity-0 translate-y-2 transition-all duration-300 z-50"
          >
            <CheckSquare className="w-5 h-5" />
            Attendance saved successfully!
          </div>

          {/* Employee List */}
          {loadingEmployees || loadingAttendance ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-8">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-gray-600 dark:text-gray-400">
                  Loading employees...
                </span>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No employees found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedEmployees.map(([role, employees]) => {
                const roleConfig = ROLE_CONFIG[role] || {
                  color: "text-gray-700 dark:text-gray-400",
                  bgColor: "bg-gray-100 dark:bg-gray-700/30",
                };
                const roleSelected = employees.filter((e) =>
                  selectedEmployeeIds.has(e.id)
                ).length;

                return (
                  <div
                    key={role}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 overflow-hidden"
                  >
                    {/* Role Header */}
                    <div
                      className={cn(
                        "px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700",
                        roleConfig.bgColor
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <h3
                          className={cn("font-bold text-lg", roleConfig.color)}
                        >
                          {role}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({roleSelected}/{employees.length} present)
                        </span>
                      </div>
                      {(() => {
                        const allRoleSelected = employees.every((e) => selectedEmployeeIds.has(e.id));
                        return (
                          <button
                            onClick={() => selectRole(role)}
                            disabled={allRoleSelected}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                              allRoleSelected
                                ? "bg-green-500 text-white cursor-default"
                                : cn("hover:bg-white/50 dark:hover:bg-gray-800/50", roleConfig.color)
                            )}
                          >
                            {allRoleSelected ? (
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <CheckSquare className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span>{allRoleSelected ? "Selected" : "Select All"}</span>
                          </button>
                        );
                      })()}
                    </div>

                    {/* Employee Grid */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {employees.map((employee) => {
                        const isSelected = selectedEmployeeIds.has(employee.id);
                        return (
                          <button
                            key={employee.id}
                            onClick={() => toggleEmployee(employee.id)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left",
                              isSelected
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            {/* Checkbox */}
                            <div
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                                isSelected
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                              )}
                            >
                              {isSelected && (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Avatar */}
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                isSelected
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                              )}
                            >
                              {employee.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "font-medium truncate",
                                  isSelected
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {employee.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {employee.employeeId}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
