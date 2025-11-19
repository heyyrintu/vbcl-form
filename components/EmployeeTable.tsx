"use client";

import { useState, useEffect } from "react";
import { Users, Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "All") {
      filtered = filtered.filter((emp) => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, roleFilter, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        setFilteredEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Electrician":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Fitter":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Painter":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "Helper":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const roleCounts = {
    All: employees.length,
    Electrician: employees.filter((e) => e.role === "Electrician").length,
    Fitter: employees.filter((e) => e.role === "Fitter").length,
    Painter: employees.filter((e) => e.role === "Painter").length,
    Helper: employees.filter((e) => e.role === "Helper").length,
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50" />
        <div className="relative p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DE1C1C] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-lg transition-all duration-500 group-hover:shadow-xl" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#E01E1F] to-[#FEA519]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Employees</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredEmployees.length} of {employees.length} employees
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#E01E1F] focus:border-transparent min-w-[150px]"
          >
            <option value="All">All Roles ({roleCounts.All})</option>
            <option value="Electrician">Electrician ({roleCounts.Electrician})</option>
            <option value="Fitter">Fitter ({roleCounts.Fitter})</option>
            <option value="Painter">Painter ({roleCounts.Painter})</option>
            <option value="Helper">Helper ({roleCounts.Helper})</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredEmployees.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Employee ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Added On
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {employee.employeeId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white text-xs font-bold">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {employee.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          employee.role
                        )}`}
                      >
                        <Briefcase className="w-3 h-3" />
                        {employee.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(employee.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchTerm || roleFilter !== "All"
                  ? "No employees found matching your filters"
                  : "No employees added yet"}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {employees.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {roleCounts.Electrician}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Electricians</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {roleCounts.Fitter}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Fitters</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {roleCounts.Painter}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">Painters</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {roleCounts.Helper}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Helpers</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

