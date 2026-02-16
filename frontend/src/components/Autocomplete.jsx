import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

const Autocomplete = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  className = "",
  suggestionClassName = "",
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  }, [searchTerm, options]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange({ target: { name, value: val } });
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    setSearchTerm(option);
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="group relative">
        {Icon && (
          <Icon className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
        )}
        <input
          type="text"
          name={name}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-12 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-primary/5"
          placeholder={placeholder}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              onChange({ target: { name, value: "" } });
            }}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl ${suggestionClassName}`}
          >
            <ul className="max-h-60 overflow-y-auto py-2">
              {filteredOptions.map((option, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className="w-full px-5 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Autocomplete;
