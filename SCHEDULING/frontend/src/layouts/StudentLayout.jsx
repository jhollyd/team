// src/layouts/StudentLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Sidebar.css'; // Import the sidebar CSS

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h4>Student Dashboard</h4>
        <ul>
          <li>
            <NavLink to="/student/home" className={({ isActive }) => isActive ? 'active' : ''}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/student/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
              Schedule
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/students" className={({ isActive }) => isActive ? 'active' : ''}>
              Admin Dashboard
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
