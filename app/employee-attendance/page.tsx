"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { ShapeLandingHero } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Calendar, Clock, Save, RefreshCw } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedShift, setSelectedShift] = useState<"Day" | "Night">("Day");
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance();
    }
  }, [selectedDate, selectedShift]);

  const fetchAttendance = async () => {
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
      <ShapeLandingHero className="fixed inset-0 z-0 opacity-60 dark:opacity-40" />
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
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSaveAttendance}
                disabled={saving || !selectedDate || selectedEmployees.length === 0}
                variant="gradient"
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
              <Button
                onClick={handleReset}
                disabled={selectedEmployees.length === 0}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Attendance Records List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE1C1C] mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading attendance...</p>
            </div>
          ) : attendanceRecords.length > 0 ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Attendance Summary
              </h2>
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white font-bold">
                          {record.employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {record.employee.name}
                          </h3>
                          {record.vehicleEntries && record.vehicleEntries.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Assigned to {record.vehicleEntries.length} vehicle{" "}
                              {record.vehicleEntries.length === 1 ? "entry" : "entries"}
                            </p>
                          )}
                        </div>
                      </div>
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
                ))}
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

