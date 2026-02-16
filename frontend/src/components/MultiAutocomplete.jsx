import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, RefreshCw } from 'lucide-react';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const MultiAutocomplete = ({ 
  options, 
  value = [], // Expected to be an array of objects {id, name}
  onChange, 
  placeholder, 
  icon: Icon,
  className = "",
  suggestionClassName = "",
  name,
  loading = false,
  error = null,
  maxSelections = null,
  debounceTime = 300,
  disabled = false,
  allowCreate = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Filter options based on debounced search term
    const query = debouncedSearchTerm.toLowerCase();
    
    let filtered = [];
    if (query) {
      filtered = options.filter(option => 
        option.name.toLowerCase().includes(query) &&
        !value.some(selected => selected.id === option.id)
      );
    } else if (isOpen) {
      // Show all available options when focused and empty
      filtered = options.filter(option => 
        !value.some(selected => selected.id === option.id)
      );
    }
    
    // Handle create new option
    if (allowCreate && query) {
      const exactMatch = filtered.some(opt => opt.name.toLowerCase() === query);
      const alreadySelected = value.some(v => v.name.toLowerCase() === query);
      
      if (!exactMatch && !alreadySelected) {
        filtered.push({ 
          id: `new-${query}-${Date.now()}`, 
          name: debouncedSearchTerm, // Use the actual text entered
          isNew: true 
        });
      }
    }
    
    setFilteredOptions(filtered);
    setActiveIndex(-1); // Reset active index when options change
  }, [debouncedSearchTerm, options, value, isOpen, allowCreate]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    if (maxSelections && value.length >= maxSelections) return;

    const newOption = option.isNew ? { id: option.name, name: option.name } : option;
    const newValue = [...value, newOption];
    
    onChange({ target: { name, value: newValue } });
    setSearchTerm("");
    // Keep focus for more selections if limit not reached
    if (!maxSelections || newValue.length < maxSelections) {
      inputRef.current?.focus();
    } else {
      setIsOpen(false);
    }
  };

  const handleRemoveTag = (optionId) => {
    const newValue = value.filter(item => item.id !== optionId);
    onChange({ target: { name, value: newValue } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && searchTerm === "" && value.length > 0) {
      handleRemoveTag(value[value.length - 1].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
        handleSelectOption(filteredOptions[activeIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const isLimitReached = maxSelections && value.length >= maxSelections;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className={`group relative flex flex-wrap items-center gap-2 rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-2 transition-all focus-within:border-primary/30 focus-within:bg-white focus-within:ring-8 focus-within:ring-primary/5 ${error ? 'border-red-200 bg-red-50/30' : ''} ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
        onClick={() => !disabled && !isLimitReached && inputRef.current?.focus()}
      >
        
        {/* Selected Tags */}
        <AnimatePresence>
          {value.map((item) => (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary border border-primary/10"
            >
              {item.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(item.id);
                  }}
                  className="hover:text-primary-dark transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        <div className="flex-1 flex items-center min-w-[120px]">
          {Icon && (
            <Icon className="ml-2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => !disabled && !isLimitReached && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLimitReached}
            className="w-full bg-transparent py-2 px-3 text-sm font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
            placeholder={isLimitReached ? "Batas maksimal tercapai" : (value.length === 0 ? placeholder : "")}
            autoComplete="off"
          />
        </div>

        {loading && (
          <div className="absolute right-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <RefreshCw size={18} className="text-slate-400" />
            </motion.div>
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-red-500 pl-4">{error}</p>}

      <AnimatePresence>
        {isOpen && (filteredOptions.length > 0 || (searchTerm && filteredOptions.length === 0) || loading) && !isLimitReached && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl ${suggestionClassName}`}
          >
            <ul ref={listRef} className="max-h-60 overflow-y-auto py-2">
              {loading ? (
                <li className="px-5 py-4 text-center text-sm text-slate-400 font-medium flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Memuat data...
                </li>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-bold transition-colors ${
                        index === activeIndex ? 'bg-slate-50 text-primary' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option.isNew ? `Tambah "${option.name}"` : option.name}
                      {!option.isNew && (
                        <Check 
                          size={16} 
                          className={`text-primary transition-opacity ${
                            index === activeIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`} 
                        />
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-5 py-4 text-center text-sm text-slate-400 font-medium">
                  Tidak ada hasil ditemukan
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiAutocomplete;