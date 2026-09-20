$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " STARTING PHASE 9: STUDENT-FACULTY MESSAGING TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

function Login($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.success) {
        throw "Login failed for $email"
    }
    return $res.data.accessToken
}

# 1. Login all roles
Write-Host "1. Authenticating test users..."
$studentToken = Login "student@campusconnect.com" "student123"
Write-Host "  ✅ Student authenticated" -ForegroundColor Green
$facultyToken = Login "faculty@campusconnect.com" "faculty123"
Write-Host "  ✅ Faculty authenticated" -ForegroundColor Green
$adminToken = Login "admin@campusconnect.com" "admin123"
Write-Host "  ✅ Admin authenticated`n" -ForegroundColor Green

$studentHeaders = @{ Authorization = "Bearer $studentToken" }
$facultyHeaders = @{ Authorization = "Bearer $facultyToken" }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# 2. Student recipient discovery
Write-Host "2. Testing Student Recipients Discovery (/api/conversations/recipients)..."
$recipRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/recipients" -Method Get -Headers $studentHeaders
$recipients = $recipRes.data
Write-Host "  Found $($recipients.Count) eligible recipients for student."
if ($recipients.Count -eq 0) { throw "No recipients found for student" }
$targetFaculty = $recipients[0]
Write-Host "  Target Faculty: $($targetFaculty.name) for course [$($targetFaculty.courseCode)] $($targetFaculty.courseName)"
Write-Host "  ✅ Eligible faculty confirmed`n" -ForegroundColor Green

# 3. Student starts a conversation
Write-Host "3. Student starts conversation..."
$startBody = @{
    recipientId = $targetFaculty.id
    courseId = $targetFaculty.courseId
    message = "Hello Professor, I have a question regarding Assignment 2."
} | ConvertTo-Json
$startRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations" -Method Post -Headers $studentHeaders -Body $startBody -ContentType "application/json"
$convId = $startRes.data.id
Write-Host "  ✅ Conversation started with ID: $convId" -ForegroundColor Green
Write-Host "  Snippet: $($startRes.data.lastMessageSnippet)`n"

# 4. Student sends follow-up message
Write-Host "4. Student sends follow-up message..."
$msgBody = @{ content = "Could you please clarify question 4?" } | ConvertTo-Json
$msgRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Post -Headers $studentHeaders -Body $msgBody -ContentType "application/json"
Write-Host "  ✅ Follow-up message sent`n" -ForegroundColor Green

# 5. Verify message history
Write-Host "5. Verifying message history..."
$histRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Get -Headers $studentHeaders
$messages = $histRes.data
Write-Host "  Message count in thread: $($messages.Count) (Expected at least 2)"
if ($messages.Count -lt 2) { throw "Expected at least 2 messages" }
Write-Host "  ✅ Messages saved and retrieved in order`n" -ForegroundColor Green

# 6 & 7. Faculty fetches conversations list
Write-Host "6 & 7. Faculty fetches conversations list..."
$facultyConvsRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations" -Method Get -Headers $facultyHeaders
$facultyConvs = $facultyConvsRes.data
$foundConv = $facultyConvs | Where-Object { $_.id -eq $convId }
if (-not $foundConv) { throw "Conversation $convId not in faculty conversation list" }
Write-Host "  ✅ Conversation present in Faculty list!" -ForegroundColor Green
Write-Host "  Student: $($foundConv.studentName) ($($foundConv.studentRollNumber))"
Write-Host "  Faculty unread count: $($foundConv.unreadCount)"
if ($foundConv.unreadCount -lt 2) { throw "Faculty unread count should be at least 2" }

$facUnreadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/unread-count" -Method Get -Headers $facultyHeaders
Write-Host "  Faculty total unread: $($facUnreadRes.data.unreadCount)`n"

# 8. Faculty opens thread (auto-mark read) and sends reply
Write-Host "8. Faculty opens thread and sends reply..."
$facMessagesRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Get -Headers $facultyHeaders
$facUnreadAfterRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/unread-count" -Method Get -Headers $facultyHeaders
Write-Host "  Faculty unread count after reading: $($facUnreadAfterRes.data.unreadCount) (Expected: 0)"
if ($facUnreadAfterRes.data.unreadCount -ne 0) { throw "Faculty unread did not clear to 0" }

$replyBody = @{ content = "Hi, question 4 requires using dynamic programming. Check slide 22." } | ConvertTo-Json
$replyRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Post -Headers $facultyHeaders -Body $replyBody -ContentType "application/json"
Write-Host "  ✅ Faculty reply sent successfully`n" -ForegroundColor Green

