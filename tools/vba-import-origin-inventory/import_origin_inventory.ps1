param(
    [string]$WorkbookFile = "Planilha T20 Macro.xlsm"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$builder = Join-Path $scriptDir "build_origin_inventory.js"
$catalogFile = Join-Path $scriptDir "origin_inventory_import.json"
$inventoryModule = Join-Path $scriptDir "modInventarioT20.bas"
$originModule = Join-Path $scriptDir "modOrigensT20.bas"
$powerModule = Join-Path $root "tools\vba-import-raw-powers\modPoderesT20.bas"
$magicModule = Join-Path $root "tools\vba-import-raw-powers\modMagiasT20.bas"
$principalModule = Join-Path $root "tools\vba-import-raw-powers\modPrincipalRostoT20.extracted.bas"
$principalCode = Join-Path $root "tools\vba-import-raw-powers\Planilha1.extracted.cls"
$workbookPath = (Resolve-Path (Join-Path $root $WorkbookFile)).Path

& node $builder
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar os catalogos de origens e inventario." }
$catalog = Get-Content -Raw -Encoding UTF8 $catalogFile | ConvertFrom-Json
if ($catalog.origins.Count -ne 101) { throw "Quantidade inesperada de origens: $($catalog.origins.Count)." }
if ($catalog.items.Count -ne 489) { throw "Quantidade inesperada de itens: $($catalog.items.Count)." }

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
    $chunkSize = 100

    for ($offset = 0; $offset -lt $all.Count; $offset += $chunkSize) {
        $count = [Math]::Min($chunkSize, $all.Count - $offset)
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
    param($Workbook, [string]$Name, [string]$RefersTo)
    try {
        $existing = $Workbook.Names.Item($Name)
        $existing.RefersTo = $RefersTo
    } catch {
        [void]$Workbook.Names.Add($Name, $RefersTo)
    }
}

function Set-ValidationList {
    param($Range, [string]$Name, [string]$Title)
    Write-Host "Validation $Name on $($Range.Worksheet.Name)!$($Range.Address(0, 0))"
    $ready = $false
    try { $ready = ([int]$Range.Validation.Type -eq 3 -and [string]$Range.Validation.Formula1 -eq "=$Name") } catch {}
    if (-not $ready) {
        try { $Range.Validation.Delete() } catch {}
        $Range.Validation.Add(3, 1, 1, "=$Name")
    }
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.InCellDropdown = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = $Title
    $Range.Validation.ErrorMessage = "Escolha um valor da lista."
}

function Set-ValidationInline {
    param($Range, [string[]]$Values, $Excel, [string]$Title)
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
    try { $Range.Validation.Delete() } catch {}
    $Range.Validation.Add(1, 1, 1, $Minimum, $Maximum)
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = $Title
    $Range.Validation.ErrorMessage = "Informe um numero entre $Minimum e $Maximum."
}

function Replace-CodeModule {
    param(
        $Workbook,
        [string]$ComponentName,
        [string]$CodePath,
        [switch]$Create,
        [switch]$ClassBody
    )
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

function Set-GridBorders {
    param($Range, [int]$Color = 12632256)
    foreach ($index in 7, 8, 9, 10, 11, 12) {
        $border = $Range.Borders.Item($index)
        $border.LineStyle = 1
        $border.Weight = 2
        $border.Color = $Color
    }
}

function Remove-ProgressaoReferences {
    param($Workbook)
    for ($index = $Workbook.Names.Count; $index -ge 1; $index--) {
        $name = $Workbook.Names.Item($index)
        if ([string]$name.RefersTo -match "(?i)(^|=|')Progressao(')?!") { $name.Delete() }
    }
    try { $Workbook.Worksheets.Item("Progressao").Delete() } catch {}
}

function Wait-ForCalculation {
    param($Excel, [int]$TimeoutSeconds = 30)
    $Excel.CalculateFullRebuild()
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ([int]$Excel.CalculationState -ne 0 -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 100
    }
    if ([int]$Excel.CalculationState -ne 0) { throw "O Excel nao concluiu o recalculo dentro do prazo." }
}

$backupDir = Join-Path $root "backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$leaf = [IO.Path]::GetFileNameWithoutExtension($workbookPath)
$backupPath = Join-Path $backupDir "$leaf-pre-inventario-origens-$stamp.xlsm"
Copy-Item -LiteralPath $workbookPath -Destination $backupPath -Force

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
    Remove-ProgressaoReferences $workbook

    $originRows = New-Object System.Collections.ArrayList
    foreach ($origin in $catalog.origins) {
        [void]$originRows.Add(@(
            $origin.nome, $origin.pericias, $origin.poderes, $origin.poderUnico, $origin.poderUnicoDescricao,
            $origin.itens, $origin.tipo, $origin.regiao, $origin.beneficioFixo, $origin.periciasFixas
        ))
    }
    $originSheet = Get-OrCreateWorksheet $workbook "Base_Origens"
    Write-WorksheetRows $originSheet @("Origem", "Pericias", "Poderes", "PoderUnico", "PoderUnicoDescricao", "Itens", "TipoOrigem", "Regiao", "BeneficioFixo", "PericiasFixas") $originRows

    $itemRows = New-Object System.Collections.ArrayList
    foreach ($item in $catalog.items) {
        [void]$itemRows.Add(@(
            $item.exibicao, $item.itemId, $item.nome, $item.tipo, $item.categoriaId, [double]$item.espacos,
            $item.combateId, $item.empunhaduraId, $item.dano, $item.margemOriginal, $item.multiplicadorCritico,
            $item.alcance, $item.tiposDano, $item.corpoACorpo, $item.arremesso, $item.disparo,
            $item.armaduraCategoria, $item.defesa, $item.penalidadeArmadura, $item.escudoCategoria,
            $item.bonusDefesaEscudo, $item.penalidadeEscudo, $item.atributo
        ))
    }
    $itemSheet = Get-OrCreateWorksheet $workbook "Base_Inventario"
    Write-WorksheetRows $itemSheet @(
        "Exibicao", "ItemId", "Nome", "Tipo", "CategoriaId", "Espacos", "CombateId", "EmpunhaduraId", "Dano",
        "MargemOriginal", "MultiplicadorCritico", "Alcance", "TiposDano", "CorpoACorpo", "Arremesso", "Disparo",
        "ArmaduraCategoria", "Defesa", "PenalidadeArmadura", "EscudoCategoria", "BonusDefesaEscudo",
        "PenalidadeEscudo", "Atributo"
    ) $itemRows

    $controlSheet = Get-OrCreateWorksheet $workbook "Inventario_Controle"
    $null = $controlSheet.Cells.Clear()
    $controlHeaders = New-Object 'object[,]' 1, 6
    $controlHeaders[0, 0] = "Armas"
    $controlHeaders[0, 1] = "Armaduras"
    $controlHeaders[0, 2] = "Escudos"
    $controlHeaders[0, 3] = "BonusEstiloAtaque"
    $controlHeaders[0, 4] = "TesteBaseAtaque"
    $controlHeaders[0, 5] = "BonusGeralAtaque"
    $controlSheet.Range("A1:F1").Value2 = $controlHeaders

    Add-OrUpdateName $workbook "Lista_Origens_T20" "='Base_Origens'!`$A`$2:`$A`$$($catalog.origins.Count + 1)"
    Add-OrUpdateName $workbook "Lista_Itens_Mochila_T20" "='Base_Inventario'!`$A`$2:`$A`$$($catalog.items.Count + 1)"
    Add-OrUpdateName $workbook "Lista_Armas_Mochila_T20" "='Inventario_Controle'!`$A`$2:`$A`$30"
    Add-OrUpdateName $workbook "Lista_Armaduras_Mochila_T20" "='Inventario_Controle'!`$B`$2:`$B`$30"
    Add-OrUpdateName $workbook "Lista_Escudos_Mochila_T20" "='Inventario_Controle'!`$C`$2:`$C`$30"

    $principal = $workbook.Worksheets.Item("Principal")
    $oldArmor = [string]$principal.Range("O5").Value2
    $oldShield = [string]$principal.Range("O6").Value2
    if ($oldShield -eq "Escudo") { $oldShield = "Escudo Leve" }
    $originBenefit1 = [string]$principal.Range("K9").Value2
    $originBenefit2 = [string]$principal.Range("K10").Value2
    $originDescription1 = [string]$principal.Range("M9").Value2
    $originDescription2 = [string]$principal.Range("M10").Value2
    $magicAttribute = [string]$principal.Range("K18").Text
    $magicBonus = 0
    try { $magicBonus = [double]$workbook.Worksheets.Item("Magias_Controle").Range("G2").Value2 } catch {}

    try { $principal.Range("N10:U16").UnMerge() } catch {}
    try { $principal.Range("O7:U16").Validation.Delete() } catch {}
    $principal.Range("N10:U16").Clear()
    $principal.Range("O7:U9").UnMerge()

    $principal.Range("O7:U7").Merge()
    $principal.Range("O8:R8").Merge()
    for ($row = 9; $row -le 14; $row++) { $principal.Range("O${row}:R${row}").Merge() }
    $principal.Range("O15:P15").Merge()
    $principal.Range("Q15:R15").Merge()
    $principal.Range("S15:T15").Merge()
    $principal.Range("O16:P16").Merge()
    $principal.Range("Q16:R16").Merge()
    $principal.Range("S16:T16").Merge()

    $oAcute = [char]243
    $aTilde = [char]227
    $cCedilla = [char]231
    $principal.Range("O7").Value2 = "MOCHILA"
    $principal.Range("O8").Value2 = "Item"
    $principal.Range("S8").Value2 = "Qtd."
    $principal.Range("T8").Value2 = "Peso"
    $principal.Range("U8").Value2 = "Total"
    $principal.Range("O15").Value2 = "Tibares"
    $principal.Range("S15").Value2 = "Limite de carga"
    $principal.Range("O16").Value2 = "Carga usada"
    $principal.Range("S16").Value2 = "Carga m" + [char]225 + "xima"
    $principal.Range("Q15").Value2 = 0
    $principal.Range("Q16").Formula = "=SUM(U9:U14)"
    $principal.Range("U15").Formula = "=10+IF(A6>=0,2*A6,A6)"
    $principal.Range("U16").Formula = "=U15*2"

    $itemLastRow = $catalog.items.Count + 1
    for ($row = 9; $row -le 14; $row++) {
        $principal.Range("T$row").Formula = "=IF(O$row=`"`",`"`",IFERROR(VLOOKUP(O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,6,FALSE),0))"
        $principal.Range("U$row").Formula = "=IF(O$row=`"`",`"`",S$row*T$row)"
        Set-ValidationList $principal.Range("O$row") "Lista_Itens_Mochila_T20" "Forja T20 - Mochila"
    }
    Set-ValidationWhole $principal.Range("S9:S14") 1 999 "Forja T20 - Quantidade"

    if (-not [string]::IsNullOrWhiteSpace($oldArmor)) {
        $principal.Range("O9").Value2 = $oldArmor
        $principal.Range("S9").Value2 = 1
    }
    if (-not [string]::IsNullOrWhiteSpace($oldShield)) {
        $principal.Range("O10").Value2 = $oldShield
        $principal.Range("S10").Value2 = 1
    }

    $dark = 4210752
    $white = 16777215
    $light = 16448250
    $header = $principal.Range("O7:U8")
    $header.Interior.Color = $dark
    $header.Font.Color = $white
    $header.Font.Bold = $true
    $header.Font.Size = 8
    $header.HorizontalAlignment = -4108
    $header.VerticalAlignment = -4108
    Set-GridBorders $header 0

    $body = $principal.Range("O9:U14")
    $body.Interior.Color = $white
    $body.Font.Color = 0
    $body.Font.Size = 9
    $body.VerticalAlignment = -4108
    $body.WrapText = $true
    $principal.Range("O9:R14").HorizontalAlignment = -4131
    $principal.Range("S9:U14").HorizontalAlignment = -4108
    Set-GridBorders $body

    foreach ($address in "O15:P16", "S15:T16") {
        $range = $principal.Range($address)
        $range.Interior.Color = $dark
        $range.Font.Color = $white
        $range.Font.Bold = $true
        $range.Font.Size = 8
        $range.HorizontalAlignment = -4108
        $range.VerticalAlignment = -4108
        Set-GridBorders $range 0
    }
    foreach ($address in "Q15:R16", "U15:U16") {
        $summaryValues = $principal.Range($address)
        $summaryValues.Interior.Color = $light
        $summaryValues.Font.Color = 0
        $summaryValues.Font.Bold = $true
        $summaryValues.HorizontalAlignment = -4108
        $summaryValues.VerticalAlignment = -4108
    }
    Set-GridBorders $principal.Range("Q15:R16")
    Set-GridBorders $principal.Range("U15:U16")
    $principal.Range("Q15").NumberFormatLocal = '"T$" #.##0,00'
    $principal.Range("Q16").NumberFormatLocal = "Geral"
    $principal.Range("U15:U16").NumberFormatLocal = "Geral"
    $principal.Range("T9:U14").NumberFormatLocal = "Geral"

    try { $principal.Range("Q16:R16").FormatConditions.Delete() } catch {}
    $redRule = $principal.Range("Q16:R16").FormatConditions.Add(2, [Type]::Missing, "=`$Q`$16>`$U`$16")
    $redRule.Interior.Color = 13551615
    $redRule.StopIfTrue = $true
    $amberRule = $principal.Range("Q16:R16").FormatConditions.Add(2, [Type]::Missing, "=`$Q`$16>`$U`$15")
    $amberRule.Interior.Color = 10092543
    $amberRule.StopIfTrue = $true
    $greenRule = $principal.Range("Q16:R16").FormatConditions.Add(2, [Type]::Missing, "=`$Q`$16<=`$U`$15")
    $greenRule.Interior.Color = 13434828

    Set-ValidationList $principal.Range("F1") "Lista_Origens_T20" "Forja T20 - Origem"
    try { $principal.Range("J9:N10").UnMerge() } catch {}
    $principal.Range("K9:N10").ClearContents()
    $principal.Range("J9:J10").Merge()
    $principal.Range("K9:L9").Merge()
    $principal.Range("M9:N9").Merge()
    $principal.Range("K10:L10").Merge()
    $principal.Range("M10:N10").Merge()
    $principal.Range("J9").Value2 = "Benef" + [char]237 + "cios de origem"
    $principal.Range("K9").Value2 = $originBenefit1
    $principal.Range("K10").Value2 = $originBenefit2
    $principal.Range("M9").Value2 = $originDescription1
    $principal.Range("M10").Value2 = $originDescription2
    $principal.Range("J9:J10").Interior.Color = $dark
    $principal.Range("J9:J10").Font.Color = $white
    $principal.Range("J9:J10").Font.Bold = $true
    $principal.Range("J9:J10").HorizontalAlignment = -4108
    $principal.Range("J9:J10").VerticalAlignment = -4108
    $principal.Range("K9:L10").Interior.Color = $white
    $principal.Range("K9:L10").HorizontalAlignment = -4108
    $principal.Range("M9:N10").Interior.Color = $light
    $principal.Range("M9:N10").HorizontalAlignment = -4131
    $principal.Range("K9:N10").VerticalAlignment = -4108
    $principal.Range("J9:N10").WrapText = $true
    Set-GridBorders $principal.Range("J9:N10") 0

    Set-ValidationList $principal.Range("O2:O3") "Lista_Armas_Mochila_T20" "Forja T20 - Ataque"
    $leftHand = "M" + $aTilde + "o Esquerda"
    $rightHand = "M" + $aTilde + "o Direita"
    $twoHands = "Duas M" + $aTilde + "os"
    Set-ValidationInline $principal.Range("U2:U3") @("Guardada", $leftHand, $rightHand, $twoHands) $excel "Forja T20 - Empunhadura"
    for ($row = 2; $row -le 3; $row++) {
        $otherRow = if ($row -eq 2) { 3 } else { 2 }
        $baseAttack = "IFERROR(IF(VLOOKUP(O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,7,FALSE)=`"a_distancia`",`$C`$17,`$C`$10),0)"
        $generalAttack = "IFERROR(SUMIFS('Efeitos_Ativos'!`$H`$2:`$H`$500,'Efeitos_Ativos'!`$D`$2:`$D`$500,`"bonus_ataque`"),0)"
        $styleCondition = "AND(OR('Principal'!U$row=`"$leftHand`",'Principal'!U$row=`"$rightHand`"),OR('Principal'!U$otherRow=`"`",'Principal'!U$otherRow=`"Guardada`"),OR('Principal'!R6=`"`",'Principal'!R6=`"Guardado`"),IFERROR(VLOOKUP('Principal'!O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,14,FALSE),`"`")=`"SIM`",IFERROR(VLOOKUP('Principal'!O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,8,FALSE),`"`")=`"uma_mao`")"
        $controlSheet.Range("D$row").Formula = "=IF($styleCondition,IFERROR(SUMIFS('Efeitos_Ativos'!`$H`$2:`$H`$500,'Efeitos_Ativos'!`$D`$2:`$D`$500,`"bonus_ataque_condicional`",'Efeitos_Ativos'!`$C`$2:`$C`$500,`"Estilo de Uma Arma`"),0),0)"
        $controlSheet.Range("E$row").Formula = "=IF('Principal'!O$row=`"`",`"`",IFERROR(IF(VLOOKUP('Principal'!O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,7,FALSE)=`"a_distancia`",'Principal'!`$C`$17,'Principal'!`$C`$10),0))"
        $controlSheet.Range("F$row").Formula = "=$generalAttack"
        $principal.Range("P$row").Formula = "=IF(O$row=`"`",`"`",IF(ISNUMBER('Inventario_Controle'!E$row),'Inventario_Controle'!E$row+'Inventario_Controle'!F$row+'Inventario_Controle'!D$row,'Inventario_Controle'!E$row))"
        $principal.Range("Q$row").Formula = "=IF(O$row=`"`",`"`",IFERROR(VLOOKUP(O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,9,FALSE),`"`"))"
        $principal.Range("R$row").Formula = "=IF(O$row=`"`",`"`",modInventarioT20.TextoCritico(O$row))"
        $principal.Range("S$row").Formula = "=IF(O$row=`"`",`"`",IFERROR(VLOOKUP(O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,13,FALSE),`"`"))"
        $principal.Range("T$row").Formula = "=IF(O$row=`"`",`"`",IFERROR(VLOOKUP(O$row,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,12,FALSE),`"`"))"
    }

    Set-ValidationList $principal.Range("O5") "Lista_Armaduras_Mochila_T20" "Forja T20 - Armadura"
    Set-ValidationList $principal.Range("O6") "Lista_Escudos_Mochila_T20" "Forja T20 - Escudo"
    Set-ValidationInline $principal.Range("R5") @("VERDADEIRO", "FALSO") $excel "Forja T20 - Armadura"
    Set-ValidationInline $principal.Range("R6") @("Guardado", $leftHand, $rightHand) $excel "Forja T20 - Escudo"
    $principal.Range("P5").Formula = "=IF(O5=`"`",`"`",IFERROR(VLOOKUP(O5,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,18,FALSE),0))"
    $principal.Range("Q5").Formula = "=IF(O5=`"`",`"`",ABS(IFERROR(VLOOKUP(O5,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,19,FALSE),0)))"
    $principal.Range("P6").Formula = "=IF(O6=`"`",`"`",IFERROR(VLOOKUP(O6,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,21,FALSE),0))"
    $principal.Range("Q6").Formula = "=IF(O6=`"`",`"`",ABS(IFERROR(VLOOKUP(O6,'Base_Inventario'!`$A`$2:`$W`$$itemLastRow,22,FALSE),0)))"
    if (-not [string]::IsNullOrWhiteSpace($oldArmor)) { $principal.Range("O5").Value2 = $oldArmor }
    if (-not [string]::IsNullOrWhiteSpace($oldShield)) { $principal.Range("O6").Value2 = $oldShield }
    if (-not [string]::IsNullOrWhiteSpace($oldArmor)) { $principal.Range("R5").Value2 = "VERDADEIRO" } else { $principal.Range("R5").Value2 = "FALSO" }
    if (-not [string]::IsNullOrWhiteSpace($oldShield)) { $principal.Range("R6").Value2 = $leftHand } else { $principal.Range("R6").Value2 = "Guardado" }
    $principal.Range("K1").Formula = "=10+L2+IF(modInventarioT20.ArmaduraVestida(),P5,0)+IF(modInventarioT20.EscudoEmpunhado(),P6,0)+M1+modInventarioT20.BonusDefesaEmpunhadura()"
    try { $principal.Range("K7:M7").UnMerge() } catch {}
    $principal.Range("K7:M7").ClearContents()
    $principal.Range("M7").Formula = "=IF(modInventarioT20.ArmaduraVestida(),Q5,0)+IF(modInventarioT20.EscudoEmpunhado(),Q6,0)"
    $principal.Range("M7").NumberFormat = ";;;"

    $principal.Range("N18").Value2 = "B" + $oAcute + "nus CD"
    $principal.Range("O18").Value2 = $magicBonus
    $principal.Range("K18").Value2 = $magicAttribute
    Set-ValidationWhole $principal.Range("O18") -99 99 "Forja T20 - Bonus de CD"
    $principal.Range("N18").Interior.Color = $light
    $principal.Range("N18").Font.Bold = $true
    $principal.Range("O18").Interior.Color = $light
    $principal.Range("N18:O18").VerticalAlignment = -4108
    $principal.Range("N18").HorizontalAlignment = -4131
    $principal.Range("O18").HorizontalAlignment = -4108

    $originSheet.Visible = 2
    $itemSheet.Visible = 2
    $controlSheet.Visible = 2

    Replace-CodeModule $workbook "modPoderesT20" $powerModule
    Replace-CodeModule $workbook "modMagiasT20" $magicModule
    Replace-CodeModule $workbook "modPrincipalRostoT20" $principalModule
    Replace-CodeModule $workbook "modOrigensT20" $originModule -Create
    Replace-CodeModule $workbook "modInventarioT20" $inventoryModule -Create
    Replace-CodeModule $workbook $principal.CodeName $principalCode -ClassBody

    $compileControl = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compileControl -and $compileControl.Enabled) { $compileControl.Execute() }

    foreach ($sheet in $workbook.Worksheets) { $sheet.UsedRange.Font.Strikethrough = $false }
    $excel.Calculation = -4105
    $excel.EnableEvents = $true
    $excel.ScreenUpdating = $true
    $prefix = "'$($workbook.Name)'!"
    $excel.Run($prefix + "modEstadoExcelT20.CodexRestaurarAutomacaoT20") | Out-Null
    $excel.Run($prefix + "modPoderesClasseT20.CodexAtualizarPoderesResumo") | Out-Null
    $excel.Run($prefix + "modRegrasT20.AtualizarEfeitosAtivos") | Out-Null
    $excel.Run($prefix + "modPrincipalRostoT20.AtualizarRostoPrincipal") | Out-Null
    $excel.Run($prefix + "modInventarioT20.AtualizarInventario", $false) | Out-Null
    $excel.Run($prefix + "modMagiasT20.AtualizarMagiasPersonagem", $true) | Out-Null
    $excel.Run($prefix + "modOrigensT20.AtualizarComentarioOrigem") | Out-Null
    Wait-ForCalculation $excel

    $principal.Activate()
    $principal.Range("A1").Select()
    $excel.ActiveWindow.Zoom = 80
    $workbook.Save()
    $saved = $true

    [pscustomobject]@{
        Workbook = $workbook.FullName
        Backup = $backupPath
        Origins = $catalog.origins.Count
        Items = $catalog.items.Count
        ProgressaoRemoved = -not ($workbook.Worksheets | Where-Object { $_.Name -eq "Progressao" })
        InventoryVersion = $excel.Run($prefix + "modInventarioT20.CodexInventarioT20Version")
        OriginVersion = $excel.Run($prefix + "modOrigensT20.CodexOrigensT20Version")
        PrincipalVersion = $excel.Run($prefix + "modPrincipalRostoT20.CodexPrincipalRostoVersion")
        Saved = $workbook.Saved
    } | Format-List
} finally {
    if ($null -ne $workbook) { $workbook.Close($saved) }
    if ($null -ne $excel) { $excel.Quit() }
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    if ($null -ne $excel) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
