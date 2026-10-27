const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  console.log('=== TESTING EMPLOYEE LOGIN FUNCTIONALITY ===\n');

  // Test 1: Invalid credentials
  console.log('1. Testing invalid credentials rejection...');
  const invalidLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'nonexistent@firm.com', password: 'badpassword' },
  });
  console.log(`   Response status: ${invalidLogin.status}, error: "${invalidLogin.body?.error}"`);
  if (invalidLogin.status !== 401) throw new Error('Expected 401 for non-existent user');

  // Test 2: Admin Tanmay logs in to provision an employee
  console.log('\n2. Admin logging in to provision employee...');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'tanmay@firm.com', password: 'password123' },
  });
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0] || '';
  if (adminLogin.status !== 200) throw new Error('Admin login failed');

  // Test 3: Admin provisions new employee Marcus Vance with custom password
  const testEmail = `marcus-${Date.now()}@firm.com`;
  const testPass = 'creativePass2026';
  console.log(`\n3. Provisioning employee Marcus Vance (${testEmail})...`);
  const createRes = await request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: {
      name: 'Marcus Vance',
      email: testEmail,
      role: 'EMPLOYEE',
      designation: 'Lead Animator',
      password: testPass,
    },
  });
  if (createRes.status !== 200 || !createRes.body.user) {
    throw new Error('Employee provisioning failed: ' + JSON.stringify(createRes.body));
  }
  const employeeUser = createRes.body.user;
  console.log(`   Provisioned employee ID: ${employeeUser.id}`);

  // Test 4: Employee logs in with wrong password
  console.log('\n4. Testing employee login with wrong password...');
  const wrongPassLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testEmail, password: 'wrongPasswordHere' },
  });
  console.log(`   Response status: ${wrongPassLogin.status}, error: "${wrongPassLogin.body?.error}"`);
  if (wrongPassLogin.status !== 401) throw new Error('Expected 401 for wrong password');

  // Test 5: Employee logs in with correct custom password
  console.log('\n5. Employee logging in with provisioned credentials...');
  const empLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testEmail, password: testPass },
  });
  console.log(`   Response status: ${empLogin.status}`);
  if (empLogin.status !== 200 || !empLogin.body.user) {
    throw new Error('Employee login failed: ' + JSON.stringify(empLogin.body));
  }
  const empCookie = empLogin.headers['set-cookie']?.[0]?.split(';')[0] || '';
  console.log(`   Logged in as: ${empLogin.body.user.name} (${empLogin.body.user.role})`);
  console.log(`   Session cookie established: ${empCookie ? 'YES' : 'NO'}`);

  // Test 6: Verify session endpoint with employee cookie
  console.log('\n6. Checking /api/auth/me session verification...');
  const meRes = await request('/api/auth/me', {
    method: 'GET',
    headers: { Cookie: empCookie },
  });
  console.log(`   Session verified user: ${meRes.body.user?.name} (Role: ${meRes.body.user?.role})`);
  if (meRes.body.user?.id !== employeeUser.id) throw new Error('Session user mismatch');

  // Test 7: Admin deactivates employee account
  console.log('\n7. Admin archiving/deactivating employee account...');
  const archiveRes = await request('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: { userId: employeeUser.id, is_active: false },
  });
  if (archiveRes.status !== 200) throw new Error('Failed to archive user');

  // Test 8: Deactivated employee attempts login
  console.log('\n8. Testing login on deactivated employee account...');
  const deactLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testEmail, password: testPass },
  });
  console.log(`   Response status: ${deactLogin.status}, error: "${deactLogin.body?.error}"`);
  if (deactLogin.status !== 403) throw new Error('Expected 403 for deactivated user login');

  // Test 9: Employee logs out
  console.log('\n9. Testing employee logout...');
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: empCookie },
  });
  console.log(`   Logout response status: ${logoutRes.status}`);

  // Test 10: Cleanup
  console.log('\n10. Cleaning up test user...');
  await request(`/api/users?id=${encodeURIComponent(employeeUser.id)}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  console.log('   Cleanup complete.');

  console.log('\n======================================================');
  console.log('✅ EMPLOYEE LOGIN FUNCTIONALITY VERIFIED 100% READY');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
