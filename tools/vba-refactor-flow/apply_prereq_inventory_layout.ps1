param(
    [string]$WorkbookName = 'Planilha T20 Macro.xlsm',
    [switch]$Refresh
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$components = [ordered]@{
    'modLayoutT20' = Join-Path $root 'tools\vba-import-final-layout\modLayoutT20.bas'
    'modInventarioT20' = Join-Path $root 'tools\vba-import-origin-inventory\modInventarioT20.bas'
    'modAssistenteCriacaoT20' = Join-Path $PSScriptRoot 'modAssistenteCriacaoT20.bas'
    'modFluxoT20' = Join-Path $PSScriptRoot 'modFluxoT20.bas'
    'modMagiasT20' = Join-Path $PSScriptRoot 'modMagiasT20.bas'
    'modPoderesT20' = Join-Path $PSScriptRoot 'modPoderesT20.bas'
    'modPrincipalRostoT20' = Join-Path $PSScriptRoot 'modPrincipalRostoT20.bas'
    'modRegrasT20' = Join-Path $PSScriptRoot 'modRegrasT20.bas'
    'Planilha1' = Join-Path $PSScriptRoot 'Planilha1.cls'
    'UserFormMagia' = Join-Path $root 'tools\vba-import-raw-powers\UserFormMagia.code.bas'
    'frmAtributosT20' = Join-Path $PSScriptRoot 'UserFormAtributos.code.bas'
}

function Get-CodeText([string]$Path) {
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8
    return (($lines | Where-Object { $_ -notmatch '^Attribute VB_' }) -join "`r`n")
}

function Set-ComponentCode($Project, [string]$Name, [string]$Path) {
    $component = $Project.VBComponents.Item($Name)
    $module = $component.CodeModule
    if ($module.CountOfLines -gt 0) { $module.DeleteLines(1, $module.CountOfLines) }
    $module.AddFromString((Get-CodeText $Path))
}

$excel = $null
$workbook = $null
$createdExcel = $false
$openedWorkbook = $false
try {
    $excel = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application')
}
catch {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $createdExcel = $true
}

$oldAutomationSecurity = $excel.AutomationSecurity
$excel.AutomationSecurity = 3
try {
    $workbook = $excel.Workbooks.Item($WorkbookName)
}
catch {
    $workbook = $excel.Workbooks.Open((Join-Path $root $WorkbookName))
    $openedWorkbook = $true
}

$project = $workbook.VBProject
$oldEvents = $excel.EnableEvents
$oldScreen = $excel.ScreenUpdating
$oldAlerts = $excel.DisplayAlerts
$oldCalculation = $excel.Calculation

try {
    $excel.EnableEvents = $false
    $excel.ScreenUpdating = $false
    $excel.DisplayAlerts = $false
    $excel.Calculation = -4135

    foreach ($entry in $components.GetEnumerator()) {
        Set-ComponentCode $project $entry.Key $entry.Value
    }

    $compile = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compile -and $compile.Enabled) { $compile.Execute() }

    if ($Refresh) {
        $excel.Run("'$WorkbookName'!modFluxoT20.InstalarFluxoOtimizado")
        $excel.Run("'$WorkbookName'!modPoderesT20.AtualizarPoderesEscopo", 'resumo')
        $excel.Run("'$WorkbookName'!modRegrasT20.AtualizarEfeitosAtivos")
        $excel.Run("'$WorkbookName'!modMagiasT20.AtualizarMagiasPersonagem", $true)
        $excel.Run("'$WorkbookName'!modPrincipalRostoT20.AtualizarRostoPrincipal")
        $excel.Run("'$WorkbookName'!modInventarioT20.AtualizarInventario", $false)
        $excel.CalculateFull()
    }

    $compile = $excel.VBE.CommandBars.FindControl(1, 578)
    $compileEnabled = $false
    if ($null -ne $compile) { $compileEnabled = [bool]$compile.Enabled }
    $workbook.Save()

    Write-Output "installed=$($components.Keys -join ',')"
    Write-Output "compile_enabled_after=$compileEnabled"
    Write-Output "saved=$($workbook.Saved)"
    Write-Output "refresh=$([bool]$Refresh)"
}
finally {
    $excel.Calculation = $oldCalculation
    $excel.EnableEvents = $oldEvents
    $excel.ScreenUpdating = $oldScreen
    $excel.DisplayAlerts = $oldAlerts
    $excel.AutomationSecurity = $oldAutomationSecurity
    $excel.StatusBar = $false
    if ($openedWorkbook -and $null -ne $workbook) { $workbook.Close($true) }
    if ($createdExcel -and $null -ne $excel) { $excel.Quit() }
    if ($null -ne $workbook) { [Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null }
    if ($null -ne $excel) { [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null }
}
