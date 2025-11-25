const fs = require('fs');
const path = require('path');

// Common programming languages and technologies
const PROGRAMMING_LANGUAGES = [
  'java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'go', 'rust',
  'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
  'mongodb', 'mysql', 'postgresql', 'redis', 'aws', 'azure', 'gcp', 'docker',
  'kubernetes', 'git', 'linux', 'rest', 'graphql', 'microservices', 'agile',
  'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform', 'ansible'
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
 * Extract text from PDF (simplified - in production, use pdf-parse or similar)
 */
async function extractTextFromPDF(filePath) {
  // For now, return empty string - in production, use pdf-parse library
  // const pdfParse = require('pdf-parse');
  // const dataBuffer = fs.readFileSync(filePath);
  // const data = await pdfParse(dataBuffer);
  // return data.text;
  
  // Placeholder - you should install and use pdf-parse
  return '';
}

/**
 * Extract text from DOCX (simplified - in production, use mammoth or similar)
 */
async function extractTextFromDOCX(filePath) {
  // For now, return empty string - in production, use mammoth library
  // const mammoth = require('mammoth');
  // const result = await mammoth.extractRawText({ path: filePath });
  // return result.value;
  
  // Placeholder - you should install and use mammoth
  return '';
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
  const lowerText = text.toLowerCase();
  const foundSkills = [];
  
  // Check for programming languages and frameworks
  [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS].forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.push(skill);
    }
  });
  
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
  const lowerText = text.toLowerCase();
  const foundRoles = [];
  
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      foundRoles.push(role);
    }
  }
  
  return foundRoles.length > 0 ? foundRoles : ['Software Engineer']; // Default
}

/**
 * Extract location from resume text
 */
function extractLocation(text) {
  // Common location patterns
  const locationPatterns = [
    /(?:located in|based in|from|residing in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:India|USA|United States|UK|United Kingdom)/i,
    /(?:city|location):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
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
    // For now, we'll use a simple approach
    // In production, you should install: npm install pdf-parse mammoth
    
    // Try to read as text (works for some PDFs and text files)
    let text = '';
    try {
      text = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      // If not readable as text, try extraction methods
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.pdf') {
        text = await extractTextFromPDF(filePath);
      } else if (ext === '.docx' || ext === '.doc') {
        text = await extractTextFromDOCX(filePath);
      }
    }
    
    // If text is still empty, return basic structure
    if (!text || text.trim().length === 0) {
      return {
        topSkills: [],
        experienceLevel: 'Fresher',
        preferredRoles: ['Software Engineer'],
        location: null,
        degree: null,
        extractedText: ''
      };
    }
    
    // Extract information
    const topSkills = extractSkills(text);
    const experienceLevel = extractExperienceLevel(text);
    const preferredRoles = extractPreferredRoles(text);
    const location = extractLocation(text);
    const degree = extractDegree(text);
    
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

