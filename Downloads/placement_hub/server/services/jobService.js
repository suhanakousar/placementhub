const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'f627be65a2mshfe6bd4a0cff94f1p16906fjsn66a6d43077ce';

/**
 * Fetch jobs from Rise API
 */
async function fetchJobsFromRise(params) {
  try {
    const { keywords, location, page = 1, pageSize = 20 } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      sort: 'desc',
      sortedBy: 'createdAt'
    });
    
    if (location && location !== 'Remote' && location !== 'Worldwide') {
      queryParams.append('jobLoc', location);
    }
    
    const response = await axios.get(
      `https://api.joinrise.io/api/v1/jobs/public?${queryParams.toString()}`,
      { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.data || !response.data.success || !response.data.result?.jobs) {
      console.log('Rise API: No jobs in response', {
        hasData: !!response.data,
        success: response.data?.success,
        hasJobs: !!response.data?.result?.jobs,
        jobsCount: response.data?.result?.jobs?.length
      });
      return [];
    }
    
    const jobs = response.data.result.jobs
      .filter(job => {
        // Filter by keywords if provided
        if (keywords) {
          const searchText = `${job.title || ''} ${job.descriptionBreakdown?.oneSentenceJobSummary || ''} ${job.skills_suggest?.join(' ') || ''}`.toLowerCase();
          const keywordLower = keywords.toLowerCase();
          return searchText.includes(keywordLower);
        }
        return true;
      })
      .map(job => ({
        jobId: job._id || `rise-${Date.now()}-${Math.random()}`,
        title: job.title || 'Untitled Position',
        company: job.owner?.companyName || 'Unknown Company',
        location: job.locationAddress || job.location || 'Location not specified',
        type: job.type || job.descriptionBreakdown?.workModel || 'Full-time',
        description: job.descriptionBreakdown?.oneSentenceJobSummary || '',
        skills: job.skills_suggest || job.descriptionBreakdown?.skillRequirements || [],
        postedAt: job.createdAt || new Date().toISOString(),
        url: job.url || `https://joinrise.co/jobs/${job._id}`,
        salaryRange: job.descriptionBreakdown?.salaryRangeMinYearly 
          ? `$${job.descriptionBreakdown.salaryRangeMinYearly.toLocaleString()} - $${job.descriptionBreakdown.salaryRangeMaxYearly?.toLocaleString() || 'N/A'}`
          : null,
        source: 'Rise'
      }));
    
    console.log(`Rise API: Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error('Error fetching jobs from Rise API:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return [];
  }
}

/**
 * Fetch jobs from LinkedIn API (RapidAPI)
 */
async function fetchJobsFromLinkedIn(params) {
  try {
    const { keywords, location, experienceLevel, jobType, pageSize = 20 } = params;
    
    // Map experience levels
    const experienceLevels = {
      'Fresher': 'intern;entry',
      '0-1': 'entry;associate',
      '1-3': 'associate;midSenior',
      '3+': 'midSenior;director'
    };
    
    // Map job types
    const workplaceTypes = {
      'Remote': 'remote',
      'Hybrid': 'hybrid',
      'Full-time': 'onSite',
      'Internship': 'remote;hybrid;onSite'
    };
    
    const queryParams = new URLSearchParams({
      query: keywords || 'software engineer',
      experienceLevels: experienceLevels[experienceLevel] || 'entry;associate;midSenior',
      workplaceTypes: workplaceTypes[jobType] || 'remote;hybrid;onSite',
      location: location === 'Remote' ? 'Worldwide' : (location || 'Worldwide'),
      datePosted: 'month',
      employmentTypes: 'fulltime;intern',
      limit: Math.min(pageSize, 50).toString()
    });
    
    const response = await axios.get(
      `https://jobs-api14.p.rapidapi.com/v2/linkedin/search?${queryParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jobs-api14.p.rapidapi.com'
        },
        timeout: 10000
      }
    );
    
    if (!response.data || !response.data.jobs) {
      console.log('LinkedIn API: No jobs in response');
      return [];
    }
    
    const mappedJobs = response.data.jobs.map((job, index) => ({
      jobId: job.jobId || `linkedin-${Date.now()}-${index}`,
      title: job.title || 'Untitled Position',
      company: job.companyName || 'Unknown Company',
      location: job.location || 'Location not specified',
      type: job.workplaceType || jobType || 'Full-time',
      description: job.description?.substring(0, 200) || '',
      skills: extractSkillsFromDescription(job.description || ''),
      postedAt: job.publishedAt || job.datePosted || new Date().toISOString(),
      url: job.url || job.link || '#',
      salaryRange: job.salary || null,
      source: 'LinkedIn'
    }));
    
    console.log(`LinkedIn API: Fetched ${mappedJobs.length} jobs`);
    return mappedJobs;
  } catch (error) {
    console.error('Error fetching jobs from LinkedIn API:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return [];
  }
}

/**
 * Fetch jobs from Active Jobs DB API (RapidAPI)
 */
