import React, { useEffect, useState } from "react";

/* -------- API root (change for prod) -------- */
const API = "http://localhost:8000";

const numeric8 = (v) => v.replace(/[^0-9]/g, "").slice(0, 8);

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [sid, setSid] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/students/`)
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((data) => {
        setStudents(data.students);
      })
      .catch(() => {
        console.error('Failed to load students');
        setStudents([]);
      });
  }, []);

  /* ---------- add row locally ---------- */
  const handleAdd = (e) => {
    e.preventDefault();
    setStatusMsg("");                           // clear old toast

    const row = {
      id: Date.now().toString(),
      studentId: sid,
      firstName: first.trim(),
      lastName: last.trim(),
      isInternational: false,
      maxHours: 0,
      priority: 0,
      synced: false,                            // pending
    };
    setStudents((prev) => [...prev, row]);
    setFirst("");
    setLast("");
    setSid("");
  };

  const patch = (id, obj) =>
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...obj, synced: false } : s))
    );

  const handleDelete = async (id) => {
    try {
      const studentToDelete = students.find(s => s.id === id);
      if (!studentToDelete) return;

      // Delete from backend
      const response = await fetch(`${API}/delete-student/?student_id=${studentToDelete.studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      // Update local state
      setStudents(prev => prev.filter(s => s.id !== id));
      setStatusMsg("✅ Student deleted successfully");
    } catch (error) {
      console.error("Error deleting student:", error);
      setStatusMsg("⚠︎ Error deleting student");
    }
  };

  const submitNew = async () => {
    // Filter out students that haven't been synced yet
    const studentsToSubmit = students.filter(s => !s.synced);
    
    if (studentsToSubmit.length === 0) {
      setStatusMsg("No new students to update");
      return;
    }

    console.log("Submitting students:", studentsToSubmit);  // Debug log

    try {
      const response = await fetch(`${API}/admin-form/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listofstudents: studentsToSubmit.map(s => ({
            student_id: s.studentId,
            first_name: s.firstName,
            last_name: s.lastName,
            student_email: `${s.studentId}@umb.edu`,
            max_hours: s.maxHours,
            f1_status: s.isInternational,
            priority: s.priority
          }))
        })
      });

      console.log("Response status:", response.status);  // Debug log
      const data = await response.json();
      console.log("Response data:", data);  // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      // Mark all submitted students as synced
      setStudents(prev => prev.map(s => ({
        ...s,
        synced: true
      })));
      setStatusMsg("Students updated successfully");
    } catch (error) {
      console.error("Error submitting students:", error);  // Debug log
      setStatusMsg(error.message || "Failed to update students");
    }
  };

  const updateParameters = async () => {
    // Get all students that need updating
    const studentsToUpdate = students.filter(s => !s.synced);
    
    if (studentsToUpdate.length === 0) {
      setStatusMsg("No changes to update");
      return;
    }

    try {
      const response = await fetch(`${API}/update-parameters/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: studentsToUpdate.map(s => ({
            student_id: s.studentId,  // This is already the hashed ID from the backend
            max_hours: s.maxHours,
            f1_status: s.isInternational,
            priority: s.priority
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update parameters');
      }

      // Mark all updated students as synced
      setStudents(prev => prev.map(s => ({
        ...s,
        synced: true
      })));
      setStatusMsg("Parameters updated successfully");
    } catch (error) {
      console.error("Error updating parameters:", error);
      setStatusMsg(error.message || "Failed to update parameters");
    }
  };

  return (
    <div className="p-3">
      <h2>Manage Students</h2>

      {/* add form */}
      <form className="row g-2 align-items-end mb-3" onSubmit={handleAdd}>
        <div className="col-sm-3">
          <label className="form-label">First</label>
          <input
            className="form-control"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            required
          />
        </div>
        <div className="col-sm-3">
          <label className="form-label">Last</label>
          <input
            className="form-control"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            required
          />
        </div>
        <div className="col-sm-3">
          <label className="form-label">Student ID</label>
          <input
            className="form-control"
            value={sid}
            onChange={(e) => setSid(numeric8(e.target.value))}
            maxLength={8}
            inputMode="numeric"
            required
          />
        </div>
        <div className="col-sm-3">
          <button className="btn btn-primary w-100">Add (local)</button>
        </div>
      </form>

      {/* submit buttons */}
      <div className="mb-3">
        <button
          className="btn btn-success me-2"
          onClick={submitNew}
        >
          Update Students → DB
        </button>
        <button
          className="btn btn-primary"
          onClick={updateParameters}
        >
          Update Parameters → DB
        </button>
      </div>

      {statusMsg && <div className="alert alert-info py-2">{statusMsg}</div>}

      {/* table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Intl?</th>
              <th>Max Hours</th>
              <th>Priority</th>
              <th>Submitted Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.firstName} {s.lastName}</td>
                <td>
                  {s.synced ? (
                    <span className="badge bg-success">✔︎</span>
                  ) : (
                    <span className="badge bg-danger">📌 Pending</span>
                  )}
                </td>

                <td>
                  <select
                    value={s.isInternational ? "Yes" : "No"}
                    onChange={(e) => {
                      const intl = e.target.value === "Yes";
                      const capped = Math.min(intl ? 20 : 40, s.maxHours || 0);
                      const row = { ...s, isInternational: intl, maxHours: capped };
                      patch(s.id, row);
                    }}
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: 80 }}
                    min="0"
                    max={s.isInternational ? 20 : 40}
                    value={s.maxHours}
                    onChange={(e) => {
                      const row = { ...s, maxHours: Number(e.target.value) };
                      patch(s.id, row);
                    }}
                  />
                </td>

                <td>
                  <input   
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: 60 }}
                    min="0"
                    max="5"    
                    value={s.priority}
                    onChange={(e) => {
                      const row = { ...s, priority: Number(e.target.value) };
                      patch(s.id, row);
                    }}
                  />
                </td>

                <td>
                  {s.hasSubmittedAvailability ? (
                    <span className="badge bg-success">Yes</span>
                  ) : (
                    <span className="badge bg-warning">No</span>
                  )}
                </td>

                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
