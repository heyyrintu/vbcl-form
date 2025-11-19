"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { formatDateTime, convertTo12Hour } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { cn } from "@/lib/utils";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE1C1C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full h-screen overflow-hidden bg-gray-50")}>
      <AppSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.15)" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">All Entries</h1>
            <p className="text-sm text-gray-600">Complete list of all production records</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
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
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.dronaSupervisor}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col gap-1">
                          <div>{record.shift}</div>
                          {record.date && (
                            <div className="text-xs text-gray-400">
                              {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          {(record.inTime || record.outTime) && (
                            <div className="text-xs text-gray-400">
                              {record.inTime ? `In: ${convertTo12Hour(record.inTime)}` : ''}
                              {record.inTime && record.outTime ? ' | ' : ''}
                              {record.outTime ? `Out: ${convertTo12Hour(record.outTime)}` : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.binNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.modelNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          <span className="text-xs">E:{record.electrician}</span>
                          <span className="text-xs">F:{record.fitter}</span>
                          <span className="text-xs">P:{record.painter}</span>
                          <span className="text-xs">H:{record.helper}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(record.updatedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
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

