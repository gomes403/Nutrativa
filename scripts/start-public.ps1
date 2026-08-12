$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
  $npm = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $npm) {
  Write-Host "NPM nao encontrado. Instale o Node.js para iniciar o sistema." -ForegroundColor Red
  exit 1
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue

Write-Host "Iniciando NUTRATIVA para teste em celular..." -ForegroundColor Green
$api = Start-Process -FilePath $npm.Source -ArgumentList "run", "api" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
$web = Start-Process -FilePath $npm.Source -ArgumentList "run", "web" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 5

$networkIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ""
Write-Host "Sistema iniciado." -ForegroundColor Green
Write-Host "Neste computador: http://127.0.0.1:5180"
if ($networkIp) {
  Write-Host "Na mesma rede Wi-Fi: http://$networkIp`:5180"
}

if (-not $cloudflared) {
  Write-Host ""
  Write-Host "Para acessar fora da rede local e instalar no celular, instale o Cloudflare Tunnel:" -ForegroundColor Yellow
  Write-Host "winget install Cloudflare.cloudflared"
  Write-Host "Depois execute novamente: npm run start:public"
  Write-Host ""
  Write-Host "Processos iniciados: API $($api.Id), WEB $($web.Id)."
  exit 0
}

Write-Host ""
Write-Host "Gerando link publico seguro. Copie o endereco https:// que aparecer abaixo para abrir no celular." -ForegroundColor Cyan
Write-Host "Mantenha esta janela aberta enquanto estiver testando."
Write-Host ""

& $cloudflared.Source tunnel --url http://127.0.0.1:5180
