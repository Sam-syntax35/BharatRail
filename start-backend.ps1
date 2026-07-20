# start-backend.ps1
# Script to launch all 8 backend microservices in separate PowerShell console windows

Write-Host "Starting all BharatRail backend microservices..." -ForegroundColor Cyan

# 1. User Service
Write-Host "Launching User Service (Port 4001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location user-service; npm run dev"

# 2. Search Service
Write-Host "Launching Search Service (Port 4002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location search-service; npm run dev"

# 3. Admin Service
Write-Host "Launching Admin Service (Port 4003)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location admin-service; npm run dev"

# 4. Notification Service
Write-Host "Launching Notification Service (Port 4004)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location notification-service; npm run dev"

# 5. Booking Service
Write-Host "Launching Booking Service (Port 4005)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location booking-service; npm run dev"

# 6. Payment Service
Write-Host "Launching Payment Service (Port 4006)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location payment-service; npm run dev"

# 7. Inventory Service
Write-Host "Launching Inventory Service (Port 4007)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location inventory-service; npm run dev"

# 8. API Gateway
Write-Host "Launching API Gateway (Port 4000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location api-gateway; npm run dev"

Write-Host "All backend microservices successfully spawned!" -ForegroundColor Green
