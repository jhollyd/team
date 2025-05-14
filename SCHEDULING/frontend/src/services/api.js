import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Fetches all saved schedules from the backend.
 * @returns {Promise} A promise that resolves to the list of schedules.
 */
export async function fetchSchedules() {
  const res = await axios.get(`${API_BASE_URL}/schedules/`);
  return res.data;
}

/**
 * Generates new schedules based on the provided parameters.
 * @param {Object} params - The parameters for generating schedules.
 * @param {string} params.employee_ids - Comma-separated list of employee IDs.
 * @param {number} params.total_master_schedule_hours - Total hours for the master schedule.
 * @param {number} params.num_schedules_desired - Number of schedules to generate.
 * @returns {Promise} A promise that resolves to the generated schedules.
 */
export async function generateSchedules(params) {
  const res = await axios.get(`${API_BASE_URL}/generate-schedules/`, { params });
  return res.data;
}

/**
 * Saves a schedule to the backend.
 * @param {Object} scheduleData - The schedule data to save.
 * @returns {Promise} A promise that resolves to the response from the backend.
 */
export async function saveSchedule(scheduleData) {
  const res = await axios.put(`${API_BASE_URL}/save-schedule/`, scheduleData);
  return res.data;
}

/**
 * Submits new students to the backend.
 * @param {Array} studentsList - List of new students to submit.
 * @returns {Promise} A promise that resolves to the response from the backend.
 */
export async function submitNewStudents(studentsList) {
  const body = { listofstudents: studentsList };
  const res = await axios.post(`${API_BASE_URL}/admin-form/`, body);
  return res.data;
}

/**
 * Updates employee parameters in the backend.
 * @param {Array} updates - List of updates for employee parameters.
 * @returns {Promise} A promise that resolves to the response from the backend.
 */
export async function updateParameters(updates) {
  const res = await axios.put(`${API_BASE_URL}/update-parameters/`, { updates });
  return res.data;
}

/**
 * Submits a student's availability to the backend.
 * @param {Object} availabilityData - The availability data to submit.
 * @returns {Promise} A promise that resolves to the response from the backend.
 */
export async function submitAvailability(availabilityData) {
  const res = await axios.put(`${API_BASE_URL}/submit-availability/`, availabilityData);
  return res.data;
}