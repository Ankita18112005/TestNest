import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  if (!user || (!user.isAdmin && user.email !== 'user@admin.com')) return null;

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Welcome, {user.name}!
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '2rem', 
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        {[
          { path: '/admin/dashboard', label: 'Sessions' },
          { path: '/admin/schedule', label: 'Schedule' },
          { path: '/admin/payments', label: 'Payments' },
          { path: '/admin/clients', label: 'Clients' }
        ].map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              padding: '0.75rem 0',
              textDecoration: 'none',
              color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
              fontWeight: isActive ? '600' : '500',
              fontSize: '0.875rem'
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default AdminLayout;
