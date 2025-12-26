"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Calendar, Clock, Save, RefreshCw, ArrowRight } from "lucide-react";
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
import EmployeeSelector from "@/components/EmployeeSelector";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  shift: string;
  employee: Employee;
  vehicleEntries?: Array<{
    recordId: string;
    binNo: string;
    modelNo: string;
    chassisNo: string;
    srNoVehicleCount: number | null;
    splitCount: number;
  }>;
}

export default function EmployeeAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params if available (for navigation back)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? dayjs(dateParam) : dayjs();
  });
  const [selectedShift, setSelectedShift] = useState<"Day" | "Night">(() => {
    const shiftParam = searchParams.get('shift');
    return (shiftParam === 'Night' ? 'Night' : 'Day') as "Day" | "Night";
  });
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Navigation states
  const [navigatingToEmployee, setNavigatingToEmployee] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const response = await fetch(
        `/api/employee-attendance?date=${dateStr}&shift=${selectedShift}`
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
        setSelectedEmployees(data.map((record: AttendanceRecord) => record.employee));
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedShift]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle employee profile navigation
  const handleEmployeeClick = async (employee: Employee) => {
    setNavigationError(null);
    setNavigatingToEmployee(employee.id);

    try {
      // Verify employee exists before navigating
      const response = await fetch(`/api/employees/${employee.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setNavigationError(`Employee profile not found: ${employee.name}`);
          setNavigatingToEmployee(null);
          return;
        }
        throw new Error('Failed to verify employee');
      }

      // Build URL with query parameters
      const params = new URLSearchParams();
      if (selectedDate) {
        params.set('returnDate', selectedDate.format('YYYY-MM-DD'));
      }
      params.set('returnShift', selectedShift);
      params.set('from', 'attendance');

      const url = `/employees/${employee.id}?${params.toString()}`;
      
      // Navigate with smooth transition
      router.push(url);
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigationError('Failed to navigate to employee profile. Please try again.');
      setNavigatingToEmployee(null);
    }
  };

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
          employeeIds: selectedEmployees.map((e) => e.id),
        }),
      });

      if (response.ok) {
        await fetchAttendance();
        alert("Attendance saved successfully!");
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

  const handleReset = () => {
    setSelectedEmployees([]);
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300"
      )}
    >
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <BGPattern
          variant="grid"
          mask="fade-edges"
          size={24}
          fill="rgba(222, 28, 28, 0.1)"
          className="absolute inset-0 pointer-events-none dark:opacity-30"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
          {/* Hero Section */}
          <div className="relative mb-8 sm:mb-10 p-[1px] rounded-3xl overflow-hidden group" style={{ background: 'linear-gradient(to right, rgba(224, 30, 31, 0.7), rgba(254, 165, 25, 0.7))' }}>
            <div className="relative h-full w-full rounded-3xl overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-lg rounded-3xl transition-all duration-500 group-hover:shadow-2xl group-hover:bg-white/50 dark:group-hover:bg-gray-900/50" />

            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-60 animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl opacity-60 animate-pulse delay-1000" />

              <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                    <Users className="w-3 h-3" />
                    Employee Management
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                    Employee{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      Attendance
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
                    Track daily employee attendance by shift and manage workforce allocation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Date and Shift Selection */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
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
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Shift
                </label>
                <Select
                  value={selectedShift}
                  onValueChange={(value: "Day" | "Night") => setSelectedShift(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day Shift</SelectItem>
                    <SelectItem value="Night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employee Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Add Employees
              </label>
              <EmployeeSelector
                selectedEmployees={selectedEmployees}
                onEmployeesChange={setSelectedEmployees}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={handleSaveAttendance}
                disabled={saving || !selectedDate || selectedEmployees.length === 0}
                variant="gradient"
                className="flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Attendance"}</span>
              </Button>
              <button
                onClick={handleReset}
                disabled={selectedEmployees.length === 0}
                className="px-6 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Reset</span>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Attendance Records List */}
          {loading ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Attendance Summary
              </h2>
              <div className="space-y-3">
                {/* Loading Skeletons */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : attendanceRecords.length > 0 ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Attendance Summary
              </h2>
              
              {/* Error message */}
              {navigationError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {navigationError}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {attendanceRecords.map((record) => {
                  const isNavigating = navigatingToEmployee === record.employee.id;
                  
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all duration-300",
                        "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900",
                        "border-gray-200 dark:border-gray-700",
                        isNavigating && "opacity-50 scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleEmployeeClick(record.employee)}
                          disabled={isNavigating}
                          className={cn(
                            "flex items-center gap-3 text-left group",
                            "transition-all duration-200 rounded-lg p-2 -m-2",
                            "hover:bg-gray-100 dark:hover:bg-gray-800",
                            "focus:outline-none focus:ring-2 focus:ring-[#DE1C1C] focus:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                          aria-label={`View profile for ${record.employee.name}`}
                          aria-busy={isNavigating}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white font-bold transition-transform duration-200 group-hover:scale-110">
                            {record.employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#DE1C1C] dark:group-hover:text-[#FEA519] transition-colors duration-200">
                                {record.employee.name}
                              </h3>
                              {isNavigating && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#DE1C1C] border-t-transparent" />
                              )}
                            </div>
                            {record.vehicleEntries && record.vehicleEntries.length > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Assigned to {record.vehicleEntries.length} vehicle{" "}
                                {record.vehicleEntries.length === 1 ? "entry" : "entries"}
                              </p>
                            )}
                          </div>
                        </button>
                        <div className="ml-3">
                          {record.vehicleEntries && record.vehicleEntries.length > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Total Count:{" "}
                                {record.vehicleEntries
                                  .reduce((sum, entry) => sum + entry.splitCount, 0)
                                  .toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Entries Details */}
                      {record.vehicleEntries && record.vehicleEntries.length > 0 && (
                        <div className="mt-3 pl-13 space-y-2">
                          {record.vehicleEntries.map((entry, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center"
                            >
                              <span>
                                {entry.srNoVehicleCount
                                  ? `Vehicle #${entry.srNoVehicleCount}`
                                  : "Pending"}{" "}
                                - {entry.binNo} ({entry.modelNo})
                              </span>
                              <span className="font-medium text-[#E01E1F]">
                                {entry.splitCount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No attendance records for this date and shift.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Add employees above and click Save Attendance to begin tracking.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

