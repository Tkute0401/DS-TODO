// scratch/test_db_direct.js
const { db } = require('../src/lib/db');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const users = await db.getAllUsers(true);
  console.log('All users (including archived):', users.map(u => ({ id: u.id, name: u.name, is_active: u.is_active })));
  
  const kunal = users.find(u => u.email === 'kunal.verma@firm.com');
  if (kunal) {
    console.log('Updating kunal to is_active: false...');
    const updated = await db.updateUser(kunal.id, { is_active: false });
    console.log('Updated return:', updated);

    const activeList = await db.getAllUsers(false);
    console.log('Active users count:', activeList.length, activeList.map(u => u.name));
  }
}

test().catch(console.error);
