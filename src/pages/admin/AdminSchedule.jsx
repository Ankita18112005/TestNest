import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Save, X, Plus } from 'lucide-react';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [schedule, setSchedule] = useState({});
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const timezones = Intl.supportedValuesOf('timeZone');

  useEffect(() => {
    if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) {
      navigate('/login');
      return;
    }

    const fetchSchedule = async () => {
      try {
        const snap = await getDocs(collection(db, 'schedule'));
        const schedData = {};
        
        DAYS.forEach(d => schedData[d.toLowerCase()] = []);
        
        snap.forEach(doc => {
          const data = doc.data();
          const key = (data.dayOfWeek || doc.id).toLowerCase();
          
          // Legacy support (array of strings -> array of objects)
          let intervals = data.intervals || [];
          if (intervals.length > 0 && typeof intervals[0] === 'string') {
             // Convert legacy ['09:00', '10:00'] into [{start: '09:00', end: '10:00'}]
             intervals = intervals.map(t => ({ start: t, end: String(parseInt(t.split(':')[0])+1).padStart(2, '0') + ':00' }));
          }

          schedData[key] = intervals;
          if (data.timezone && key === 'monday') {
             setTimezone(data.timezone);
          }
        });
        
        setSchedule(schedData);
      } catch (err) {
        console.warn("Could not fetch schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, [user, navigate]);

  const toggleDay = (day) => {
    const key = day.toLowerCase();
    const newSchedule = { ...schedule };
    if (newSchedule[key] && newSchedule[key].length > 0) {
      newSchedule[key] = []; // disable
    } else {
      newSchedule[key] = [{ start: '09:00', end: '17:00' }]; // enable with default
    }
    setSchedule(newSchedule);
  };

  const updateInterval = (day, index, field, value) => {
    const key = day.toLowerCase();
    const newSchedule = { ...schedule };
    newSchedule[key][index][field] = value;
    setSchedule(newSchedule);
  };

  const addInterval = (day) => {
    const key = day.toLowerCase();
    const newSchedule = { ...schedule };
    newSchedule[key].push({ start: '09:00', end: '17:00' });
    setSchedule(newSchedule);
  };

  const removeInterval = (day, index) => {
    const key = day.toLowerCase();
    const newSchedule = { ...schedule };
    newSchedule[key].splice(index, 1);
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      for (const day of DAYS) {
        await setDoc(doc(db, 'schedule', day.toLowerCase()), {
          dayOfWeek: day,
          intervals: schedule[day.toLowerCase()] || [],
          timezone: timezone
        });
      }
      toast('Schedule saved successfully!', 'success');
    } catch (err) {
      console.error("Failed to save schedule:", err);
      toast('Failed to save schedule.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Availability Settings</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            Manage your weekly hours and date overrides.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={timezone} 
            onChange={(e) => setTimezone(e.target.value)}
            className="input-field"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', minWidth: '200px' }}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <button 
            className="btn btn-primary" 
            onClick={saveSchedule} 
            disabled={saving || loading} 
            style={{ borderRadius: '999px', padding: '0.5rem 1.5rem', fontWeight: '500' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading schedule...</div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Weekly Hours</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DAYS.map(day => {
              const key = day.toLowerCase();
              const isActive = schedule[key] && schedule[key].length > 0;
              
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'flex-start', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: isActive ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                  
                  {/* Checkbox and Day Label */}
                  <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={() => toggleDay(day)}
                      style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                    />
                    <span style={{ fontWeight: isActive ? '600' : '400', color: isActive ? 'inherit' : 'var(--text-secondary)' }}>
                      {day}
                    </span>
                  </div>
                  
                  {/* Intervals */}
                  <div style={{ flex: 1 }}>
                    {!isActive ? (
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Unavailable</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {schedule[key].map((interval, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input 
                              type="time" 
                              className="input-field" 
                              value={interval.start}
                              onChange={(e) => updateInterval(day, idx, 'start', e.target.value)}
                              style={{ width: '120px', padding: '0.5rem', background: 'transparent' }}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                            <input 
                              type="time" 
                              className="input-field" 
                              value={interval.end}
                              onChange={(e) => updateInterval(day, idx, 'end', e.target.value)}
                              style={{ width: '120px', padding: '0.5rem', background: 'transparent' }}
                            />
                            <button 
                              onClick={() => removeInterval(day, idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                              title="Remove limit"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => addInterval(day)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', alignSelf: 'flex-start', padding: '0.5rem 0', marginTop: '0.25rem' }}
                        >
                          <Plus size={14} /> Add limit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
