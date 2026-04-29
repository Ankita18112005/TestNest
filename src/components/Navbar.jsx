import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Home } from 'lucide-react';
import { useToast } from './Toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast('You have been logged out. See you soon! 👋', 'info');
      navigate('/');
    } catch (err) {
      toast('Failed to logout. Please try again.', 'error');
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={user ? (user.isAdmin ? "/admin/dashboard" : "/dashboard") : "/"} className="navbar-brand">
          <Calendar size={28} color="var(--primary-accent)" />
          TimeNest
        </Link>
        <div className="navbar-nav">
          <Link to="/book" className="btn btn-ghost" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Home size={18} />
            Home
          </Link>

          
          {user ? (
            <>
              {user.isAdmin ? (
                <Link to="/admin/dashboard" className="btn btn-ghost" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <User size={18} />
                  Admin
                </Link>
              ) : (
                <Link to="/dashboard" className="btn btn-ghost" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <User size={18} />
                  {user.name}
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-outline" style={{padding: '0.5rem 1rem'}}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