async function fetchJobsFromActiveJobsDB(params) {
  try {
    const { keywords, location, pageSize = 20 } = params;
    
    const queryParams = new URLSearchParams({
      limit: Math.min(pageSize, 50).toString(),
      offset: '0'
    });
    
    if (keywords) {
      queryParams.append('title_filter', `"${keywords}"`);
    }
    
    if (location && location !== 'Remote' && location !== 'Worldwide') {
      queryParams.append('location_filter', `"${location}"`);
    }
    
    queryParams.append('description_type', 'text');
    
    const response = await axios.get(
      `https://active-jobs-db.p.rapidapi.com/active-ats-7d?${queryParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        },
        timeout: 10000
      }
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      console.log('Active Jobs DB API: No jobs in response');
      return [];
    }
    
    const mappedJobs = response.data.map((job, index) => ({
      jobId: job.id || `activejobs-${Date.now()}-${index}`,
      title: job.title || 'Untitled Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Location not specified',
      type: job.type || 'Full-time',
      description: job.description?.substring(0, 200) || '',
      skills: extractSkillsFromDescription(job.description || ''),
      postedAt: job.postedAt || job.createdAt || new Date().toISOString(),
      url: job.url || job.link || '#',
      salaryRange: job.salary || null,
      source: 'ActiveJobsDB'
    }));
    
    console.log(`Active Jobs DB API: Fetched ${mappedJobs.length} jobs`);
    return mappedJobs;
  } catch (error) {
    console.error('Error fetching jobs from Active Jobs DB API:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return [];
  }
}

/**
 * Extract skills from job description
 */
function extractSkillsFromDescription(description) {
  if (!description) return [];
  
  const commonSkills = [
    'java', 'python', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'docker',
    'kubernetes', 'mongodb', 'mysql', 'postgresql', 'git', 'agile', 'scrum',
    'devops', 'ci/cd', 'rest', 'graphql', 'microservices', 'sql', 'html', 'css'
  ];
  
  const lowerDesc = description.toLowerCase();
  const foundSkills = [];
  
  commonSkills.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerDesc)) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills.slice(0, 10);
}

/**
 * Fetch jobs from all APIs and combine results
 */
async function fetchJobsFromAPIs(params) {
  const { pageSize = 20 } = params;
  
  console.log('Fetching jobs with params:', params);
  
  // Fetch from all APIs in parallel with error handling
  const [riseJobs, linkedInJobs, activeJobs] = await Promise.allSettled([
    fetchJobsFromRise({ ...params, pageSize: Math.ceil(pageSize / 3) }),
    fetchJobsFromLinkedIn({ ...params, pageSize: Math.ceil(pageSize / 3) }),
    fetchJobsFromActiveJobsDB({ ...params, pageSize: Math.ceil(pageSize / 3) })
  ]);
  
  // Extract results from Promise.allSettled
  const riseResults = riseJobs.status === 'fulfilled' ? riseJobs.value : [];
  const linkedInResults = linkedInJobs.status === 'fulfilled' ? linkedInJobs.value : [];
  const activeJobsResults = activeJobs.status === 'fulfilled' ? activeJobs.value : [];
  
  if (riseJobs.status === 'rejected') {
    console.error('Rise API promise rejected:', riseJobs.reason);
  }
  if (linkedInJobs.status === 'rejected') {
    console.error('LinkedIn API promise rejected:', linkedInJobs.reason);
  }
  if (activeJobs.status === 'rejected') {
    console.error('Active Jobs DB API promise rejected:', activeJobs.reason);
  }
  
  // Combine and deduplicate by title and company
  const allJobs = [...riseResults, ...linkedInResults, ...activeJobsResults];
  const uniqueJobs = [];
  const seen = new Set();
  
  for (const job of allJobs) {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(job);
    }
  }
  
  console.log(`Total unique jobs fetched: ${uniqueJobs.length} (Rise: ${riseResults.length}, LinkedIn: ${linkedInResults.length}, ActiveJobs: ${activeJobsResults.length})`);
  
  return uniqueJobs.slice(0, pageSize);
}

/**
 * Calculate match score based on overlapping skills
 */
function calculateMatchScore(jobSkills, resumeSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!resumeSkills || resumeSkills.length === 0) return 0;
  
  // Normalize skills to lowercase for comparison
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());
  const normalizedResumeSkills = resumeSkills.map(s => s.toLowerCase());
  
  // Find overlapping skills
  const overlappingSkills = normalizedJobSkills.filter(skill => 
    normalizedResumeSkills.some(resumeSkill => 
      resumeSkill.includes(skill) || skill.includes(resumeSkill)
    )
  );
  
  // Calculate match percentage
  const matchPercentage = (overlappingSkills.length / normalizedJobSkills.length) * 100;
  
  // Cap at 100 and round
  return Math.min(100, Math.round(matchPercentage));
}

module.exports = {
  fetchJobsFromAPIs,
  fetchJobsFromRise,
  fetchJobsFromLinkedIn,
  fetchJobsFromActiveJobsDB,
  calculateMatchScore
};

