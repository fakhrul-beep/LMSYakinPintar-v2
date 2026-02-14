import React, { useState, useEffect } from 'react';
import { Check, Clock, Calendar, X, AlertCircle } from 'lucide-react';

const DAYS = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const AvailabilityPicker = ({ value, onChange, error }) => {
  // Parse initial value if it's a string (from legacy data or JSON stringified)
  const parseValue = (val) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      console.warn("Failed to parse availability JSON, returning empty object", e);
      return {};
    }
  };

  const [availability, setAvailability] = useState(parseValue(value));
  const [activeDay, setActiveDay] = useState(DAYS[0]);

  useEffect(() => {
    setAvailability(parseValue(value));
  }, [value]);

  const toggleDay = (day) => {
    const newAvailability = { ...availability };
    if (newAvailability[day]) {
      delete newAvailability[day];
    } else {
      newAvailability[day] = [];
    }
    setAvailability(newAvailability);
    onChange(newAvailability);
  };

  const toggleHour = (day, hour) => {
    const newAvailability = { ...availability };
    if (!newAvailability[day]) {
      newAvailability[day] = [hour];
    } else {
      const hours = [...newAvailability[day]];
      const index = hours.indexOf(hour);
      if (index > -1) {
        hours.splice(index, 1);
      } else {
        hours.push(hour);
      }
      newAvailability[day] = hours.sort((a, b) => a - b);
    }
    setAvailability(newAvailability);
    onChange(newAvailability);
  };

  const isDaySelected = (day) => !!availability[day];
  const isHourSelected = (day, hour) => availability[day]?.includes(hour);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          Atur Jadwal Ketersediaan
        </label>
        {error && (
          <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full border border-red-100">
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </div>

      {/* Days Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => {
              if (!isDaySelected(day)) toggleDay(day);
              setActiveDay(day);
            }}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${
              isDaySelected(day)
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
            } ${activeDay === day ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            aria-label={`Pilih hari ${day}`}
            aria-pressed={isDaySelected(day)}
          >
            <span className="text-sm font-bold">{day}</span>
            {isDaySelected(day) && (
              <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg border-2 border-white">
                <Check size={10} strokeWidth={4} />
              </div>
            )}
            <div className="mt-2 text-[10px] font-medium opacity-60">
              {availability[day]?.length || 0} Jam
            </div>
          </button>
        ))}
      </div>

      {/* Hours Grid for Active Day */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Jam Mengajar: {activeDay}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Klik pada jam untuk memilih ketersediaan Anda</p>
            </div>
          </div>
          {isDaySelected(activeDay) && (
            <button
              type="button"
              onClick={() => toggleDay(activeDay)}
              className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <X size={14} />
              Hapus Hari Ini
            </button>
          )}
        </div>

        {!isDaySelected(activeDay) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Calendar className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">Hari ini belum diaktifkan</p>
            <button
              type="button"
              onClick={() => toggleDay(activeDay)}
              className="mt-4 px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 hover:bg-accent transition-all"
            >
              Aktifkan {activeDay}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => toggleHour(activeDay, hour)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  isHourSelected(activeDay, hour)
                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/10'
                    : 'border-white bg-white text-slate-500 hover:border-slate-200 hover:shadow-sm'
                }`}
                aria-label={`Jam ${hour.toString().padStart(2, '0')}:00`}
                aria-pressed={isHourSelected(activeDay, hour)}
              >
                <span className="text-xs font-bold">{hour.toString().padStart(2, '0')}:00</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1 bg-blue-100 text-blue-600 rounded-lg">
            <Check size={14} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-900">Ringkasan Ketersediaan</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(availability).length === 0 ? (
                <p className="text-[11px] text-blue-700 italic">Belum ada jadwal yang dipilih.</p>
              ) : (
                Object.entries(availability).map(([day, hours]) => (
                  hours.length > 0 && (
                    <div key={day} className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-800 shadow-sm">
                      {day}: {hours.length} Jam
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPicker;
