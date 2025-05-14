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
    try {
    const body = {
        listofstudents: students.map((s) => ({
        student_id: s.studentId,
        student_email: `${s.studentId}@umb.edu`,
          first_name: s.firstName,
          last_name: s.lastName,
          max_hours: s.maxHours || 0,
          f1_status: s.isInternational || false,
          priority: s.priority || 0
      })),
    };

      console.log('Sending request with body:', JSON.stringify(body, null, 2));

      // First, update the database
      const updateResponse = await fetch(`${API}/admin-form/`, {
      method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      body: JSON.stringify(body),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update students');
      }

      const updateData = await updateResponse.json();
      console.log('Admin form response:', updateData);

      // Then, fetch the latest data
      const studentsResponse = await fetch(`${API}/students/`);
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch updated students list');
      }

      const studentsData = await studentsResponse.json();
      console.log('Updated students data:', JSON.stringify(studentsData, null, 2));

      // Update the local state with the latest data
      setStudents(studentsData.students.map(s => ({
        ...s,
        synced: true
      })));
      setStatusMsg("✅ Students updated in DB!");
    } catch (error) {
      console.error("Error in update process:", error);
      setStatusMsg(`⚠︎ Error: ${error.message}`);
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

      {/* submit button */}
      <button
        className="btn btn-success mb-3"
        onClick={submitNew}
      >
        Update Students → DB
      </button>

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
                      if (!s.synced) return;
                      const intl = e.target.value === "Yes";
                      const capped = Math.min(intl ? 20 : 40, s.maxHours || 0);
                      const row = { ...s, isInternational: intl, maxHours: capped };
                      patch(s.id, row);
                      fireUpdateAPI(row);
                    }}
                    disabled={!s.synced}
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
