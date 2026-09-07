param(
    [string]$WorkbookFile = "Planilha T20 Macro.xlsm",
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$workbookPath = (Resolve-Path (Join-Path $root $WorkbookFile)).Path
$originDir = Join-Path $root "tools\vba-import-origin-inventory"
$rawDir = Join-Path $root "tools\vba-import-raw-powers"
$catalogFile = Join-Path $originDir "origin_inventory_import.json"

& node (Join-Path $originDir "build_origin_inventory.js")
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar origens e inventario." }
$catalog = Get-Content -Raw -Encoding UTF8 $catalogFile | ConvertFrom-Json
if ($catalog.origins.Count -lt 100) { throw "Catalogo de origens incompleto: $($catalog.origins.Count)." }
if ($catalog.items.Count -lt 480) { throw "Catalogo de itens incompleto: $($catalog.items.Count)." }

function Get-OrCreateWorksheet {
    param($Workbook, [string]$Name)
    try { return $Workbook.Worksheets.Item($Name) } catch {}
    $sheet = $Workbook.Worksheets.Add([Type]::Missing, $Workbook.Worksheets.Item($Workbook.Worksheets.Count))
    $sheet.Name = $Name
    return $sheet
}

function Write-WorksheetRows {
    param($Worksheet, [object[]]$Header, $Rows)
    $null = $Worksheet.Cells.Clear()
    $all = New-Object System.Collections.ArrayList
    [void]$all.Add($Header)
    foreach ($row in $Rows) { [void]$all.Add($row) }
    $columnCount = $Header.Count
    for ($offset = 0; $offset -lt $all.Count; $offset += 100) {
        $count = [Math]::Min(100, $all.Count - $offset)
        $matrix = New-Object 'object[,]' $count, $columnCount
        for ($r = 0; $r -lt $count; $r++) {
            $source = $all[$offset + $r]
            for ($c = 0; $c -lt $columnCount; $c++) {
                if ($c -lt $source.Count) { $matrix[$r, $c] = $source[$c] }
            }
        }
        $target = $Worksheet.Range($Worksheet.Cells($offset + 1, 1), $Worksheet.Cells($offset + $count, $columnCount))
        $target.Value2 = $matrix
    }
}

function Add-OrUpdateName {
    param($Workbook, [string]$Name, [string]$RefersToR1C1)
    $item = $null
    try { $item = $Workbook.Names.Item($Name) } catch {}
    if ($null -eq $item) { $item = $Workbook.Names.Add($Name, "=1") }
    $item.RefersToR1C1 = $RefersToR1C1
}

function Set-ValidationList {
    param($Range, [string]$Name, [string]$Title)
    if ([double]$Range.CountLarge -gt 1) {
        foreach ($cell in $Range.Cells) { Set-ValidationList $cell $Name $Title }
        return
    }
    Write-Host ("VALIDATION|{0}!{1}|{2}" -f $Range.Worksheet.Name, $Range.Address(0, 0), $Name)
    $ready = $false
    try { $ready = ([int]$Range.Validation.Type -eq 3 -and [string]$Range.Validation.Formula1 -eq "=$Name") } catch {}
    if ($ready) { return }
    try { $Range.Validation.Delete() } catch {}
    $Range.Validation.Add(3, 1, 1, "=$Name")
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.InCellDropdown = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = $Title
    $Range.Validation.ErrorMessage = "Escolha um valor da lista."
}

function Set-ValidationInline {
    param($Range, [string[]]$Values, $Excel, [string]$Title)
    if ([double]$Range.CountLarge -gt 1) {
        foreach ($cell in $Range.Cells) { Set-ValidationInline $cell $Values $Excel $Title }
        return
    }
    $separator = [string]$Excel.International(5)
    try { $Range.Validation.Delete() } catch {}
    $Range.Validation.Add(3, 1, 1, ($Values -join $separator))
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.InCellDropdown = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = $Title
    $Range.Validation.ErrorMessage = "Escolha um valor da lista."
}

function Set-ValidationWhole {
    param($Range, [int]$Minimum, [int]$Maximum, [string]$Title)
    if ([double]$Range.CountLarge -gt 1) {
        foreach ($cell in $Range.Cells) { Set-ValidationWhole $cell $Minimum $Maximum $Title }
        return
    }
    try { $Range.Validation.Delete() } catch {}
    $Range.Validation.Add(1, 1, 1, $Minimum, $Maximum)
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = $Title
    $Range.Validation.ErrorMessage = "Informe um numero entre $Minimum e $Maximum."
}

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
    if ($component.CodeModule.CountOfLines -gt 0) { $component.CodeModule.DeleteLines(1, $component.CodeModule.CountOfLines) }
    $component.CodeModule.AddFromString($code)
}

