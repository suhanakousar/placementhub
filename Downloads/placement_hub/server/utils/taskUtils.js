const Task = require('../models/Task');
const Feedback = require('../models/Feedback');

/**
 * Create tasks from feedback tags
 * @param {Object} feedback - Feedback object
 * @param {Array} tags - Feedback tags
 * @returns {Array} - Created tasks
 */
async function createTasksFromFeedback(feedback, tags) {
  const tasks = [];
  const tagToTaskMap = {
    'resume': {
      title: 'Update Resume',
      description: 'Review and update your resume based on mentor feedback',
      priority: 'high'
    },
    'coding': {
      title: 'Practice Coding',
      description: 'Focus on improving coding skills as discussed in the meeting',
      priority: 'medium'
    },
    'hr_prep': {
      title: 'HR Interview Preparation',
      description: 'Prepare for HR interview questions and scenarios',
      priority: 'high'
    },
    'confidence': {
      title: 'Build Confidence',
      description: 'Work on building confidence in interviews and communication',
      priority: 'medium'
    },
    'technical_skills': {
      title: 'Improve Technical Skills',
      description: 'Focus on strengthening technical skills mentioned in feedback',
      priority: 'high'
    },
    'problem_solving': {
      title: 'Practice Problem Solving',
      description: 'Work on problem-solving skills and approach',
      priority: 'medium'
    },
    'presentation': {
      title: 'Improve Presentation Skills',
      description: 'Practice and improve presentation and communication skills',
      priority: 'medium'
    },
    'time_management': {
      title: 'Time Management',
      description: 'Work on better time management strategies',
      priority: 'low'
    },
    'needs_improvement': {
      title: 'Address Areas for Improvement',
      description: 'Focus on the areas that need improvement as discussed',
      priority: 'high'
    }
  };

  for (const tag of tags) {
    const taskConfig = tagToTaskMap[tag];
    if (taskConfig) {
      const task = await Task.create({
        studentId: feedback.studentId,
        createdBy: feedback.mentorId,
        title: taskConfig.title,
        description: taskConfig.description,
        priority: taskConfig.priority,
        origin: 'feedback_tag',
        linkedFeedbackId: feedback._id,
        linkedMeetingId: feedback.meetingId,
        sourceTag: tag,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get task statistics for a student
 * @param {ObjectId} studentId - Student ID
 * @returns {Object} - Task statistics
 */
async function getTaskStats(studentId) {
  const tasks = await Task.find({ studentId });

  const stats = {
    total: tasks.length,
    byStatus: {
      open: tasks.filter(t => t.status === 'open').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    },
    overdue: tasks.filter(t => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    }).length,
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length
    }
  };

  // Calculate average completion time
  const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt - task.createdAt);
    }, 0);
    stats.avgCompletionTime = totalTime / completedTasks.length; // in milliseconds
  } else {
    stats.avgCompletionTime = 0;
  }

  return stats;
}

/**
 * Get task statistics for admin (all students)
 * @param {ObjectId} mentorId - Mentor/Admin ID
 * @returns {Object} - Aggregate task statistics
 */
async function getAdminTaskStats(mentorId) {
  const tasks = await Task.find({ createdBy: mentorId });

  const stats = {
    total: tasks.length,
    byStatus: {
      open: tasks.filter(t => t.status === 'open').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    },
    overdue: tasks.filter(t => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    }).length,
    byOrigin: {
      manual: tasks.filter(t => t.origin === 'manual').length,
      auto_feedback: tasks.filter(t => t.origin === 'auto_feedback').length,
      auto_no_show: tasks.filter(t => t.origin === 'auto_no_show').length,
      auto_email: tasks.filter(t => t.origin === 'auto_email').length,
      feedback_tag: tasks.filter(t => t.origin === 'feedback_tag').length
    }
  };

  return stats;
}

module.exports = {
  createTasksFromFeedback,
  getTaskStats,
  getAdminTaskStats
};

