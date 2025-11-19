"use client";

import { formatDateTime, convertTo12Hour } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RecordCardProps {
  record: any;
  onEdit?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  isCompleted?: boolean;
}

export default function RecordCard({ record, onEdit, onSubmit, onCancel, isCompleted }: RecordCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          {isCompleted && record.srNoVehicleCount && (
            <div className="inline-block bg-[#DE1C1C]/10 text-[#DE1C1C] text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              Vehicle #{record.srNoVehicleCount}
            </div>
          )}
          {!isCompleted && (
            <div className="inline-block bg-[#FEA418]/20 text-[#FEA418] text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              Pending
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{record.chassisNo}</h3>
          <p className="text-sm text-gray-600">Model: {record.modelNo}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          record.type === "PTS" ? "bg-[#FEA418]/20 text-[#FEA418]" : "bg-[#DE1C1C]/10 text-[#DE1C1C]"
        }`}>
          {record.type}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Supervisor:</span>
          <span className="font-medium text-gray-900">{record.dronaSupervisor}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shift:</span>
          <span className="font-medium text-gray-900">{record.shift}</span>
        </div>
        {record.date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">
              {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
        {(record.inTime || record.outTime) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">
              {record.inTime ? `In: ${convertTo12Hour(record.inTime)}` : ''}
              {record.inTime && record.outTime ? ' | ' : ''}
              {record.outTime ? `Out: ${convertTo12Hour(record.outTime)}` : ''}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Bin No:</span>
          <span className="font-medium text-gray-900">{record.binNo}</span>
        </div>
        {record.productionInchargeFromVBCL && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Prod. Incharge Name:</span>
            <span className="font-medium text-gray-900">{record.productionInchargeFromVBCL}</span>
          </div>
        )}
        {isCompleted && record.completedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium text-gray-900">{formatDateTime(record.completedAt)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-3 mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Manpower</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Electrician:</span>
            <span className="font-medium">{record.electrician}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fitter:</span>
            <span className="font-medium">{record.fitter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Painter:</span>
            <span className="font-medium">{record.painter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Helper:</span>
            <span className="font-medium">{record.helper}</span>
          </div>
        </div>
      </div>

      {record.remarks && (
        <div className="border-t border-gray-200 pt-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Remarks</p>
          <p className="text-sm text-gray-600">{record.remarks}</p>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        {!isCompleted && (
          <>
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="gradient"
                size="sm"
                className="flex-1"
              >
                Edit
              </Button>
            )}
            {onSubmit && (
              <Button
                onClick={onSubmit}
                variant="gradient"
                size="sm"
                className="flex-1"
              >
                Submit
              </Button>
            )}
          </>
        )}
        {isCompleted && onCancel && (
          <Button
            onClick={onCancel}
            variant="gradient"
            size="sm"
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

