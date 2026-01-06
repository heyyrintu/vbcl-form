"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTimeOrTime } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Briefcase,
  Truck,
  Layers,
  MapPin,
  Zap,
  Wrench,
  PaintBucket,
  HelpingHand,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import type { ProductionRecord } from "@/types/record";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, [id]);

  const checkAuthAndFetch = async () => {
    try {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      
      setIsAdmin(session.user?.role === "ADMIN");
      await fetchRecord();
    } catch (error) {
      console.error("Auth check failed:", error);
      router.replace("/login");
    }
  };

  const fetchRecord = async () => {
    try {
      const response = await fetch(`/api/records/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRecord(data);
      } else if (response.status === 404) {
        setError("Record not found");
      } else {
        setError("Failed to load record");
      }
    } catch (error) {
      console.error("Failed to fetch record:", error);
      setError("Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/all-entries?edit=${id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        router.push("/all-entries");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete record");
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950")}>
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading record...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950")}>
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="mt-4 text-gray-900 dark:text-white font-bold text-lg">{error || "Record not found"}</p>
              <Button onClick={() => router.push("/all-entries")} className="mt-4">
                Back to All Entries
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950")}>
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        
        <main className="flex-1 overflow-y-auto relative">
          <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>

            {/* Header */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 break-all">
                      {record.serialNo || "No Serial"}
                    </h1>
                    {record.status === "COMPLETED" && record.srNoVehicleCount && (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold px-3 py-1.5 rounded-full border border-red-100 dark:border-red-800/30 shadow-sm">
                        <Truck className="w-4 h-4" />
                        Vehicle #{record.srNoVehicleCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Layers className="w-4 h-4" />
                    <span>Model: {record.modelNo} • Chassis: {record.chassisNo}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm ${
                    record.status === "COMPLETED"
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400"
                      : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400"
                  }`}>
                    {record.status === "COMPLETED" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Completed
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-1.5" />
                        Pending
                      </>
                    )}
                  </span>
                  
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm ${
                    record.type === "PTS"
                      ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400"
                      : "bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400"
                  }`}>
                    {record.type}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {record.status === "PENDING" && (
                  <Button onClick={handleEdit} variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    variant="outline" 
                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Supervisor</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{record.dronaSupervisor}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Shift</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{record.shift}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Bin Number</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{record.binNo}</p>
                  </div>
                  {record.productionInchargeFromVBCL && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Production Incharge</label>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{record.productionInchargeFromVBCL}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Information */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Timing Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Date</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {record.date ? new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">In Time</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {record.inTime ? formatDateTimeOrTime(record.inTime) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Out Time</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {record.outTime ? formatDateTimeOrTime(record.outTime) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manpower Details */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Manpower Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Electrician</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{record.electrician}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Fitter</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{record.fitter}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <PaintBucket className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">Painter</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">{record.painter}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <HelpingHand className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Helper</p>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{record.helper}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Assignments */}
              {record.employeeAssignments && record.employeeAssignments.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Assigned Employees
                  </h2>
                  <div className="space-y-2">
                    {record.employeeAssignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{assignment.employee.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{assignment.employee.employeeId} • {assignment.employee.role}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {assignment.splitCount === 1 ? "Full" : `${assignment.splitCount.toFixed(2)}x`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {record.remarks && (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6 md:col-span-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Remarks
                  </h2>
                  <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{record.remarks}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6 md:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Record Timestamps</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Created At</label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {new Date(record.createdAt).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Last Updated</label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {new Date(record.updatedAt).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {record.status === "COMPLETED" && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Record ID</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-mono">{record.id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Delete Entry</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to permanently delete this entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
