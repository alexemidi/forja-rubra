$ErrorActionPreference = 'Stop'
$sourceDir = $PSScriptRoot
$workbookName = 'Planilha T20 Macro.xlsm'
$files = @('modPoderesT20.bas', 'modMagiasT20.bas')

function Get-CodeText([string]$path) {
    $lines = Get-Content -LiteralPath $path -Encoding UTF8
    return (($lines | Where-Object { $_ -notmatch '^Attribute VB_' }) -join "`r`n")
}

$excel = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application')
$workbook = $excel.Workbooks.Item($workbookName)
$oldEvents = $excel.EnableEvents
$oldScreen = $excel.ScreenUpdating
$oldCalculation = $excel.Calculation

try {
    $excel.EnableEvents = $false
    $excel.ScreenUpdating = $false
    $excel.Calculation = -4135
    foreach ($file in $files) {
        $name = [IO.Path]::GetFileNameWithoutExtension($file)
        $component = $workbook.VBProject.VBComponents.Item($name)
        $module = $component.CodeModule
        if ($module.CountOfLines -gt 0) { $module.DeleteLines(1, $module.CountOfLines) }
        $module.AddFromString((Get-CodeText (Join-Path $sourceDir $file)))
    }

    $compile = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compile -and $compile.Enabled) { $compile.Execute() }

    $excel.Run("'$workbookName'!modPoderesT20.AtualizarPoderesEscopo", 'resumo')
    $excel.Run("'$workbookName'!modRegrasT20.AtualizarEfeitosAtivos")
    $excel.Run("'$workbookName'!modMagiasT20.AtualizarMagiasPersonagem", $true)
    $excel.Run("'$workbookName'!modPrincipalRostoT20.AtualizarRostoPrincipal")
    $workbook.Save()
    Write-Output "updated=$($files -join ',')"
    Write-Output "saved=$($workbook.Saved)"
}
finally {
    $excel.Calculation = $oldCalculation
    $excel.EnableEvents = $oldEvents
    $excel.ScreenUpdating = $oldScreen
    $excel.StatusBar = $false
}
