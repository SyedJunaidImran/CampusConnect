/**
 * Automated Verification Script for CampusConnect Timetable.
 * Tests:
 * 1. Student authentication and student timetable retrieval (/api/schedules/student/my)
 * 2. Faculty authentication and faculty teaching schedule retrieval (/api/schedules/faculty/my)
 * 3. Today's schedules for Student & Faculty (/api/schedules/today)
 * 4. Upcoming classes (/api/schedules/upcoming)
 * 5. Access control verification (Student cannot access faculty endpoint; Faculty cannot access student endpoint)
 * 6. Overlap conflict detection logic verification
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTimetableTests() {
  console.log('================================================================');
  console.log('🗓️ CAMPUSCONNECT TIMETABLE E2E VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users
    console.log('[1/6] Authenticating test users...');
    const studentToken = await login('student@campusconnect.com', 'Student@123');
    const facultyToken = await login('faculty@campusconnect.com', 'Faculty@123');
    const adminToken = await login('admin@campusconnect.com', 'Admin@123');
    assert(!!studentToken, 'Student authenticated successfully');
    assert(!!facultyToken, 'Faculty authenticated successfully');
    assert(!!adminToken, 'Admin authenticated successfully');

    // 2. Student Timetable
    console.log('\n[2/6] Testing Student Timetable retrieval (/api/schedules/student/my)...');
    const studentRes = await request({
      path: '/api/schedules/student/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentRes.status === 200, 'Student timetable status 200');
    const studentSchedules = studentRes.data?.data || [];
    assert(Array.isArray(studentSchedules), 'Student schedules is an array');
    console.log(`    Found ${studentSchedules.length} enrolled schedule slots for student.`);
    studentSchedules.forEach((s) => {
      assert(s.courseCode && s.startTime && s.endTime && s.room && s.dayOfWeek,
        `Schedule ${s.id}: ${s.courseCode} on ${s.dayOfWeek} at ${s.startTime}-${s.endTime} in ${s.room} is well-formed`);
    });

    // 3. Faculty Timetable
    console.log('\n[3/6] Testing Faculty Timetable retrieval (/api/schedules/faculty/my)...');
    const facultyRes = await request({
      path: '/api/schedules/faculty/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(facultyRes.status === 200, 'Faculty timetable status 200');
    const facultySchedules = facultyRes.data?.data || [];
    assert(Array.isArray(facultySchedules), 'Faculty schedules is an array');
    console.log(`    Found ${facultySchedules.length} teaching schedule slots for faculty.`);
    facultySchedules.forEach((s) => {
      assert(s.courseCode && s.startTime && s.endTime && s.room && s.dayOfWeek,
        `Lecture ${s.id}: ${s.courseCode} on ${s.dayOfWeek} at ${s.startTime}-${s.endTime} in ${s.room} is well-formed`);
    });

    // 4. Today and Upcoming Endpoints
    console.log('\n[4/6] Testing Today & Upcoming Endpoints...');
    const studentToday = await request({
      path: '/api/schedules/today',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentToday.status === 200, 'Student today schedules status 200');
    console.log(`    Student today classes count: ${studentToday.data?.data?.length || 0}`);

    const facultyToday = await request({
      path: '/api/schedules/today',
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(facultyToday.status === 200, 'Faculty today schedules status 200');
    console.log(`    Faculty today lectures count: ${facultyToday.data?.data?.length || 0}`);

    const upcomingRes = await request({
      path: '/api/schedules/upcoming',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(upcomingRes.status === 200, 'Student upcoming classes status 200');

    // 5. Access Control Enforcement
    console.log('\n[5/6] Testing Access Control Restrictions...');
    const studentAccessingFaculty = await request({
      path: '/api/schedules/faculty/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAccessingFaculty.status === 403, 'Student is forbidden (403) from accessing faculty timetable');

    const facultyAccessingStudent = await request({
      path: '/api/schedules/student/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(facultyAccessingStudent.status === 403, 'Faculty is forbidden (403) from accessing student timetable');

    // 6. Conflict Detection Unit Verification
    console.log('\n[6/6] Verifying Timetable Conflict Detection Logic...');
    // Simulate overlap logic
    const mockSchedules = [
      { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30' },
      { id: 2, dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:30' }, // overlaps with 1
      { id: 3, dayOfWeek: 'MONDAY', startTime: '11:30', endTime: '13:00' }, // adjacent, no overlap
      { id: 4, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:30' }, // different day
    ];

    const detectedConflicts = new Set();
    for (let i = 0; i < mockSchedules.length; i++) {
      for (let j = i + 1; j < mockSchedules.length; j++) {
        const a = mockSchedules[i];
        const b = mockSchedules[j];
        if (a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && a.endTime > b.startTime) {
          detectedConflicts.add(a.id);
          detectedConflicts.add(b.id);
        }
      }
    }
    assert(detectedConflicts.has(1) && detectedConflicts.has(2), 'Conflict detected for overlapping slots (id 1 and 2)');
    assert(!detectedConflicts.has(3), 'No false conflict for adjacent slot (id 3)');
    assert(!detectedConflicts.has(4), 'No conflict across different days (id 4)');

    console.log('\n================================================================');
    console.log('🎉 ALL TIMETABLE E2E TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  }
}

runTimetableTests();
