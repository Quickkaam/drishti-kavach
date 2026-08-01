require('dotenv').config();
const { sendNotification, TYPES, SEVERITY, CATEGORIES, ROLES } = require('./src/services/notifications');

async function test() {
  const result = await sendNotification({
    title: 'Test Notification',
    message: 'Testing if the notification is successfully created in the DB.',
    type: TYPES.INFO,
    severity: SEVERITY.INFO,
    category: CATEGORIES.SYSTEM,
    targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    sendInApp: true
  });
  console.log('Result:', result);
}

test();
