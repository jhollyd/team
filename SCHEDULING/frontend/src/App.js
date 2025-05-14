// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Student pages
import StudentHomePage from './pages/student/StudentHomePage';
import StudentSchedulePage from './pages/student/StudentSchedulePage';

// Admin pages
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminSchedulesPage from './pages/admin/AdminSchedulesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect for root */}
        <Route path="/" element={<Navigate to="/student/home" replace />} />

        {/* Student layout with nested routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="home" element={<StudentHomePage />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
        </Route>

        {/* Admin layout with nested routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="schedules" element={<AdminSchedulesPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<h2 className="p-3">404 - Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
