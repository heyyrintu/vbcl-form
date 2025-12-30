"use client";

import { useEffect, useState, useMemo } from "react";
import { formatDateTime, convertTo12Hour } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { cn } from "@/lib/utils";
import { Download, LayoutDashboard, Truck, CalendarDays, Clock, X, Calendar, Users, UserCheck, Wrench, PaintBucket, Zap, HelpingHand, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import type { ProductionRecord, EmployeeAssignment } from "@/types/record";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// IST Timezone constant
const IST_TIMEZONE = "Asia/Kolkata";

// Helper function to get today's date in IST
const getTodayIST = (): string => {
  return dayjs().tz(IST_TIMEZONE).format("YYYY-MM-DD");
};

// Helper function to check if a date string is today in IST
const isToday = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  const today = getTodayIST();
  return dateStr === today;
};

// Helper function to get month options for dropdown
const getMonthOptions = () => {
  const options = [];
  const now = dayjs().tz(IST_TIMEZONE);
  for (let i = 0; i < 4; i++) {
    const month = now.subtract(i, "month");
    options.push({
      value: month.format("YYYY-MM"),
      label: month.format("MMMM YYYY"),
      startDate: month.startOf("month").format("YYYY-MM-DD"),
      endDate: month.endOf("month").format("YYYY-MM-DD"),
    });
  }
  return options;
};

