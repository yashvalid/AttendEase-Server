$baseUrl = "http://localhost:3000/api"
$email = "teacher_$(Get-Random)@test.com"
$password = "password123"

Write-Host "1. Registering Teacher ($email)..."
$regBody = @{
    name = "Test Teacher"
    email = $email
    password = $password
    role = "teacher"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$baseUrl/user/register" -Method Post -Body $regBody -ContentType "application/json"
    Write-Host "Registration Success: $($regResponse.message)"
} catch {
    Write-Host "Registration Failed: $_"
    exit 1
}

Write-Host "`n2. Logging in..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Success. Token received."
} catch {
    Write-Host "Login Failed: $_"
    exit 1
}

Write-Host "`n3. Creating Class..."
$classBody = @{
    class_name = "Test Class 101"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $classResponse = Invoke-RestMethod -Uri "$baseUrl/user/create_class" -Method Post -Body $classBody -Headers $headers -ContentType "application/json"
    Write-Host "Class Created: $($classResponse.message), ID: $($classResponse.class_id)"
} catch {
    Write-Host "Class Creation Failed: $_"
    exit 1
}

Write-Host "`n4. Fetching Classes..."
try {
    $classesResponse = Invoke-RestMethod -Uri "$baseUrl/user/classes" -Method Get -Headers $headers
    Write-Host "Classes fetched: $($classesResponse.classes.Count)"
    $classesResponse.classes | ForEach-Object { Write-Host "- $_.class_name ($_.class_id)" }
} catch {
    Write-Host "Fetch Classes Failed: $_"
    exit 1
}

Write-Host "`nVerification Complete!"
