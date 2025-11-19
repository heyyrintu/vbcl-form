"use client";

import RecordCard from "./RecordCard";

interface RecordListProps {
  records: any[];
  isCompleted?: boolean;
  onEdit?: (record: any) => void;
  onSubmit?: (record: any) => void;
  onCancel?: (record: any) => void;
}

export default function RecordList({ records, isCompleted, onEdit, onSubmit, onCancel }: RecordListProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No records</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isCompleted ? "No completed entries yet." : "Get started by creating a new entry."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

