'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id: string;
  label?: React.ReactNode;
  error?: string;
  noOptionsText?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "เลือก...",
  id,
  label,
  error,
  noOptionsText = "ไม่พบข้อมูลที่ค้นหา"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal search text with value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filter options when search term changes, only when menu is open and typing
  useEffect(() => {
    if (isOpen) {
      const match = searchTerm.trim().toLowerCase();
      if (!match) {
        setFilteredOptions(options);
      } else {
        const filtered = options.filter(option =>
          option.toLowerCase().includes(match)
        );
        setFilteredOptions(filtered);
      }
    }
  }, [searchTerm, isOpen, options]);

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

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
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
      if (containerRef.current && !document.activeElement?.closest('.searchable-select-container')) {
        setIsOpen(false);
        setSearchTerm(value);
      }
    }, 150);
  };

  return (
    <div className={`branch-select-container searchable-select-container ${error ? 'has-error' : ''}`} ref={containerRef} id={`container-${id}`}>
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
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option === value;
                return (
                  <li
                    key={option}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur from resetting before select registers
                      handleSelect(option);
                    }}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </li>
                );
              })
            ) : (
              <li className="no-options-item">{noOptionsText}</li>
            )}
          </ul>
        )}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
