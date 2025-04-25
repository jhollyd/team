import React, { useState, useEffect } from 'react';
import { fetchSchedule, updateConstraints, generateSchedule, fetchStudents } from '../../services/api';

export default function AdminSchedulesPage() {
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numberOfHours, setNumberOfHours] = useState(40);
  const [numberOfEmployees, setNumberOfEmployees] = useState(2);

  // Add validation functions
  const handleHoursChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setNumberOfHours(value);
  };

  const handleEmployeesChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setNumberOfEmployees(value);
  };

  // Fetch initial data when the component mounts
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [studentData, scheduleData] = await Promise.all([fetchStudents(), fetchSchedule()]);
        setStudents(studentData);
        setSchedule(scheduleData);
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Define the missing functions
  async function handleSaveConstraints() {
    try {
      await updateConstraints({
        numberOfHours,
        numberOfEmployees,
      });
      alert('Constraints updated');
    } catch (err) {
      console.error('Error saving constraints', err);
      setError('Error saving constraints');
    }
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      await generateSchedule();
      const data = await fetchSchedule();
      setSchedule(data);
    } catch (err) {
      setError('Error generating schedule');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!schedule) {
      alert('No schedule available to export');
      return;
    }
    let csvContent = 'Time,Mon,Tue,Wed,Thu,Fri\n';
    schedule.timeBlocks.forEach((block) => {
      csvContent += `${block.hour}:00,${block.monStudents.join(' & ')},${block.tueStudents.join(' & ')},${block.wedStudents.join(' & ')},${block.thuStudents.join(' & ')},${block.friStudents.join(' & ')}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'final_schedule.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Render the component
  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-4">Weekly Assignment Schedule</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="alert alert-info">Loading...</div>}
        </div>
      </div>

      <div className="row">
        {/* Student Sidebar */}
        <div className="col-md-3 mb-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Students</h3>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Max Hours</th>
                      <th>Int'l</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => (
                      <tr key={stu.id}>
                        <td>{stu.name}</td>
                        <td>{stu.maxHours}</td>
                        <td>{stu.isInternational ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer">
              <a href="/admin/students" className="btn btn-secondary w-100">
                Manage Students
              </a>
            </div>
          </div>
        </div>

        {/* Main Schedule Area */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-header">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div className="d-flex align-items-center">
                  <label className="me-2">Number of Hours:</label>
                  <input
                    type="number"
                    value={numberOfHours}
                    onChange={handleHoursChange}
                    className="form-control form-control-sm"
                    style={{ width: '80px' }}
                    min="0"
                  />
                </div>
                <div className="d-flex align-items-center">
                  <label className="me-2">Number of Employees:</label>
                  <input
                    type="number"
                    value={numberOfEmployees}
                    onChange={handleEmployeesChange}
                    className="form-control form-control-sm"
                    style={{ width: '80px' }}
                    min="0"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    onClick={handleSaveConstraints}
                    className="btn btn-sm btn-secondary"
                  >
                    Save Constraints
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="btn btn-sm btn-primary"
                  >
                    Generate Schedule
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="btn btn-sm btn-success"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {!schedule ? (
                <p className="text-center text-muted">No schedule available yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Time</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.timeBlocks.map((block) => (
                        <tr key={block.hour}>
                          <td className="fw-bold">{block.hour}:00</td>
                          <td>{block.monStudents.join(', ')}</td>
                          <td>{block.tueStudents.join(', ')}</td>
                          <td>{block.wedStudents.join(', ')}</td>
                          <td>{block.thuStudents.join(', ')}</td>
                          <td>{block.friStudents.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}