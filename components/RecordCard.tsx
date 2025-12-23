"use client";

import { convertTo12Hour } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProductionRecord } from "@/types/record";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  Zap,
  Wrench,
  PaintBucket,
  HelpingHand,
  AlertCircle,
  Truck,
  Layers,
  MapPin
} from "lucide-react";

interface RecordCardProps {
  record: ProductionRecord;
  onEdit?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  isCompleted?: boolean;
}

export default function RecordCard({ record, onEdit, onSubmit, onCancel, isCompleted }: RecordCardProps) {
  return (
    <div className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm hover:shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Gradient Border Effect on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header Section */}
      <div className="relative flex justify-between items-start mb-4">
        <div className="space-y-1 w-full">
          <div className="flex flex-wrap items-center justify-between w-full mb-2 gap-2">
            <div className="flex items-center gap-2">
              {isCompleted && record.srNoVehicleCount ? (
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100 dark:border-red-800/30 shadow-sm">
                  <Truck className="w-3 h-3" />
                  Vehicle #{record.srNoVehicleCount}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-800/30 shadow-sm animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Pending
                </div>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${record.type === "PTS"
              ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400"
              : "bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400"
              }`}>
              {record.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight break-all">
              {record.chassisNo}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">Model: {record.modelNo}</span>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <User className="w-3 h-3" /> Supervisor
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {record.dronaSupervisor}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Shift
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {record.shift}
          </span>
        </div>

        {record.date && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        {(record.inTime || record.outTime) && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {record.inTime ? convertTo12Hour(record.inTime) : '--'}
              {record.outTime ? ` - ${convertTo12Hour(record.outTime)}` : ''}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Bin No
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 break-all">
            {record.binNo}
          </span>
        </div>
      </div>

      {/* Manpower Section - Hidden for now, will be used in future
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manpower</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 hover:bg-blue-50 transition-colors">
            <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate">Electrician</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{record.electrician}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-md bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/20 hover:bg-orange-50 transition-colors">
            <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate">Fitter</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{record.fitter}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-md bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 hover:bg-purple-50 transition-colors">
            <PaintBucket className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate">Painter</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{record.painter}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-md bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 hover:bg-green-50 transition-colors">
            <HelpingHand className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate">Helper</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{record.helper}</span>
            </div>
          </div>
        </div>
      </div>
      */}

      {/* Remarks Section */}
      {record.remarks && (
        <div className="mb-4 p-3 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/20 rounded-lg">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Remarks
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 italic break-words">&ldquo;{record.remarks}&rdquo;</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-3 pt-2 mt-auto">
        {!isCompleted && (
          <>
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex-1 border-gray-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                Edit
              </Button>
            )}
            {onSubmit && (
              <Button
                onClick={onSubmit}
                variant="gradient"
                size="sm"
                className="flex-1 shadow-md"
              >
                Submit
              </Button>
            )}
          </>
        )}
        {isCompleted && onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

