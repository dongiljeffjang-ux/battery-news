#Requires -Version 5.1
<#
.SYNOPSIS
    바이브코딩 VS Code + Continue 규약 자동 설치 스크립트
.DESCRIPTION
    VS Code Continue 확장 프로그램에서 사용할 Futurem 코딩 규약 rule 파일을
    현재 프로젝트 폴더의 .continue\rules\ 위치에 복사합니다.
    상세 가이드는 현재 프로젝트 폴더의 docs\ 하위 문서를 참조합니다.
#>

param(
    [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$rulesSrc = Join-Path $projectRoot "continue-rules"
$rulesDst = Join-Path $projectRoot ".continue\rules"
$docsDir = Join-Path $projectRoot "docs"
$username = $env:USERNAME

function Write-Step([string]$msg) {
    Write-Host "`n▶ $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "  ✔ $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  ⚠ $msg" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║      바이브코딩(VibeCoding) Continue 규약 설치 스크립트  ║" -ForegroundColor Magenta
Write-Host "║           프로젝트 로컬 VS Code + Continue 규약 환경      ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "  사용자: $username"
Write-Host "  프로젝트 경로: $projectRoot"
Write-Host "  규칙 설치 경로: $rulesDst"

Write-Step "프로젝트 로컬 Continue rule 파일 설치 → $rulesDst"

if (-not (Test-Path -LiteralPath $rulesSrc)) {
    throw "원본 폴더가 없습니다: $rulesSrc"
}

if (-not (Test-Path -LiteralPath $rulesDst)) {
    New-Item -ItemType Directory -Force -Path $rulesDst | Out-Null
    Write-OK "디렉토리 생성: $rulesDst"
}

$ruleFiles = Get-ChildItem -Path $rulesSrc -Filter "*.md"
if (-not $ruleFiles) {
    Write-Warn "설치할 .md rule 파일이 없습니다."
}

foreach ($f in $ruleFiles) {
    $dst = Join-Path $rulesDst $f.Name
    Copy-Item -LiteralPath $f.FullName -Destination $dst -Force
    Write-OK $f.Name
}

Write-Step "프로젝트 로컬 상세 가이드 확인 → $docsDir"

if (Test-Path -LiteralPath $docsDir) {
    Write-OK "docs 하위 상세 가이드 사용"
} else {
    Write-Warn "상세 가이드 폴더가 없습니다: $docsDir"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  설치 완료!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  이 프로젝트 폴더를 VS Code로 열면 Continue에서 사내 개발 규약을 참조할 수 있습니다."
Write-Host "  상세 가이드 위치: $docsDir"
Write-Host "  확인 질문: 현재 프로젝트의 코딩 규약을 알고 있어?"
Write-Host ""

if (-not $NoPause) {
    Read-Host "Press Enter to close"
}
