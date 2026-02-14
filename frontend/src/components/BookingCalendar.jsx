import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter,
  RefreshCcw
} from 'lucide-react';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const BookingCalendar = ({ 
  availabilityData, 
  onSelectSlot, 
  selectedSlot,
  subjects = [],
  onSubjectChange,
  onDurationChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [filterSubject, setFilterSubject] = useState(subjects[0] || '');
  const [filterDuration, setFilterDuration] = useState(60); // minutes
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  // Swipe logic for mobile
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    
    if (distance > 50) nextMonth(); // Swipe left -> next month
    if (distance < -50) prevMonth(); // Swipe right -> prev month
    setTouchStart(null);
  };

  // Calendar logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Check if a specific date and hour is available
  const getSlotStatus = (date, hour) => {
    if (!availabilityData) return 'unavailable';
    
    const dayName = DAYS_ID[date.getDay()];
    const isBaseAvailable = availabilityData[dayName]?.includes(hour) || 
                           availabilityData[dayName]?.includes(hour.toString());
    
    if (!isBaseAvailable) return 'unavailable';
    
    // In a real app, we would check against existing bookings here
    // For now, let's simulate some 'full' slots
    const isFull = Math.random() > 0.9; // 10% chance a slot is full
    return isFull ? 'full' : 'available';
  };

  // Check if a day has any available slots
  const getDayAvailability = (day) => {
    const date = new Date(year, month, day);
    const dayName = DAYS_ID[date.getDay()];
    const hours = availabilityData?.[dayName] || [];
    
    if (hours.length === 0) return 'none';
    
    // Check if any hour is actually available (not full)
    const hasAvailable = hours.some(h => getSlotStatus(date, h) === 'available');
    return hasAvailable ? 'available' : 'full';
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, status: 'empty' });
    }

    // Days of month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ 
        day: i, 
        status: getDayAvailability(i)
      });
    }

    return days;
  }, [year, month, availabilityData]);

  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(year, month, day);
    setSelectedDate(date);
    if (window.innerWidth < 768) {
      setViewMode('list');
    }
  };

  const handleSlotClick = (hour) => {
    if (!selectedDate) return;
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour, 0, 0, 0);
    
    // Log activity
    console.log(`[Activity Log] Slot Selected: ${dateTime.toISOString()} | Subject: ${filterSubject} | Duration: ${filterDuration}m`);
    
    onSelectSlot({
      scheduled_at: dateTime.toISOString().slice(0, 16), // Format for datetime-local
      subject: filterSubject,
      duration: filterDuration
    });
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-200">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          Kalender Booking
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <Filter size={14} className="text-slate-400 ml-2" />
            <select 
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0"
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                onSubjectChange?.(e.target.value);
              }}
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <Clock size={14} className="text-slate-400 ml-2" />
            <select 
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0"
              value={filterDuration}
              onChange={(e) => {
                const dur = Number(e.target.value);
                setFilterDuration(dur);
                onDurationChange?.(dur);
              }}
            >
              <option value={30}>30 Menit</option>
              <option value={60}>60 Menit</option>
              <option value={90}>90 Menit</option>
              <option value={120}>120 Menit</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Calendar Grid */}
        <div 
          className={`lg:col-span-4 ${viewMode === 'list' && window.innerWidth < 768 ? 'hidden' : 'block'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-black text-slate-900 flex items-center gap-2">
              {MONTHS_ID[month]} {year}
              {loading && <RefreshCcw size={16} className="animate-spin text-primary" />}
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase pb-2">
                {d}
              </div>
            ))}
            
            {calendarDays.map((d, idx) => {
              const isToday = d.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSelected = selectedDate && d.day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
              
              return (
                <button
                  key={idx}
                  disabled={d.status === 'empty'}
                  onClick={() => handleDateClick(d.day)}
                  className={`
                    relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all
                    ${d.status === 'empty' ? 'invisible' : 'hover:scale-105'}
                    ${isSelected ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20 scale-110 z-10' : 'bg-white border border-slate-100'}
                    ${d.status === 'available' && !isSelected ? 'text-slate-700' : ''}
                    ${d.status === 'none' && !isSelected ? 'bg-slate-50 text-slate-300 opacity-50' : ''}
                    ${d.status === 'full' && !isSelected ? 'bg-rose-50 text-rose-300' : ''}
                  `}
                >
                  {d.day}
                  {d.status === 'available' && !isSelected && (
                    <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  )}
                  {d.status === 'full' && !isSelected && (
                    <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-rose-400"></div>
                  )}
                  {isToday && !isSelected && (
                    <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              Tersedia
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-400"></div>
              Penuh
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-slate-200"></div>
              Tidak Aktif
            </div>
          </div>
        </div>

        {/* Time Slots / List View */}
        <div className={`lg:col-span-3 ${viewMode === 'calendar' && window.innerWidth < 768 ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-slate-900">
              {selectedDate ? `${selectedDate.getDate()} ${MONTHS_ID[selectedDate.getMonth()]}` : 'Pilih Tanggal'}
            </h4>
            {window.innerWidth < 768 && (
              <button 
                onClick={() => setViewMode('calendar')}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Kembali
              </button>
            )}
          </div>

          {selectedDate ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {DAYS_ID[selectedDate.getDay()]}
              {availabilityData?.[DAYS_ID[selectedDate.getDay()]]?.length > 0 ? (
                availabilityData[DAYS_ID[selectedDate.getDay()]].map(hour => {
                  const status = getSlotStatus(selectedDate, hour);
                  const isSelected = selectedSlot?.scheduled_at === `${selectedDate.toISOString().slice(0, 10)}T${hour.toString().padStart(2, '0')}:00`;
                  
                  return (
                    <button
                      key={hour}
                      disabled={status !== 'available'}
                      onClick={() => handleSlotClick(hour)}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group
                        ${status === 'available' 
                          ? isSelected 
                            ? 'border-primary bg-primary text-white shadow-md' 
                            : 'border-slate-100 bg-white hover:border-primary hover:bg-primary/5' 
                          : 'border-slate-50 bg-slate-50 opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={18} className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
                        <span className="font-bold text-sm">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                      </div>
                      
                      {status === 'available' ? (
                        isSelected ? <CheckCircle2 size={18} /> : <div className="text-[10px] font-black uppercase text-emerald-500">Pilih</div>
                      ) : (
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          {status === 'full' ? 'Penuh' : 'Libur'}
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Info className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">Guru tidak memiliki jadwal<br/>di hari ini.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <CalendarIcon className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400">Silakan pilih tanggal di kalender<br/>untuk melihat jam tersedia.</p>
            </div>
          )}

          {selectedDate && (
            <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-[10px] leading-relaxed text-blue-700 font-medium">
                Sesi belajar akan berlangsung selama <strong>{filterDuration} menit</strong>. Pastikan Anda sudah menyiapkan materi yang ingin dibahas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
