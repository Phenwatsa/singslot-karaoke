import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getBangkokTodayString } from '../../utils/date';

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClear?: () => void;
  minDate?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  showClear?: boolean;
  align?: 'right' | 'left';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onClear,
  minDate,
  label = 'Date:',
  className = '',
  triggerClassName = '',
  placeholder = 'Select date',
  showClear = true,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize navigation year & month from value or Bangkok today
  const getInitialYearMonth = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const today = getBangkokTodayString();
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m - 1 };
  };

  const initial = getInitialYearMonth();
  const [navYear, setNavYear] = useState(initial.year);
  const [navMonth, setNavMonth] = useState(initial.month);

  // Synchronize calendar view if value changes externally
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setNavYear(y);
      setNavMonth(m - 1);
    }
  }, [value]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const todayStr = getBangkokTodayString();

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (minDate && formatted < minDate) {
      return;
    }
    onChange(formatted);
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(todayStr);
    const [y, m] = todayStr.split('-').map(Number);
    setNavYear(y);
    setNavMonth(m - 1);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  // Calendar math
  const firstDayOfWeek = new Date(navYear, navMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(navYear, navMonth, 0).getDate();

  // Trailing previous month days
  const prevMonthDays: number[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Days in current month
  const currentMonthDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthDays.push(d);
  }

  // Trailing next month days (fill out full 35 or 42 grid slots)
  const totalSlots = prevMonthDays.length + currentMonthDays.length;
  const nextMonthGridSize = totalSlots > 35 ? 42 : 35;
  const nextMonthDays: number[] = [];
  for (let d = 1; d <= nextMonthGridSize - totalSlots; d++) {
    nextMonthDays.push(d);
  }

  // Format display text (e.g. DD/MM/YYYY)
  const formattedDisplay = (() => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  })();

  const isFullWidth = className.includes('w-full');

  return (
    <div ref={containerRef} className={`relative ${isFullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border border-pink-200/80 bg-white/95 px-3.5 py-1.5 text-xs text-slate-700 shadow-xs hover:border-pink-300 hover:bg-white active:scale-98 transition-all cursor-pointer backdrop-blur-sm ${
          isFullWidth ? 'w-full justify-between' : ''
        } ${triggerClassName}`}
        title="Choose date"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
          {label && <span className="font-semibold text-slate-500">{label}</span>}
          <span className={`font-bold ${value ? 'text-slate-800' : 'text-slate-400 font-normal'}`}>
            {formattedDisplay}
          </span>
        </div>
        {isFullWidth && (
          <ChevronDown className="h-4 w-4 text-slate-400 stroke-[2.2] shrink-0" />
        )}
      </button>

      {/* Minimal Calendar Popover - Compact, Non-overflowing, Matching Design Spec */}
      {isOpen && (
        <div
          className={`absolute mt-2 z-50 w-[236px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-3 shadow-xl shadow-slate-200/70 border border-slate-100 ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0 right-auto'
          }`}
        >
          {/* Header: ChevronLeft, Month Year, ChevronRight */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>

            <span className="text-xs font-bold text-slate-900 tracking-tight select-none">
              {MONTH_NAMES[navMonth]} {navYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Weekday Row (Su Mo Tu We Th Fr Sa) */}
          <div className="grid grid-cols-7 mb-1 text-center">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[10px] font-semibold text-slate-400 select-none py-0.5">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {/* Trailing days of previous month */}
            {prevMonthDays.map((d) => {
              const prevMonth = navMonth === 0 ? 11 : navMonth - 1;
              const prevYear = navMonth === 0 ? navYear - 1 : navYear;
              return (
                <button
                  key={`prev-${d}`}
                  type="button"
                  onClick={() => handleSelectDate(prevYear, prevMonth, d)}
                  className="flex h-7 w-7 mx-auto items-center justify-center text-xs text-slate-300 font-normal hover:text-slate-500 rounded-lg transition-colors cursor-pointer select-none"
                >
                  {d}
                </button>
              );
            })}

            {/* Days in current month */}
            {currentMonthDays.map((d) => {
              const dateStr = `${navYear}-${String(navMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;
              const isPast = minDate ? dateStr < minDate : false;

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDate(navYear, navMonth, d)}
                  className={`flex h-7 w-7 mx-auto items-center justify-center text-xs font-semibold rounded-xl transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                      : isPast
                      ? 'text-slate-300 font-normal cursor-not-allowed'
                      : isToday
                      ? 'text-purple-600 font-bold hover:bg-slate-50'
                      : 'text-slate-800 hover:bg-slate-50 active:scale-95'
                  }`}
                >
                  {d}
                </button>
              );
            })}

            {/* Trailing days of next month */}
            {nextMonthDays.map((d) => {
              const nextMonth = navMonth === 11 ? 0 : navMonth + 1;
              const nextYear = navMonth === 11 ? navYear + 1 : navYear;
              return (
                <button
                  key={`next-${d}`}
                  type="button"
                  onClick={() => handleSelectDate(nextYear, nextMonth, d)}
                  className="flex h-7 w-7 mx-auto items-center justify-center text-xs text-slate-300 font-normal hover:text-slate-500 rounded-lg transition-colors cursor-pointer select-none"
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Minimal Bottom Actions: Clear & Today */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            {showClear ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-0.5 font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-0.5 font-extrabold text-[10px] text-purple-900 bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 hover:brightness-105 active:scale-95 rounded-full border border-purple-200/50 shadow-2xs transition-all cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
