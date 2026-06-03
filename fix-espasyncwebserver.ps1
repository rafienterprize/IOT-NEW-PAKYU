# PowerShell Script: Fix ESPAsyncWebServer Library
# Menghapus library lama dan install fork terbaru yang kompatibel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX: ESPAsyncWebServer Library" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$libraryPath = "$env:USERPROFILE\Documents\Arduino\libraries\ESPAsyncWebServer"
$tempPath = "$env:TEMP\ESPAsyncWebServer-master.zip"
$extractPath = "$env:TEMP\ESPAsyncWebServer-master"

# Step 1: Hapus library lama
Write-Host "[1/5] Menghapus library lama..." -ForegroundColor Yellow
if (Test-Path $libraryPath) {
    Remove-Item -Path $libraryPath -Recurse -Force
    Write-Host "      Library lama dihapus!" -ForegroundColor Green
} else {
    Write-Host "      Library lama tidak ditemukan (skip)" -ForegroundColor Gray
}

# Step 2: Download fork terbaru
Write-Host "[2/5] Download fork terbaru..." -ForegroundColor Yellow
$url = "https://github.com/mathieucarbou/ESPAsyncWebServer/archive/refs/heads/master.zip"
try {
    Invoke-WebRequest -Uri $url -OutFile $tempPath -UseBasicParsing
    Write-Host "      Download selesai!" -ForegroundColor Green
} catch {
    Write-Host "      Error download! Coba manual:" -ForegroundColor Red
    Write-Host "      $url" -ForegroundColor Red
    exit 1
}

# Step 3: Extract
Write-Host "[3/5] Extract file..." -ForegroundColor Yellow
Expand-Archive -Path $tempPath -DestinationPath $env:TEMP -Force
Write-Host "      Extract selesai!" -ForegroundColor Green

# Step 4: Rename dan copy
Write-Host "[4/5] Install library..." -ForegroundColor Yellow
$extractedFolder = Get-ChildItem -Path $env:TEMP -Filter "ESPAsyncWebServer-*" -Directory | Select-Object -First 1
if ($extractedFolder) {
    Move-Item -Path $extractedFolder.FullName -Destination $libraryPath -Force
    Write-Host "      Library terinstall!" -ForegroundColor Green
} else {
    Write-Host "      Error: Folder extract tidak ditemukan!" -ForegroundColor Red
    exit 1
}

# Step 5: Cleanup
Write-Host "[5/5] Cleanup..." -ForegroundColor Yellow
Remove-Item -Path $tempPath -Force -ErrorAction SilentlyContinue
Write-Host "      Cleanup selesai!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SELESAI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Library baru terinstall di:" -ForegroundColor White
Write-Host $libraryPath -ForegroundColor Yellow
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. RESTART Arduino IDE" -ForegroundColor White
Write-Host "2. Open sketch: esp32-4.ino" -ForegroundColor White
Write-Host "3. Click Verify/Compile" -ForegroundColor White
Write-Host ""
