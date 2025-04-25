import React, { useState, useEffect } from 'react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([
    {
      id: '1',
      firstName: 'Demo',
      lastName: 'Student1',
      studentId: 'S001',
      isInternational: false,
      maxHours: 15,
      icalSubmitted: true,
      priority: 3,
      preferClassDays: false,
    },
    {
      id: '2',
      firstName: 'Demo',
      lastName: 'Student2',
      studentId: 'S002',
      isInternational: true,
      maxHours: 20,
      icalSubmitted: false,
      priority: 1,
      preferClassDays: true,
    },
  ]);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');

  const validateStudentId = (value) => {
    // Only allow numeric values and limit to 8 digits
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.slice(0, 8);
  };

  const fetchStudents = async () => {
    return students;
  };

  const updateStudent = async (studentId, updates) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId ? { ...student, ...updates } : student
      )
    );
  };

  const createStudent = async (studentData) => {
    const newStudent = {
      id: Math.random().toString(36).substr(2, 9), // Generate a random ID
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      studentId: studentData.studentId,
      isInternational: false,
      maxHours: 0,
      icalSubmitted: false,
      priority: 1,
      preferClassDays: false,
    };
    setStudents((prevStudents) => [...prevStudents, newStudent]);
    return newStudent;
  };

  const deleteStudent = async (studentId) => {
    setStudents((prevStudents) =>
      prevStudents.filter((student) => student.id !== studentId)
    );
  };

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    try {
      await createStudent({
        firstName: newFirstName,
        lastName: newLastName,
        studentId: newStudentId,
      });
      // Clear input fields after adding
      setNewFirstName('');
      setNewLastName('');
      setNewStudentId('');
    } catch (err) {
      console.error('Error adding student:', err);
    }
  }

  async function handleDeleteStudent(studentId) {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId);
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    }
  }

  async function handleInternationalChange(studentId, value) {
    const isInternational = value === 'Yes';
    const currentStu = students.find((s) => s.id === studentId);
    let newMaxHours = currentStu?.maxHours || 0;

    if (isInternational && newMaxHours > 20) {
      newMaxHours = 20;
    }

    try {
      await updateStudent(studentId, { isInternational, maxHours: newMaxHours });
    } catch (err) {
      console.error('Error updating student:', err);
    }
  }

  async function handleMaxHoursChange(studentId, newHours) {
    const currentStu = students.find((s) => s.id === studentId);
    const isInternational = currentStu?.isInternational || false;
    let hours = Number(newHours) || 0;

    if (isInternational) {
      hours = Math.min(20, Math.max(0, hours));
    } else {
      hours = Math.min(40, Math.max(0, hours));
    }

    try {
      await updateStudent(studentId, { maxHours: hours });
    } catch (err) {
      console.error('Error updating max hours:', err);
    }
  }

  async function handlePriorityChange(studentId, newPriority) {
    const priority = Math.max(1, Math.min(5, Number(newPriority))); // Restrict to 1-5
    try {
      await updateStudent(studentId, { priority });
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  }

  async function handlePreferClassDaysChange(studentId, checked) {
    try {
      await updateStudent(studentId, { preferClassDays: checked });
    } catch (err) {
      console.error('Error updating prefer class days:', err);
    }
  }

  return (
    <div className="p-3">
      <h2>Manage Students</h2>

      {/* Form to Add New Student */}
      <div className="mb-3">
        <h3>Add New Student</h3>
        <form onSubmit={handleAddStudent}>
          <label htmlFor="newFirstName" className="me-2">
            First Name:
          </label>
          <input
            id="newFirstName"
            type="text"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            required
            className="me-2"
          />
          <label htmlFor="newLastName" className="me-2">
            Last Name:
          </label>
          <input
            id="newLastName"
            type="text"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            required
            className="me-2"
          />
          <label htmlFor="newStudentId" className="me-2">
            Student ID:
          </label>
          <input
            id="newStudentId"
            type="text"
            value={newStudentId}
            onChange={(e) => setNewStudentId(validateStudentId(e.target.value))}
            required
            className="me-2"
            maxLength={8}
            pattern="[0-9]*"
            inputMode="numeric"
          />
          <button type="submit" className="btn btn-sm btn-primary">
            Add
          </button>
        </form>
      </div>

      {/* Students Table */}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>International?</th>
            <th>Max Hours</th>
            <th>iCal Uploaded?</th>
            <th>Priority (1-5)</th>
            <th>Prefer working on Class Days</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((stu) => (
            <tr key={stu.id}>
              <td>{`${stu.firstName} ${stu.lastName}`}</td>
              <td>
                <select
                  value={stu.isInternational ? 'Yes' : 'No'}
                  onChange={(e) => handleInternationalChange(stu.id, e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={stu.maxHours || 0}
                  onChange={(e) => handleMaxHoursChange(stu.id, e.target.value)}
                  min="0"
                  max={stu.isInternational ? "20" : "40"}
                  title={stu.isInternational ? "Maximum 20 hours for international students" : "Maximum 40 hours for non-international students"}
                />
                <small className="text-muted ms-2">
                  {stu.isInternational ? "(Max: 20)" : "(Max: 40)"}
                </small>
              </td>
              <td>{stu.icalSubmitted ? 'Yes' : 'No'}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={stu.priority || 1}
                  onChange={(e) => handlePriorityChange(stu.id, e.target.value)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={stu.preferClassDays || false}
                  onChange={(e) => handlePreferClassDaysChange(stu.id, e.target.checked)}
                />
              </td>
              <td>
                <button
                  onClick={() => handleDeleteStudent(stu.id)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}