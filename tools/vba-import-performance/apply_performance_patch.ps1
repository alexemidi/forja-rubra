param(
    [string]$WorkbookFile = "Planilha T20 Macro.xlsm",
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$workbookPath = (Resolve-Path (Join-Path $root $WorkbookFile)).Path
$rawDir = Join-Path $root "tools\vba-import-raw-powers"
$layoutDir = Join-Path $root "tools\vba-import-final-layout"
$inventoryDir = Join-Path $root "tools\vba-import-origin-inventory"
$backupPath = $null

function Replace-CodeModule {
    param($Workbook, [string]$ComponentName, [string]$CodePath, [switch]$Create, [switch]$ClassBody)

    $component = $null
    try { $component = $Workbook.VBProject.VBComponents.Item($ComponentName) } catch {}
    if ($null -eq $component) {
        if (-not $Create) { throw "Componente VBA nao encontrado: $ComponentName" }
        $component = $Workbook.VBProject.VBComponents.Add(1)
        $component.Name = $ComponentName
    }

    $code = Get-Content -Raw -Encoding UTF8 $CodePath
    if ($ClassBody) {
        $match = [regex]::Match($code, '(?s)Option Explicit.*$')
        if (-not $match.Success) { throw "Corpo de classe VBA invalido: $CodePath" }
        $code = $match.Value
    } else {
        $code = [regex]::Replace($code, '(?m)^Attribute VB_Name\s*=.*\r?\n?', '')
    }

    if ($component.CodeModule.CountOfLines -gt 0) {
        $component.CodeModule.DeleteLines(1, $component.CodeModule.CountOfLines)
    }
    $component.CodeModule.AddFromString($code)
}

if (-not $SkipBackup) {
    $backupDir = Join-Path $root "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $leaf = [IO.Path]::GetFileNameWithoutExtension($workbookPath)
    $backupPath = Join-Path $backupDir "$leaf-pre-performance-$stamp.xlsm"
    Copy-Item -LiteralPath $workbookPath -Destination $backupPath -Force
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$excel.ScreenUpdating = $false
$excel.AutomationSecurity = 1
$workbook = $null

try {
    $workbook = $excel.Workbooks.Open($workbookPath)
    $excel.Calculation = -4135

    Replace-CodeModule $workbook "modEstadoExcelT20" (Join-Path $rawDir "modEstadoExcelT20.bas")
    Replace-CodeModule $workbook "modAutomacaoT20" (Join-Path $rawDir "modAutomacaoT20.bas")
    Replace-CodeModule $workbook "modRegrasT20" (Join-Path $rawDir "modRegrasT20.bas")
    Replace-CodeModule $workbook "modMagiasT20" (Join-Path $rawDir "modMagiasT20.bas")
    Replace-CodeModule $workbook "modPoderesT20" (Join-Path $rawDir "modPoderesT20.bas")
    Replace-CodeModule $workbook "modPrincipalRostoT20" (Join-Path $rawDir "modPrincipalRostoT20.extracted.bas")
    Replace-CodeModule $workbook "modInventarioT20" (Join-Path $inventoryDir "modInventarioT20.bas")
    Replace-CodeModule $workbook "modCriacaoT20" (Join-Path $layoutDir "modCriacaoT20.bas") -Create
    Replace-CodeModule $workbook "Planilha1" (Join-Path $rawDir "Planilha1.extracted.cls") -ClassBody

    $prefix = "'" + $workbook.Name + "'!"
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $excel.Run($prefix + "modEstadoExcelT20.IniciarModoRapido") | Out-Null
    $excel.Run($prefix + "modPoderesT20.AtualizarPoderesClasse", $true) | Out-Null
    $excel.Run($prefix + "modRegrasT20.AtualizarEfeitosAtivos") | Out-Null
    $excel.Run($prefix + "modMagiasT20.AtualizarMagiasPersonagem", $true) | Out-Null
    $excel.Run($prefix + "modPrincipalRostoT20.AtualizarRostoPrincipal") | Out-Null
    $excel.Run($prefix + "modInventarioT20.AtualizarInventario", $false) | Out-Null
    $excel.Run($prefix + "modEstadoExcelT20.FinalizarModoRapido", $true) | Out-Null
    $timer.Stop()

    $principal = $workbook.Worksheets.Item("Principal")
    $errorCount = 0
    try {
        $errors = $principal.UsedRange.SpecialCells(-4123, 16)
        if ($null -ne $errors) { $errorCount = $errors.Count }
    } catch {}
    if ($errorCount -gt 0) { throw "A Principal ficou com $errorCount erro(s) de formula." }

    $excel.Calculation = -4105
    $workbook.Save()
    [pscustomobject]@{
        Workbook = $workbookPath
        Backup = $backupPath
        PerformanceVersion = $excel.Run($prefix + "modEstadoExcelT20.CodexPerformanceVersion")
        ValidationPipelineMs = $timer.ElapsedMilliseconds
        FormulaErrors = $errorCount
    } | ConvertTo-Json -Compress | Write-Output
}
finally {
    if ($null -ne $workbook) {
        try { $workbook.Close($true) } catch {}
    }
    try { $excel.Calculation = -4105 } catch {}
    try { $excel.EnableEvents = $true } catch {}
    try { $excel.ScreenUpdating = $true } catch {}
    try { $excel.DisplayAlerts = $true } catch {}
    $excel.Quit()
}
