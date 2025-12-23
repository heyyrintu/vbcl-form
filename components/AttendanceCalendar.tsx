"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceCalendarProps {
    month: string; // YYYY-MM format
    attendanceMap: Record<string, { day: boolean; night: boolean; id: string; createdAt: string }>;
    onDateClick?: (date: string, canEdit: boolean) => void;
}

export default function AttendanceCalendar({
    month,
    attendanceMap,
    onDateClick,
}: AttendanceCalendarProps) {
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const firstDayOfMonth = new Date(year, monthNum - 1, 1).getDay();

    // Generate calendar days
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const isWithin72Hours = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= 72;
    };

    const getDateString = (day: number) => {
        return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const handleDayClick = (day: number) => {
        if (!onDateClick) return;
        const dateStr = getDateString(day);
        const canEdit = isWithin72Hours(dateStr);
        onDateClick(dateStr, canEdit);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 bg-gradient-to-r from-[#E01E1F]/10 to-[#FEA519]/10 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                    {monthNames[monthNum - 1]} {year}
                </h3>
            </div>

            {/* Week Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className={`p-2 text-center text-xs font-bold uppercase tracking-wide ${day === "Sun"
                                ? "text-red-500"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="aspect-square border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
                            />
                        );
                    }

                    const dateStr = getDateString(day);
                    const attendance = attendanceMap[dateStr];
                    const hasDay = attendance?.day;
                    const hasNight = attendance?.night;
                    const isPresent = hasDay || hasNight;
                    const isSunday = new Date(year, monthNum - 1, day).getDay() === 0;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    const canEdit = isWithin72Hours(dateStr);

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`
                aspect-square p-1 border-b border-r border-gray-100 dark:border-gray-800 
                flex flex-col items-center justify-center gap-0.5 transition-all
                ${isSunday ? "bg-red-50/50 dark:bg-red-900/10" : ""}
                ${isToday ? "ring-2 ring-inset ring-[#E01E1F]" : ""}
                ${onDateClick ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                ${!canEdit && onDateClick ? "opacity-60" : ""}
              `}
                        >
                            <span
                                className={`text-sm font-medium ${isSunday
                                        ? "text-red-500"
                                        : isPresent
                                            ? "text-gray-900 dark:text-white"
                                            : "text-gray-400 dark:text-gray-500"
                                    }`}
                            >
                                {day}
                            </span>

                            {/* Attendance Indicators */}
                            {isPresent && (
                                <div className="flex gap-0.5">
                                    {hasDay && (
                                        <div className="w-2 h-2 rounded-full bg-amber-500" title="Day Shift" />
                                    )}
                                    {hasNight && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" title="Night Shift" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-gray-600 dark:text-gray-400">Day Shift</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-gray-600 dark:text-gray-400">Night Shift</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-[#E01E1F]" />
                    <span className="text-gray-600 dark:text-gray-400">Today</span>
                </div>
            </div>
        </div>
    );
}
