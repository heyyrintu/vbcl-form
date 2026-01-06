"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RecordForm from "@/components/RecordForm";
import RecordList from "@/components/RecordList";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, LayoutDashboard, CheckCircle2, Clock, ChevronDown, ChevronUp, Loader2, Trash2, RotateCcw } from "lucide-react";
import type { ProductionRecord } from "@/types/record";
import { getSession } from "next-auth/react";

function AllEntriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "deleted">("pending");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  // Check authentication on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (mounted && session) {
          setAuthState("authenticated");
          setIsAdmin(session.user?.role === "ADMIN");
          // User is authenticated, fetch records
          fetchRecords();
        } else if (mounted) {
          setAuthState("unauthenticated");
          setLoading(false);
          router.replace("/login");
        }
      } catch (error) {
        console.error("AllEntries: Auth check failed:", error);
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
        
        // Check if we need to open edit form from query params
        const editId = searchParams?.get("edit");
        if (editId && data.length > 0) {
          const recordToEdit = data.find((r) => r.id === editId);
          if (recordToEdit) {
            setEditingRecord(recordToEdit);
            setShowForm(true);
            // Clear the query param
            router.replace("/all-entries");
          }
        }
      }
      
      // Fetch deleted records if admin
      if (isAdmin) {
        const deletedResponse = await fetch("/api/records/recycle-bin");
        if (deletedResponse.ok) {
          const deletedData: ProductionRecord[] = await deletedResponse.json();
          setDeletedRecords(deletedData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntry = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCancelRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (response.ok) {
        await fetchRecords();
        setShowCancelConfirm(null);
      }
    } catch (error) {
      console.error("Failed to cancel record:", error);
    }
  };

  const handleSubmitRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchRecords();
        setShowSubmitConfirm(null);

        // Show warning only if Google Sheets sync failed (not just not configured)
        if (!result.sheetSyncSuccess && result.sheetSyncError && !result.sheetSyncNotConfigured) {
          alert(`Record submitted but Google Sheets sync failed: ${result.sheetSyncError}`);
        }
      } else {
        throw new Error("Failed to submit record");
      }
    } catch (error) {
      console.error("Failed to submit record:", error);
      alert("Failed to submit record. Please try again.");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleFormSuccess = () => {
    fetchRecords();
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRecords();
        setShowDeleteConfirm(null);
      } else {
        throw new Error("Failed to delete record");
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  const handleRestoreRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/recycle-bin/${recordId}`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchRecords();
        setShowRestoreConfirm(null);
      } else {
        throw new Error("Failed to restore record");
      }
    } catch (error) {
      console.error("Failed to restore record:", error);
      alert("Failed to restore record. Please try again.");
    }
  };

  const handlePermanentDelete = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/recycle-bin/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRecords();
        setShowPermanentDeleteConfirm(null);
      } else {
        throw new Error("Failed to permanently delete record");
      }
    } catch (error) {
      console.error("Failed to permanently delete record:", error);
      alert("Failed to permanently delete record. Please try again.");
    }
  };

  const handleShowMore = () => {
    setIsLoadingMore(true);
    // Simulate network request/rendering delay for smooth UX
    setTimeout(() => {
      setShowAllCompleted(true);
      setIsLoadingMore(false);
    }, 800);
  };

  const pendingRecords = records.filter((r) => r.status === "PENDING");
  const completedRecords = records.filter((r) => r.status === "COMPLETED");

  // Group completed records by date
  const groupedByDate = completedRecords.reduce<Record<string, ProductionRecord[]>>((acc, record) => {
    const date = record.date || new Date(record.createdAt).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {});

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Get records for the most recent day
  const mostRecentDate = sortedDates[0] || "";
  const mostRecentDayRecords = mostRecentDate ? groupedByDate[mostRecentDate] : [];

  // Get all other records (excluding the most recent day)
  const otherDaysRecords = sortedDates.slice(1).flatMap((date) => groupedByDate[date]);

  // Determine which records to display
  const displayedCompletedRecords = showAllCompleted
    ? completedRecords
    : mostRecentDayRecords;

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
    <div className={cn("flex flex-col w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300")}>
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
        {/* Subtle Grid Pattern Overlay */}
        <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(222, 28, 28, 0.1)" className="absolute inset-0 pointer-events-none dark:opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
          {/* Tabs */}
          <div className="mb-6 sm:mb-8 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60">
              <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`relative pb-4 px-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === "pending"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending
                  {pendingRecords.length > 0 && (
                    <span className="ml-1 py-0.5 px-2 rounded-full text-xs bg-accent/20 text-accent-foreground dark:text-accent font-bold">
                      {pendingRecords.length}
                    </span>
                  )}
                  {activeTab === "pending" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("completed");
                    setShowAllCompleted(false); // Reset when switching tabs
                  }}
                  className={`relative pb-4 px-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === "completed"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                  {completedRecords.length > 0 && (
                    <span className="ml-1 py-0.5 px-2 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400 font-bold">
                      {completedRecords.length}
                    </span>
                  )}
                  {activeTab === "completed" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab("deleted")}
                    className={`relative pb-4 px-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === "deleted"
                      ? "text-primary"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Recycle Bin
                    {deletedRecords.length > 0 && (
                      <span className="ml-1 py-0.5 px-2 rounded-full text-xs bg-red-500/20 text-red-600 dark:text-red-400 font-bold">
                        {deletedRecords.length}
                      </span>
                    )}
                    {activeTab === "deleted" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                  </button>
                )}
              </div>
              
              <Button
                onClick={handleNewEntry}
                variant="gradient"
                size="default"
                className="h-10 px-6 ml-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group/btn hidden sm:flex shrink-0"
              >
                <Plus className="w-5 h-5 mr-2 group-hover/btn:rotate-90 transition-transform duration-300" />
                New Entry
              </Button>
            </div>
          </div>

          {/* Floating Action Button for Mobile */}
          <Button
            onClick={handleNewEntry}
            variant="gradient"
            size="default"
            className="sm:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group/fab p-0 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 group-hover/fab:rotate-90 transition-transform duration-300" />
          </Button>

          {/* Records List */}
          <div className="relative z-10 pb-20 md:pb-0">
            {activeTab === "pending" ? (
              <RecordList
                records={pendingRecords}
                isCompleted={false}
                onEdit={handleEdit}
                onSubmit={(record) => setShowSubmitConfirm(record.id)}
                onDelete={(record) => setShowDeleteConfirm(record.id)}
                isAdmin={isAdmin}
              />
            ) : activeTab === "deleted" ? (
              <div className="space-y-4">
                {deletedRecords.length === 0 ? (
                  <div className="text-center py-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50">
                    <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Recycle bin is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        📝 Items in recycle bin will be permanently deleted after 7 days
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {deletedRecords.map((record) => (
                        <div key={record.id} className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-4 transition-all duration-300">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{record.serialNo || "No Serial"}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{record.modelNo} • {record.chassisNo}</p>
                              </div>
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full">
                                Deleted
                              </span>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => setShowRestoreConfirm(record.id)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                              </button>
                              <button
                                onClick={() => setShowPermanentDeleteConfirm(record.id)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <RecordList
                  records={displayedCompletedRecords}
                  isCompleted={true}
                  onCancel={(record) => setShowCancelConfirm(record.id)}
                  onDelete={(record) => setShowDeleteConfirm(record.id)}
                  isAdmin={isAdmin}
                />
                {!showAllCompleted && otherDaysRecords.length > 0 && (
                  <div className="mt-12 flex flex-col items-center justify-center pb-8">
                    <Button
                      onClick={handleShowMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      className="group relative px-8 py-3 text-sm font-medium bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-300 rounded-full"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>Show More ({otherDaysRecords.length})</span>
                          <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-1" />
                        </div>
                      )}
                    </Button>
                  </div>
                )}
                {showAllCompleted && completedRecords.length > mostRecentDayRecords.length && (
                  <div className="mt-12 flex flex-col items-center justify-center pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mb-8" />
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>All {completedRecords.length} entries loaded</span>
                    </div>

                    <Button
                      onClick={() => {
                        setShowAllCompleted(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      variant="outline"
                      className="group relative px-8 py-3 text-sm font-medium bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-300 rounded-full"
                    >
                      <ChevronUp className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-y-1" />
                      <span>Show Less</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </main>
        </div>

      {/* Form Modal */}
      {showForm && (
        <RecordForm
          existingRecord={editingRecord}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Confirm Submit</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to submit this entry? Once submitted, it will be marked as completed and synced to Google Sheets.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showSubmitConfirm && handleSubmitRecord(showSubmitConfirm)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Confirm Cancel</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to move this entry back to pending? It will become editable again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={() => showCancelConfirm && handleCancelRecord(showCancelConfirm)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Yes, Move to Pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Move to Recycle Bin</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to move this entry to recycle bin? It will be automatically deleted after 7 days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteRecord(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
              >
                Yes, Move to Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">Restore Entry</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to restore this entry? It will be moved back to its original status.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showRestoreConfirm && handleRestoreRecord(showRestoreConfirm)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold"
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Permanently Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ⚠️ This action cannot be undone! Are you sure you want to permanently delete this entry?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermanentDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showPermanentDeleteConfirm && handlePermanentDelete(showPermanentDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
              >
                Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllEntriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE1C1C] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AllEntriesContent />
    </Suspense>
  );
}
