// Department code to full name mapping
export const departmentNames = {
  'CSE': 'Computer Science & Engineering',
  'ECE': 'Electronics & Communication Engineering',
  'EEE': 'Electrical & Electronics Engineering',
  'ME': 'Mechanical Engineering',
  'CE': 'Civil Engineering',
  'IT': 'Information Technology',
  'CSIT': 'Computer Science & Information Technology',
  'AI': 'AI & DS (Artificial Intelligence & Data Science)',
  'BT': 'Biotechnology'
};

// Function to get full department name from code
export const getDepartmentName = (code) => {
  if (!code) return 'N/A';
  return departmentNames[code] || code;
};

// Function to get department code from full name (for reverse lookup)
export const getDepartmentCode = (fullName) => {
  if (!fullName) return null;
  const entry = Object.entries(departmentNames).find(([_, name]) => name === fullName);
  return entry ? entry[0] : null;
};