function Remove-ProgressaoReferences {
    param($Workbook)
    for ($index = $Workbook.Names.Count; $index -ge 1; $index--) {
        $name = $Workbook.Names.Item($index)
        if ([string]$name.RefersTo -match "(?i)(^|=|')Progressao(')?!") { $name.Delete() }
    }
    try { $Workbook.Worksheets.Item("Progressao").Delete() } catch {}
}

function Add-CommandButton {
    param($Sheet, [string]$Name, [string]$Caption, [string]$Address, [string]$Macro)
    try { $Sheet.Shapes.Item($Name).Delete() } catch {}
    $anchor = $Sheet.Range($Address)
    $shape = $Sheet.Shapes.AddShape(1, $anchor.Left, $anchor.Top, $anchor.Width, $anchor.Height)
    $shape.Name = $Name
    $shape.OnAction = $Macro
    $shape.Fill.ForeColor.RGB = 4210752
    $shape.Line.ForeColor.RGB = 0
    $shape.TextFrame2.TextRange.Text = $Caption
    $shape.TextFrame2.TextRange.Font.Name = "Arial"
    $shape.TextFrame2.TextRange.Font.Size = 10
    $shape.TextFrame2.TextRange.Font.Bold = $true
    $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = 16777215
    $shape.TextFrame2.VerticalAnchor = 3
    $shape.TextFrame2.TextRange.ParagraphFormat.Alignment = 2
}

function Wait-ForCalculation {
    param($Excel, [int]$TimeoutSeconds = 40)
    $Excel.CalculateFullRebuild()
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ([int]$Excel.CalculationState -ne 0 -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 100 }
    if ([int]$Excel.CalculationState -ne 0) { throw "O Excel nao concluiu o recalculo." }
}

