// verify_neon_system.js
// Tests the live Neon PostgreSQL connection, Tanmay Kute admin authentication,
// and verifies that all old mock data has been removed.

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- STARTING NEON & TANMAY KUTE LIVE VERIFICATION ---');

  // Step 1: Login as Tanmay Kute
  console.log('\n[1] Attempting login as Tanmay Kute (tanmay@firm.com)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tanmay@firm.com', password: 'password123' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login Success! User:', loginData.user.name, '| Role:', loginData.user.role, '| Designation:', loginData.user.designation);

  if (loginData.user.name !== 'Tanmay Kute' || loginData.user.role !== 'ADMIN') {
    throw new Error(`Unexpected user info: ${JSON.stringify(loginData.user)}`);
  }

  const cookieHeader = cookies ? cookies.split(';')[0] : '';
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
  };

  // Step 2: Check /api/auth/me
  console.log('\n[2] Verifying session with /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('Session verified:', meData.user.name, `(${meData.user.email})`);

  // Step 3: Check /api/users (ensure all mock users are removed)
  console.log('\n[3] Checking /api/users to ensure mock users were purged...');
  const usersRes = await fetch(`${BASE_URL}/api/users`, { headers: authHeaders });
  const usersData = await usersRes.json();
  console.log('Active users count in live database:', usersData.users.length);
  console.log('Users list:', usersData.users.map(u => `${u.name} (${u.role})`).join(', '));

  const hasMockUser = usersData.users.some(u => 
    u.name.includes('Siddharth') || 
    u.name.includes('Ananya') || 
    u.name.includes('Rahul') || 
    u.name.includes('Amit') || 
    u.name.includes('Priya')
  );

  if (hasMockUser) {
    throw new Error('Old mock users are still present in database!');
  }
  console.log('PASS: No old mock users detected.');

  // Step 4: Check /api/tasks (ensure old mock tasks are removed)
  console.log('\n[4] Checking /api/tasks?view=all to ensure mock tasks were purged...');
  const tasksRes = await fetch(`${BASE_URL}/api/tasks?view=all`, { headers: authHeaders });
  const tasksData = await tasksRes.json();
  console.log('Active tasks in live database:', tasksData.tasks.length);

  const hasMockTask = tasksData.tasks.some(t => 
    t.title.includes('Nike') || 
    t.title.includes('Zara') || 
    t.title.includes('Raw 4K') || 
    t.title.includes('Animated Logo')
  );

  if (hasMockTask) {
    throw new Error('Old mock tasks are still present in database!');
  }
  console.log('PASS: No old mock tasks detected.');

  // Step 5: Create a live production task by Tanmay Kute
  console.log('\n[5] Creating a live task on Neon PostgreSQL by Admin Tanmay Kute...');
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Dyno Launch - Production Rollout & Client Brief',
      due_date: new Date().toISOString().split('T')[0],
      is_urgent: true,
      assignee_id: loginData.user.id,
    }),
  });

  if (!createTaskRes.ok) {
    throw new Error(`Failed to create task: ${createTaskRes.status} ${await createTaskRes.text()}`);
  }

  const createdTaskData = await createTaskRes.json();
  console.log('Task created successfully on Neon DB!');
  console.log('Task ID:', createdTaskData.task.id);
  console.log('Title:', createdTaskData.task.title);
  console.log('Assignee:', createdTaskData.task.assignee_name);
  console.log('Creator:', createdTaskData.task.creator_name);

  // Step 6: Update the task to IN_PROGRESS
  console.log('\n[6] Updating task status to IN_PROGRESS...');
  const updateRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskData.task.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'IN_PROGRESS' }),
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to update task: ${updateRes.status} ${await updateRes.text()}`);
  }
  const updatedData = await updateRes.json();
  console.log('Task updated status:', updatedData.task.status);

  // Step 7: Verify final tasks count
  const verifyRes = await fetch(`${BASE_URL}/api/tasks?view=all`, { headers: authHeaders });
  const verifyData = await verifyRes.json();
  console.log('\n[7] Final Live Neon Tasks Count:', verifyData.tasks.length);
  console.log('Task list:', verifyData.tasks.map(t => `[${t.status}] ${t.title}`).join(', '));

  console.log('\n========================================');
  console.log('ALL NEON & ADMIN VERIFICATIONS PASSED 100%');
  console.log('========================================');
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
