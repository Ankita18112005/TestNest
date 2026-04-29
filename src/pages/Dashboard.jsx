import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, Plus } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../components/Toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'bookings'));
        const bList = [];
        snap.forEach(doc => bList.push({ id: doc.id, ...doc.data() }));
        // sort descending
        bList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setBookings(bList);
      } catch (err) {
        console.warn("Could not fetch user bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your upcoming sessions and bookings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/book')} style={{ display: 'flex', gap: '0.5rem' }}>
          <Plus size={20} />
          Book New Session
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={24} />
          Your Bookings
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <p>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <Calendar size={48} opacity={0.2} style={{ margin: '0 auto 1rem auto' }} />
            <p>You don't have any bookings yet.</p>
            <button className="btn btn-outline" onClick={() => navigate('/book')} style={{ marginTop: '1rem' }}>
              Book your first session
            </button>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="booking-item-details">
                  <h4 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {booking.duration}-Hour Session 
                    {booking.status === 'Cancelled' ? <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>(Cancelled)</span> : null}
                  </h4>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Calendar size={14} />
                    {booking.date ? format(new Date(booking.date), 'MMMM d, yyyy') : 'Unknown Date'} &nbsp;•&nbsp;
                    <Clock size={14} />
                    {booking.time}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="status-badge" style={{ background: booking.status === 'Cancelled' ? '#f1f5f9' : '#dcfce7', color: booking.status === 'Cancelled' ? '#64748b' : '#16a34a', marginRight: '1rem' }}>
                    {booking.status}
                  </span>
                  
                  {booking.status !== 'Cancelled' && (
                    <>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} 
                        onClick={() => toast('To reschedule, please cancel and re-book a new session.', 'info')}
                      >
                         Reschedule
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderColor: '#ef4444', color: '#ef4444' }}
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to cancel this booking?")) {
                            try {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'users', user.uid, 'bookings', booking.id), { status: 'Cancelled' });
                              // Refresh
                              const updatedBookings = bookings.map(b => b.id === booking.id ? { ...b, status: 'Cancelled' } : b);
                              setBookings(updatedBookings);
                              toast('Booking cancelled successfully.', 'warning');
                            } catch (e) {
                              toast('Failed to cancel booking.', 'error');
                            }
                          }
                        }}
                      >
                         Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