export default function Dashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "COMPLETED">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "srNoVehicleCount">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Date filter states
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Manpower section states
  const [manpowerFilter, setManpowerFilter] = useState<"total" | "today" | "yesterday">("today");
  const [manpowerStats, setManpowerStats] = useState({ total: 0, onrole: 0, fitter: 0, painter: 0, electrician: 0, helper: 0 });
  const [manpowerLoading, setManpowerLoading] = useState(false);

  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Check authentication on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (mounted && session) {
          setAuthState("authenticated");
          fetchRecords();
        } else if (mounted) {
          setAuthState("unauthenticated");
          setLoading(false);
          router.replace("/login");
        }
      } catch (error) {
        console.error("Dashboard: Auth check failed:", error);
        if (mounted) {
          setAuthState("unauthenticated");
          setLoading(false);
          router.replace("/login");
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/records");
      if (response.ok) {
        const data: ProductionRecord[] = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle month selection
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (value) {
      const option = monthOptions.find((o) => o.value === value);
      if (option) {
        setFromDate(dayjs(option.startDate));
        setToDate(dayjs(option.endDate));
      }
    }
  };

  // Clear all date filters
  const clearDateFilters = () => {
    setFromDate(null);
    setToDate(null);
    setSelectedMonth("");
  };

  // Filter records by date range
  const dateFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!fromDate && !toDate) return true;

      const recordDate = record.date;
      if (!recordDate) return true; // Include records without date if no filter

      const recordDayjs = dayjs(recordDate);

      if (fromDate && recordDayjs.isBefore(fromDate, "day")) return false;
      if (toDate && recordDayjs.isAfter(toDate, "day")) return false;

      return true;
    });
  }, [records, fromDate, toDate]);

  // Apply status filter on top of date filter
  const filteredRecords = dateFilteredRecords.filter((record) => {
    if (filterStatus === "all") return true;
    return record.status === filterStatus;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aValue: number | string | null = null;
    let bValue: number | string | null = null;

    if (sortBy === "createdAt" || sortBy === "updatedAt") {
      aValue = new Date(a[sortBy]).getTime();
      bValue = new Date(b[sortBy]).getTime();
    } else {
      aValue = a[sortBy] ?? 0;
      bValue = b[sortBy] ?? 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, fromDate, toDate, selectedMonth, sortBy, sortOrder]);

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Summary card calculations
  const totalVehicle = useMemo(() => {
    return dateFilteredRecords.filter((r) => r.status === "COMPLETED").length;
  }, [dateFilteredRecords]);

  const todaysVehicleCount = useMemo(() => {
    return records.filter((r) => r.status === "COMPLETED" && isToday(r.date)).length;
  }, [records]);

  const pendingVehicle = useMemo(() => {
    return records.filter((r) => r.status === "PENDING").length;
  }, [records]);

  // Fetch manpower stats
  const fetchManpowerStats = async () => {
    setManpowerLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("filter", manpowerFilter);

      // If using page date filter (when manpower filter would use it)
      if (manpowerFilter !== "total" && manpowerFilter !== "today" && manpowerFilter !== "yesterday") {
        if (fromDate) params.set("fromDate", fromDate.format("YYYY-MM-DD"));
        if (toDate) params.set("toDate", toDate.format("YYYY-MM-DD"));
      }

      const response = await fetch(`/api/manpower?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setManpowerStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch manpower stats:", error);
    } finally {
      setManpowerLoading(false);
    }
  };

  // Fetch manpower stats when filter changes
  useEffect(() => {
    if (authState === "authenticated") {
      fetchManpowerStats();
    }
  }, [manpowerFilter, fromDate, toDate, authState]);

  const handleSort = (field: "createdAt" | "updatedAt" | "srNoVehicleCount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const exportToExcel = () => {
    const excelData = sortedRecords.map((record) => {
      const employees = record.employeeAssignments
        ?.map((assignment: EmployeeAssignment) => `${assignment.employee.name} [${assignment.employee.employeeId}] (${assignment.splitCount.toFixed(2)})`)
        .join(", ") || "";

      return {
        "Vehicle #": record.srNoVehicleCount || "",
        "Status": record.status,
        "Supervisor": record.dronaSupervisor,
        "Shift": record.shift,
        "Date": record.date ? new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "",
        "In Time": record.inTime ? convertTo12Hour(record.inTime) : "",
        "Out Time": record.outTime ? convertTo12Hour(record.outTime) : "",
        "Bin No": record.binNo,
        "Model No": record.modelNo,
        "Chassis No": record.chassisNo,
        "Type": record.type,
        "Electrician": record.electrician,
        "Fitter": record.fitter,
        "Painter": record.painter,
        "Helper": record.helper,
        "Production Incharge": record.productionInchargeFromVBCL || "",
        "Employees": employees,
        "Remarks": record.remarks || "",
        "Created At": formatDateTime(record.createdAt),
        "Last Updated": formatDateTime(record.updatedAt),
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Details");

    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    const filename = `Vehicle_Tracker_Entries_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (loading || authState === "checking" || authState === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE1C1C] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {authState === "unauthenticated" ? "Redirecting to login..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={cn("flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300")}>
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <AppHeader />
          {/* Subtle Grid Pattern Overlay */}
          <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">

            {/* Date Filter Section */}
            <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Date Filter</span>
                  <span className="text-xs text-gray-500">(IST)</span>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                  {/* From Date */}
                  <div className="flex-1 min-w-[140px] lg:flex-none">
                    <DatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={(newValue) => {
                        setFromDate(newValue);
                        setSelectedMonth("");
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                              backgroundColor: "white",
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* To Date */}
                  <div className="flex-1 min-w-[140px] lg:flex-none">
                    <DatePicker
                      label="To Date"
                      value={toDate}
                      onChange={(newValue) => {
                        setToDate(newValue);
                        setSelectedMonth("");
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                              backgroundColor: "white",
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Month Selector */}
                  <div className="flex-1 min-w-[160px] lg:flex-none">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Select Month</option>
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Button */}
                  {(fromDate || toDate || selectedMonth) && (
                    <Button
                      onClick={clearDateFilters}
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 text-gray-600 hover:text-red-600 hover:border-red-300"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>

                {sortedRecords.length > 0 && (
                  <Button
                    onClick={exportToExcel}
                    variant="gradient"
                    size="sm"
                    className="shrink-0 h-9 px-4 w-full lg:w-auto text-sm shadow-md shadow-primary/20 hover:shadow-primary/40"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Total Vehicle Card */}
              <div className="relative group p-[1px] rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.8), rgba(254, 165, 25, 0.8))' }}>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden transition-all duration-300 group-hover:bg-white/95 dark:group-hover:bg-gray-900/95">
                  {/* Decorative gradient blob */}
                  <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-[#DE1C1C]/20 to-[#FEA418]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#DE1C1C] to-[#FEA418] rounded-lg sm:rounded-xl shadow-lg shadow-[#DE1C1C]/20">
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Total Vehicle</span>
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#DE1C1C] to-[#FEA418]">{totalVehicle}</div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
                      {fromDate || toDate ? "In selected range" : "All time processed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Vehicle Count Card */}
              <div className="relative group p-[1px] rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.8), rgba(254, 165, 25, 0.8))' }}>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden transition-all duration-300 group-hover:bg-white/95 dark:group-hover:bg-gray-900/95">
                  {/* Decorative gradient blob */}
                  <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-[#FEA418]/20 to-[#DE1C1C]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#FEA418] to-[#DE1C1C] rounded-lg sm:rounded-xl shadow-lg shadow-[#FEA418]/20">
                        <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Today&apos;s Vehicle</span>
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEA418] to-[#DE1C1C]">{todaysVehicleCount}</div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
                      Processed today ({getTodayIST()})
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Vehicle Card */}
              <div className="relative group p-[1px] rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(254, 165, 25, 0.8), rgba(224, 30, 31, 0.8))' }}>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden transition-all duration-300 group-hover:bg-white/95 dark:group-hover:bg-gray-900/95">
                  {/* Decorative gradient blob */}
                  <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-[#FEA418]/20 to-[#DE1C1C]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#FEA418] to-[#DE1C1C] rounded-lg sm:rounded-xl shadow-lg shadow-[#FEA418]/20">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Pending Vehicle</span>
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEA418] to-[#DE1C1C]">{pendingVehicle}</div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
                      Awaiting submission
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Manpower Section */}
            <div className="mb-4 sm:mb-6">
              {/* Section Header with Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#DE1C1C]" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">Manpower Overview</h2>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setManpowerFilter("total")}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all ${manpowerFilter === "total"
                      ? "bg-gradient-to-r from-[#DE1C1C] to-[#FEA418] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#DE1C1C]/50"
                      }`}
                  >
                    Total
                  </button>
                  <button
                    onClick={() => setManpowerFilter("today")}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all ${manpowerFilter === "today"
                      ? "bg-gradient-to-r from-[#DE1C1C] to-[#FEA418] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#DE1C1C]/50"
                      }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setManpowerFilter("yesterday")}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all ${manpowerFilter === "yesterday"
                      ? "bg-gradient-to-r from-[#DE1C1C] to-[#FEA418] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#DE1C1C]/50"
                      }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              {/* Manpower Cards Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {/* Total ManPower */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.6), rgba(254, 165, 25, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#DE1C1C] to-[#FEA418] rounded-md sm:rounded-lg">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Total</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#DE1C1C] to-[#FEA418]">
                      {manpowerLoading ? "..." : manpowerStats.total}
                    </div>
                  </div>
                </div>

                {/* Onrole Employee */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.6), rgba(254, 165, 25, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#FEA418] to-[#DE1C1C] rounded-md sm:rounded-lg">
                        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Onrole</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEA418] to-[#DE1C1C]">
                      {manpowerLoading ? "..." : manpowerStats.onrole}
                    </div>
                  </div>
                </div>

                {/* Fitter Count */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.6), rgba(254, 165, 25, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#DE1C1C] to-[#FEA418] rounded-md sm:rounded-lg">
                        <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Fitter</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#DE1C1C] to-[#FEA418]">
                      {manpowerLoading ? "..." : manpowerStats.fitter}
                    </div>
                  </div>
                </div>

                {/* Painter Count */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(254, 165, 25, 0.6), rgba(224, 30, 31, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#FEA418] to-[#DE1C1C] rounded-md sm:rounded-lg">
                        <PaintBucket className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Painter</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEA418] to-[#DE1C1C]">
                      {manpowerLoading ? "..." : manpowerStats.painter}
                    </div>
                  </div>
                </div>

                {/* Electrician Count */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.6), rgba(254, 165, 25, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#DE1C1C] to-[#FEA418] rounded-md sm:rounded-lg">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Electrician</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#DE1C1C] to-[#FEA418]">
                      {manpowerLoading ? "..." : manpowerStats.electrician}
                    </div>
                  </div>
                </div>

                {/* Helper Count */}
                <div className="relative group p-[1px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(254, 165, 25, 0.6), rgba(224, 30, 31, 0.6))' }}>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all duration-300 group-hover:bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[#FEA418] to-[#DE1C1C] rounded-md sm:rounded-lg">
                        <HelpingHand className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Helper</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEA418] to-[#DE1C1C]">
                      {manpowerLoading ? "..." : manpowerStats.helper}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filterStatus === "all"
                    ? "bg-[#DE1C1C] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  All ({dateFilteredRecords.length})
                </button>
                <button
                  onClick={() => setFilterStatus("PENDING")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filterStatus === "PENDING"
                    ? "bg-[#FEA418] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Pending ({dateFilteredRecords.filter((r) => r.status === "PENDING").length})
                </button>
                <button
                  onClick={() => setFilterStatus("COMPLETED")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filterStatus === "COMPLETED"
                    ? "bg-[#FEA418] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Completed ({dateFilteredRecords.filter((r) => r.status === "COMPLETED").length})
                </button>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 mb-6">
              {currentRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  No records found
                </div>
              ) : (
                currentRecords.map((record) => (
                  <div key={record.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {record.srNoVehicleCount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DE1C1C]/10 text-[#DE1C1C]">
                            #{record.srNoVehicleCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.modelNo}</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${record.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-[#FEA418]/20 text-[#FEA418]"
                          }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 block">Supervisor</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{record.dronaSupervisor}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Shift</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{record.shift}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Date</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "-"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Chassis No</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{record.chassisNo}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.type === "PTS"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                          }`}
                      >
                        {record.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(record.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("srNoVehicleCount")}
                      >
                        <div className="flex items-center gap-1">
                          Vehicle #
                          {sortBy === "srNoVehicleCount" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supervisor
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Time
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Out Time
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bin No
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model No
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chassis No
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Production Incharge
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("updatedAt")}
                      >
                        <div className="flex items-center gap-1">
                          Last Updated
                          {sortBy === "updatedAt" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Created
                          {sortBy === "createdAt" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      currentRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.srNoVehicleCount ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DE1C1C]/10 text-[#DE1C1C]">
                                #{record.srNoVehicleCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${record.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-[#FEA418]/20 text-[#FEA418]"
                                }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.dronaSupervisor}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.shift}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.date ? new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.inTime ? convertTo12Hour(record.inTime) : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.outTime ? convertTo12Hour(record.outTime) : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.binNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.modelNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {record.chassisNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.type === "PTS"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                                }`}
                            >
                              {record.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.productionInchargeFromVBCL || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            {record.remarks || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(record.updatedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(record.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {sortedRecords.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-sm text-gray-500 pb-8">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={recordsPerPage}
                    onChange={(e) => {
                      setRecordsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 w-16 rounded-md border border-gray-300 bg-white text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:bg-gray-900 dark:border-gray-700"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center rounded-md border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </LocalizationProvider>
  );
}
