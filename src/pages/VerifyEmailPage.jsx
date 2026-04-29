import React from 'react';
import { Link } from 'react-router-dom';

const VerifyEmailPage = () => {
  return (
    <div className="container fade-in">
      <div className="auth-container card" style={{ marginTop: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Verify Your Email</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Once verified, you can sign in to your new account.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
