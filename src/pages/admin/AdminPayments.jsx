import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';

const AdminPayments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) {
      navigate('/login');
      return;
    }

    const fetchPayments = async () => {
      try {
        const snap = await getDocs(collectionGroup(db, 'payments'));
        const pList = [];
        snap.forEach(doc => {
           // We can get userId from the ref path: users/{userId}/payments/{paymentId}
           const parentPath = doc.ref.parent.parent;
           const userId = parentPath ? parentPath.id : 'unknown';
           
           pList.push({ id: doc.id, userId, ...doc.data() });
        });
        
        // Sort by date descending
        pList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPayments(pList);
      } catch (err) {
        console.warn("Could not fetch payments:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [user, navigate]);

  if (!user || !user.isAdmin) return null;

  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="fade-in">

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Total Revenue</p>
            <h2 style={{ margin: 0 }}>${totalRevenue.toLocaleString()}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1rem', borderRadius: '50%' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Transactions</p>
            <h2 style={{ margin: 0 }}>{payments.length}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '1rem', borderRadius: '50%' }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Paying Clients</p>
            <h2 style={{ margin: 0 }}>{new Set(payments.map(p => p.clientEmail)).size}</h2>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h3>
        {loading ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading payments...</div>
        ) : payments.length === 0 ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Transaction ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Client</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{payment.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>
                        {/* Link to client */}
                        <Link to="/admin/clients" style={{ color: 'var(--primary-accent)', textDecoration: 'none' }}>
                          {payment.clientName || 'Unknown'}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{payment.clientEmail}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>{payment.date ? format(new Date(payment.date), 'MMM d, yyyy HH:mm') : 'N/A'}</td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>${payment.amount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="status-badge" style={{ background: payment.status === 'Completed' ? '#dcfce7' : '#f1f5f9', color: payment.status === 'Completed' ? '#16a34a' : '#64748b' }}>
                        {payment.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
