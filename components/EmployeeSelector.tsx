"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

interface EmployeeSelectorProps {
  selectedEmployees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  className?: string;
}

export default function EmployeeSelector({
  selectedEmployees,
  onEmployeesChange,
  className = "",
}: EmployeeSelectorProps) {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState<string>("Helper");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setAllEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setIsAddingNew(false);
  };

  const handleSelectEmployee = (employee: Employee) => {
    // Check if employee is already selected
    if (!selectedEmployees.find((e) => e.id === employee.id)) {
      onEmployeesChange([...selectedEmployees, employee]);
    }
    setSearchTerm("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveEmployee = (employeeId: string) => {
    onEmployeesChange(selectedEmployees.filter((e) => e.id !== employeeId));
  };

  const handleAddNewEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newEmployeeName.trim(),
          role: newEmployeeRole 
        }),
      });

      if (response.ok) {
        const newEmployee = await response.json();
        setAllEmployees([...allEmployees, newEmployee]);
        handleSelectEmployee(newEmployee);
        setNewEmployeeName("");
        setNewEmployeeRole("Helper");
        setIsAddingNew(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add employee");
      }
    } catch (error) {
      console.error("Failed to add employee:", error);
      alert("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search term and exclude already selected ones
  const filteredEmployees = allEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedEmployees.find((e) => e.id === emp.id)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredEmployees.length > 0) {
      e.preventDefault();
      handleSelectEmployee(filteredEmployees[0]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected Employees as Chips */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEmployees.map((employee) => (
            <div
              key={employee.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#E01E1F]/10 to-[#FEA519]/10 border border-[#E01E1F]/20 rounded-full text-sm"
            >
              <User className="w-3.5 h-3.5 text-[#E01E1F]" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {employee.name} ({employee.employeeId})
              </span>
              <button
                type="button"
                onClick={() => handleRemoveEmployee(employee.id)}
                className="ml-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input with Autocomplete */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search and add employees..."
          className="pr-10"
        />
        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {filteredEmployees.length > 0 ? (
              <>
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleSelectEmployee(employee)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col gap-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {employee.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {employee.employeeId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {employee.role}
                      </span>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-[#E01E1F] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-t border-gray-200 dark:border-gray-600"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Add new employee</span>
                </button>
              </>
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setNewEmployeeName(searchTerm);
                  setIsAddingNew(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 text-[#E01E1F] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">
                  Add "{searchTerm}" as new employee
                </span>
              </button>
            ) : (
              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                No employees found. Start typing to add a new employee.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Employee Dialog */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Add New Employee
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Enter the employee name and select their role.
            </p>
            <div className="space-y-3 mb-4">
              <Input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Employee name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewEmployee();
                  }
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#E01E1F] focus:border-transparent"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Fitter">Fitter</option>
                  <option value="Painter">Painter</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewEmployeeName("");
                  setNewEmployeeRole("Helper");
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewEmployee}
                disabled={loading || !newEmployeeName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Count Display */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">Total Employees:</span>{" "}
        {selectedEmployees.length}
      </div>
    </div>
  );
}