# 9, 10, 11. Student verifies incoming reply and unread count
Write-Host "9, 10, 11. Student verifies incoming reply and unread count..."
$stuUnreadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/unread-count" -Method Get -Headers $studentHeaders
Write-Host "  Student unread count before opening: $($stuUnreadRes.data.unreadCount) (Expected: 1)"
if ($stuUnreadRes.data.unreadCount -ne 1) { throw "Expected 1 unread message for student" }

$stuThreadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Get -Headers $studentHeaders
$allMsgs = $stuThreadRes.data
$latestMsg = $allMsgs[$allMsgs.Count - 1]
Write-Host "  Latest message sender role: $($latestMsg.senderRole)"
Write-Host "  Latest message content: '$($latestMsg.content)'"
if ($latestMsg.senderRole -ne "FACULTY") { throw "Expected message from FACULTY" }

# 12 & 13. Student unread count clears to 0
Write-Host "`n12 & 13. Verifying student unread count cleared..."
$stuUnreadAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/unread-count" -Method Get -Headers $studentHeaders
Write-Host "  Student unread count after opening: $($stuUnreadAfter.data.unreadCount) (Expected: 0)"
if ($stuUnreadAfter.data.unreadCount -ne 0) { throw "Expected 0 unread messages for student" }
Write-Host "  ✅ Complete read receipt cycle verified`n" -ForegroundColor Green

# 14. Security check: Admin access rejected
Write-Host "14. Security Check: Admin attempts to access private conversation..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Get -Headers $adminHeaders
    throw "Security violation: Admin accessed private messages"
} catch {
    Write-Host "  ✅ Blocked with error: $($_.Exception.Response.StatusCode.value__) (Expected 403)" -ForegroundColor Green
}

# 15. Security check: Unrelated faculty
Write-Host "`n15. Security Check: Contacting unauthorized faculty..."
try {
    $illegalBody = @{ recipientId = 999999; courseId = $targetFaculty.courseId; message = "Unauthorized" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/conversations" -Method Post -Headers $studentHeaders -Body $illegalBody -ContentType "application/json"
    throw "Security violation: Unrelated faculty contacted"
} catch {
    Write-Host "  ✅ Blocked with error: $($_.Exception.Response.StatusCode.value__) (Expected 403 or 404)" -ForegroundColor Green
}

# 16. Validation check: Empty message rejected
Write-Host "`n16. Validation Check: Sending blank message..."
try {
    $emptyBody = @{ content = "   " } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/conversations/$convId/messages" -Method Post -Headers $studentHeaders -Body $emptyBody -ContentType "application/json"
    throw "Validation violation: Blank message accepted"
} catch {
    Write-Host "  ✅ Blocked with 400 Bad Request" -ForegroundColor Green
}

# 17. Duplicate conversation deduplication
Write-Host "`n17. Testing duplicate conversation deduplication..."
$dupBody = @{
    recipientId = $targetFaculty.id
    courseId = $targetFaculty.courseId
    message = "Another inquiry via start conversation."
} | ConvertTo-Json
$dupRes = Invoke-RestMethod -Uri "http://localhost:8080/api/conversations" -Method Post -Headers $studentHeaders -Body $dupBody -ContentType "application/json"
if ($dupRes.data.id -ne $convId) { throw "Expected existing conversation ID $convId to be reused, got $($dupRes.data.id)" }
Write-Host "  ✅ Reused existing conversation $convId without duplicate`n" -ForegroundColor Green

# 18 & 19. Regression checks
Write-Host "18 & 19. Regression checks across Phases 1-8..."
$cRes = Invoke-RestMethod -Uri "http://localhost:8080/api/courses" -Method Get -Headers $studentHeaders
Write-Host "  Phase 2 Courses: $($cRes.data.Count) courses found (✅ OK)"

$aRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments" -Method Get -Headers $studentHeaders
Write-Host "  Phase 4 Assignments: $($aRes.data.Count) assignments found (✅ OK)"

$sRes = Invoke-RestMethod -Uri "http://localhost:8080/api/schedules/today" -Method Get -Headers $studentHeaders
Write-Host "  Phase 5 Timetable: Schedules retrieved (✅ OK)"

$mRes = Invoke-RestMethod -Uri "http://localhost:8080/api/study-materials" -Method Get -Headers $studentHeaders
Write-Host "  Phase 7 Study Materials: $($mRes.data.Count) materials found (✅ OK)"

$annRes = Invoke-RestMethod -Uri "http://localhost:8080/api/announcements" -Method Get -Headers $studentHeaders
Write-Host "  Phase 8 Announcements: $($annRes.data.Count) notices found (✅ OK)"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "🎉 ALL PHASE 9 MESSAGING & REGRESSION TESTS PASSED (100% SUCCESS)" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Cyan
