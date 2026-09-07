param(
    [string]$WorkbookName = 'Planilha T20 Macro.xlsm'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sourceDir = $PSScriptRoot
$moduleFiles = @(
    'modFluxoT20.bas',
    'modAssistenteCriacaoT20.bas',
    'modCriacaoT20.bas',
    'modAutomacaoT20.bas',
    'modMagiasT20.bas',
    'modPoderesT20.bas',
    'modPoderesClasseT20.bas',
    'modPrincipalRostoT20.bas',
    'modRegrasT20.bas',
    'Planilha1.cls'
)

$formCodeFiles = @{
    'UserForm1' = Join-Path $PSScriptRoot 'UserForm1.code.bas'
    'UserFormMagia' = Join-Path (Split-Path -Parent $PSScriptRoot) 'vba-import-raw-powers\UserFormMagia.code.bas'
    'frmAtributosT20' = Join-Path $PSScriptRoot 'UserFormAtributos.code.bas'
}

function Get-CodeText([string]$path) {
    $lines = Get-Content -LiteralPath $path -Encoding UTF8
    return (($lines | Where-Object { $_ -notmatch '^Attribute VB_' }) -join "`r`n")
}

function Set-VbaComponentCode($project, [string]$componentName, [string]$path, [bool]$createIfMissing) {
    $component = $null
    try { $component = $project.VBComponents.Item($componentName) } catch {}
    if ($null -eq $component) {
        if (-not $createIfMissing) { throw "Componente VBA nao encontrado: $componentName" }
        $component = $project.VBComponents.Add(1)
        $component.Name = $componentName
    }

    $code = Get-CodeText $path
    $codeModule = $component.CodeModule
    if ($codeModule.CountOfLines -gt 0) {
        $codeModule.DeleteLines(1, $codeModule.CountOfLines)
    }
    $codeModule.AddFromString($code)
}

function Add-FormControl($designer, [string]$progId, [string]$name, [string]$caption = '') {
    $control = $designer.Controls.Add($progId, $name, $true)
    if (-not [string]::IsNullOrEmpty($caption)) { $control.Caption = $caption }
    $control.Left = 12
    $control.Top = 12
    $control.Width = 80
    $control.Height = 20
    return $control
}

function New-AttributeForm($project) {
    $existing = $null
    try { $existing = $project.VBComponents.Item('frmAtributosT20') } catch {}
    if ($null -ne $existing) { return }

    $component = $project.VBComponents.Add(3)
    $component.Name = 'frmAtributosT20'
    $component.Properties.Item('Caption').Value = 'Forja T20 - Atributos'
    $component.Properties.Item('Width').Value = 390
    $component.Properties.Item('Height').Value = 330
    $designer = $component.Designer

    Add-FormControl $designer 'Forms.Label.1' 'lblTitulo' 'Compra de atributos' | Out-Null
    Add-FormControl $designer 'Forms.Label.1' 'lblPontos' 'Pontos usados: 0 de 10' | Out-Null
    foreach ($name in @('Forca','Destreza','Constituicao','Inteligencia','Sabedoria','Carisma')) {
        Add-FormControl $designer 'Forms.Label.1' ("lbl$name") $name | Out-Null
        $text = Add-FormControl $designer 'Forms.TextBox.1' ("txt$name")
        $text.Locked = $true
        $spin = Add-FormControl $designer 'Forms.SpinButton.1' ("spn$name")
        $spin.Min = -1
        $spin.Max = 4
        $spin.SmallChange = 1
    }
    Add-FormControl $designer 'Forms.CommandButton.1' 'cmdOK' 'OK' | Out-Null
    Add-FormControl $designer 'Forms.CommandButton.1' 'cmdCancelar' 'Cancelar' | Out-Null
}

function Optimize-Formula([string]$formula, [bool]$isStore) {
    if ([string]::IsNullOrEmpty($formula) -or -not $formula.StartsWith('=')) { return $formula }

    $result = $formula
    foreach ($column in @('D','E','F','G','H')) {
        $result = $result.Replace("Efeitos_Ativos!`$$column`:`$$column", "Efeitos_Ativos!`$$column`$2:`$$column`$500")
    }
    if ($isStore) {
        foreach ($column in @('C','D','E','F')) {
            $result = $result.Replace("Base_Materiais!`$$column`:`$$column", "Base_Materiais!`$$column`$2:`$$column`$200")
        }
    }
    return $result
}

$excel = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application')
$workbook = $excel.Workbooks.Item($WorkbookName)
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

    foreach ($file in $moduleFiles) {
        $name = [IO.Path]::GetFileNameWithoutExtension($file)
        Set-VbaComponentCode $project $name (Join-Path $sourceDir $file) ($name -in @('modFluxoT20','modAssistenteCriacaoT20'))
    }

    New-AttributeForm $project
    foreach ($entry in $formCodeFiles.GetEnumerator()) {
        Set-VbaComponentCode $project $entry.Key $entry.Value $false
    }

    $principal = $workbook.Worksheets.Item('Principal')
    foreach ($cell in $principal.UsedRange.Cells) {
        if ($cell.HasFormula) {
            $formula = [string]$cell.Formula
            $optimized = Optimize-Formula $formula $false
            if ($optimized -ne $formula) { $cell.Formula = $optimized }
        }
    }

    $store = $workbook.Worksheets.Item('Loja')
    foreach ($cell in $store.UsedRange.Cells) {
        if ($cell.HasFormula) {
            $formula = [string]$cell.Formula
            $optimized = Optimize-Formula $formula $true
            if ($optimized -ne $formula) { $cell.Formula = $optimized }
        }
    }

    $excel.Run("'$WorkbookName'!modFluxoT20.InstalarFluxoOtimizado")

    $compile = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compile -and $compile.Enabled) { $compile.Execute() }

    $workbook.Save()
    Write-Output "installed=$WorkbookName"
    Write-Output "saved=$($workbook.Saved)"
    Write-Output "modules=$($moduleFiles.Count)"
}
finally {
    $excel.Calculation = $oldCalculation
    $excel.EnableEvents = $oldEvents
    $excel.ScreenUpdating = $oldScreen
    $excel.DisplayAlerts = $oldAlerts
    $excel.StatusBar = $false
}
