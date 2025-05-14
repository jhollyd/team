/**
 * Hashes a student ID using a consistent algorithm
 * @param {string} studentId - The student ID to hash
 * @returns {string} The hashed student ID
 */
export function hashStudentId(studentId) {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    const char = studentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
} 