# Phase 10: Analytics and Reports Automated Test Suite

$BaseUrl = "http://localhost:8080/api"
$Passed = 0
$Failed = 0

function Assert-Check([bool]$condition, [string]$message) {
    if ($condition) {
        Write-Host "  [OK] $message" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "  [FAIL] $message" -ForegroundColor Red
        $script:Failed++
    }
}

function Login($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.success) {
        throw "Login failed for $email"
    }
    return $res.data.accessToken
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " STARTING PHASE 10: ANALYTICS AND REPORTS TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Authenticate test accounts
Write-Host "`n1. Authenticating test accounts..." -ForegroundColor Yellow

$studentToken = Login "student@campusconnect.com" "student123"
Assert-Check ($studentToken -ne $null) "Student authenticated successfully"

$facultyToken = Login "faculty@campusconnect.com" "faculty123"
Assert-Check ($facultyToken -ne $null) "Faculty authenticated successfully"

$adminToken = Login "admin@campusconnect.com" "admin123"
Assert-Check ($adminToken -ne $null) "Admin authenticated successfully"

$studentHeaders = @{ Authorization = "Bearer $studentToken" }
$facultyHeaders = @{ Authorization = "Bearer $facultyToken" }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# 2. Test Admin Analytics
Write-Host "`n2. Testing Admin Analytics (GET /api/analytics/admin)..." -ForegroundColor Yellow
$adminAnalyticsRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/admin" -Method Get -Headers $adminHeaders
$adminData = $adminAnalyticsRes.data

Assert-Check ($adminData.totalStudents -gt 0) "Total students: $($adminData.totalStudents)"
Assert-Check ($adminData.totalFaculty -gt 0) "Total faculty: $($adminData.totalFaculty)"
Assert-Check ($adminData.totalCourses -gt 0) "Total courses: $($adminData.totalCourses)"
Assert-Check ($adminData.totalEnrollments -gt 0) "Total enrollments: $($adminData.totalEnrollments)"
Assert-Check ($adminData.overallAttendancePercentage -ge 0) "Overall attendance: $($adminData.overallAttendancePercentage)%"
Assert-Check ($adminData.courseEnrollments.Count -gt 0) "Course enrollments breakdown count: $($adminData.courseEnrollments.Count)"
Assert-Check ($adminData.departmentStats.Count -gt 0) "Department statistics count: $($adminData.departmentStats.Count)"
Assert-Check ($adminData.assignmentStats -ne $null) "Assignment submission statistics present"

# 3. Test Faculty Analytics
Write-Host "`n3. Testing Faculty Overview Analytics (GET /api/analytics/faculty)..." -ForegroundColor Yellow
$facultyAnalyticsRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/faculty" -Method Get -Headers $facultyHeaders
$facultyData = $facultyAnalyticsRes.data

Assert-Check ($facultyData.assignedCoursesCount -gt 0) "Faculty assigned courses count: $($facultyData.assignedCoursesCount)"
Assert-Check ($facultyData.facultyName -ne $null) "Faculty name: $($facultyData.facultyName)"
Assert-Check ($facultyData.totalEnrolledStudents -gt 0) "Total enrolled students: $($facultyData.totalEnrolledStudents)"
Assert-Check ($facultyData.courses.Count -gt 0) "Assigned courses list count: $($facultyData.courses.Count)"

$assignedCourseId = $facultyData.courses[0].courseId
$assignedCourseCode = $facultyData.courses[0].courseCode

# 4. Test Faculty Course-Specific Analytics
Write-Host "`n4. Testing Faculty Course Analytics (GET /api/analytics/faculty/course/$assignedCourseId)..." -ForegroundColor Yellow
$courseAnalyticsRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/faculty/course/$assignedCourseId" -Method Get -Headers $facultyHeaders
$courseData = $courseAnalyticsRes.data

Assert-Check ($courseData.courseCode -eq $assignedCourseCode) "Course code verified: $($courseData.courseCode)"
Assert-Check ($courseData.enrolledStudentsCount -gt 0) "Enrolled students in course: $($courseData.enrolledStudentsCount)"
Assert-Check ($courseData.studentAttendanceReport.Count -gt 0) "Attendance roster records: $($courseData.studentAttendanceReport.Count)"
Assert-Check ($courseData.assignmentStats -ne $null) "Course assignment statistics present"

# 5. Test Student Analytics Overview
Write-Host "`n5. Testing Student Personal Analytics (GET /api/analytics/student)..." -ForegroundColor Yellow
$studentAnalyticsRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/student" -Method Get -Headers $studentHeaders
$studentData = $studentAnalyticsRes.data

Assert-Check ($studentData.studentName -ne $null) "Student name confirmed: $($studentData.studentName)"
Assert-Check ($studentData.enrolledCoursesCount -gt 0) "Enrolled courses count: $($studentData.enrolledCoursesCount)"
Assert-Check ($studentData.courseAttendance.Count -gt 0) "Course attendance list count: $($studentData.courseAttendance.Count)"
Assert-Check ($studentData.overallAttendancePercentage -ge 0) "Student overall attendance: $($studentData.overallAttendancePercentage)%"

# 6. Test Student Attendance Analytics Endpoint
Write-Host "`n6. Testing Student Attendance Endpoint (GET /api/analytics/student/attendance)..." -ForegroundColor Yellow
$studentAttRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/student/attendance" -Method Get -Headers $studentHeaders
Assert-Check ($studentAttRes.data.Count -gt 0) "Student attendance list retrieved: $($studentAttRes.data.Count) items"

