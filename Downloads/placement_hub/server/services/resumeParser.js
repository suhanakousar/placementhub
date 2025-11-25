const fs = require('fs');
const path = require('path');

// Common programming languages and technologies
const PROGRAMMING_LANGUAGES = [
  'java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'go', 'rust',
  'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
  'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring',
  'mongodb', 'mysql', 'postgresql', 'postgres', 'redis', 'aws', 'azure', 'gcp', 'google cloud',
  'docker', 'kubernetes', 'k8s', 'git', 'github', 'gitlab', 'linux', 'rest', 'restful',
  'graphql', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd', 'cicd', 'jenkins',
  'terraform', 'ansible', 'jira', 'confluence', 'bootstrap', 'tailwind', 'sass', 'less',
  'jquery', 'redux', 'mobx', 'next.js', 'nextjs', 'nuxt', 'gatsby', 'webpack', 'vite',
  'firebase', 'supabase', 'vercel', 'netlify', 'heroku', 'nginx', 'apache', 'tomcat',
  'elasticsearch', 'kafka', 'rabbitmq', 'socket.io', 'websocket', 'oauth', 'jwt',
  'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'opencv', 'd3.js'
];

// Common frameworks and tools
const FRAMEWORKS = [
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
  'spring boot', 'hibernate', 'jpa', 'junit', 'maven', 'gradle', 'npm', 'yarn',
  'webpack', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'selenium'
];

// Experience level keywords
const EXPERIENCE_KEYWORDS = {
  fresher: ['fresher', 'entry level', 'graduate', 'intern', 'internship', '0 years', 'no experience'],
  '0-1': ['0-1 years', '0 to 1 years', 'junior', 'associate', '1 year'],
  '1-3': ['1-3 years', '1 to 3 years', '2 years', '3 years', 'mid-level', 'mid level'],
  '3+': ['3+ years', '3 years', 'senior', 'lead', 'principal', 'architect', '4 years', '5 years']
};

// Job role keywords
const ROLE_KEYWORDS = {
  'Software Engineer': ['software engineer', 'software developer', 'developer', 'programmer', 'coder'],
  'Frontend Developer': ['frontend', 'front-end', 'ui developer', 'react developer', 'angular developer'],
  'Backend Developer': ['backend', 'back-end', 'server-side', 'api developer', 'node.js developer'],
  'Full Stack Developer': ['full stack', 'full-stack', 'fullstack', 'mern', 'mean'],
  'Data Scientist': ['data scientist', 'data analyst', 'machine learning', 'ml engineer', 'ai engineer'],
  'DevOps Engineer': ['devops', 'sre', 'site reliability', 'cloud engineer', 'infrastructure'],
  'QA Engineer': ['qa', 'quality assurance', 'test engineer', 'automation tester', 'sdet'],
  'Mobile Developer': ['mobile developer', 'ios developer', 'android developer', 'react native', 'flutter']
};

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Fallback: try to read as text if it's a text-based PDF
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      return '';
    }
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    // Fallback: try to read as text
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      return '';
    }
  }
}

/**
 * Extract text from resume file
 */
async function extractTextFromResume(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return await extractTextFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    return await extractTextFromDOCX(filePath);
  }
  
  return '';
}

/**
 * Extract skills from resume text
 */
function extractSkills(text) {
  if (!text || text.length === 0) return [];
  
  const lowerText = text.toLowerCase();
  const foundSkills = [];
  
  // Check for programming languages and frameworks
  const allSkills = [...new Set([...PROGRAMMING_LANGUAGES, ...FRAMEWORKS])];
  
  allSkills.forEach(skill => {
    // Escape special regex characters
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary or allow for variations (e.g., "Node.js" vs "nodejs")
    const regex = new RegExp(`\\b${escapedSkill}\\b|${escapedSkill.replace(/[.*+?^${}()|[\]\\]/g, '')}`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.push(skill);
    }
  });
  
  // Also look for skills mentioned in common sections
  // Look for "Skills:", "Technologies:", "Technical Skills:" sections
  const skillsSectionRegex = /(?:skills?|technologies?|technical\s+skills?|programming\s+languages?|tools?|frameworks?)[:;]?\s*([^•\n]{50,500})/i;
  const skillsMatch = text.match(skillsSectionRegex);
  
  if (skillsMatch && skillsMatch[1]) {
    const skillsSection = skillsMatch[1].toLowerCase();
    allSkills.forEach(skill => {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(skillsSection) && !foundSkills.includes(skill)) {
        foundSkills.push(skill);
      }
    });
  }
  
  // Remove duplicates and return top 10
  return [...new Set(foundSkills)].slice(0, 10);
}

/**
 * Extract experience level from resume text
 */
