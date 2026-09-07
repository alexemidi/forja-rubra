param(
    [string]$WorkbookFile = "backups\shop-test.xlsm",
    [string]$OutputDirectory = "tmp\shop-preview"
)

$ErrorActionPreference = "Stop"
$path = (Resolve-Path -LiteralPath $WorkbookFile).Path
$output = Join-Path (Get-Location) $OutputDirectory
$null = New-Item -ItemType Directory -Path $output -Force
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$excel.DisplayAlerts = $false
$workbook = $null

function Export-RangePicture {
    param($Sheet, [string]$Address, [string]$FileName)
    $range = $Sheet.Range($Address)
    $range.Select()
    $null = $range.CopyPicture(1, 2)
    Start-Sleep -Milliseconds 800
    $chartObject = $Sheet.ChartObjects().Add(0, 0, [double]$range.Width, [double]$range.Height)
    $chartObject.Activate()
    $null = $chartObject.Chart.Paste()
    Start-Sleep -Milliseconds 800
    $destination = Join-Path $output $FileName
    if (-not $chartObject.Chart.Export($destination, "PNG")) { throw "Falha ao exportar $Address." }
    $chartObject.Delete()
    return $destination
}

try {
    $workbook = $excel.Workbooks.Open($path, 0, $true)
    $shop = $workbook.Worksheets("Loja")
    $shop.Activate()
    $excel.ActiveWindow.WindowState = -4143
    $first = Export-RangePicture $shop "A1:R8" "armas-dados.png"
    $second = Export-RangePicture $shop "S1:AB8" "armas-configuracao.png"
    [pscustomobject]@{ DataPreview = $first; ConfigurationPreview = $second }
} finally {
    if ($null -ne $workbook) { $workbook.Close($false) }
    $excel.Quit()
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
