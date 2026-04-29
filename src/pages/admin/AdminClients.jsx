import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Mail, Calendar as CalendarIcon, ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';

const AdminClients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState({ bookings: [], payments: [] });

  useEffect(() => {
    if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) {
      navigate('/login');
      return;
    }

    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = [];
        snap.forEach(doc => {
          const data = doc.data();
          if (data.role !== 'admin') {
            users.push({ id: doc.id, ...data });
          }
        });
        setClients(users);
      } catch (err) {
        console.warn("Could not fetch clients", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [user, navigate]);

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    try {
      const bSnap = await getDocs(collection(db, 'users', client.id, 'bookings'));
      const pSnap = await getDocs(collection(db, 'users', client.id, 'payments'));
      
      const bookings = [];
      const payments = [];
      bSnap.forEach(doc => bookings.push({ id: doc.id, ...doc.data() }));
      pSnap.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
      
      setClientData({ bookings, payments });
    } catch (err) {
      console.warn("Could not fetch client data", err);
    }
  };

  if (!user || !user.isAdmin) return null;

  if (selectedClient) {
    return (
      <div className="container fade-in">
        <button onClick={() => setSelectedClient(null)} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <ArrowLeft size={18} /> Back to Directory
        </button>
        
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{selectedClient.name}</h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Mail size={16} /> {selectedClient.email}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-accent)" /> Bookings
            </h3>
            {clientData.bookings.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No bookings found.</p>
            ) : (
              clientData.bookings.map(b => (
                <div key={b.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{format(new Date(b.date), 'MMM d, yyyy')}</strong> at {b.time} ({b.duration}h)
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Status: {b.status}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="#10b981" /> Payments
            </h3>
            {clientData.payments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No payments found.</p>
            ) : (
              clientData.payments.map(p => (
                <div key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>${p.amount}</strong> {p.currency}
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Status: {p.status} | Booking ID: {p.bookingId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={24} style={{ color: 'var(--primary-accent)' }} />
          <h3 style={{ margin: 0 }}>Client Directory ({clients.length})</h3>
        </div>

        {loading ? (
           <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading clients...</p>
        ) : clients.length === 0 ? (
           <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No clients found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {clients.map(client => (
              <div 
                key={client.id} 
                onClick={() => handleClientClick(client)}
                style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                className="hover:shadow-md"
              >
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>{client.name || 'Anonymous User'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} /> {client.email}
                  </span>
                  {client.createdAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon size={14} /> Joined: {format(new Date(client.createdAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary-accent)', fontWeight: '500' }}>
                  Click to view sessions &rarr;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClients;
