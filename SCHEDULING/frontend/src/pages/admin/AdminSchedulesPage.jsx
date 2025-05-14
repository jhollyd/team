// ──────────────────────────────────────────────────────────────
// src/pages/admin/AdminSchedulesPage.jsx
// ──────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin   from "@fullcalendar/daygrid";
import timeGridPlugin  from "@fullcalendar/timegrid";
import interaction     from "@fullcalendar/interaction";
import * as XLSX from 'xlsx';
import { hashStudentId } from '../../utils/hash';

const API = "http://localhost:8000";

/* ---------- 1. colour palette helper ---------- */
const palette = [
  "#2563EB", "#DC2626", "#059669", "#D97706",
  "#9333EA", "#14B8A6", "#F43F5E", "#4B5563",
];
const colorFor = (() => {
  const cache = {};
  return (id) => {  
    if (!cache[id]) {
      const idx = Object.keys(cache).length % palette.length;
      cache[id] = palette[idx];
    }
    return cache[id];
  };
})();

/* ---------- 2. helpers to map schedule <‑‑> UI ---------- */
const toGrid = (schedule) => {
  const grid = {};
  
  // Initialize grid with empty arrays for all time slots
  for (let h = 8; h < 17; h++) {
    for (let d = 1; d <= 5; d++) {
      grid[`${h}-${d}`] = [];
    }
  }

  // Process each employee's schedule
  schedule.entries.forEach((e) => {
    e.events.forEach((ev) => {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      const day = start.getDay();  // 0-6 (Sunday-Saturday)
      const startHour = start.getHours();
      const endHour = end.getHours();
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // Round to nearest hour
      
      // Only process weekdays (1-5)
      if (day >= 1 && day <= 5) {
        for (let h = startHour; h < startHour + duration; h++) {
          const key = `${h}-${day}`;
          if (grid[key]) {
            grid[key].push({
              name: `${e.employee.firstName} ${e.employee.lastName}`.trim(),
              employeeId: e.employee.employeeId
            });
          }
        }
      }
    });
  });

  // Convert grid to rows format
  const rows = [];
  for (let h = 8; h < 17; h++) {
    rows.push({
      hour: h,
      mon: grid[`${h}-1`] || [],
      tue: grid[`${h}-2`] || [],
      wed: grid[`${h}-3`] || [],
      thu: grid[`${h}-4`] || [],
      fri: grid[`${h}-5`] || []
    });
  }
  
  console.log('Schedule grid:', grid);
  console.log('Schedule rows:', rows);
  return rows;
};

const rowsToEntries = (rows, employees) => {
  const byName={};
  employees.forEach(e=>{
    const full=`${e.firstName} ${e.lastName}`.trim();
    byName[full]=e;
  });

  const empEvents={};
  rows.forEach(r=>{
    Object.entries({1:r.mon,2:r.tue,3:r.wed,4:r.thu,5:r.fri})
      .forEach(([dow,list])=>{
        list.forEach(emp=>{
          const empObj = byName[emp.name];
          if(!empObj) return;
          const start=new Date();
          start.setHours(r.hour,0,0,0);
          const diff=(dow-start.getDay()+7)%7;
          start.setDate(start.getDate()+diff);
          const end=new Date(start.getTime()+60*60*1000);

          empEvents[empObj.employeeId]=empEvents[empObj.employeeId]||{
            employee:empObj, events:[]
          };
          empEvents[empObj.employeeId].events.push({
            start:start.toISOString(), end:end.toISOString()
          });
        });
      });
  });
  return Object.values(empEvents);
};

