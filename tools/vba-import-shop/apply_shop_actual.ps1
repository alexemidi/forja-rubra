$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$workbookPath = (Resolve-Path (Join-Path $root "Planilha T20 Macro.xlsm")).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $root "backups\Planilha T20 Macro-pre-loja-final-$timestamp.xlsm"

$activeExcel = $null
$openWorkbook = $null
try {
    $activeExcel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    foreach ($candidate in $activeExcel.Workbooks) {
        if ([string]::Equals([string]$candidate.Name, "Planilha T20 Macro.xlsm", [StringComparison]::OrdinalIgnoreCase)) {
            $openWorkbook = $candidate
            break
        }
    }
    if ($null -ne $openWorkbook) {
        $openWorkbook.Save()
        $openWorkbook.SaveCopyAs($backupPath)
        $openWorkbook.Close($false)
    }
} catch [Runtime.InteropServices.COMException] {
    # O arquivo pode estar fechado; o importador ainda cria o proprio backup.
} finally {
    if ($null -ne $openWorkbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($openWorkbook) }
    if ($null -ne $activeExcel) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($activeExcel) }
}

& (Join-Path $PSScriptRoot "import_shop.ps1") -WorkbookFile "Planilha T20 Macro.xlsm"

$activeExcel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$previousEvents = $activeExcel.EnableEvents
$previousAlerts = $activeExcel.DisplayAlerts
try {
    $activeExcel.EnableEvents = $false
    $activeExcel.DisplayAlerts = $false
    $reopened = $activeExcel.Workbooks.Open($workbookPath, 0, $false)
    $reopened.Worksheets("Loja").Activate()
    $reopened.Worksheets("Loja").Range("A1").Select()
    $reopened.Save()
    [pscustomobject]@{
        Workbook = $reopened.FullName
        UserBackup = if (Test-Path -LiteralPath $backupPath) { $backupPath } else { "" }
        ActiveSheet = $reopened.ActiveSheet.Name
        Saved = $reopened.Saved
    }
} finally {
    $activeExcel.EnableEvents = $previousEvents
    $activeExcel.DisplayAlerts = $previousAlerts
    if ($null -ne $reopened) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($reopened) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($activeExcel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
