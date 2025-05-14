// src/pages/student/StudentSchedulePage.jsx
import React, { useState } from 'react';
import ICAL from 'ical.js';
import MyCalendar from './MyCalendar';

// Helper function to validate student ID (8 digits only)
const numeric8 = (v) => v.replace(/[^0-9]/g, "").slice(0, 8);

// Hash function for student ID
function hashStudentId(studentId) {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    const char = studentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

function generateEmptyGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid = {};
  days.forEach((day) => {
    grid[day] = {};
    for (let hr = 8; hr < 20; hr++) {
      grid[day][hr] = false;
    }
  });
  return grid;
}
   
export default function StudentSchedulePage() {
  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    studentId: ''
  });

  const [tempEvents, setTempEvents] = useState([
    { id: '1', title: 'Event 1', start: '2025-03-25', source: 'manual' },
    { id: '2', title: 'Event 2', start: '2025-03-28', source: 'manual' },
  ]);

  const [availabilityGrid, setAvailabilityGrid] = useState(generateEmptyGrid());
  const [icalBusySlots, setIcalBusySlots] = useState(generateEmptyGrid());

  const [icalFile, setIcalFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    setIcalFile(file);
    setUploadStatus('');
  }

  async function handleUploadIcal() {
    if (!icalFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const icsData = e.target.result;
      try {
        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        let newEvents = [];

        vevents.forEach((vevent, idx) => {
          const icsEvent = new ICAL.Event(vevent);

          if (icsEvent.isRecurring()) {
            const expansion = icsEvent.iterator();
            let next;
            let count = 0;
            const maxCount = 50;
            const duration = icsEvent.duration || icsEvent.endDate.subtractDate(icsEvent.startDate);

            while ((next = expansion.next()) && count < maxCount) {
              const start = next.toJSDate();
              const end = new Date(start.getTime() + duration.toSeconds() * 1000);

              newEvents.push({
                id: `ics-${Date.now()}-${idx}-${count}`,
                title: icsEvent.summary || 'Untitled Event',
                start: start.toISOString(),
                end: end.toISOString(),
                editable: false,
                source: 'ics',
              });
              count++;
            }
          } else {
            newEvents.push({
              id: `ics-${Date.now()}-${idx}`,
              title: icsEvent.summary || 'Untitled Event',
              start: icsEvent.startDate.toJSDate().toISOString(),
              end: icsEvent.endDate?.toJSDate()?.toISOString() || null,
              editable: false,
              source: 'ics',
            });
          }
        });

        console.log('Parsed ICS Events:', newEvents);
        setTempEvents((prev) => [...prev, ...newEvents]);


        const newBusy = { ...icalBusySlots };
        newEvents.forEach((evt) => {
          const dayStr = new Date(evt.start).toString().split(' ')[0];

        });

        setUploadStatus('Schedule successfully uploaded!');
      } catch (err) {
        console.error('Failed to parse .ics file:', err);
        alert('Invalid .ics file.');
      }
    };

    reader.readAsText(icalFile);
  }

  function handleSave() {
    // Validate student info
    if (!studentInfo.firstName || !studentInfo.lastName || !studentInfo.studentId) {
      alert('Please fill in all student information (First Name, Last Name, and Student ID)');
      return;
    }

    // Validate student ID length
    if (studentInfo.studentId.length !== 8) {
      alert('Student ID must be 8 digits');
      return;
    }

    const hashedStudentId = hashStudentId(studentInfo.studentId);
    const payload = {
      student: {
        firstName: studentInfo.firstName,
        lastName: studentInfo.lastName,
        studentId: hashedStudentId,
        originalStudentId: studentInfo.studentId, // Keep original for email generation
        email: `${studentInfo.studentId}@umb.edu` // Generate email from original student ID
      },
      events: tempEvents.map(evt => ({
        id: evt.id,
        title: evt.title,
        start: evt.start,
        end: evt.end || null,
        source: evt.source,
        editable: evt.editable ?? evt.source !== 'ics',
      })),
      generatedAt: new Date().toISOString()
    };

    fetch('http://localhost:8000/submit-availability/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || 'Failed to submit');
          });
        }
        return res.json();
      })
      .then((data) => {
        alert('Availability saved successfully!');
        console.log('Response:', data);
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || 'Failed to save availability.');
      });
  }

  return (
    <div className="p-3">
      <h2>My Weekly Calendar</h2>
      <p>Double-click on a date to create a new event. Drag or resize existing events. You can also press "Delete" while an event is selected (not ICS-sourced) to remove it.</p>

      {/* The FullCalendar component, with ICS + manual events merged */}
      <MyCalendar tempEvents={tempEvents} setTempEvents={setTempEvents} />

      <hr className="mt-4 mb-4" />

      <div className="mt-4 mb-4">
        <h4 className="mb-3">Upload Class Schedule (.ics)</h4>
        <p className="text-muted mb-3">
          Upload your iCal file to automatically add your class times to the calendar (non-editable).
        </p>
        <div className="d-flex align-items-center gap-2">
          <input
            type="file"
            accept=".ics"
            onChange={handleFileChange}
            className="form-control"
            style={{ maxWidth: '300px' }}
          />
          <button
            onClick={handleUploadIcal}
            className="btn btn-primary"
            disabled={!icalFile}
          >
            Submit iCal
          </button>
        </div>
        {uploadStatus && (
          <div className="alert alert-success mt-2" role="alert">
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Student Information Form */}
      <div className="mt-4 mb-4">
        <h4>Student Information</h4>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label htmlFor="firstName" className="form-label">First Name</label>
            <input
              type="text"
              className="form-control"
              id="firstName"
              value={studentInfo.firstName}
              onChange={(e) => setStudentInfo(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="col-md-4 mb-3">
            <label htmlFor="lastName" className="form-label">Last Name</label>
            <input
              type="text"
              className="form-control"
              id="lastName"
              value={studentInfo.lastName}
              onChange={(e) => setStudentInfo(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
          <div className="col-md-4 mb-3">
            <label htmlFor="studentId" className="form-label">Student ID</label>
            <input
              type="text"
              className="form-control"
              id="studentId"
              value={studentInfo.studentId}
              onChange={(e) => setStudentInfo(prev => ({ ...prev, studentId: numeric8(e.target.value) }))}
              maxLength={8}
              inputMode="numeric"
              required
            />
            <small className="text-muted">Enter your 8-digit student ID</small>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-success">
        Save My Availability
      </button>
    </div>
  );
}
