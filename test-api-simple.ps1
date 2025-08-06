# VSLA Backend API Testing Script
# Comprehensive testing of all endpoints

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VSLA API COMPREHENSIVE TESTING" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan

# 1. HEALTH CHECK
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET
    Write-Host "SUCCESS - Health Check Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Health Check: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. AUTHENTICATION
Write-Host "`n2. Testing Authentication..." -ForegroundColor Yellow

# Register a test user
$registerBody = @{
    fullName = "API Test Admin"
    phone = "+250788555444"
    email = "apitest@vsla.com"
    password = "testpass123"
    role = "admin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "SUCCESS - Registration Status: $($registerResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Registration: $($_.Exception.Message)" -ForegroundColor Red
}

# Login with test user
$loginBody = @{
    email = "apitest@vsla.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS - Login Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $global:authToken = $loginData.token
    Write-Host "Token received successfully" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Login: $($_.Exception.Message)" -ForegroundColor Red
    $global:authToken = $null
}

# Setup auth headers
if ($global:authToken) {
    $global:authHeaders = @{
        'Authorization' = "Bearer $global:authToken"
        'Content-Type' = 'application/json'
    }
    Write-Host "Authentication headers configured" -ForegroundColor Gray
}

# 3. USER MANAGEMENT
Write-Host "`n3. Testing User Management..." -ForegroundColor Yellow

if ($global:authHeaders) {
    # Get all users
    try {
        $usersResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method GET -Headers $global:authHeaders
        Write-Host "SUCCESS - Get Users Status: $($usersResponse.StatusCode)" -ForegroundColor Green
        $usersData = $usersResponse.Content | ConvertFrom-Json
        Write-Host "Found $($usersData.data.Count) users" -ForegroundColor Gray
        $global:testUserId = $usersData.data[0].id
    } catch {
        Write-Host "FAILED - Get Users: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Get user by ID
    if ($global:testUserId) {
        try {
            $userResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users/$global:testUserId" -Method GET -Headers $global:authHeaders
            Write-Host "SUCCESS - Get User by ID Status: $($userResponse.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "FAILED - Get User by ID: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 4. GROUP MANAGEMENT
Write-Host "`n4. Testing Group Management..." -ForegroundColor Yellow

if ($global:authHeaders) {
    # Get all groups
    try {
        $groupsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/groups" -Method GET -Headers $global:authHeaders
        Write-Host "SUCCESS - Get Groups Status: $($groupsResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Get Groups: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Create a new group
    $groupBody = @{
        name = "API Test Group"
        description = "Test group for API validation"
        location = "Kigali, Rwanda"
        maxMembers = 20
    } | ConvertTo-Json

    try {
        $newGroupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/groups" -Method POST -Body $groupBody -Headers $global:authHeaders
        Write-Host "SUCCESS - Create Group Status: $($newGroupResponse.StatusCode)" -ForegroundColor Green
        $newGroupData = $newGroupResponse.Content | ConvertFrom-Json
        $global:testGroupId = $newGroupData.data.id
        Write-Host "Created group with ID: $($global:testGroupId)" -ForegroundColor Gray
    } catch {
        Write-Host "FAILED - Create Group: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. CONTRIBUTIONS
Write-Host "`n5. Testing Contributions..." -ForegroundColor Yellow

if ($global:authHeaders) {
    try {
        $contributionsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/contributions" -Method GET -Headers $global:authHeaders
        Write-Host "SUCCESS - Get Contributions Status: $($contributionsResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Get Contributions: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. LOANS  
Write-Host "`n6. Testing Loans..." -ForegroundColor Yellow

if ($global:authHeaders) {
    try {
        $loansResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/loans" -Method GET -Headers $global:authHeaders
        Write-Host "SUCCESS - Get Loans Status: $($loansResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Get Loans: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. REPORTS
Write-Host "`n7. Testing Reports..." -ForegroundColor Yellow

if ($global:authHeaders) {
    try {
        $reportsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/reports/financial-summary" -Method GET -Headers $global:authHeaders
        Write-Host "SUCCESS - Financial Reports Status: $($reportsResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Financial Reports: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "API TESTING COMPLETED" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