function extractExperienceLevel(text) {
  const lowerText = text.toLowerCase();
  
  // Check for years of experience patterns
  const yearsPattern = /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i;
  const yearsMatch = lowerText.match(yearsPattern);
  
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years === 0 || years < 1) return 'Fresher';
    if (years >= 1 && years < 3) return '1-3';
    if (years >= 3) return '3+';
  }
  
  // Check for keywords
  for (const [level, keywords] of Object.entries(EXPERIENCE_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      if (level === 'fresher') return 'Fresher';
      if (level === '0-1') return '0-1';
      if (level === '1-3') return '1-3';
      if (level === '3+') return '3+';
    }
  }
  
  return 'Fresher'; // Default
}

/**
 * Extract preferred roles from resume text
 */
function extractPreferredRoles(text) {
  if (!text || text.length === 0) return ['Software Engineer'];
  
  const lowerText = text.toLowerCase();
  const foundRoles = [];
  
  // Check for role keywords
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      foundRoles.push(role);
    }
  }
  
  // Also check for role in objective/summary section
  const objectiveRegex = /(?:objective|summary|profile|about)[:;]?\s*([^•\n]{20,200})/i;
  const objectiveMatch = text.match(objectiveRegex);
  
  if (objectiveMatch && objectiveMatch[1]) {
    const objectiveText = objectiveMatch[1].toLowerCase();
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
      if (keywords.some(keyword => objectiveText.includes(keyword)) && !foundRoles.includes(role)) {
        foundRoles.push(role);
      }
    }
  }
  
  return foundRoles.length > 0 ? foundRoles : ['Software Engineer']; // Default
}

/**
 * Extract location from resume text
 */
function extractLocation(text) {
  if (!text || text.length === 0) return null;
  
  // Common location patterns
  const locationPatterns = [
    /(?:located in|based in|from|residing in|lives? in|current location|address)[:;]?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:India|USA|United States|UK|United Kingdom|Bangalore|Mumbai|Delhi|Hyderabad|Chennai|Pune|Kolkata)/i,
    /(?:city|location)[:;]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:address)[:;]?\s*([^,\n]{10,50}),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Return the city/state name
      const location = match[1] || match[2];
      if (location && location.length > 2 && location.length < 50) {
        return location.trim();
      }
    }
  }
  
  // Try to find common Indian cities
  const indianCities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur'];
  const lowerText = text.toLowerCase();
  for (const city of indianCities) {
    if (lowerText.includes(city.toLowerCase())) {
      return city;
    }
  }
  
  return null;
}

/**
 * Extract degree/branch from resume text
 */
function extractDegree(text) {
  const lowerText = text.toLowerCase();
  
  const degreePatterns = [
    /(?:bachelor|b\.?tech|b\.?e\.?|b\.?s\.?|bachelor of science)\s+(?:in\s+)?([a-z\s]+)/i,
    /(?:master|m\.?tech|m\.?e\.?|m\.?s\.?|master of science)\s+(?:in\s+)?([a-z\s]+)/i
  ];
  
  for (const pattern of degreePatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Parse resume file and extract information
 */
async function parseResume(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';
    
    // Extract text based on file type
    if (ext === '.pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      text = await extractTextFromDOCX(filePath);
    } else {
      // Try to read as plain text
      try {
        text = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        console.error('Error reading file as text:', err);
      }
    }
    
    // Clean up text - remove extra whitespace and normalize
    text = text.replace(/\s+/g, ' ').trim();
    
    // If text is still empty or too short, return basic structure
    if (!text || text.trim().length < 50) {
      console.warn('Resume text extraction resulted in empty or very short text');
      return {
        topSkills: [],
        experienceLevel: 'Fresher',
        preferredRoles: ['Software Engineer'],
        location: null,
        degree: null,
        extractedText: text.substring(0, 500),
        warning: 'Could not extract sufficient text from resume. Please ensure the file is not corrupted or password-protected.'
      };
    }
    
    console.log(`Extracted ${text.length} characters from resume`);
    
    // Extract information
    const topSkills = extractSkills(text);
    const experienceLevel = extractExperienceLevel(text);
    const preferredRoles = extractPreferredRoles(text);
    const location = extractLocation(text);
    const degree = extractDegree(text);
    
    // Log extracted data for debugging
    console.log('Extracted data:', {
      skillsCount: topSkills.length,
      experienceLevel,
      preferredRoles,
      location,
      degree
    });
    
    return {
      topSkills,
      experienceLevel,
      preferredRoles,
      location,
      degree,
      extractedText: text.substring(0, 1000) // Store first 1000 chars for reference
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    // Return default structure on error
    return {
      topSkills: [],
      experienceLevel: 'Fresher',
      preferredRoles: ['Software Engineer'],
      location: null,
      degree: null,
      extractedText: '',
      error: error.message
    };
  }
}

module.exports = {
  parseResume,
  extractSkills,
  extractExperienceLevel,
  extractPreferredRoles,
  extractLocation,
  extractDegree
};

