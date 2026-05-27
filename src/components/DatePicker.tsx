'use client';

import React, { useEffect, useState } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

const THAI_MONTHS = [
  { value: '01', label: 'มกราคม' },
  { value: '02', label: 'กุมภาพันธ์' },
  { value: '03', label: 'มีนาคม' },
  { value: '04', label: 'เมษายน' },
  { value: '05', label: 'พฤษภาคม' },
  { value: '06', label: 'มิถุนายน' },
  { value: '07', label: 'กรกฎาคม' },
  { value: '08', label: 'สิงหาคม' },
  { value: '09', label: 'กันยายน' },
  { value: '10', label: 'ตุลาคม' },
  { value: '11', label: 'พฤศจิกายน' },
  { value: '12', label: 'ธันวาคม' },
];

// Generate years from 2023 to 2030 (Thai years 2566 to 2573)
const YEARS = Array.from({ length: 8 }, (_, i) => {
  const yearAd = 2023 + i;
  const yearBe = yearAd + 543;
  return { value: yearAd.toString(), label: `พ.ศ. ${yearBe}` };
});

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export default function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Parse YYYY-MM-DD
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  const updateDate = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${newMonth}-${newDay}`);
    } else {
      onChange('');
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDay(val);
    updateDate(val, month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMonth(val);
    
    // Adjust day if exceeds maximum days
    let adjustedDay = day;
    if (day && year && val) {
      const maxDays = getDaysInMonth(parseInt(year), parseInt(val));
      if (parseInt(day) > maxDays) {
        adjustedDay = maxDays.toString().padStart(2, '0');
        setDay(adjustedDay);
      }
    }
    updateDate(adjustedDay, val, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYear(val);
    
    let adjustedDay = day;
    if (day && month && val) {
      const maxDays = getDaysInMonth(parseInt(val), parseInt(month));
      if (parseInt(day) > maxDays) {
        adjustedDay = maxDays.toString().padStart(2, '0');
        setDay(adjustedDay);
      }
    }
    updateDate(adjustedDay, month, val);
  };

  const maxDays = year && month ? getDaysInMonth(parseInt(year), parseInt(month)) : 31;
  const days = Array.from({ length: maxDays }, (_, i) => {
    const d = (i + 1).toString().padStart(2, '0');
    return { value: d, label: (i + 1).toString() };
  });

  return (
    <div className={`date-picker-selects-container ${error ? 'has-error' : ''}`}>
      <div className="date-selects-row" style={{ display: 'flex', gap: '6px', width: '100%' }}>
        <select
          value={day}
          onChange={handleDayChange}
          className="form-input"
          style={{ flex: 1, cursor: 'pointer' }}
        >
          <option value="">วัน</option>
          {days.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={handleMonthChange}
          className="form-input"
          style={{ flex: 2, cursor: 'pointer' }}
        >
          <option value="">เดือน</option>
          {THAI_MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={handleYearChange}
          className="form-input"
          style={{ flex: 1.5, cursor: 'pointer' }}
        >
          <option value="">ปี</option>
          {YEARS.map(y => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>
      </div>
      {error && <span className="error-text" style={{ marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}
