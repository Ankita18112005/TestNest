import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, loginWithGoogle, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      setError('Passwords do not match');
      toast('Passwords do not match. Please try again.', 'error');
      return;
    }
    
    try {
      setError('');
      await signup(email, password, name);
      await verifyEmail();
      toast(`Welcome, ${name}! 🎉 Please verify your email to continue.`, 'success', 5000);
      navigate('/verify-email');
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);
      setError('Failed to create an account: ' + err.message);
      toast('Registration failed: ' + err.message, 'error');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError('');
      await loginWithGoogle();
      toast('Account created with Google! Welcome aboard 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error("GOOGLE SIGN-IN ERROR:", err);
      setError('Failed to sign in with Google: ' + err.message);
      toast('Google sign-up failed. Please try again.', 'error');
    }
  };

  return (
    <div className="container fade-in">
      <div className="auth-container card" style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="demo@example.com"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Repeat Password</label>
            <input 
              type="password" 
              className="input-field" 
              required 
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Register
          </button>
          
          <div style={{ margin: '1rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>OR</div>
          
          <button type="button" onClick={handleGoogleRegister} className="btn" style={{ width: '100%', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
