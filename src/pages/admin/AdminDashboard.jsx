import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isTomorrow, isBefore, isAfter, startOfToday } from 'date-fns';
import { Calendar, Clock, User, XCircle, Plus } from 'lucide-react';
import { collectionGroup, getDocs, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../components/Toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState('upcoming');
  const [showAddModal, setShowAddModal] = useState(false);
  const [freeEventData, setFreeEventData] = useState({ title: '', date: '', time: '', duration: 1 });
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) {
      navigate('/login');
      return;
    }

    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collectionGroup(db, 'bookings'));
      const bookings = [];
      snap.forEach(doc => bookings.push({ id: doc.id, ...doc.data(), ref: doc.ref }));
      setAllBookings(bookings);
    } catch (err) {
      console.warn("Could not fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) return null;

  const today = startOfToday();

  const filteredBookings = allBookings.filter(b => {
    if (!b.date) return false;
    const bDate = new Date(b.date);
    if (filter === 'past') return isBefore(bDate, today);
    if (filter === 'tomorrow') return isTomorrow(bDate);
    if (filter === 'upcoming') return isAfter(bDate, today) || isToday(bDate);
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleAddFreeEvent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users', user.uid, 'bookings'), {
        userId: user.uid,
        userName: freeEventData.title || 'Manual Session',
        userEmail: 'admin-manual',
        duration: parseInt(freeEventData.duration) || 1,
        date: new Date(freeEventData.date).toISOString(),
        time: freeEventData.time,
        utcDate: new Date(`${freeEventData.date}T${freeEventData.time}`).toISOString(),
        status: 'Confirmed',
        isManual: true,
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFreeEventData({ title: '', date: '', time: '', duration: 1 });
      toast('Session added successfully!', 'success');
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast('Failed to add session.', 'error');
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(editingBooking.ref, {
        userName: editingBooking.userName,
        date: new Date(editingBooking.date).toISOString(),
        time: editingBooking.time,
        duration: parseInt(editingBooking.duration) || 1,
        utcDate: new Date(`${editingBooking.date}T${editingBooking.time}`).toISOString()
      });
      setEditingBooking(null);
      toast('Session updated successfully!', 'success');
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast('Failed to update session.', 'error');
    }
  };

  const cancelBooking = async (booking) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(booking.ref, { status: 'Cancelled' });
        toast('Booking cancelled.', 'warning');
        fetchBookings();
      } catch (err) {
        toast('Failed to cancel booking.', 'error');
      }
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', gap: '0.5rem' }}>
          <Plus size={20} /> Add Manual Session
        </button>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['past', 'tomorrow', 'upcoming'].map(tab => (
          <button
            key={tab}
            className={`btn ${filter === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="booking-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading sessions...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={48} opacity={0.2} style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No sessions found for this category.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {booking.isManual ? <span className="status-badge" style={{ background: '#3b82f620', color: '#3b82f6' }}>Manual</span> : null}
                  {booking.userName}
                  {booking.status === 'Cancelled' ? <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>(Cancelled)</span> : null}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} /> 
                    {/* Link to client */}
                    <Link to="/admin/clients" style={{ color: 'var(--primary-accent)', textDecoration: 'none' }}>{booking.userEmail}</Link>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {format(new Date(booking.date), 'MMM d, yyyy')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {booking.time} ({booking.duration}h)</span>
                </p>
                {booking.requirements && (
                   <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                     Notes: {booking.requirements}
                   </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem' }} 
                  onClick={() => setEditingBooking({ ...booking, date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '' })}
                >
                   Edit
                </button>
                {booking.status !== 'Cancelled' && (
                  <button 
                    className="btn btn-outline" 
                    style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => cancelBooking(booking)}
                  >
                    <XCircle size={16} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add Manual Session</h3>
            <form onSubmit={handleAddFreeEvent}>
              <div className="input-group">
                <label className="input-label">Client Name / Session Title</label>
                <input type="text" className="input-field" required value={freeEventData.title} onChange={e => setFreeEventData({...freeEventData, title: e.target.value})} />
              </div>
              <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                   <label className="input-label">Date</label>
                   <input type="date" className="input-field" required value={freeEventData.date} onChange={e => setFreeEventData({...freeEventData, date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                   <label className="input-label">Time</label>
                   <input type="time" className="input-field" required value={freeEventData.time} onChange={e => setFreeEventData({...freeEventData, time: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                 <label className="input-label">Duration (Hours)</label>
                 <select className="input-field" value={freeEventData.duration} onChange={e => setFreeEventData({...freeEventData, duration: e.target.value})}>
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                 </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Edit Session</h3>
            <form onSubmit={handleUpdateBooking}>
              <div className="input-group">
                <label className="input-label">Client Name / Session Title</label>
                <input type="text" className="input-field" required value={editingBooking.userName} onChange={e => setEditingBooking({...editingBooking, userName: e.target.value})} />
              </div>
              <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                   <label className="input-label">Date</label>
                   <input type="date" className="input-field" required value={editingBooking.date} onChange={e => setEditingBooking({...editingBooking, date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                   <label className="input-label">Time</label>
                   <input type="time" className="input-field" required value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                 <label className="input-label">Duration (Hours)</label>
                 <select className="input-field" value={editingBooking.duration} onChange={e => setEditingBooking({...editingBooking, duration: e.target.value})}>
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                 </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingBooking(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
