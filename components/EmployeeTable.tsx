"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Briefcase, Plus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function EmployeeTable() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Add Employee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeType, setNewEmployeeType] = useState<"onrole" | "offrole">("offrole");
  const [newEmployeeRole, setNewEmployeeRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const openModal = () => {
    setIsModalOpen(true);
    setNewEmployeeName("");
    setNewEmployeeType("offrole");
    setNewEmployeeRole("");
    setSubmitError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEmployeeName("");
    setNewEmployeeType("offrole");
    setNewEmployeeRole("");
    setSubmitError("");
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmployeeName.trim() || !newEmployeeRole) {
      setSubmitError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newEmployeeName.trim(),
          role: newEmployeeRole,
          isActive: newEmployeeType === "onrole",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Failed to add employee");
        return;
      }

      // Add the new employee to the list
      setEmployees((prev) => [...prev, data]);
      closeModal();
    } catch (error) {
      console.error("Error adding employee:", error);
      setSubmitError("Failed to add employee. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

          {/* Add Employee Button */}
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E01E1F] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </button>
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
            <>
              {/* Desktop Table - Hidden on Mobile */}
              <table className="w-full hidden md:table">
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
                      onClick={() => router.push(`/employees/${employee.id}`)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
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

              {/* Mobile Card View - Visible on Mobile Only */}
              <div className="md:hidden space-y-3">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    {/* Top Row: Avatar and Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E01E1F] to-[#FEA519] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {employee.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ID: {employee.employeeId}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Role and Date */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          employee.role
                        )}`}
                      >
                        <Briefcase className="w-3 h-3" />
                        {employee.role}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(employee.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
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

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="relative p-6 pb-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E01E1F] to-[#FEA519]" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#E01E1F] to-[#FEA519]">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Employee</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details below</p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddEmployee} className="p-6 space-y-5">
              {/* Error Message */}
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee Name
                </label>
                <Input
                  id="employeeName"
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Enter employee name"
                  className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-[#E01E1F] focus:border-[#E01E1F]"
                  disabled={submitting}
                />
              </div>

              {/* Employee Type Radio Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee Type
                </label>
                <div className="flex gap-4">
                  {/* Onrole Radio */}
                  <label
                    className={`flex-1 relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${newEmployeeType === "onrole"
                      ? "border-[#E01E1F] bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    <input
                      type="radio"
                      name="employeeType"
                      value="onrole"
                      checked={newEmployeeType === "onrole"}
                      onChange={() => {
                        setNewEmployeeType("onrole");
                        setNewEmployeeRole(""); // Reset role when type changes
                      }}
                      className="sr-only"
                      disabled={submitting}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newEmployeeType === "onrole"
                      ? "border-[#E01E1F]"
                      : "border-gray-400"
                      }`}>
                      {newEmployeeType === "onrole" && (
                        <div className="w-2 h-2 rounded-full bg-[#E01E1F]" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${newEmployeeType === "onrole"
                      ? "text-[#E01E1F]"
                      : "text-gray-600 dark:text-gray-400"
                      }`}>
                      Onrole
                    </span>
                  </label>

                  {/* Offrole Radio */}
                  <label
                    className={`flex-1 relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${newEmployeeType === "offrole"
                      ? "border-[#FEA519] bg-orange-50 dark:bg-orange-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    <input
                      type="radio"
                      name="employeeType"
                      value="offrole"
                      checked={newEmployeeType === "offrole"}
                      onChange={() => {
                        setNewEmployeeType("offrole");
                        setNewEmployeeRole(""); // Reset role when type changes
                      }}
                      className="sr-only"
                      disabled={submitting}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newEmployeeType === "offrole"
                      ? "border-[#FEA519]"
                      : "border-gray-400"
                      }`}>
                      {newEmployeeType === "offrole" && (
                        <div className="w-2 h-2 rounded-full bg-[#FEA519]" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${newEmployeeType === "offrole"
                      ? "text-[#FEA519]"
                      : "text-gray-600 dark:text-gray-400"
                      }`}>
                      Offrole
                    </span>
                  </label>
                </div>
              </div>

              {/* Role Select - Dynamic based on employee type */}
              <div className="space-y-2">
                <label htmlFor="employeeRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  id="employeeRole"
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#E01E1F] focus:border-transparent transition-all"
                  disabled={submitting}
                >
                  <option value="">Select a role</option>
                  {newEmployeeType === "onrole" ? (
                    <>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                      <option value="Assistant Manager">Assistant Manager</option>
                      <option value="Senior Associate">Senior Associate</option>
                      <option value="Associate">Associate</option>
                    </>
                  ) : (
                    <>
                      <option value="Painter">Painter</option>
                      <option value="Fitter">Fitter</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Helper">Helper</option>
                    </>
                  )}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

