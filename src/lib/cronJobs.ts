// lib/cronJobs.ts
import cron from 'node-cron';
import prisma from './prisma'; // Adjust the import based on your project structure

// Function to delete old announcements
const deleteOldAnnouncements = async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await prisma.announcement.deleteMany({
    where: {
      dateCreated: {
        lt: threeDaysAgo,
      },
    },
  });
};

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled task to delete old announcements...');
  deleteOldAnnouncements()
    .then(() => console.log('Old announcements deleted successfully.'))
    .catch((error) => console.error('Error deleting old announcements:', error));
});