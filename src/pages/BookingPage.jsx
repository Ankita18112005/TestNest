import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Globe } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

const BookingPage = () => {
  const [duration, setDuration] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timezones for the dropdown
  const timezones = Intl.supportedValuesOf('timeZone');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        // Fetch Schedule
        const schedSnap = await getDocs(collection(db, 'schedule'));
        const schedData = {};
        schedSnap.forEach(doc => {
          const data = doc.data();
          const key = (data.dayOfWeek || doc.id).toLowerCase();
          schedData[key] = data.intervals || [];
        });
        
        // Fallback for demo if schedule collection is empty
        if (Object.keys(schedData).length === 0) {
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            schedData[day] = [{start: '09:00', end: '17:00'}];
          });
        }
        setSchedule(schedData);

        // Fetch Bookings from collectionGroup
        const { collectionGroup } = await import('firebase/firestore');
        const bookingsSnap = await getDocs(collectionGroup(db, 'bookings'));
        const bookingsData = [];
        bookingsSnap.forEach(doc => {
          bookingsData.push({ id: doc.id, ...doc.data() });
        });
        setBookings(bookingsData);
        
      } catch (err) {
        console.error("Error fetching schedule/bookings:", err);
        const schedData = {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
          schedData[day] = [{start: '09:00', end: '17:00'}];
        });
        setSchedule(schedData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const today = startOfToday();

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || Object.keys(schedule).length === 0) return [];
    
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    const intervals = schedule[dayOfWeek] || [];
    
    const slots = [];
    
    intervals.forEach(interval => {
      // Legacy support check
      const startStr = typeof interval === 'string' ? interval : interval.start;
      const endStr = typeof interval === 'string' ? String(parseInt(interval.split(':')[0])+1).padStart(2,'0')+':00' : interval.end;
      
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      for (let current = startMinutes; current + (duration * 60) <= endMinutes; current += 60) {
        const hours = Math.floor(current / 60);
        const minutes = current % 60;
        
        // Schedule intervals are treated as UTC
        const dateInUtc = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes));
        
        // Filter out past time slots
        if (dateInUtc.getTime() < new Date().getTime()) continue;

        const formattedTime = formatInTimeZone(dateInUtc, userTimezone, 'hh:mm a');
        
        // Overlap logic check
        const isBooked = bookings.some(b => {
           if (!b.utcDate || b.status === 'Cancelled') return false; 
           
           const bUtc = new Date(b.utcDate).getTime();
           const sUtc = dateInUtc.getTime();
           
           const bEndUtc = bUtc + ((b.duration || 1) * 60 * 60 * 1000);
           const sEndUtc = sUtc + (duration * 60 * 60 * 1000);
           
           return bUtc < sEndUtc && sUtc < bEndUtc;
        });
        
        if (!isBooked) {
           slots.push({
             displayTime: formattedTime,
             utcDate: dateInUtc
           });
        }
      }
    });
    
    return slots;
  }, [selectedDate, schedule, bookings, duration, userTimezone]);

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      navigate('/checkout', { 
        state: { 
          date: selectedDate, 
          time: selectedTime.displayTime, 
          utcDate: selectedTime.utcDate.toISOString(),
          duration 
        } 
      });
    }
  };

  return (
    <div className="container fade-in">
      <div className="booking-container">
        
        {/* Timezone Selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={18} color="var(--text-secondary)" />
          <select 
            value={userTimezone} 
            onChange={(e) => {
              setUserTimezone(e.target.value);
              setSelectedTime(null); // Reset selected time if timezone changes
            }}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1>Book a Session</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select duration, date and time for your session with me</p>
        </div>

        <div className="duration-selector">
          <button 
            className={`duration-btn ${duration === 1 ? 'active' : ''}`}
            onClick={() => {
              setDuration(1);
              setSelectedTime(null);
            }}
          >
            <Clock size={24} />
            1 Hour Session
          </button>
          <button 
            className={`duration-btn ${duration === 2 ? 'active' : ''}`}
            onClick={() => {
              setDuration(2);
              setSelectedTime(null);
            }}
          >
            <Clock size={24} />
            2 Hour Session
          </button>
        </div>

        <div className="calendar-section">
          {/* Calendar Box */}
          <div className="calendar-wrapper card">
            <div className="calendar-header">
              <button onClick={handlePrevMonth} className="calendar-nav-btn"><ChevronLeft /></button>
              <h3 style={{ margin: 0 }}>{format(currentDate, 'MMMM yyyy')}</h3>
              <button onClick={handleNextMonth} className="calendar-nav-btn"><ChevronRight /></button>
            </div>
            
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {/* Fill empty spaces before 1st day of month */}
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {daysInMonth.map((date, i) => {
                const isDisabled = isBefore(date, today);
                const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
                
                return (
                  <div 
                    key={i} 
                    className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }
                    }}
                  >
                    {format(date, 'd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slots Box */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
            </h3>
            
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Loading schedule...
              </div>
            ) : selectedDate ? (
              <div className="time-slots">
                {availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot, index) => {
                    const isSelected = selectedTime && selectedTime.utcDate.getTime() === slot.utcDate.getTime();
                    return (
                      <button 
                        key={index}
                        className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot.displayTime}
                      </button>
                    )
                  })
                ) : (
                  <div style={{ padding: '2rem 0', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    No available time slots for this date.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Please select a date from the calendar to see available times.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', maxWidth: '300px', padding: '1rem' }}
            disabled={!selectedDate || !selectedTime}
            onClick={handleBooking}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
