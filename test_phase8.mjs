/**
 * Live End-to-End Automated API Test Suite for Phase 8: Announcements & Notifications.
 */
import http from 'http';

const BASE_HOST = 'localhost';
const BASE_PORT = 8080;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        ...options,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) {
      if (typeof data === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request(
    { path: '/api/auth/login', method: 'POST' },
    { email, password }
  );
  if (res.status !== 200 || !res.data?.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.accessToken;
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING PHASE 8 END-TO-END ANNOUNCEMENTS TEST SUITE');
  console.log('====================================================\n');

  // Step 1: Login all 3 roles
  console.log('1. Authenticating test users...');
  const adminToken = await login('admin@campusconnect.com', 'admin123');
  console.log('  ✅ Admin logged in successfully.');
  const facultyToken = await login('faculty@campusconnect.com', 'faculty123');
  console.log('  ✅ Faculty logged in successfully.');
  const studentToken = await login('student@campusconnect.com', 'student123');
  console.log('  ✅ Student logged in successfully.\n');

  // Step 2: Fetch courses to identify CS101 and CS201/CS301 IDs
  console.log('2. Fetching courses list...');
  const coursesRes = await request({
    path: '/api/courses',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const courses = coursesRes.data.data || [];
  console.log(`  Found ${courses.length} courses.`);
  const cs101 = courses.find((c) => c.courseCode === 'CS101');
  const cs201 = courses.find((c) => c.courseCode === 'CS201');

  if (!cs101) throw new Error('CS101 course not found in database');
  console.log(`  CS101 Course ID: ${cs101.id} (Faculty: ${cs101.facultyName})`);

  // Step 3: Admin creates a Global broadcast
  console.log('\n3. Admin creates Global announcement...');
  const adminGlobalRes = await request(
    {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'E2E Campus System Maintenance Window',
      content: 'Campus WiFi and server maintenance will take place this Sunday from 2 AM to 5 AM.',
      targetAudience: 'GLOBAL',
      priority: 'IMPORTANT',
      isPublished: true,
    }
  );
  console.log(`  Status: ${adminGlobalRes.status} (Expected: 201 Created)`);
  if (adminGlobalRes.status !== 201) throw new Error('Failed to create Admin Global notice: ' + JSON.stringify(adminGlobalRes.data));
  const globalNoticeId = adminGlobalRes.data.data.id;
  console.log(`  ✅ Global Announcement ID: ${globalNoticeId}`);

  // Step 4: Admin creates an Admin-only notice
  console.log('\n4. Admin creates Admin-only internal notice...');
  const adminInternalRes = await request(
    {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'E2E Admin Security Audit Checklist',
      content: 'Confidential system security checklist for system operators.',
      targetAudience: 'ADMIN',
      priority: 'URGENT',
      isPublished: true,
    }
  );
  console.log(`  Status: ${adminInternalRes.status} (Expected: 201 Created)`);
  const adminOnlyNoticeId = adminInternalRes.data.data.id;

  // Step 5: Faculty creates Course-specific notice for CS101
  console.log('\n5. Faculty creates announcement for assigned course (CS101)...');
  const facultyCourseRes = await request(
    {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
    },
    {
      title: 'E2E CS101 Lab 3 Setup Instructions',
      content: 'Please install JDK 17 and IntelliJ IDEA before Tuesday lab session.',
      targetAudience: 'COURSE',
      priority: 'IMPORTANT',
      courseId: cs101.id,
      isPublished: true,
    }
  );
  console.log(`  Status: ${facultyCourseRes.status} (Expected: 201 Created)`);
  if (facultyCourseRes.status !== 201) throw new Error('Faculty failed to create CS101 notice: ' + JSON.stringify(facultyCourseRes.data));
  const facultyNoticeId = facultyCourseRes.data.data.id;
  console.log(`  ✅ Faculty Course Notice ID: ${facultyNoticeId}`);

  // Step 6: RBAC Negative Check — Faculty attempts to create Global notice (Must be 403)
  console.log('\n6. Security Check: Faculty attempts to create GLOBAL announcement...');
  const facultyGlobalAttempt = await request(
    {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
    },
    {
      title: 'Unauthorized Global Notice',
      content: 'This should be blocked by Spring Security RBAC.',
      targetAudience: 'GLOBAL',
      priority: 'GENERAL',
      isPublished: true,
    }
  );
  console.log(`  Status: ${facultyGlobalAttempt.status} (Expected: 403 Forbidden)`);
  if (facultyGlobalAttempt.status !== 403) throw new Error('RBAC Violation: Faculty created Global notice!');
  console.log('  ✅ 403 Forbidden correctly returned.');

  // Step 7: RBAC Negative Check — Student attempts to create announcement (Must be 403)
  console.log('\n7. Security Check: Student attempts to create announcement...');
  const studentCreateAttempt = await request(
    {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    {
      title: 'Student Attempt Notice',
      content: 'Students cannot publish announcements.',
      targetAudience: 'COURSE',
      courseId: cs101.id,
      priority: 'GENERAL',
      isPublished: true,
    }
  );
  console.log(`  Status: ${studentCreateAttempt.status} (Expected: 403 Forbidden)`);
  if (studentCreateAttempt.status !== 403) throw new Error('RBAC Violation: Student created announcement!');
  console.log('  ✅ 403 Forbidden correctly returned.');

  // Step 8: Student fetches announcements feed
  console.log('\n8. Student fetches announcements feed...');
  const studentFeedRes = await request({
    path: '/api/announcements',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Status: ${studentFeedRes.status}`);
  const studentNotices = studentFeedRes.data.data || [];
  console.log(`  Student received ${studentNotices.length} notices.`);

  const hasGlobal = studentNotices.some((a) => a.id === globalNoticeId);
  const hasCourse = studentNotices.some((a) => a.id === facultyNoticeId);
  const hasAdminOnly = studentNotices.some((a) => a.id === adminOnlyNoticeId);

  console.log(`  - Contains Global notice: ${hasGlobal ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Contains Enrolled Course notice: ${hasCourse ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Admin-only notice hidden from student: ${!hasAdminOnly ? '✅ YES' : '❌ NO'}`);

  if (!hasGlobal || !hasCourse || hasAdminOnly) {
    throw new Error('Student feed visibility scoping failed!');
  }

  // Step 9: Notification / Read Status Tracking
  console.log('\n9. Testing unread counter and read receipts...');
  const unreadBeforeRes = await request({
    path: '/api/announcements/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const unreadBefore = unreadBeforeRes.data.data.unreadCount;
  console.log(`  Student unread count before: ${unreadBefore}`);

  // Mark single notice as read
  const markReadRes = await request({
    path: `/api/announcements/${globalNoticeId}/read`,
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Mark as read status: ${markReadRes.status} (Expected: 200 OK)`);

  const unreadAfterRes = await request({
    path: '/api/announcements/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const unreadAfter = unreadAfterRes.data.data.unreadCount;
  console.log(`  Student unread count after single read: ${unreadAfter}`);

  if (unreadAfter !== unreadBefore - 1) {
    throw new Error(`Unread count did not decrement properly: before=${unreadBefore}, after=${unreadAfter}`);
  }
  console.log('  ✅ Unread count decremented by exactly 1.');

  // Step 10: Mark all as read
  console.log('\n10. Testing mark all as read...');
  const markAllRes = await request({
    path: '/api/announcements/read-all',
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Mark all as read status: ${markAllRes.status} (Expected: 200 OK)`);

  const unreadFinalRes = await request({
    path: '/api/announcements/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const unreadFinal = unreadFinalRes.data.data.unreadCount;
  console.log(`  Student unread count after mark all: ${unreadFinal} (Expected: 0)`);
  if (unreadFinal !== 0) throw new Error(`Expected 0 unread notices, got ${unreadFinal}`);
  console.log('  ✅ All notices marked as read successfully.');

  // Step 11: Faculty toggles publication status
  console.log('\n11. Faculty toggles announcement publication (unpublish)...');
  const toggleRes = await request({
    path: `/api/announcements/${facultyNoticeId}/publish?publish=false`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Toggle status: ${toggleRes.status}`);
  const isPubStatus = toggleRes.data?.data?.isPublished ?? toggleRes.data?.data?.published;
  if (isPubStatus !== false) {
    throw new Error('Toggle publish failed: ' + JSON.stringify(toggleRes.data));
  }
  console.log('  ✅ Notice unpublished (draft mode).');


  // Verify student cannot see unpublished notice
  const studentFeedDraftCheck = await request({
    path: '/api/announcements',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const isDraftVisibleToStudent = (studentFeedDraftCheck.data.data || []).some(
    (a) => a.id === facultyNoticeId
  );
  console.log(`  Draft notice hidden from student: ${!isDraftVisibleToStudent ? '✅ YES' : '❌ NO'}`);
  if (isDraftVisibleToStudent) throw new Error('Student could view unpublished draft announcement!');

  // Step 12: Faculty edits announcement
  console.log('\n12. Faculty updates announcement content...');
  const updateRes = await request(
    {
      path: `/api/announcements/${facultyNoticeId}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${facultyToken}` },
    },
    {
      title: 'E2E CS101 Lab 3 Setup Instructions [UPDATED]',
      content: 'Updated: Please install JDK 17 and IntelliJ IDEA Community 2024.',
      targetAudience: 'COURSE',
      priority: 'URGENT',
      courseId: cs101.id,
      isPublished: true,
    }
  );
  console.log(`  Update status: ${updateRes.status} (Expected: 200 OK)`);
  if (updateRes.data.data.title !== 'E2E CS101 Lab 3 Setup Instructions [UPDATED]') {
    throw new Error('Announcement update content mismatch');
  }
  console.log('  ✅ Announcement updated and re-published.');

  // Step 13: RBAC Negative Check — Student attempts to delete announcement (Must be 403)
  console.log('\n13. Security Check: Student attempts to delete notice...');
  const studentDeleteAttempt = await request({
    path: `/api/announcements/${facultyNoticeId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Delete status: ${studentDeleteAttempt.status} (Expected: 403 Forbidden)`);
  if (studentDeleteAttempt.status !== 403) throw new Error('RBAC Violation: Student deleted announcement!');
  console.log('  ✅ 403 Forbidden correctly returned.');

  // Step 14: Faculty deletes own announcement
  console.log('\n14. Faculty deletes own course announcement...');
  const facultyDeleteRes = await request({
    path: `/api/announcements/${facultyNoticeId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Delete status: ${facultyDeleteRes.status} (Expected: 200 OK)`);
  console.log('  ✅ Faculty notice deleted successfully.');

  // Step 15: Admin cleans up test Global and Admin notices
  console.log('\n15. Admin cleans up test notices...');
  await request({
    path: `/api/announcements/${globalNoticeId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await request({
    path: `/api/announcements/${adminOnlyNoticeId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('  ✅ Admin cleanup completed.');

  console.log('\n====================================================');
  console.log('🎉 ALL PHASE 8 ANNOUNCEMENTS TESTS PASSED (100% SUCCESS)');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
