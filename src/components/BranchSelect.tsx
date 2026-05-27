'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BRANCHES } from '@/lib/branches';
import { Search, ChevronDown, Check } from 'lucide-react';

interface BranchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
  label?: string;
  error?: string;
}

export default function BranchSelect({
  value,
  onChange,
  placeholder = "เลือกสาขา...",
  id,
  label,
  error
}: BranchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<string[]>(BRANCHES);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal search text with value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filter branches when search term changes, only when menu is open and typing
  useEffect(() => {
    if (isOpen) {
      const match = searchTerm.trim().toLowerCase();
      if (!match) {
        setFilteredBranches(BRANCHES);
      } else {
        const filtered = BRANCHES.filter(branch =>
          branch.toLowerCase().includes(match)
        );
        setFilteredBranches(filtered);
      }
    }
  }, [searchTerm, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to current value if they click outside without choosing
        setSearchTerm(value);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value]);

  const handleSelect = (branch: string) => {
    onChange(branch);
    setSearchTerm(branch);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(''); // Clear input on focus to allow easier searching
  };

  const handleBlur = () => {
    // Wait a brief moment to allow click event to register on options list
    setTimeout(() => {
      if (containerRef.current && !document.activeElement?.closest('.branch-select-container')) {
        setIsOpen(false);
        setSearchTerm(value);
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
                const isSelected = branch === value;
                return (
                  <li
                    key={branch}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur from resetting before select registers
                      handleSelect(branch);
                    }}
                  >
                    <span>{branch}</span>
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