# 7. Test Student Assignment Analytics Endpoint
Write-Host "`n7. Testing Student Assignments Endpoint (GET /api/analytics/student/assignments)..." -ForegroundColor Yellow
$studentAssignRes = Invoke-RestMethod -Uri "$BaseUrl/analytics/student/assignments" -Method Get -Headers $studentHeaders
Assert-Check ($studentAssignRes.success -eq $true) "Student assignment breakdown retrieved successfully"

# 8. Security and Authorization Checks
Write-Host "`n8. Security and Authorization Checks..." -ForegroundColor Yellow

# 8a. Student calling Admin Analytics (should return 403)
$studentBlocked = $false
try {
    $null = Invoke-RestMethod -Uri "$BaseUrl/analytics/admin" -Method Get -Headers $studentHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) { $studentBlocked = $true }
}
Assert-Check ($studentBlocked -eq $true) "Student blocked from Admin Analytics with 403 Forbidden"

# 8b. Faculty calling Admin Analytics (should return 403)
$facultyBlocked = $false
try {
    $null = Invoke-RestMethod -Uri "$BaseUrl/analytics/admin" -Method Get -Headers $facultyHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) { $facultyBlocked = $true }
}
Assert-Check ($facultyBlocked -eq $true) "Faculty blocked from Admin Analytics with 403 Forbidden"

# 8c. Student calling Faculty Analytics (should return 403)
$studentBlockedFromFaculty = $false
try {
    $null = Invoke-RestMethod -Uri "$BaseUrl/analytics/faculty" -Method Get -Headers $studentHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) { $studentBlockedFromFaculty = $true }
}
Assert-Check ($studentBlockedFromFaculty -eq $true) "Student blocked from Faculty Analytics with 403 Forbidden"

# 8d. Faculty calling Course Analytics for unassigned course (should return 403)
$allCoursesRes = Invoke-RestMethod -Uri "$BaseUrl/courses" -Method Get -Headers $adminHeaders
$unassignedCourse = $null
foreach ($c in $allCoursesRes.data) {
    if ($c.faculty -ne $null -and $c.faculty.id -ne $facultyData.facultyId) {
        $unassignedCourse = $c
        break
    }
}

if ($unassignedCourse -ne $null) {
    $unassignedCourseId = $unassignedCourse.id
    $facultyDenied = $false
    try {
        $null = Invoke-RestMethod -Uri "$BaseUrl/analytics/faculty/course/$unassignedCourseId" -Method Get -Headers $facultyHeaders
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 403) { $facultyDenied = $true }
    }
    Assert-Check ($facultyDenied -eq $true) "Faculty blocked from unassigned course $unassignedCourseId with 403 Forbidden"
} else {
    Write-Host "  (Skipped unassigned course check: all courses assigned to this faculty)" -ForegroundColor Gray
}

# 8e. Non-existent course ID (should return 404)
$notFoundBlocked = $false
try {
    $null = Invoke-RestMethod -Uri "$BaseUrl/analytics/faculty/course/999999" -Method Get -Headers $adminHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) { $notFoundBlocked = $true }
}
Assert-Check ($notFoundBlocked -eq $true) "Non-existent course ID returns 404 Not Found"

# 9. Regression Checks across Phases 1-9
Write-Host "`n9. Regression Checks across Phases 1-9..." -ForegroundColor Yellow

# Phase 2: Courses
$coursesRes = Invoke-RestMethod -Uri "$BaseUrl/courses" -Method Get -Headers $studentHeaders
$coursesCount = $coursesRes.data.Count
Assert-Check ($coursesCount -gt 0) "Phase 2 Courses catalog active ($coursesCount courses)"

# Phase 3: Attendance
$attRes = Invoke-RestMethod -Uri "$BaseUrl/attendance/my" -Method Get -Headers $studentHeaders
Assert-Check ($attRes.data -ne $null) "Phase 3 Attendance summary active"

# Phase 4: Assignments
$assignRes = Invoke-RestMethod -Uri "$BaseUrl/assignments" -Method Get -Headers $studentHeaders
$assignCount = $assignRes.data.Count
Assert-Check ($assignCount -gt 0) "Phase 4 Assignments active ($assignCount assignments)"

# Phase 5: Timetable
$schedRes = Invoke-RestMethod -Uri "$BaseUrl/schedules/today" -Method Get -Headers $studentHeaders
Assert-Check ($schedRes.success -eq $true) "Phase 5 Timetable active"

# Phase 7: Study Materials
$matRes = Invoke-RestMethod -Uri "$BaseUrl/study-materials" -Method Get -Headers $studentHeaders
$matCount = $matRes.data.Count
Assert-Check ($matCount -gt 0) "Phase 7 Study Materials active ($matCount materials)"

# Phase 8: Announcements
$annRes = Invoke-RestMethod -Uri "$BaseUrl/announcements" -Method Get -Headers $studentHeaders
$annCount = $annRes.data.Count
Assert-Check ($annCount -gt 0) "Phase 8 Announcements active ($annCount notices)"

# Phase 9: Messaging
$msgUnreadRes = Invoke-RestMethod -Uri "$BaseUrl/conversations/unread-count" -Method Get -Headers $studentHeaders
Assert-Check ($msgUnreadRes.success -eq $true) "Phase 9 Messaging unread counter active"

$convsRes = Invoke-RestMethod -Uri "$BaseUrl/conversations" -Method Get -Headers $studentHeaders
Assert-Check ($convsRes.success -eq $true) "Phase 9 Conversations feed active"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host " RESULTS: $Passed PASSED, $Failed FAILED" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Red" })
Write-Host "================================================================" -ForegroundColor Cyan

if ($Failed -eq 0) {
    Write-Host "ALL PHASE 10 ANALYTICS AND REGRESSION TESTS PASSED (100% SUCCESS)" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
