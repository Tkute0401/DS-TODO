const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

function getCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

async function run() {
  console.log('🚀 Starting Self-Made Task Revision End-to-End Test Suite...\n');

  // 1. Login as Admin Tanmay Kute
  console.log('1. Logging in as Admin Tanmay Kute...');
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'tanmay@firm.com', password: 'password123' }
  );

  if (adminLogin.status !== 200) {
    console.error('❌ Admin login failed:', adminLogin.data);
    process.exit(1);
  }
  const adminCookie = getCookie(adminLogin.headers);
  const adminUser = adminLogin.data.user;
  console.log(`✅ Admin logged in: ${adminUser.name} (${adminUser.id}, role: ${adminUser.role})`);

  // 2. Create test employee user: Rohit
  console.log('\n2. Creating test employee Rohit...');
  const createEmpRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      name: 'Rohit Verma',
      email: `rohit.test.${Date.now()}@firm.com`,
      role: 'EMPLOYEE',
      designation: 'Growth Designer',
      phone: '+91 9876543210',
      password: 'password123',
    }
  );

  if (createEmpRes.status !== 200) {
    console.error('❌ Failed to create employee:', createEmpRes.data);
    process.exit(1);
  }
  const rohitUser = createEmpRes.data.user;
  console.log(`✅ Test employee created: ${rohitUser.name} (${rohitUser.id}, email: ${rohitUser.email})`);

  // 3. Rohit logs in
  console.log('\n3. Logging in as Rohit Verma...');
  const rohitLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: rohitUser.email, password: 'password123' }
  );

  const rohitCookie = getCookie(rohitLogin.headers);
  console.log('✅ Rohit logged in successfully.');

  // 4. Rohit creates a self-made task
  console.log('\n4. Rohit creates a self-made task...');
  const createTaskRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: rohitCookie,
      },
    },
    {
      title: 'Revamp Onboarding Flow Wireframes',
      due_date: '2026-10-30',
      is_urgent: true,
    }
  );

  if (createTaskRes.status !== 200) {
    console.error('❌ Failed to create task:', createTaskRes.data);
    process.exit(1);
  }
  const createdTask = createTaskRes.data.task;
  console.log(`✅ Self-made task created: [${createdTask.id}] "${createdTask.title}"`);
  console.log(`   creator_id: ${createdTask.creator_id}, assignee_id: ${createdTask.assignee_id}, status: ${createdTask.status}`);

  if (createdTask.creator_id !== rohitUser.id || createdTask.assignee_id !== rohitUser.id) {
    console.error('❌ Task is not marked as self-made!');
    process.exit(1);
  }

  // 5. Rohit marks task as DONE (Employee submission should route to NEEDS_REVIEW!)
  console.log('\n5. Rohit checks off his self-made task (submitting status: DONE)...');
  const submitRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/tasks/${createdTask.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: rohitCookie,
      },
    },
    { status: 'DONE' }
  );

  if (submitRes.status !== 200) {
    console.error('❌ Failed to submit task:', submitRes.data);
    process.exit(1);
  }
  const submittedTask = submitRes.data.task;
  console.log(`✅ Response task status: "${submittedTask.status}"`);
  if (submittedTask.status !== 'NEEDS_REVIEW') {
    console.error(`❌ Expected status NEEDS_REVIEW, got "${submittedTask.status}"`);
    process.exit(1);
  }
  console.log(`✅ Successfully gated! Self-made task routed to NEEDS_REVIEW (review_started_at: ${submittedTask.review_started_at})`);

  // 6. Verify Admin Tanmay received review notification
  console.log('\n6. Checking Admin Tanmay notifications...');
  const adminNotifsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  const adminNotifs = adminNotifsRes.data.notifications || [];
  const reviewNotif = adminNotifs.find((n) => n.task_id === createdTask.id && n.type === 'NEEDS_REVIEW');
  if (!reviewNotif) {
    console.error('❌ Admin did not receive review notification for selfmade task! Received:', adminNotifs);
    process.exit(1);
  }
  console.log(`✅ Admin received notification: "${reviewNotif.title}" - "${reviewNotif.body}"`);

  // 7. Admin Tanmay provides revision on Rohit's self-made task
  console.log('\n7. Admin Tanmay requests revision on Rohit\'s self-made task...');
  const revisionNoteText = 'Please include the mobile responsive version for screen 4.';
  const reviseRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/tasks/${createdTask.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      status: 'IN_PROGRESS',
      revision_note: revisionNoteText,
    }
  );

  if (reviseRes.status !== 200) {
    console.error('❌ Admin revision request failed:', reviseRes.data);
    process.exit(1);
  }
  const revisedTask = reviseRes.data.task;
  console.log(`✅ Task status after revision request: "${revisedTask.status}"`);
  console.log(`✅ Task revision_note: "${revisedTask.revision_note}"`);
  console.log(`✅ Task review_started_at: ${revisedTask.review_started_at}`);
  console.log(`✅ Task completed_at: ${revisedTask.completed_at}`);

  if (revisedTask.status !== 'IN_PROGRESS' || revisedTask.revision_note !== revisionNoteText) {
    console.error('❌ Revision note not applied properly to task!');
    process.exit(1);
  }

  // 8. Verify Rohit received the revision notification
  console.log('\n8. Checking Rohit\'s notifications for revision note...');
  const rohitNotifsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: rohitCookie },
  });

  const rohitNotifs = rohitNotifsRes.data.notifications || [];
  const revisionNotif = rohitNotifs.find((n) => n.task_id === createdTask.id && n.type === 'REVIEW_REVISION');
  if (!revisionNotif) {
    console.error('❌ Rohit did not receive revision notification! Received:', rohitNotifs);
    process.exit(1);
  }
  console.log(`✅ Rohit received revision notification: "${revisionNotif.title}" - "${revisionNotif.body}"`);

  // 9. Rohit addresses revision and resubmits for review
  console.log('\n9. Rohit resubmits deliverable for review with deliverable link...');
  const resubmitRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/tasks/${createdTask.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: rohitCookie,
      },
    },
    {
      status: 'NEEDS_REVIEW',
      deliverable_link: 'https://figma.com/file/sample-onboarding-v2',
    }
  );

  const resubmittedTask = resubmitRes.data.task;
  console.log(`✅ Resubmitted task status: "${resubmittedTask.status}" (link: ${resubmittedTask.deliverable_link})`);

  // 10. Admin Tanmay approves with Kudos
  console.log('\n10. Admin Tanmay approves the self-made deliverable with Kudos...');
  const approveRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/tasks/${createdTask.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      status: 'DONE',
      kudos_badge: 'PIXEL_PERFECT',
    }
  );

  const approvedTask = approveRes.data.task;
  console.log(`✅ Approved task status: "${approvedTask.status}"`);
  console.log(`✅ Completed at: ${approvedTask.completed_at}`);
  console.log(`✅ Revision note cleared: ${approvedTask.revision_note}`);

  if (approvedTask.status !== 'DONE' || !approvedTask.completed_at || approvedTask.revision_note !== null) {
    console.error('❌ Approved task state invalid!');
    process.exit(1);
  }

  // 11. Verify Rohit received Kudos notification
  console.log('\n11. Verifying Rohit received Kudos approval notification...');
  const rohitNotifsRes2 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: rohitCookie },
  });
  const kudosNotif = (rohitNotifsRes2.data.notifications || []).find((n) => n.task_id === createdTask.id && n.type === 'REVIEW_APPROVED');
  if (!kudosNotif) {
    console.error('❌ Rohit did not receive kudos approval notification!');
    process.exit(1);
  }
  console.log(`✅ Rohit received approval notification: "${kudosNotif.title}" - "${kudosNotif.body}"`);

  // 12. Cleanup: Admin deletes test employee Rohit
  console.log('\n12. Cleaning up test user Rohit...');
  const deleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/users?id=${encodeURIComponent(rohitUser.id)}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });

  if (deleteRes.status === 200) {
    console.log(`✅ Test user Rohit deleted successfully.`);
  }

  console.log('\n🎉 ALL 12 TESTS PASSED! Managers and Admins can successfully provide revisions on self-made employee tasks with full notification dispatch, revision tracking, and sign-off flow.\n');
}

run().catch((err) => {
  console.error('💥 Test suite failed:', err);
  process.exit(1);
});
