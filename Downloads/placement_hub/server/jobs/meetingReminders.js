const cron = require('node-cron');
const { processPendingReminders, checkNoShows } = require('../utils/reminderUtils');

/**
 * Schedule cron jobs for meeting reminders and no-show detection
 */
function scheduleMeetingJobs() {
  // Process pending reminders every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Processing pending reminders...');
    try {
      await processPendingReminders();
    } catch (error) {
      console.error('[Cron] Error processing reminders:', error);
    }
  });

  // Check for no-shows every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Checking for no-shows...');
    try {
      await checkNoShows();
    } catch (error) {
      console.error('[Cron] Error checking no-shows:', error);
    }
  });

  console.log('Meeting reminder and no-show detection jobs scheduled');
}

module.exports = { scheduleMeetingJobs };

