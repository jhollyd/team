// src/pages/student/StudentHomePage.jsx
import React from 'react';

export default function StudentHomePage() {
  return (
    <div className="p-3">
      <h2>Welcome, Student!</h2>
      <p>Please follow these steps to upload your schedule:</p>
      <ol>
        <li>Log in to your Wiser account.</li>
        <li>Click on <strong>My Schedule</strong>.</li>
        <li>Click on <strong>List View</strong> and select the current semester.</li>
        <li>Click on <strong>Email as a .ics</strong>.</li>
        <li>You will receive the file in your college ID email. Download the file.</li>
        <li>Then, go to the Schedule page and upload it in the <strong>Upload iCal</strong> option.</li>
      </ol>    
      <p>
        <a href="/student/schedule" className="btn btn-primary">Go to My Schedule</a>
      </p>
    </div>   
  );
}    
