// src/pages/student/StudentSchedulePage.jsx
import React, { useState } from 'react';
import ICAL from 'ical.js';
import MyCalendar from './MyCalendar'; 

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
  const [tempEvents, setTempEvents] = useState([
    { id: '1', title: 'Event 1', start: '2025-03-25', source: 'manual' },
    { id: '2', title: 'Event 2', start: '2025-03-28', source: 'manual' },
  ]);

  const [availabilityGrid, setAvailabilityGrid] = useState(generateEmptyGrid());
  const [icalBusySlots, setIcalBusySlots] = useState(generateEmptyGrid());

  const [icalFile, setIcalFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');

  // Function to validate student ID
  const validateStudentId = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.slice(0, 8);
  };

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
            const maxCount = 50; // limit expansions
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
        // Merge these ICS events into FullCalendar
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
    console.log('Saving availability:', availabilityGrid);
    alert('Availability saved (fake).');
  }

  return (
    <div className="p-3">
      <h2>My Weekly Calendar </h2>
      <p>Double-click on a date to create a new event. Drag or resize existing events. You can also press "Delete" while an event is selected (not ICS-sourced) to remove it.</p>

      {/* The FullCalendar component, with ICS + manual events merged */}
      <MyCalendar tempEvents={tempEvents} setTempEvents={setTempEvents} />

      <hr className="mt-4 mb-4" />

      <div className="mt-4">
        <h4>Student Information</h4>
        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="firstName" className="form-label">First Name</label>
            <input
              type="text"
              id="firstName"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="lastName" className="form-label">Last Name</label>
            <input
              type="text"
              id="lastName"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="studentId" className="form-label">Student ID</label>
            <input
              type="text"
              id="studentId"
              className="form-control"
              value={studentId}
              onChange={(e) => setStudentId(validateStudentId(e.target.value))}
              maxLength={8}
              pattern="[0-9]*"
              inputMode="numeric"
              required
            />
          </div>
        </div>

        <div className="mt-4">
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
      </div>

      <button onClick={handleSave} className="btn btn-success">
        Save My Availability
      </button>
    </div>
  );
}
