import React, { useEffect, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";

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

  const handleDelete = (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    fetch(`${API}/delete-student/?student_id=${studentId}`, {
      method: 'DELETE',
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete student');
        // Remove the student from the local state
        setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
        setStatusMsg('✅ Student deleted successfully');
      })
      .catch((err) => {
        console.error('Error deleting student:', err);
        setStatusMsg('⚠︎ Failed to delete student');
      });
  };

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
      hasSubmittedAvailability: false,          // new field
    };
    setStudents((prev) => [...prev, row]);
    setFirst("");
    setLast("");
    setSid("");
  };

  const patch = (id, obj) =>
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...obj } : s))
    );

  const fireUpdateAPI = (stu) => {
    fetch(`${API}/update-parameters/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: [
          {
            student_id: stu.studentId,
            max_hours: stu.maxHours,
            f1_status: stu.isInternational,
            priority: stu.priority,
          },
        ],
      }),
    }).catch(() => console.log("update-parameters offline"));
  };

  const submitNew = () => {
    const pending = students.filter((s) => !s.synced);
    const existing = students.filter((s) => s.synced);
    if (!pending.length && !existing.length) return alert("No students to submit.");

    const body = {
      students: [
        ...pending.map((s) => ({
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: `${s.studentId}@umb.edu`,
          maxHours: s.maxHours,
          f1Status: s.isInternational,
          priority: s.priority
        })),
        ...existing.map((s) => ({
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: `${s.studentId}@umb.edu`,
          maxHours: s.maxHours,
          f1Status: s.isInternational,
          priority: s.priority
        }))
      ],
    };

    fetch(`${API}/admin-form/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        /* mark new rows as synced */
        setStudents((prev) =>
          prev.map((s) =>
            pending.some(p => p.studentId === s.studentId) ? { ...s, synced: true } : s
          )
        );
        setStatusMsg("✅ Students updated successfully!");
      })
      .catch(() => setStatusMsg("⚠︎ Could not reach backend."));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Student Management</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Max Hours</th>
                    <th>International</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentId}</td>
                      <td>{s.firstName}</td>
                      <td>{s.lastName}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 80 }}
                          min="0"
                          max={s.isInternational ? 20 : 40}
                          value={s.maxHours}
                          onChange={(e) => {
                            if (!s.synced) return;
                            const row = { ...s, maxHours: Number(e.target.value) };
                            patch(s.id, row);
                            fireUpdateAPI(row);
                          }}
                          disabled={!s.synced}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={s.isInternational}
                          onChange={(e) => {
                            if (!s.synced) return;
                            const row = { ...s, isInternational: e.target.checked };
                            patch(s.id, row);
                            fireUpdateAPI(row);
                          }}
                          disabled={!s.synced}
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
                            if (!s.synced) return;
                            const row = { ...s, priority: Number(e.target.value) };
                            patch(s.id, row);
                            fireUpdateAPI(row);
                          }}
                          disabled={!s.synced}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s.studentId)}
                          disabled={!s.synced}
                          title="Delete student"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