/* ---------- 3. component ---------- */
export default function AdminSchedulesPage() {
  /* state */
  const [employees, setEmployees] = useState([]);
  const [rows      , setRows]      = useState([]);
  const [fcEvents  , setFcEvents ] = useState([]);
  const [showCal   , setShowCal ]  = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [allSchedules, setAllSchedules] = useState([]);

  /* controls */
  const [hours, setHours] = useState(40);
  const [staff, setStaff] = useState(1);
  const [k    , setK    ] = useState(1);

  /* load distinct employees (sidebar) */
  const loadEmployees = () => {
    fetch(`${API}/students/`)
      .then(r => r.ok ? r.json() : { students: [] })
      .then(data => {
        const employees = data.students.map(s => ({
          employeeId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          maxHours: s.maxHours,
          isInternational: s.isInternational,
          priority: s.priority,
          hasSubmittedAvailability: s.hasSubmittedAvailability
        }));
        setEmployees(employees);
      })
      .catch(() => {
        console.error('Failed to load students');
        setEmployees([]);
      });
  };

  // Initial load
  useEffect(() => {
    loadEmployees();
  }, []);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadEmployees();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* -------------- actions -------------- */
  const generateSchedules = () => {
    // Validate inputs
    if (hours <= 0) {
      alert("Please enter a valid number of hours per week");
      return;
    }
    if (staff < 1) {
      alert("Please enter a valid number of staff per shift (minimum 1)");
      return;
    }
    if (k < 1) {
      alert("Please enter a valid number of schedules to generate (minimum 1)");
      return;
    }
    if (employees.length === 0) {
      alert("No employees available. Please add employees first.");
      return;
    }

    // Check if any employees have submitted availability
    const employeesWithAvailability = employees.filter(e => e.hasSubmittedAvailability);
    if (employeesWithAvailability.length === 0) {
      alert("No employees have submitted their availability. Please ask employees to submit their availability first.");
      return;
    }

    // Log input availabilities
    console.log("Input Availabilities:", employeesWithAvailability);

    const qs = new URLSearchParams({
      employee_ids: employees.map(e => e.employeeId).join(","),
      total_master_schedule_hours: hours,
      num_schedules_desired: k,
      min_staff_per_shift: staff
    });

    fetch(`${API}/generate-schedules/?${qs.toString()}`)
      .then(r => {
        if (!r.ok) {
          return r.json().then(data => {
            throw new Error(data.error || 'Failed to generate schedules');
          });
        }
        return r.json();
      })
      .then(data => {
        if (!data.schedules || !data.schedules.length) { 
          alert("No schedules could be generated. Make sure students have submitted their availability and have enough available time slots."); 
          return; 
        }
        // Store all schedules
        setAllSchedules(data.schedules);
        setCurrentScheduleIndex(0);
        // Display the first schedule
        const best = data.schedules[0];
        setRows(toGrid(best));

        // Log generated schedules
        console.log("Generated Schedules:", data.schedules);

        // Verify schedules against availabilities
        data.schedules.forEach((schedule, index) => {
          console.log(`Verifying Schedule ${index + 1}:`);
          let totalScheduledHours = 0;
          const employeeHours = {};

          schedule.entries.forEach(entry => {
            const employee = employees.find(e => e.employeeId === entry.employee.employeeId);
            if (!employee) {
              console.warn(`Employee ${entry.employee.employeeId} not found in availabilities.`);
              return;
            }
            if (!employeeHours[employee.employeeId]) {
              employeeHours[employee.employeeId] = 0;
            }

            entry.events.forEach(ev => {
              const start = new Date(ev.start);
              const end = new Date(ev.end);
              const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // Round to nearest hour
              totalScheduledHours += duration;
              employeeHours[employee.employeeId] += duration;
              console.log(`Employee ${employee.firstName} ${employee.lastName} scheduled from ${start.toISOString()} to ${end.toISOString()} (${duration} hours)`);
            });
          });

          // Verify total hours
          console.log(`Total scheduled hours: ${totalScheduledHours}`);
          if (totalScheduledHours !== hours) {
            console.warn(`Warning: Total scheduled hours (${totalScheduledHours}) does not match input hours (${hours}).`);
          }

          // Verify employee hours
          Object.entries(employeeHours).forEach(([empId, hours]) => {
            const employee = employees.find(e => e.employeeId === empId);
            if (employee && employee.maxHours && hours > employee.maxHours) {
              console.warn(`Warning: Employee ${employee.firstName} ${employee.lastName} scheduled for ${hours} hours, exceeding max hours (${employee.maxHours}).`);
            }
          });
        });

        // Build FullCalendar events for the first schedule
        const fc = [];
        
        // Get the current date and adjust to the start of the week (Monday)
        const now = new Date();
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
        const monday = new Date(now.setDate(now.getDate() + diff));
        monday.setHours(0, 0, 0, 0);
        
        best.entries.forEach(entry => {
          const employee = employees.find(e => e.employeeId === entry.employee.employeeId);
          if (!employee) return;
          
          entry.events.forEach(ev => {
            // Parse ISO dates
            const start = new Date(ev.start);
            const end = new Date(ev.end);
            
            // Get the day of week (0-6, where 0 is Sunday)
            const dayOfWeek = start.getDay();
            
            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) return;
            
            // Create new dates for the current week
            const adjustedStart = new Date(monday);
            adjustedStart.setDate(monday.getDate() + (dayOfWeek - 1)); // Adjust to Monday-based week
            adjustedStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
            
            const adjustedEnd = new Date(adjustedStart);
            const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // Round to nearest hour
            adjustedEnd.setTime(adjustedStart.getTime() + duration * 60 * 60 * 1000);
            
            // Adjust end time if it's after 20:00
            if (adjustedEnd.getHours() > 20) {
              adjustedEnd.setHours(20, 0, 0, 0);
            }
            
            // Only add events that start during working hours
            if (adjustedStart.getHours() >= 8) {
              // Create a new event object with proper date handling
              const event = {
                title: `${employee.firstName} ${employee.lastName}`,
                start: adjustedStart.toISOString(),
                end: adjustedEnd.toISOString(),
                color: colorFor(entry.employee.employeeId),
                extendedProps: {
                  employeeId: entry.employee.employeeId
                },
                display: 'block',
                allDay: false
              };
              
              console.log('Adding event:', event);
              fc.push(event);
            }
          });
        });
        
        console.log('Generated calendar events:', fc);
        setFcEvents(fc);
      })
      .catch((err) => {
        alert(err.message || "Failed to generate schedules. Please try again.");
      });
  };

  const displaySchedule = (index) => {
    if (index < 0 || index >= allSchedules.length) return;
    setCurrentScheduleIndex(index);
    const schedule = allSchedules[index];
    setRows(toGrid(schedule));

    // Build FullCalendar events for the selected schedule
    const fc = [];
    
    // Get the current date and adjust to the start of the week (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
    const monday = new Date(now.setDate(now.getDate() + diff));
    monday.setHours(0, 0, 0, 0);
    
    schedule.entries.forEach(entry => {
      const employee = employees.find(e => e.employeeId === entry.employee.employeeId);
      if (!employee) return;
      
      entry.events.forEach(ev => {
        // Parse ISO dates
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        
        // Get the day of week (0-6, where 0 is Sunday)
        const dayOfWeek = start.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) return;
        
        // Create new dates for the current week
        const adjustedStart = new Date(monday);
        adjustedStart.setDate(monday.getDate() + (dayOfWeek - 1)); // Adjust to Monday-based week
        adjustedStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
        
        const adjustedEnd = new Date(adjustedStart);
        const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // Round to nearest hour
        adjustedEnd.setTime(adjustedStart.getTime() + duration * 60 * 60 * 1000);
        
        // Adjust end time if it's after 20:00
        if (adjustedEnd.getHours() > 20) {
          adjustedEnd.setHours(20, 0, 0, 0);
        }
        
        // Only add events that start during working hours
        if (adjustedStart.getHours() >= 8) {
          // Create a new event object with proper date handling
          const event = {
            title: `${employee.firstName} ${employee.lastName}`,
            start: adjustedStart.toISOString(),
            end: adjustedEnd.toISOString(),
            color: colorFor(entry.employee.employeeId),
            extendedProps: {
              employeeId: entry.employee.employeeId
            },
            display: 'block',
            allDay: false
          };
          
          console.log('Adding event:', event);
          fc.push(event);
        }
      });
    });
    
    console.log('Generated calendar events:', fc);
    setFcEvents(fc);

    // Verify that calendar and table views display identical data
    const tableEvents = rowsToEntries(rows, employees);
    const calendarEvents = fc.map(event => ({
      employee: {
        employeeId: event.extendedProps.employeeId,
        firstName: event.title.split(' ')[0],
        lastName: event.title.split(' ')[1]
      },
      events: [{
        start: event.start,
        end: event.end
      }]
    }));

    const tableEventsStr = JSON.stringify(tableEvents);
    const calendarEventsStr = JSON.stringify(calendarEvents);

    if (tableEventsStr !== calendarEventsStr) {
      console.warn('Warning: Calendar and table views display different data.');
      console.log('Table Events:', tableEvents);
      console.log('Calendar Events:', calendarEvents);
    } else {
      console.log('Calendar and table views display identical data.');
    }
  };

  const generateCSV = (rows) => {
    const headers = ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const csvRows = [headers];

    rows.forEach(r => {
      const row = [
        `${r.hour}:00 - ${r.hour + 1}:00`,
        r.mon.map(emp => emp.name).join(', '),
        r.tue.map(emp => emp.name).join(', '),
        r.wed.map(emp => emp.name).join(', '),
        r.thu.map(emp => emp.name).join(', '),
        r.fri.map(emp => emp.name).join(', ')
      ];
      csvRows.push(row);
    });

    return csvRows.map(row => row.join(',')).join('\n');
  };

  const generateExcel = (rows) => {
    const headers = ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const excelRows = [headers];

    rows.forEach(r => {
      const row = [
        `${r.hour}:00 - ${r.hour + 1}:00`,
        r.mon.map(emp => emp.name).join(', '),
        r.tue.map(emp => emp.name).join(', '),
        r.wed.map(emp => emp.name).join(', '),
        r.thu.map(emp => emp.name).join(', '),
        r.fri.map(emp => emp.name).join(', ')
      ];
      excelRows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  };

  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  const saveSchedule = () => {
    if(!rows.length) return;

    const entries = rowsToEntries(rows, employees);
    const hashedEntries = entries.map(entry => ({
      ...entry,
      employee: {
        ...entry.employee,
        employeeId: hashStudentId(entry.employee.employeeId)
      }
    }));
    const body = { comment:"Saved from UI", entries: hashedEntries };

    fetch(`${API}/save-schedule/`,{
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body),
    })
      .then(r=>{ if(!r.ok) throw new Error(); return r.json(); })
      .then(()=>alert("Schedule saved to DB"))
      .catch(()=>alert("Save failed"));

    // Download schedule as Excel
    const excelContent = generateExcel(rows);
    const blob = new Blob([s2ab(excelContent)], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  };

  /* -------------- render -------------- */
  return(
    <div className="container-fluid p-4">
      <h2 className="mb-3">Admin – Schedules</h2>

      <div className="row">
        {/* ⬅︎ sidebar */}
        <div className="col-md-3 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Employees ({employees.length})</span>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  loadEmployees();
                  setLastRefresh(new Date());
                }}
                title="Refresh employee list"
              >
                ↻
              </button>
            </div>
            <ul className="list-group list-group-flush" style={{maxHeight:400,overflowY:"auto"}}>
              {employees.map(e=>(
                <li key={e.employeeId} className="list-group-item">
                  <span className="badge me-2" style={{
                    backgroundColor:colorFor(e.employeeId)
                  }}>&nbsp;</span>
                  {e.firstName} {e.lastName}
                  <small className="d-block text-muted">
                    Max Hours: {e.maxHours || 'Not set'}
                    <br />
                    Availability: {e.hasSubmittedAvailability ? 
                      <span className="text-success">Submitted</span> : 
                      <span className="text-danger">Not Submitted</span>
                    }
                  </small>
                </li>
              ))}
            </ul>
            <div className="card-footer text-muted small">
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* ➡︎ main */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-header d-flex flex-wrap align-items-center gap-2">
              <label>
                Total Hours/Week
                <input type="number" className="form-control form-control-sm ms-1"
                       style={{width:90}} value={hours}
                       min="1" max="168"
                       onChange={e=>setHours(Math.max(1, Math.min(168, Number(e.target.value)||0)))}/>
              </label>
              <label className="ms-3">
                Minimum Staff Required Per Time Slot
                <input type="number" className="form-control form-control-sm ms-1"
                       style={{width:90}} value={staff}
                       min="1" max="10"
                       onChange={e=>setStaff(Math.max(1, Math.min(10, Number(e.target.value)||1)))}/>
              </label>
              <label className="ms-3">
                Number of Schedule Options to Generate
                <input type="number" className="form-control form-control-sm ms-1"
                       style={{width:90}} value={k}
                       min="1" max="5"
                       onChange={e=>setK(Math.max(1, Math.min(5, Number(e.target.value)||1)))}/>
              </label>

              <button className="btn btn-sm btn-primary ms-3"
                      onClick={generateSchedules}
                      disabled={!employees.length}>
                Generate
              </button>
              <button className="btn btn-sm btn-success ms-2"
                      onClick={saveSchedule}
                      disabled={!rows.length}>
                Save
              </button>
              <button className="btn btn-sm btn-outline-secondary ms-auto"
                      onClick={()=>setShowCal(s=>!s)}
                      disabled={!rows.length}>
                {showCal? "Show table" : "Show calendar"}
              </button>
            </div>

            <div className="card-body">
              {!rows.length
                ? <p className="text-muted">Generate a schedule to see it here.</p>
                : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => displaySchedule(currentScheduleIndex - 1)}
                          disabled={currentScheduleIndex === 0}
                        >
                          Previous
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => displaySchedule(currentScheduleIndex + 1)}
                          disabled={currentScheduleIndex === allSchedules.length - 1}
                        >
                          Next
                        </button>
                      </div>
                      <div>
                        Schedule {currentScheduleIndex + 1} of {allSchedules.length}
                      </div>
                    </div>
                    {showCal
                      ? (
                        <FullCalendar
                          plugins={[dayGridPlugin,timeGridPlugin,interaction]}
                          initialView="timeGridWeek"
                          headerToolbar={{
                            left: "",
                            center: "",
                            right: "timeGridWeek"
                          }}
                          events={fcEvents}
                          height="auto"
                          slotMinTime="08:00:00"
                          slotMaxTime="20:00:00"
                          allDaySlot={false}
                          dayHeaderFormat={{ weekday: 'long' }}
                          titleFormat={{ month: 'long', year: 'numeric' }}
                          slotLabelFormat={{
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }}
                          nowIndicator={true}
                          weekends={false}
                          eventTimeFormat={{
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }}
                          eventDisplay="block"
                          eventMinHeight={20}
                          slotDuration="00:15:00"
                          snapDuration="00:15:00"
                          expandRows={true}
                          stickyHeaderDates={true}
                          dayMaxEvents={true}
                          initialDate={new Date()}
                          eventContent={(eventInfo) => {
                            return {
                              html: `
                                <div class="fc-event-main-frame">
                                  <div class="fc-event-title-container">
                                    <div class="fc-event-title fc-sticky">${eventInfo.event.title}</div>
                                  </div>
                                </div>
                              `
                            };
                          }}
                          eventDidMount={(info) => {
                            console.log('Event mounted:', info.event);
                          }}
                          eventDataTransform={(event) => {
                            console.log('Transforming event:', event);
                            const transformed = {
                              ...event,
                              start: new Date(event.start),
                              end: new Date(event.end)
                            };
                            console.log('Transformed event:', transformed);
                            return transformed;
                          }}
                          eventOverlap={false}
                          slotEventOverlap={false}
                        />
                      )
                      : (
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead className="table-light">
                              <tr>
                                <th style={{width: '100px'}}>Time</th>
                                <th>Monday</th>
                                <th>Tuesday</th>
                                <th>Wednesday</th>
                                <th>Thursday</th>
                                <th>Friday</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map(r => (
                                <tr key={r.hour}>
                                  <td className="fw-bold align-middle">
                                    {r.hour}:00 - {r.hour + 1}:00
                                  </td>
                                  {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => (
                                    <td key={day} className="align-middle">
                                      {r[day].map((emp, idx) => (
                                        <div key={idx} className="d-flex align-items-center mb-1">
                                          <span className="badge me-2" style={{
                                            backgroundColor: colorFor(emp.employeeId)
                                          }}>&nbsp;</span>
                                          {emp.name}
                                        </div>
                                      ))}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                  </>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
