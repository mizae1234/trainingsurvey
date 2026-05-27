'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function DatePicker({ value, onChange, error, placeholder = 'เลือกวันที่...' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date()); // The month being viewed
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop value
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        setCurrentDate(parsedDate);
        setViewDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
      }
    } else {
      setCurrentDate(new Date());
      setViewDate(new Date());
    }
  }, [value]);

  // Click outside to close calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date to display in input (e.g. 27 พ.ค. 2569)
  const formatDisplayDate = (): string => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return '';
    const d = parseInt(parts[2]);
    const m = parseInt(parts[1]) - 1;
    const y = parseInt(parts[0]) + 543; // BE Year
    return `${d} ${THAI_MONTHS_SHORT[m]} ${y}`;
  };

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Generate calendar days
  const generateDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const daysList = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysList.push({
        day: prevTotalDays - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      daysList.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }

    // Next month padding days to make a grid of 42
    const remainingCells = 42 - daysList.length;
    for (let i = 1; i <= remainingCells; i++) {
      daysList.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }

    return daysList;
  };

  const handleSelectDay = (dayObj: { day: number; month: number; year: number }) => {
    const formatMonth = (dayObj.month + 1).toString().padStart(2, '0');
    const formatDay = dayObj.day.toString().padStart(2, '0');
    onChange(`${dayObj.year}-${formatMonth}-${formatDay}`);
    setIsOpen(false);
  };

  const isSelected = (day: number, month: number, year: number): boolean => {
    if (!value) return false;
    const parts = value.split('-');
    return (
      parseInt(parts[2]) === day &&
      parseInt(parts[1]) - 1 === month &&
      parseInt(parts[0]) === year
    );
  };

  const isToday = (day: number, month: number, year: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <div className={`branch-select-container ${error ? 'has-error' : ''}`} ref={containerRef} style={{ position: 'relative' }}>
      <div className="input-with-icon" onClick={() => setIsOpen(!isOpen)}>
        <CalendarIcon size={18} className="search-icon" />
        <input
          type="text"
          className="combobox-input"
          style={{ paddingLeft: '42px', paddingRight: '16px', cursor: 'pointer' }}
          value={formatDisplayDate()}
          placeholder={placeholder}
          readOnly
        />
      </div>

      {isOpen && (
        <div 
          className="calendar-popup" 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 60,
            marginTop: '6px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            width: '280px',
            padding: '16px',
            userSelect: 'none'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button 
              type="button" 
              onClick={prevMonth} 
              className="btn btn-secondary" 
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {THAI_MONTHS_FULL[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
            </div>
            <button 
              type="button" 
              onClick={nextMonth} 
              className="btn btn-secondary" 
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
            {WEEKDAYS.map((day, idx) => (
              <div 
                key={day} 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: idx === 0 ? 'var(--primary-red)' : 'var(--text-muted)' 
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {generateDays().map((dayObj, index) => {
              const selected = isSelected(dayObj.day, dayObj.month, dayObj.year);
              const today = isToday(dayObj.day, dayObj.month, dayObj.year);
              
              let cellStyle: React.CSSProperties = {
                fontSize: '12px',
                fontWeight: selected ? '600' : '400',
                padding: '6px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              };

              if (dayObj.isCurrentMonth) {
                cellStyle.color = 'var(--text-primary)';
              } else {
                cellStyle.color = '#CBD5E1'; // Muted grey
              }

              if (today) {
                cellStyle.border = '1px solid var(--primary-yellow)';
                cellStyle.backgroundColor = 'var(--yellow-tint)';
              }

              if (selected) {
                cellStyle.backgroundColor = 'var(--primary-red)';
                cellStyle.color = '#FFFFFF';
              }

              return (
                <div
                  key={index}
                  style={cellStyle}
                  onClick={() => handleSelectDay(dayObj)}
                  className="calendar-cell"
                >
                  {dayObj.day}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <span className="error-text" style={{ marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}
