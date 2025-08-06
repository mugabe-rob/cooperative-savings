# VSLA Backend API Testing Script
# Comprehensive testing of all endpoints

# ===================================
# 1. HEALTH CHECK
# ===================================

Write-Host "🏥 Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET
    Write-Host "✅ Health Check Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "="*50

# ===================================
# 2. AUTHENTICATION ENDPOINTS
# ===================================

Write-Host "🔐 Testing Authentication..." -ForegroundColor Cyan

# Test User Registration
Write-Host "`n👤 Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    fullName = "Test Admin User"
    phone = "+250788999888"
    email = "testadmin@vsla.com"
    password = "testpass123"
    role = "admin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration Status: $($registerResponse.StatusCode)" -ForegroundColor Green
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "User ID: $($registerData.id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
    $registerResponse = $null
}

# Test User Login  
Write-Host "`n🔑 Testing User Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "testadmin@vsla.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $global:authToken = $loginData.token
    Write-Host "Token received: $($global:authToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    $global:authToken = $null
}

# Setup headers for authenticated requests
if ($global:authToken) {
    $global:authHeaders = @{
        'Authorization' = "Bearer $global:authToken"
        'Content-Type' = 'application/json'
    }
}

Write-Host "`n" + "="*50

# ===================================
# 3. USER MANAGEMENT ENDPOINTS
# ===================================

Write-Host "👥 Testing User Management..." -ForegroundColor Cyan

if ($global:authHeaders) {
    # Get all users
    Write-Host "`n📋 Testing Get All Users..." -ForegroundColor Yellow
    try {
        $usersResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Get Users Status: $($usersResponse.StatusCode)" -ForegroundColor Green
        $usersData = $usersResponse.Content | ConvertFrom-Json
        Write-Host "Found $($usersData.data.Count) users" -ForegroundColor Gray
        $global:testUserId = $usersData.data[0].id
    } catch {
        Write-Host "❌ Get Users Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Get user by ID
    if ($global:testUserId) {
        Write-Host "`n👤 Testing Get User by ID..." -ForegroundColor Yellow
        try {
            $userResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users/$global:testUserId" -Method GET -Headers $global:authHeaders
            Write-Host "✅ Get User Status: $($userResponse.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Get User Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Create a member user
    Write-Host "`n➕ Testing Create Member User..." -ForegroundColor Yellow
    $memberBody = @{
        fullName = "Test Member User"
        phone = "+250788777666"
        email = "testmember@vsla.com"
        password = "memberpass123"
        role = "member"
    } | ConvertTo-Json

    try {
        $memberResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method POST -Body $memberBody -Headers $global:authHeaders
        Write-Host "✅ Create Member Status: $($memberResponse.StatusCode)" -ForegroundColor Green
        $memberData = $memberResponse.Content | ConvertFrom-Json
        $global:memberUserId = $memberData.data.id
    } catch {
        Write-Host "❌ Create Member Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*50

# ===================================
# 4. GROUP MANAGEMENT ENDPOINTS  
# ===================================

Write-Host "👨‍👩‍👧‍👦 Testing Group Management..." -ForegroundColor Cyan

if ($global:authHeaders) {
    # Get all groups
    Write-Host "`n📋 Testing Get All Groups..." -ForegroundColor Yellow
    try {
        $groupsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/groups" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Get Groups Status: $($groupsResponse.StatusCode)" -ForegroundColor Green
        $groupsData = $groupsResponse.Content | ConvertFrom-Json
        Write-Host "Found $($groupsData.data.Count) groups" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Get Groups Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Create a new group
    Write-Host "`n➕ Testing Create Group..." -ForegroundColor Yellow
    $groupBody = @{
        name = "Test Savings Group"
        description = "A test group for API testing"
        location = "Kigali, Rwanda"
        maxMembers = 25
        minimumContribution = 1000
    } | ConvertTo-Json

    try {
        $newGroupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/groups" -Method POST -Body $groupBody -Headers $global:authHeaders
        Write-Host "✅ Create Group Status: $($newGroupResponse.StatusCode)" -ForegroundColor Green
        $newGroupData = $newGroupResponse.Content | ConvertFrom-Json
        $global:testGroupId = $newGroupData.data.id
    } catch {
        Write-Host "❌ Create Group Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*50

# ===================================
# 5. CONTRIBUTION ENDPOINTS
# ===================================

Write-Host "💰 Testing Contributions..." -ForegroundColor Cyan

if ($global:authHeaders -and $global:testGroupId) {
    # Get contributions
    Write-Host "`n📋 Testing Get Contributions..." -ForegroundColor Yellow
    try {
        $contributionsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/contributions" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Get Contributions Status: $($contributionsResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Get Contributions Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Create a contribution
    Write-Host "`n➕ Testing Create Contribution..." -ForegroundColor Yellow
    $contributionBody = @{
        groupId = $global:testGroupId
        amount = 5000
        type = "regular"
        description = "Monthly contribution"
    } | ConvertTo-Json

    try {
        $contribResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/contributions" -Method POST -Body $contributionBody -Headers $global:authHeaders
        Write-Host "✅ Create Contribution Status: $($contribResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Create Contribution Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*50

# ===================================
# 6. LOAN ENDPOINTS
# ===================================

Write-Host "🏦 Testing Loans..." -ForegroundColor Cyan

if ($global:authHeaders -and $global:testGroupId) {
    # Get loans
    Write-Host "`n📋 Testing Get Loans..." -ForegroundColor Yellow
    try {
        $loansResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/loans" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Get Loans Status: $($loansResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Get Loans Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Request a loan
    Write-Host "`n💸 Testing Loan Request..." -ForegroundColor Yellow
    $loanBody = @{
        groupId = $global:testGroupId
        amount = 50000
        purpose = "Small business expansion"
        repaymentMonths = 12
    } | ConvertTo-Json

    try {
        $loanResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/loans" -Method POST -Body $loanBody -Headers $global:authHeaders
        Write-Host "✅ Loan Request Status: $($loanResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Loan Request Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*50

# ===================================
# 7. REPORTS ENDPOINTS
# ===================================

Write-Host "📊 Testing Reports..." -ForegroundColor Cyan

if ($global:authHeaders) {
    # Get financial summary
    Write-Host "`n💼 Testing Financial Summary..." -ForegroundColor Yellow
    try {
        $summaryResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/reports/financial-summary" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Financial Summary Status: $($summaryResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Financial Summary Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Get group performance
    Write-Host "`n📈 Testing Group Performance..." -ForegroundColor Yellow
    try {
        $performanceResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/reports/group-performance" -Method GET -Headers $global:authHeaders
        Write-Host "✅ Group Performance Status: $($performanceResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Group Performance Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*50
Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "Check the results above for any failures that need attention." -ForegroundColor Yellow
