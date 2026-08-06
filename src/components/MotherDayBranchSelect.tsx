'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface BranchOption {
  code: string;
  name: string;
}

interface MotherDayBranchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
  label?: React.ReactNode;
  error?: string;
}

export default function MotherDayBranchSelect({
  value,
  onChange,
  placeholder = "พิมพ์รหัสหรือชื่อสาขาเพื่อค้นหา...",
  id,
  label,
  error,
}: MotherDayBranchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch branches from API (sorted by code)
  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data: BranchOption[]) => {
        if (Array.isArray(data)) {
          setBranches(data);
          setFilteredBranches(data);
        }
      })
      .catch((err) => console.error('Failed to fetch branches:', err));
  }, []);

  // Sync display text with selected value
  useEffect(() => {
    if (value) {
      const selected = branches.find((b) => b.code === value);
      setSearchTerm(selected ? `${selected.code} - ${selected.name}` : value);
    } else {
      setSearchTerm('');
    }
  }, [value, branches]);

  // Filter when typing
  useEffect(() => {
    if (!isOpen) return;
    const match = searchTerm.trim().toLowerCase();
    if (!match) {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(
        branches.filter(
          (b) =>
            b.code.toLowerCase().includes(match) ||
            b.name.toLowerCase().includes(match)
        )
      );
    }
  }, [searchTerm, isOpen, branches]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetDisplay();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, branches]);

  const resetDisplay = () => {
    if (value) {
      const selected = branches.find((b) => b.code === value);
      setSearchTerm(selected ? `${selected.code} - ${selected.name}` : value);
    } else {
      setSearchTerm('');
    }
  };

  const handleSelect = (branch: BranchOption) => {
    onChange(branch.code);
    setSearchTerm(`${branch.code} - ${branch.name}`);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (containerRef.current && !document.activeElement?.closest('.branch-select-container')) {
        setIsOpen(false);
        resetDisplay();
      }
    }, 150);
  };

  return (
    <div className={`branch-select-container ${error ? 'has-error' : ''}`} ref={containerRef} id={`container-${id}`}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <div className="combobox-wrapper">
        <div className="input-with-icon">
          <Search size={18} className="search-icon" />
          <input
            id={id}
            type="text"
            className="combobox-input"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete="off"
          />
          <button
            type="button"
            className="dropdown-trigger-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle options"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {isOpen && (
          <ul className="options-list">
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => {
                const isSelected = branch.code === value;
                return (
                  <li
                    key={branch.code}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(branch);
                    }}
                  >
                    <span>{branch.code} - {branch.name}</span>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </li>
                );
              })
            ) : (
              <li className="no-options-item">ไม่พบข้อมูลสาขาที่ค้นหา</li>
            )}
          </ul>
        )}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
