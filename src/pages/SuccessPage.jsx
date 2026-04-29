import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const bookingData = location.state;

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  return (
    <div className="container fade-in">
      <div className="auth-container card" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ marginBottom: '1rem' }}>Payment Successful!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your {bookingData.duration}-hour session is confirmed for {bookingData.time}.
        </p>

        {!user ? (
          <div>
            <p style={{ marginBottom: '1.5rem', fontWeight: '500' }}>
              Create an account or log in to manage your bookings and join the session easily.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/register" state={{ pendingBooking: bookingData }} className="btn btn-primary">
                Register to save booking
              </Link>
              <Link to="/login" state={{ pendingBooking: bookingData }} className="btn btn-outline">
                Login to your account
              </Link>
            </div>
          </div>
        ) : (
          <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
            Go to dashboard
          </Link>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;
