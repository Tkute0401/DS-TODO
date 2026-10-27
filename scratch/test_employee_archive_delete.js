// scratch/test_employee_archive_delete.js
// Tests the full employee lifecycle: Provisioning, Archiving/Deactivating,
// Restoring/Unarchiving, Permanent Deleting, and Admin Self-Protection Guards.

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('=== STARTING EMPLOYEE ARCHIVE & DELETE VERIFICATION ===');

  // Step 1: Login as Admin Tanmay Kute
  console.log('\n[1] Logging in as Admin Tanmay Kute...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tanmay@firm.com', password: 'password123' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookies ? cookies.split(';')[0] : '',
  };
  console.log('Logged in as:', loginData.user.name, `(${loginData.user.role})`);

  // Step 2: Provision a new employee (Kunal Verma)
  console.log('\n[2] Provisioning test employee Kunal Verma...');
  const addRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Kunal Verma',
      email: 'kunal.verma@firm.com',
      role: 'EMPLOYEE',
      designation: 'Junior Video Editor',
      phone: '+919988776655',
      password: 'password123',
    }),
  });

  if (!addRes.ok) {
    throw new Error(`Failed to provision employee: ${addRes.status} ${await addRes.text()}`);
  }
  const addedUser = (await addRes.json()).user;
  console.log('Provisioned successfully! ID:', addedUser.id, 'Email:', addedUser.email);

  // Step 3: Verify employee in active list
  const activeListRes = await fetch(`${BASE_URL}/api/users`, { headers: authHeaders });
  const activeListData = await activeListRes.json();
  const foundActive = activeListData.users.find(u => u.id === addedUser.id);
  if (!foundActive) throw new Error('Provisioned user not found in active users list!');
  console.log('PASS: Kunal Verma is visible in active roster.');

  // Step 4: Archive (Deactivate) Kunal Verma
  console.log('\n[3] Archiving Kunal Verma (is_active = false)...');
  const archiveRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      userId: addedUser.id,
      is_active: false,
    }),
  });

  if (!archiveRes.ok) {
    throw new Error(`Archive request failed: ${archiveRes.status} ${await archiveRes.text()}`);
  }
  const archivedUser = (await archiveRes.json()).user;
  console.log('Archived user returned is_active:', archivedUser.is_active);

  // Verify Kunal is NOT in normal active list
  const activeAfterArchiveRes = await fetch(`${BASE_URL}/api/users`, { headers: authHeaders });
  const activeAfterArchive = await activeAfterArchiveRes.json();
  const inActiveList = activeAfterArchive.users.some(u => u.id === addedUser.id);
  if (inActiveList) throw new Error('Archived user still appears in active users list!');
  console.log('PASS: Archived employee successfully hidden from active task rosters.');

  // Verify Kunal DOES appear in include_archived=true list
  const allWithArchivedRes = await fetch(`${BASE_URL}/api/users?include_archived=true`, { headers: authHeaders });
  const allWithArchived = await allWithArchivedRes.json();
  const inAllList = allWithArchived.users.find(u => u.id === addedUser.id);
  if (!inAllList || inAllList.is_active !== false) {
    throw new Error('Archived user missing from admin directory view!');
  }
  console.log('PASS: Archived employee is visible with archived badge in admin roster.');

  // Verify Kunal CANNOT log in while archived
  console.log('\n[4] Verifying archived employee login is blocked...');
  const kunalLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kunal.verma@firm.com', password: 'password123' }),
  });
  if (kunalLoginRes.status !== 401) {
    throw new Error(`Expected 401 for archived user login, got ${kunalLoginRes.status}`);
  }
  console.log('PASS: Archived user login correctly rejected with 401 Unauthorized.');

  // Step 5: Restore (Unarchive) Kunal Verma
  console.log('\n[5] Restoring Kunal Verma (is_active = true)...');
  const restoreRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      userId: addedUser.id,
      is_active: true,
    }),
  });
  if (!restoreRes.ok) throw new Error('Failed to restore user');
  console.log('PASS: Employee restored to active workforce.');

  // Step 6: Test Self-Protection Guardrails (Admin cannot archive/delete themselves)
  console.log('\n[6] Testing Admin Self-Protection Guardrails...');
  const selfArchiveRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      userId: loginData.user.id,
      is_active: false,
    }),
  });
  if (selfArchiveRes.status !== 400) {
    throw new Error(`Expected 400 for self-archiving, got ${selfArchiveRes.status}`);
  }
  console.log('PASS: Self-archive rejected: "You cannot archive your own admin account"');

  const selfDeleteRes = await fetch(`${BASE_URL}/api/users?id=${loginData.user.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (selfDeleteRes.status !== 400) {
    throw new Error(`Expected 400 for self-deletion, got ${selfDeleteRes.status}`);
  }
  console.log('PASS: Self-delete rejected: "You cannot delete your own admin account"');

  // Step 7: Permanent Deletion of test employee
  console.log('\n[7] Permanently deleting test employee Kunal Verma...');
  const deleteRes = await fetch(`${BASE_URL}/api/users?id=${addedUser.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!deleteRes.ok) {
    throw new Error(`Delete failed: ${deleteRes.status} ${await deleteRes.text()}`);
  }
  console.log('PASS: DELETE API succeeded.');

  // Verify Kunal is permanently gone
  const finalUsersRes = await fetch(`${BASE_URL}/api/users?include_archived=true`, { headers: authHeaders });
  const finalUsers = await finalUsersRes.json();
  const stillExists = finalUsers.users.some(u => u.id === addedUser.id);
  if (stillExists) throw new Error('User was not permanently deleted!');
  console.log('PASS: Kunal Verma successfully purged from database. Users count:', finalUsers.users.length);

  console.log('\n======================================================');
  console.log('ALL EMPLOYEE ARCHIVE & DELETE CHECKS PASSED 100%!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
