param(
    [string]$WorkbookFile = "Planilha T20 Macro.xlsm",
    [string]$OutputDirectory = "tmp\principal-preview"
)

$ErrorActionPreference = "Stop"
$path = (Resolve-Path -LiteralPath $WorkbookFile).Path
$output = Join-Path (Get-Location) $OutputDirectory
$null = New-Item -ItemType Directory -Path $output -Force
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$workbook = $null

function Export-RangePicture {
    param($Sheet, [string]$Address, [string]$FileName)
    $range = $Sheet.Range($Address)
    $range.Select()
    $null = $range.CopyPicture(1, 2)
    Start-Sleep -Milliseconds 700
    $chartObject = $Sheet.ChartObjects().Add(0, 0, [double]$range.Width, [double]$range.Height)
    $chartObject.Activate()
    $null = $chartObject.Chart.Paste()
    Start-Sleep -Milliseconds 700
    $destination = Join-Path $output $FileName
    if (-not $chartObject.Chart.Export($destination, "PNG")) { throw "Falha ao exportar $Address." }
    $chartObject.Delete()
    $destination
}

try {
    $workbook = $excel.Workbooks.Open($path, 0, $true)
    $sheet = $workbook.Worksheets("Principal")
    $sheet.Activate()
    $excel.ActiveWindow.WindowState = -4143
    $left = Export-RangePicture $sheet "A1:M25" "principal-esquerda.png"
    $right = Export-RangePicture $sheet "N1:U25" "principal-direita.png"
    [pscustomobject]@{ Left = $left; Right = $right }
} finally {
    if ($null -ne $workbook) { $workbook.Close($false) }
    $excel.Quit()
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
