// src/layouts/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Sidebar.css'; // Use the same CSS file

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h4>Admin Dashboard</h4>
        <ul>
          <li>
            <NavLink to="/admin/students" className={({ isActive }) => isActive ? 'active' : ''}>
              Students
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/schedules" className={({ isActive }) => isActive ? 'active' : ''}>
              Schedules
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </div>
    </div>
  );
}
