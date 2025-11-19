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

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<string | null>(null);

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
        {/* Action Bar */}
        <div className="mb-6">
          <Button
            onClick={handleNewEntry}
            variant="gradient"
            size="lg"
            className="w-full sm:w-auto"
          >
            + New Entry
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-[#DE1C1C] text-[#DE1C1C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending
                {pendingRecords.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-[#FEA418]/20 text-[#FEA418]">
                    {pendingRecords.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "completed"
                    ? "border-[#DE1C1C] text-[#DE1C1C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Completed
                {completedRecords.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-[#FEA418]/20 text-[#FEA418]">
                    {completedRecords.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Records List */}
        <div>
          {activeTab === "pending" ? (
            <RecordList
              records={pendingRecords}
              isCompleted={false}
              onEdit={handleEdit}
              onSubmit={(record) => setShowSubmitConfirm(record.id)}
            />
          ) : (
            <RecordList
              records={completedRecords}
              isCompleted={true}
              onCancel={(record) => setShowCancelConfirm(record.id)}
            />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submit</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit this entry? Once submitted, it will be marked as completed and synced to Google Sheets.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => showSubmitConfirm && handleSubmitRecord(showSubmitConfirm)}
                className="flex-1 px-4 py-2 bg-[#FEA418] text-white rounded-md hover:bg-[#E8940E]"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Cancel</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to move this entry back to pending? It will become editable again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                No, Keep It
              </button>
              <button
                onClick={() => showCancelConfirm && handleCancelRecord(showCancelConfirm)}
                className="flex-1 px-4 py-2 bg-[#FEA418] text-white rounded-md hover:bg-[#E8940E]"
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

