param(
    [string]$GeneralSourcePath = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$workbookPath = Join-Path $projectRoot "Planilha T20 Macro.xlsm"
$catalogPath = Join-Path $PSScriptRoot "poderes_catalogo_import.json"
$modulePath = Join-Path $PSScriptRoot "modPoderesT20.bas"
$formCodePath = Join-Path $PSScriptRoot "UserFormMagia.code.bas"
$backupDir = Join-Path $projectRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "Planilha T20 Macro-pre-catalogo-$timestamp.xlsm"

function Convert-ToMatrix {
    param(
        [object[]]$Header,
        [System.Collections.IEnumerable]$Rows
    )

    $rowList = New-Object System.Collections.ArrayList
    foreach ($row in $Rows) {
        [void]$rowList.Add(@($row))
    }

    $rowCount = $rowList.Count + 1
    $colCount = $Header.Count
    $matrix = New-Object "object[,]" $rowCount, $colCount
    for ($c = 0; $c -lt $colCount; $c++) {
        $matrix[0, $c] = $Header[$c]
    }
    for ($r = 0; $r -lt $rowList.Count; $r++) {
        $row = @($rowList[$r])
        for ($c = 0; $c -lt $colCount; $c++) {
            if ($c -lt $row.Count -and $null -ne $row[$c]) {
                $matrix[($r + 1), $c] = $row[$c]
            } else {
                $matrix[($r + 1), $c] = ""
            }
        }
    }
    return ,$matrix
}

function Write-WorksheetRows {
    param(
        $Worksheet,
        [object[]]$Header,
        [System.Collections.IEnumerable]$Rows
    )

    $rowList = New-Object System.Collections.ArrayList
    foreach ($row in $Rows) {
        [void]$rowList.Add(@($row))
    }

    $newLastRow = $rowList.Count + 1
    $oldLastRow = $Worksheet.Cells($Worksheet.Rows.Count, 1).End(-4162).Row
    $clearLastRow = [Math]::Max($oldLastRow, $newLastRow)
    $lastColumn = $Header.Count
    $Worksheet.Range($Worksheet.Cells(1, 1), $Worksheet.Cells($clearLastRow, $lastColumn)).ClearContents()

    $matrix = Convert-ToMatrix -Header $Header -Rows $rowList
    $target = $Worksheet.Range($Worksheet.Cells(1, 1), $Worksheet.Cells($newLastRow, $lastColumn))
    $target.Value2 = $matrix
    $Worksheet.Rows.Item(1).Font.Bold = $true
    $Worksheet.Rows.Item(1).AutoFilter() | Out-Null
}

function Replace-CodeModule {
    param(
        $Workbook,
        [string]$ComponentName,
        [string]$CodePath,
        [switch]$StripAttribute
    )

    $code = Get-Content -Raw -Encoding UTF8 $CodePath
    if ($StripAttribute) {
        $code = [regex]::Replace($code, '^Attribute VB_Name = "[^"]+"\r?\n', '')
    }
    $module = $Workbook.VBProject.VBComponents.Item($ComponentName).CodeModule
    if ($module.CountOfLines -gt 0) {
        $module.DeleteLines(1, $module.CountOfLines)
    }
    $module.AddFromString($code)
}

function Add-UniquePoolId {
    param(
        [string]$Pool,
        [string]$Id
    )

    $items = New-Object System.Collections.ArrayList
    foreach ($item in ($Pool -split ';')) {
        $trimmed = $item.Trim()
        if ($trimmed -and -not ($items -contains $trimmed)) {
            [void]$items.Add($trimmed)
        }
    }
    if ($Id -and -not ($items -contains $Id)) {
        [void]$items.Add($Id)
    }
    return ($items -join ';')
}

function Read-GeneralPowerRows {
    param(
        $Worksheet,
        [int]$ColumnCount
    )

    $rows = New-Object System.Collections.ArrayList
    $lastRow = $Worksheet.Cells($Worksheet.Rows.Count, 1).End(-4162).Row
    if ($lastRow -lt 2) { return ,$rows }

    $values = $Worksheet.Range($Worksheet.Cells(2, 1), $Worksheet.Cells($lastRow, $ColumnCount)).Value2
    for ($r = 1; $r -le ($lastRow - 1); $r++) {
        if ([string]$values[$r, 3] -eq "Geral") {
            $row = @()
            for ($c = 1; $c -le $ColumnCount; $c++) {
                $row += $values[$r, $c]
            }
            [void]$rows.Add($row)
        }
    }
    return ,$rows
}

if (-not (Test-Path $workbookPath)) { throw "Workbook not found: $workbookPath" }
if (-not (Test-Path $catalogPath)) { throw "Catalog import not found: $catalogPath" }

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item -LiteralPath $workbookPath -Destination $backupPath

$data = Get-Content -Raw -Encoding UTF8 $catalogPath | ConvertFrom-Json
$catalogHeader = @(
    "PoderId", "Nome", "OrigemTipo", "Categoria", "ClasseIds", "Livro", "Descricao", "Repetivel",
    "NivelMinimo", "ReqAtributos", "ReqPoderes", "ReqPericias", "ReqProficiencias", "PreReqResumo",
    "EscolhasJson", "EfeitosJson", "DeusesIds", "RacasTexto", "OrigemNome"
)
$baseHeader = @(
    "ClasseId", "Classe", "PoderId", "Nome", "Descricao", "Repetivel", "NivelMinimo", "ReqAtributos",
    "ReqPoderes", "ReqPericias", "PreReqJson", "EscolhasJson", "EfeitosJson", "PreReqResumo"
)
$mapHeader = @("ClasseId", "Classe", "PoderId", "PoderClasseId")

$variantBase = [ordered]@{
    necromante = "arcanista"
    machado_de_pedra = "barbaro"
    magimarcialista = "bardo"
    duelista = "bucaneiro"
    seteiro = "cacador"
    vassalo = "cavaleiro"
    usurpador = "clerigo"
    ermitao = "druida"
    inovador = "guerreiro"
    alquimista = "inventor"
    ventanista = "ladino"
    atleta = "lutador"
    burgues = "nobre"
    santo = "paladino"
}

$excel = $null
$workbook = $null
$saved = $false
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.EnableEvents = $false
    $workbook = $excel.Workbooks.Open($workbookPath, 0, $false)
    try { $workbook.AutoSaveOn = $false } catch { }
    $resetControl = $excel.VBE.CommandBars.FindControl(1, 228)
    if ($null -ne $resetControl -and $resetControl.Enabled) {
        $resetControl.Execute()
    }

    $catalogSheet = $workbook.Worksheets.Item("Base_Poderes_Catalogo")
    $generalRows = Read-GeneralPowerRows -Worksheet $catalogSheet -ColumnCount $catalogHeader.Count

    if ($generalRows.Count -eq 0 -and $GeneralSourcePath) {
        $resolvedGeneralSource = (Resolve-Path $GeneralSourcePath).Path
        $sourceWorkbook = $excel.Workbooks.Open($resolvedGeneralSource, 0, $true)
        try {
            $sourceSheet = $sourceWorkbook.Worksheets.Item("Base_Poderes_Catalogo")
            $generalRows = Read-GeneralPowerRows -Worksheet $sourceSheet -ColumnCount $catalogHeader.Count
        }
        finally {
            $sourceWorkbook.Close($false)
        }
    }

    if ($generalRows.Count -eq 0) {
        throw "No general powers were found. Supply -GeneralSourcePath with a pre-import workbook backup."
    }

    $allCatalogRows = New-Object System.Collections.ArrayList
    foreach ($row in $data.classPowerRows) { [void]$allCatalogRows.Add(@($row)) }
    foreach ($row in $generalRows) { [void]$allCatalogRows.Add(@($row)) }

    Write-WorksheetRows -Worksheet $catalogSheet -Header $catalogHeader -Rows $allCatalogRows
    Write-WorksheetRows -Worksheet $workbook.Worksheets.Item("Base_Poderes_Classe") -Header $baseHeader -Rows $data.basePoderesClasseRows
    Write-WorksheetRows -Worksheet $workbook.Worksheets.Item("Base_Poderes_Classe_Map") -Header $mapHeader -Rows $data.mapRows

    $catalogSheet.Visible = 2
    $workbook.Worksheets.Item("Base_Poderes_Classe_Map").Visible = 2

    $slotSheet = $workbook.Worksheets.Item("Base_Slots_Poder_Classe")
    $slotLastRow = $slotSheet.Cells($slotSheet.Rows.Count, 1).End(-4162).Row
    for ($r = 2; $r -le $slotLastRow; $r++) {
        $originClassId = [string]$slotSheet.Cells($r, 1).Value2
        if ($variantBase.Contains($originClassId)) {
            $pool = [string]$slotSheet.Cells($r, 3).Value2
            $pool = Add-UniquePoolId -Pool $pool -Id $variantBase[$originClassId]
            $pool = Add-UniquePoolId -Pool $pool -Id $originClassId
            $slotSheet.Cells($r, 3).Value2 = $pool
        }
    }

    Replace-CodeModule -Workbook $workbook -ComponentName "modPoderesT20" -CodePath $modulePath -StripAttribute
    Replace-CodeModule -Workbook $workbook -ComponentName "UserFormMagia" -CodePath $formCodePath

    $form = $workbook.VBProject.VBComponents.Item("UserFormMagia")
    $form.Designer.Controls.Item("lstMagias").IntegralHeight = $false
    $form.Designer.Controls.Item("txtDetalhes").MultiLine = $true
    $form.Designer.Controls.Item("txtDetalhes").WordWrap = $true
    $form.Designer.Controls.Item("txtDetalhes").ScrollBars = 2
    $form.Designer.Controls.Item("txtDetalhes").Locked = $true

    foreach ($sheet in $workbook.Worksheets) {
        $sheet.UsedRange.Font.Strikethrough = $false
    }

    $excel.EnableEvents = $true
    $excel.Calculation = -4105
    $version = $excel.Run("modPoderesT20.CodexPoderesT20Version")
    $excel.Run("modEstadoExcelT20.CodexRestaurarAutomacaoT20") | Out-Null
    $excel.Run("modPoderesClasseT20.CodexAtualizarPoderesResumo") | Out-Null
    $excel.Run("modRegrasT20.AtualizarEfeitosAtivos") | Out-Null
    $excel.Run("modPrincipalRostoT20.AtualizarRostoPrincipal") | Out-Null

    $workbook.Save()
    $saved = $true
    [pscustomobject]@{
        Workbook = $workbook.FullName
        Backup = $backupPath
        Version = $version
        GeneralPowers = $generalRows.Count
        ClassPowers = $data.classPowerRows.Count
        ClassMappings = $data.mapRows.Count
        Saved = $workbook.Saved
        Events = $excel.EnableEvents
        Calculation = $excel.Calculation
    } | Format-List
}
finally {
    if ($null -ne $workbook) {
        $workbook.Close($saved)
    }
    if ($null -ne $excel) {
        $excel.Quit()
    }
}
