"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { formatDateTime, convertTo12Hour } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { ShapeLandingHero } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";
import { Download, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export default function AllEntriesPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "COMPLETED">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "srNoVehicleCount">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/records");
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    if (filterStatus === "all") return true;
    return record.status === filterStatus;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aValue: any;
    let bValue: any;

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

  const handleSort = (field: "createdAt" | "updatedAt" | "srNoVehicleCount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = sortedRecords.map((record) => {
      // Format employees
      const employees = record.employeeAssignments
        ?.map((assignment: any) => `${assignment.employee.name} [${assignment.employee.employeeId}] (${assignment.splitCount.toFixed(2)})`)
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

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Entries");

    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    // Generate filename with current date
    const filename = `Vehicle_Tracker_Entries_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE1C1C] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300")}>
      <ShapeLandingHero className="fixed inset-0 z-0 opacity-60 dark:opacity-40" />
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
                  <LayoutDashboard className="w-3 h-3" />
                  Production Records
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                  All <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Entries</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
                  Complete list of all production records with detailed information and export capabilities.
                </p>
              </div>

              {sortedRecords.length > 0 && (
                <Button
                  onClick={exportToExcel}
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group/btn"
                >
                  <Download className="w-6 h-6 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                  Download Excel
                </Button>
              )}
              </div>
            </div>
          </div>
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filterStatus === "all"
                  ? "bg-[#DE1C1C] text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filterStatus === "PENDING"
                  ? "bg-[#FEA418] text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending ({records.filter((r) => r.status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilterStatus("COMPLETED")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filterStatus === "COMPLETED"
                  ? "bg-[#FEA418] text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Completed ({records.filter((r) => r.status === "COMPLETED").length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    Manpower
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
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
                    <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record) => (
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            record.status === "COMPLETED"
                              ? "bg-[#FEA418]/20 text-[#FEA418]"
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.type === "PTS"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          <span className="text-xs">E:{record.electrician}</span>
                          <span className="text-xs">F:{record.fitter}</span>
                          <span className="text-xs">P:{record.painter}</span>
                          <span className="text-xs">H:{record.helper}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {record.employeeAssignments && record.employeeAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.employeeAssignments.map((assignment: any, idx: number) => (
                              <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {assignment.employee.name} [{assignment.employee.employeeId}]
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Records</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{records.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="mt-1 text-2xl font-semibold text-[#FEA418]">
              {records.filter((r) => r.status === "PENDING").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="mt-1 text-2xl font-semibold text-[#FEA418]">
              {records.filter((r) => r.status === "COMPLETED").length}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

