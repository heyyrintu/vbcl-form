"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import RecordForm from "@/components/RecordForm";
import RecordList from "@/components/RecordList";
import AppSidebar from "@/components/AppSidebar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, LayoutDashboard, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

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

  const handleNewEntry = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: any) => {
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

        // Show success message if Google Sheets sync failed
        if (!result.sheetSyncSuccess && result.sheetSyncError) {
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

  const pendingRecords = records.filter((r) => r.status === "PENDING");
  const completedRecords = records.filter((r) => r.status === "COMPLETED");

  // Group completed records by date
  const groupedByDate = completedRecords.reduce((acc, record) => {
    const date = record.date || new Date(record.createdAt).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, any[]>);

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
                  Production Dashboard
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                  Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tracker</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
                  Monitor production flow, track vehicle status, and manage daily entries with ease.
                </p>
              </div>

              <Button
                onClick={handleNewEntry}
                variant="gradient"
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group/btn"
              >
                <Plus className="w-6 h-6 mr-2 group-hover/btn:rotate-90 transition-transform duration-300" />
                New Entry
              </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800/60 min-w-max">
              <button
                onClick={() => setActiveTab("pending")}
                className={`relative pb-4 px-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === "pending"
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
                className={`relative pb-4 px-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === "completed"
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
            </div>
          </div>

          {/* Records List */}
          <div className="relative z-10 pb-20 md:pb-0">
            {activeTab === "pending" ? (
              <RecordList
                records={pendingRecords}
                isCompleted={false}
                onEdit={handleEdit}
                onSubmit={(record) => setShowSubmitConfirm(record.id)}
              />
            ) : (
              <>
                <RecordList
                  records={displayedCompletedRecords}
                  isCompleted={true}
                  onCancel={(record) => setShowCancelConfirm(record.id)}
                />
                {!showAllCompleted && otherDaysRecords.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={() => setShowAllCompleted(true)}
                      variant="outline"
                      className="px-6 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 hover:border-[#E01E1F] hover:text-[#E01E1F] transition-all duration-300"
                    >
                      <ChevronDown className="w-5 h-5 mr-2" />
                      Show More ({otherDaysRecords.length} more {otherDaysRecords.length === 1 ? "entry" : "entries"})
                    </Button>
                  </div>
                )}
                {showAllCompleted && completedRecords.length > mostRecentDayRecords.length && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={() => {
                        setShowAllCompleted(false);
                        // Scroll to top of completed section
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      variant="outline"
                      className="px-6 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 hover:border-[#E01E1F] hover:text-[#E01E1F] transition-all duration-300"
                    >
                      <ChevronUp className="w-5 h-5 mr-2" />
                      Show Less
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}
