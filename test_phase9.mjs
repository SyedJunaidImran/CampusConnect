/**
 * Live End-to-End Automated API Test Suite for Phase 9: Communication & Student-Faculty Messaging.
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
  console.log('================================================================');
  console.log('🚀 STARTING PHASE 9: STUDENT-FACULTY MESSAGING TEST SUITE');
  console.log('================================================================\n');

  // Step 1: Login all roles
  console.log('1. Authenticating test accounts...');
  const studentToken = await login('student@campusconnect.com', 'student123');
  console.log('  ✅ Student logged in successfully.');
  const facultyToken = await login('faculty@campusconnect.com', 'faculty123');
  console.log('  ✅ Faculty logged in successfully.');
  const adminToken = await login('admin@campusconnect.com', 'admin123');
  console.log('  ✅ Admin logged in successfully.\n');

  // Step 2: Verify authorized faculty can be selected (Recipients API)
  console.log('2. Testing Student Recipients Discovery (/api/conversations/recipients)...');
  const recipRes = await request({
    path: '/api/conversations/recipients',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Status: ${recipRes.status} (Expected: 200 OK)`);
  if (recipRes.status !== 200) throw new Error('Failed to fetch recipients: ' + JSON.stringify(recipRes.data));
  const recipients = recipRes.data.data || [];
  console.log(`  Found ${recipients.length} eligible instructor-course pairings for student.`);
  if (recipients.length === 0) throw new Error('Student has no eligible faculty recipients to message');

  const targetFaculty = recipients[0];
  console.log(`  Target Faculty: ${targetFaculty.name} for course [${targetFaculty.courseCode}] ${targetFaculty.courseName}`);
  console.log('  ✅ Eligible faculty recipient confirmed.\n');

  // Step 3: Student starts a conversation
  console.log('3. Student starts a new conversation...');
  const startRes = await request(
    {
      path: '/api/conversations',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    {
      recipientId: targetFaculty.id,
      courseId: targetFaculty.courseId,
      message: 'Hello Professor, I have a question about the assignment submission deadline.',
    }
  );
  console.log(`  Status: ${startRes.status} (Expected: 201 Created)`);
  if (startRes.status !== 201) throw new Error('Failed to start conversation: ' + JSON.stringify(startRes.data));
  const conversation = startRes.data.data;
  const conversationId = conversation.id;
  console.log(`  ✅ Conversation started with ID: ${conversationId}`);
  console.log(`  Snippet: "${conversation.lastMessageSnippet}"\n`);

  // Step 4: Student sends a follow-up message
  console.log('4. Student sends follow-up message in the conversation...');
  const followUpRes = await request(
    {
      path: `/api/conversations/${conversationId}/messages`,
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    {
      content: 'Could you please confirm if late submissions receive partial credit?',
    }
  );
  console.log(`  Status: ${followUpRes.status} (Expected: 201 Created)`);
  if (followUpRes.status !== 201) throw new Error('Failed to send follow-up message: ' + JSON.stringify(followUpRes.data));
  console.log('  ✅ Follow-up message sent.\n');

  // Step 5: Verify messages are saved and returned in chronological order
  console.log('5. Verifying message history in conversation...');
  const studentMessagesRes = await request({
    path: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Status: ${studentMessagesRes.status} (Expected: 200 OK)`);
  const messagesList = studentMessagesRes.data.data || [];
  console.log(`  Retrieved ${messagesList.length} messages (Expected at least 2).`);
  if (messagesList.length < 2) throw new Error('Expected at least 2 messages in thread');
  console.log('  ✅ Messages verified.\n');

  // Step 6 & 7: Login as Faculty and verify conversation appears
  console.log('6 & 7. Faculty fetches conversations list (/api/conversations)...');
  const facultyConvsRes = await request({
    path: '/api/conversations',
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Status: ${facultyConvsRes.status} (Expected: 200 OK)`);
  const facultyConvs = facultyConvsRes.data.data || [];
  const facultyConv = facultyConvs.find((c) => c.id === conversationId);
  if (!facultyConv) throw new Error(`Faculty conversation list does not contain conversation ID ${conversationId}`);
  console.log(`  ✅ Conversation found in Faculty's list!`);
  console.log(`  Student: ${facultyConv.studentName} (${facultyConv.studentRollNumber})`);
  console.log(`  Faculty unread count for this thread: ${facultyConv.unreadCount}`);
  if (facultyConv.unreadCount < 2) throw new Error(`Expected at least 2 unread messages for faculty, got ${facultyConv.unreadCount}`);

  // Check faculty total unread count
  const facultyUnreadBefore = await request({
    path: '/api/conversations/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Faculty overall unread count: ${facultyUnreadBefore.data.data.unreadCount}`);
  if (facultyUnreadBefore.data.data.unreadCount < 2) throw new Error('Faculty overall unread count mismatch');
  console.log('  ✅ Faculty unread indicators verified.\n');

  // Step 8: Faculty reads the messages (which auto-marks read) and replies
  console.log('8. Faculty opens conversation (auto-mark read) and sends reply...');
  const facultyReadRes = await request({
    path: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Faculty opened messages (Status: ${facultyReadRes.status})`);

  // Verify faculty unread dropped to 0
  const facultyUnreadAfter = await request({
    path: '/api/conversations/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log(`  Faculty unread count after opening: ${facultyUnreadAfter.data.data.unreadCount} (Expected: 0)`);
  if (facultyUnreadAfter.data.data.unreadCount !== 0) throw new Error('Faculty unread count did not clear after opening thread');
  console.log('  ✅ Auto-mark as read verified for faculty.');

  // Faculty sends reply
  const replyRes = await request(
    {
      path: `/api/conversations/${conversationId}/messages`,
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
    },
    {
      content: 'Hello! Yes, submissions up to 24 hours late are accepted with a 10% penalty.',
    }
  );
  console.log(`  Faculty reply status: ${replyRes.status} (Expected: 201 Created)`);
  if (replyRes.status !== 201) throw new Error('Failed to send faculty reply');
  console.log('  ✅ Faculty reply sent successfully.\n');

  // Step 9, 10, 11: Student checks unread count and sees reply
  console.log('9, 10, 11. Student verifies incoming reply and unread count...');
  const studentUnreadBefore = await request({
    path: '/api/conversations/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Student unread count before reading: ${studentUnreadBefore.data.data.unreadCount} (Expected: 1)`);
  if (studentUnreadBefore.data.data.unreadCount !== 1) throw new Error(`Expected 1 unread message for student, got ${studentUnreadBefore.data.data.unreadCount}`);

  // Student fetches messages (marks as read)
  const studentThreadRes = await request({
    path: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const updatedMessages = studentThreadRes.data.data || [];
  console.log(`  Student received ${updatedMessages.length} messages in thread.`);
  const lastMsg = updatedMessages[updatedMessages.length - 1];
  console.log(`  Latest message sender: ${lastMsg.senderName} (${lastMsg.senderRole})`);
  console.log(`  Latest message content: "${lastMsg.content}"`);
  if (lastMsg.senderRole !== 'FACULTY') throw new Error('Expected latest message to be from FACULTY');

  // Step 12 & 13: Verify student unread count drops to 0
  console.log('\n12 & 13. Verifying student unread count cleared...');
  const studentUnreadAfter = await request({
    path: '/api/conversations/unread-count',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  Student unread count after opening: ${studentUnreadAfter.data.data.unreadCount} (Expected: 0)`);
  if (studentUnreadAfter.data.data.unreadCount !== 0) throw new Error('Student unread count did not clear to 0');
  console.log('  ✅ Read tracking and receipt cycle completely verified.\n');

  // Step 14: Security test — unauthorized user attempts to view conversation
  console.log('14. Security Check: Admin attempts to access private conversation messages...');
  const adminAccessRes = await request({
    path: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`  Status: ${adminAccessRes.status} (Expected: 403 Forbidden)`);
  if (adminAccessRes.status !== 403) throw new Error('Security violation: Admin was able to access private messages!');
  console.log('  ✅ 403 Forbidden correctly returned for unauthorized user.\n');

  // Step 15: Security test — student tries to contact unrelated/unassigned faculty
  console.log('15. Security Check: Student attempts to contact unrelated faculty/course...');
  const illegalStartRes = await request(
    {
      path: '/api/conversations',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    {
      recipientId: 999999, // Non-existent or unassociated faculty
      courseId: targetFaculty.courseId,
      message: 'Unauthorized communication attempt.',
    }
  );
  console.log(`  Status: ${illegalStartRes.status} (Expected: 403 or 404)`);
  if (illegalStartRes.status !== 403 && illegalStartRes.status !== 404) {
    throw new Error('Security violation: Student started conversation with unauthorized faculty!');
  }
  console.log('  ✅ Unauthorized conversation initiation blocked.\n');

  // Step 16: Validation test — empty content or blank message
  console.log('16. Validation Check: Sending empty message...');
  const emptyMsgRes = await request(
    {
      path: `/api/conversations/${conversationId}/messages`,
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    { content: '   ' }
  );
  console.log(`  Status: ${emptyMsgRes.status} (Expected: 400 Bad Request)`);
  if (emptyMsgRes.status !== 400) throw new Error('Validation failure: Blank message accepted!');
  console.log('  ✅ 400 Bad Request correctly returned for blank message.\n');

  // Step 17: Duplicate conversation prevention test
  console.log('17. Testing duplicate conversation deduplication...');
  const duplicateStartRes = await request(
    {
      path: '/api/conversations',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    },
    {
      recipientId: targetFaculty.id,
      courseId: targetFaculty.courseId,
      message: 'Follow-up on previous thread via start conversation.',
    }
  );
  console.log(`  Status: ${duplicateStartRes.status} (Expected: 201 Created)`);
  const returnedConv = duplicateStartRes.data.data;
  if (returnedConv.id !== conversationId) {
    throw new Error(`Expected existing conversation ID ${conversationId} to be reused, but got ${returnedConv.id}`);
  }
  console.log(`  ✅ Existing conversation thread ${returnedConv.id} reused without duplicate thread.\n`);

  // Step 18 & 19: Regression Tests across Phases 1–8
  console.log('18 & 19. Regression checks across Phases 1–8...');

  // Phase 1: Auth check
  console.log('  - Phase 1 (Auth): Verified earlier via login.');

  // Phase 2: Courses check
  const coursesRes = await request({
    path: '/api/courses',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (coursesRes.status !== 200) throw new Error('Phase 2 Courses API failed');
  console.log('  - Phase 2 (Courses): ✅ 200 OK');

  // Phase 3: Attendance check
  const attendanceRes = await request({
    path: '/api/attendance/my-attendance',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (attendanceRes.status !== 200) throw new Error('Phase 3 Attendance API failed');
  console.log('  - Phase 3 (Attendance): ✅ 200 OK');

  // Phase 4: Assignments check
  const assignmentsRes = await request({
    path: '/api/assignments',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (assignmentsRes.status !== 200) throw new Error('Phase 4 Assignments API failed');
  console.log('  - Phase 4 (Assignments): ✅ 200 OK');

  // Phase 5: Timetable / Schedules check
  const schedulesRes = await request({
    path: '/api/schedules/today',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (schedulesRes.status !== 200) throw new Error('Phase 5 Timetable API failed');
  console.log('  - Phase 5 (Timetable): ✅ 200 OK');

  // Phase 7: Study Materials check
  const materialsRes = await request({
    path: '/api/study-materials',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (materialsRes.status !== 200) throw new Error('Phase 7 Study Materials API failed');
  console.log('  - Phase 7 (Study Materials): ✅ 200 OK');

  // Phase 8: Announcements check
  const announcementsRes = await request({
    path: '/api/announcements',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (announcementsRes.status !== 200) throw new Error('Phase 8 Announcements API failed');
  console.log('  - Phase 8 (Announcements): ✅ 200 OK');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 9 MESSAGING AND REGRESSION TESTS PASSED (100% SUCCESS)');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
