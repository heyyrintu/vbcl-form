"use client";

import RecordCard from "./RecordCard";
import { FileX2 } from "lucide-react";
import type { ProductionRecord } from "@/types/record";

interface RecordListProps {
  records: ProductionRecord[];
  isCompleted?: boolean;
  onEdit?: (record: ProductionRecord) => void;
  onSubmit?: (record: ProductionRecord) => void;
  onCancel?: (record: ProductionRecord) => void;
}

export default function RecordList({ records, isCompleted, onEdit, onSubmit, onCancel }: RecordListProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
          <FileX2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No records found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {isCompleted ? "There are no completed entries to display at the moment." : "Get started by creating a new entry using the form above."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          isCompleted={isCompleted}
          onEdit={onEdit ? () => onEdit(record) : undefined}
          onSubmit={onSubmit ? () => onSubmit(record) : undefined}
          onCancel={onCancel ? () => onCancel(record) : undefined}
        />
      ))}
    </div>
  );
}