if (-not $SkipBackup) {
    $backupDir = Join-Path $root "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $leaf = [IO.Path]::GetFileNameWithoutExtension($workbookPath)
    Copy-Item -LiteralPath $workbookPath -Destination (Join-Path $backupDir "$leaf-pre-layout-final-$stamp.xlsm") -Force
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$excel.ScreenUpdating = $false
$excel.AutomationSecurity = 1
$workbook = $null
$saved = $false

try {
    $workbook = $excel.Workbooks.Open($workbookPath)
    $sourceName = "Atualiza" + [char]231 + [char]227 + "o"
    $source = $workbook.Worksheets.Item($sourceName)
    $principal = $workbook.Worksheets.Item("Principal")
    Remove-ProgressaoReferences $workbook

    try { $principal.Range("A1:W200").UnMerge() } catch {}
    $principal.Range("A1:W200").Clear()
    foreach ($shape in @($principal.Shapes)) { $shape.Delete() }
    $source.Range("A1:W57").Copy($principal.Range("A1"))
    for ($c = 1; $c -le 23; $c++) { $principal.Columns.Item($c).ColumnWidth = $source.Columns.Item($c).ColumnWidth }
    for ($r = 1; $r -le 57; $r++) { $principal.Rows.Item($r).RowHeight = $source.Rows.Item($r).RowHeight }
    $principal.Range("A1:W57").Font.Strikethrough = $false

    $originRows = New-Object System.Collections.ArrayList
    foreach ($origin in $catalog.origins) {
        [void]$originRows.Add(@($origin.nome, $origin.pericias, $origin.poderes, $origin.poderUnico, $origin.poderUnicoDescricao, $origin.itens, $origin.tipo, $origin.regiao, $origin.beneficioFixo, $origin.periciasFixas))
    }
    $originSheet = Get-OrCreateWorksheet $workbook "Base_Origens"
    Write-WorksheetRows $originSheet @("Origem", "Pericias", "Poderes", "PoderUnico", "PoderUnicoDescricao", "Itens", "TipoOrigem", "Regiao", "BeneficioFixo", "PericiasFixas") $originRows

    $itemRows = New-Object System.Collections.ArrayList
    foreach ($item in $catalog.items) {
        [void]$itemRows.Add(@($item.exibicao, $item.itemId, $item.nome, $item.tipo, $item.categoriaId, [double]$item.espacos, $item.combateId, $item.empunhaduraId, $item.dano, $item.margemCritico, $item.multiplicadorCritico, $item.alcance, $item.tiposDano, $item.corpoACorpo, $item.arremesso, $item.disparo, $item.armaduraCategoria, $item.defesa, $item.penalidadeArmadura, $item.escudoCategoria, $item.bonusDefesaEscudo, $item.penalidadeEscudo, $item.atributo))
    }
    $itemSheet = Get-OrCreateWorksheet $workbook "Base_Inventario"
    Write-WorksheetRows $itemSheet @("Exibicao", "ItemId", "Nome", "Tipo", "CategoriaId", "Espacos", "CombateId", "EmpunhaduraId", "Dano", "MargemCritico", "MultiplicadorCritico", "Alcance", "TiposDano", "CorpoACorpo", "Arremesso", "Disparo", "ArmaduraCategoria", "Defesa", "PenalidadeArmadura", "EscudoCategoria", "BonusDefesaEscudo", "PenalidadeEscudo", "Atributo") $itemRows

    $control = Get-OrCreateWorksheet $workbook "Inventario_Controle"
    $control.Cells.Clear()
    $control.Range("A1:C1").Value2 = @("Armas", "Armaduras", "Escudos")
    $control.Visible = 2
    $originSheet.Visible = 2
    $itemSheet.Visible = 2

    Add-OrUpdateName $workbook "Lista_Origens_T20" "='Base_Origens'!R2C1:R$($catalog.origins.Count + 1)C1"
    Add-OrUpdateName $workbook "Lista_Itens_Mochila_T20" "='Base_Inventario'!R2C1:R$($catalog.items.Count + 1)C1"
    Add-OrUpdateName $workbook "Lista_Armas_Mochila_T20" "='Inventario_Controle'!R2C1:R200C1"
    Add-OrUpdateName $workbook "Lista_Armaduras_Mochila_T20" "='Inventario_Controle'!R2C2:R200C2"
    Add-OrUpdateName $workbook "Lista_Escudos_Mochila_T20" "='Inventario_Controle'!R2C3:R200C3"

    Replace-CodeModule $workbook "modLayoutT20" (Join-Path $scriptDir "modLayoutT20.bas") -Create
    Replace-CodeModule $workbook "modCriacaoT20" (Join-Path $scriptDir "modCriacaoT20.bas") -Create
    Replace-CodeModule $workbook "modInventarioT20" (Join-Path $originDir "modInventarioT20.bas") -Create
    Replace-CodeModule $workbook "modOrigensT20" (Join-Path $originDir "modOrigensT20.bas") -Create
    Replace-CodeModule $workbook "modEstadoExcelT20" (Join-Path $rawDir "modEstadoExcelT20.bas")
    Replace-CodeModule $workbook "modAutomacaoT20" (Join-Path $rawDir "modAutomacaoT20.bas")
    Replace-CodeModule $workbook "modRegrasT20" (Join-Path $rawDir "modRegrasT20.bas")
    Replace-CodeModule $workbook "modMagiasT20" (Join-Path $rawDir "modMagiasT20.bas")
    Replace-CodeModule $workbook "modPoderesT20" (Join-Path $rawDir "modPoderesT20.bas")
    Replace-CodeModule $workbook "modPrincipalRostoT20" (Join-Path $rawDir "modPrincipalRostoT20.extracted.bas")
    Replace-CodeModule $workbook "Planilha1" (Join-Path $rawDir "Planilha1.extracted.cls") -ClassBody

    $codes = @("FOR", "DES", "CON", "INT", "SAB", "CAR")
    for ($c = 1; $c -le 6; $c++) {
        $letter = [char](64 + $c)
        $principal.Cells(6, $c).Formula = "=$letter`$4+$letter`$5+IFERROR(SUMIFS(Efeitos_Ativos!`$H:`$H,Efeitos_Ativos!`$D:`$D,""bonus_atributo"",Efeitos_Ativos!`$F:`$F,""$($codes[$c-1])""),0)"
    }
    $principal.Range("B8").Formula = '=IFERROR(VLOOKUP(F2,Classes!A:F,2,FALSE)+$C$6+MAX($F$1-1,0)*(VLOOKUP(F2,Classes!A:F,3,FALSE)+$C$6)+IFERROR(SUMIFS(Efeitos_Ativos!$H:$H,Efeitos_Ativos!$D:$D,"bonus_pv"),0),0)'
    $principal.Range("D8").Formula = '=IFERROR(VLOOKUP(F2,Classes!A:F,4,FALSE)*$F$1+IFERROR(SUMIFS(Efeitos_Ativos!$H:$H,Efeitos_Ativos!$D:$D,"bonus_pm"),0),0)'
    if ($principal.Range("C8").HasFormula) { $principal.Range("C8").Value2 = 0 }
    if ($principal.Range("E8").HasFormula) { $principal.Range("E8").Value2 = 0 }

    $ultimaPericia = $principal.Cells($principal.Rows.Count, 9).End(-4162).Row
    $treino = $workbook.Worksheets.Item("Treino_Pericias")
    for ($r = 4; $r -le $ultimaPericia; $r++) {
        $linhaTreino = 2 + ($r - 4)
        $principal.Cells($r, 12).Formula = "=Treino_Pericias!M$linhaTreino"
        $treino.Cells($linhaTreino, 1).Formula = "=INT(Principal!`$F`$1/2)"
        $treino.Cells($linhaTreino, 2).Formula = "=IF(Principal!L$r,2,0)"
        $treino.Cells($linhaTreino, 13).Formula = "=OR(E${linhaTreino}:L${linhaTreino},N${linhaTreino})"
    }

    Set-ValidationList $principal.Range("D2") "Lista_Origens_T20" "Forja T20 - Origem"
    Set-ValidationList $principal.Range("A25:A30") "Lista_Itens_Mochila_T20" "Forja T20 - Mochila"
    Set-ValidationList $principal.Range("D25:D30") "Lista_Itens_Mochila_T20" "Forja T20 - Mochila"
    Set-ValidationWhole $principal.Range("B25:B30") 1 999 "Forja T20 - Quantidade"
    Set-ValidationWhole $principal.Range("E25:E30") 1 999 "Forja T20 - Quantidade"
    Set-ValidationList $principal.Range("A10:A14") "Lista_Armas_Mochila_T20" "Forja T20 - Ataque"
    Set-ValidationList $principal.Range("A21") "Lista_Armaduras_Mochila_T20" "Forja T20 - Armadura"
    Set-ValidationList $principal.Range("A22") "Lista_Escudos_Mochila_T20" "Forja T20 - Escudo"
    $left = "M" + [char]227 + "o esquerda"
    $right = "M" + [char]227 + "o direita"
    $both = "Duas m" + [char]227 + "os"
    Set-ValidationInline $principal.Range("G10:G14") @("Guardada", $left, $right, $both) $excel "Forja T20 - Empunhadura"
    Set-ValidationInline $principal.Range("D22") @("Guardado", $left, $right) $excel "Forja T20 - Escudo"
    if ([string]::IsNullOrWhiteSpace([string]$principal.Range("D21").Value2)) { $principal.Range("D21").Value2 = $false }
    if ([string]::IsNullOrWhiteSpace([string]$principal.Range("D22").Value2)) { $principal.Range("D22").Value2 = "Guardado" }

    $prefix = "'" + $workbook.Name + "'!"
    $excel.Run($prefix + "modAutomacaoT20.GarantirMinimoLinhasOficio") | Out-Null
    $excel.Run($prefix + "modRegrasT20.AtualizarEfeitosAtivos") | Out-Null
    $excel.Run($prefix + "modMagiasT20.AtualizarMagiasPersonagem", $true) | Out-Null
    $excel.Run($prefix + "modPoderesT20.AtualizarPoderesClasse", $true) | Out-Null
    $excel.Run($prefix + "modRegrasT20.AtualizarEfeitosAtivos") | Out-Null
    $excel.Run($prefix + "modPrincipalRostoT20.AtualizarRostoPrincipal") | Out-Null
    $excel.Run($prefix + "modInventarioT20.AtualizarInventario", $false) | Out-Null
    $excel.Run($prefix + "modOrigensT20.AtualizarComentarioOrigem") | Out-Null
    Wait-ForCalculation $excel

    $captionCriacao = "Iniciar cria" + [char]231 + [char]227 + "o"
    $captionPericias = "Rever per" + [char]237 + "cias"
    Add-CommandButton $principal "btnIniciarCriacao" $captionCriacao "I1:K2" ($prefix + "modCriacaoT20.IniciarCriacaoPersonagem")
    Add-CommandButton $principal "btnReverPericias" $captionPericias "L1:N2" ($prefix + "modCriacaoT20.ReverPericias")
    $source.Visible = 0
    $principal.Activate()
    $principal.Range("A1").Select()
    $excel.ActiveWindow.DisplayGridlines = $false
    $excel.ActiveWindow.Zoom = 70

    foreach ($sheet in $workbook.Worksheets) {
        try { $sheet.UsedRange.Font.Strikethrough = $false } catch {}
    }

    $errorCount = 0
    foreach ($sheet in $workbook.Worksheets) {
        try { $errorCount += $sheet.UsedRange.SpecialCells(-4123, 16).Count } catch {}
    }
    if ($errorCount -gt 0) { throw "Foram encontrados $errorCount erros de formula." }

    $workbook.Save()
    $saved = $true
    [pscustomobject]@{
        Workbook = $workbookPath
        PrincipalRange = $principal.UsedRange.Address()
        Origins = $catalog.origins.Count
        Items = $catalog.items.Count
        FormulaErrors = $errorCount
        ProgressaoRemoved = -not ($workbook.Worksheets | Where-Object { $_.Name -eq "Progressao" })
        LayoutVersion = $excel.Run($prefix + "modPrincipalRostoT20.CodexPrincipalRostoVersion")
        InventoryVersion = $excel.Run($prefix + "modInventarioT20.CodexInventarioT20Version")
    } | ConvertTo-Json -Compress | Write-Output
}
finally {
    if ($null -ne $workbook) { $workbook.Close($saved) }
    $excel.Quit()
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel)
}
