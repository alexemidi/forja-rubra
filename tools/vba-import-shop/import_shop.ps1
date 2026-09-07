param(
    [string]$WorkbookFile = "Planilha T20 Macro.xlsm"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..\..")
$builder = Join-Path $scriptDir "build_shop_catalog.js"
$catalogFile = Join-Path $scriptDir "shop_import.json"
$moduleFile = Join-Path $scriptDir "modLojaT20.bas"
$sheetCodeFile = Join-Path $scriptDir "PlanilhaLoja.code.cls"
$workbookPath = (Resolve-Path (Join-Path $root $WorkbookFile)).Path

& node $builder
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o catalogo da loja." }
$catalog = Get-Content -Raw -Encoding UTF8 $catalogFile | ConvertFrom-Json
if ($catalog.items.Count -ne 489) { throw "Quantidade inesperada de itens: $($catalog.items.Count)." }
if ($catalog.improvements.Count -ne 48) { throw "Quantidade inesperada de melhorias: $($catalog.improvements.Count)." }

function Get-OrCreateWorksheet {
    param($Workbook, [string]$Name)
    try { return $Workbook.Worksheets.Item($Name) } catch {}
    $sheet = $Workbook.Worksheets.Add()
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
    Write-Host "Writing $($Worksheet.Name): $($all.Count) rows x $columnCount columns"

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
        try {
            $target.Value2 = $matrix
        } catch {
            for ($r = 0; $r -lt $count; $r++) {
                for ($c = 0; $c -lt $columnCount; $c++) {
                    $Worksheet.Cells($offset + $r + 1, $c + 1).Value2 = $matrix[$r, $c]
                }
            }
        }
    }
}

function Replace-CodeModule {
    param($Workbook, [string]$ComponentName, [string]$CodePath, [switch]$StripAttribute)
    $component = $null
    try { $component = $Workbook.VBProject.VBComponents.Item($ComponentName) } catch {}
    if ($null -eq $component) {
        $component = $Workbook.VBProject.VBComponents.Add(1)
        $component.Name = $ComponentName
    }
    $code = Get-Content -Raw -Encoding UTF8 $CodePath
    if ($StripAttribute) { $code = [regex]::Replace($code, '(?m)^Attribute VB_Name\s*=.*\r?\n?', '') }
    if ($component.CodeModule.CountOfLines -gt 0) { $component.CodeModule.DeleteLines(1, $component.CodeModule.CountOfLines) }
    $component.CodeModule.AddFromString($code)
}

function Column-Letter {
    param([int]$Column)
    $result = ""
    while ($Column -gt 0) {
        $Column--
        $result = [char](65 + ($Column % 26)) + $result
        $Column = [Math]::Floor($Column / 26)
    }
    return $result
}

function Set-ValidationList {
    param($Range, [string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return }
    try { $Range.Validation.Delete() } catch {}
    $Range.Validation.Add(3, 1, 1, "=$Name")
    $Range.Validation.IgnoreBlank = $true
    $Range.Validation.InCellDropdown = $true
    $Range.Validation.ShowError = $true
    $Range.Validation.ErrorTitle = "Forja T20 - Loja"
    $Range.Validation.ErrorMessage = "Escolha um valor da lista."
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

function New-RowArray {
    param([int]$Length)
    return [object[]](New-Object object[] $Length)
}

$backupDir = Join-Path $root "backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "Planilha T20 Macro-pre-loja-$stamp.xlsm"
Copy-Item -LiteralPath $workbookPath -Destination $backupPath -Force

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$excel.AutomationSecurity = 1
$workbook = $null

try {
    $workbook = $excel.Workbooks.Open($workbookPath)

    $itemHeaders = @(
        "ItemId", "Nome", "Tipo", "CategoriaId", "SecaoId", "LivroOrigemId", "LivrosOrigemIds", "Preco", "Moeda", "Espacos",
        "Habilidade", "Variavel", "Descricao", "EfeitosJson", "CombateId", "EmpunhaduraId", "Dano", "MargemOriginal", "MargemCritico", "MultiplicadorCritico",
        "Alcance", "TiposDanoIds", "TiposDano", "PropriedadesIds", "Propriedades", "GruposArmaIds", "CorpoACorpo", "Arremesso", "Disparo", "Leve",
        "UmaMao", "DuasMaos", "Atributo", "ArmaAna", "ArmaduraCategoria", "Defesa", "PenalidadeArmadura", "UsaDestrezaDefesa", "EscudoCategoria", "BonusDefesaEscudo",
        "PenalidadeEscudo", "MelhoriaClasse", "MaterialAplicacao", "ModificaPericia"
    )
    $itemRows = New-Object System.Collections.ArrayList
    foreach ($item in $catalog.items) {
        [void]$itemRows.Add(@(
            $item.id, $item.nome, $item.tipo, $item.categoriaId, $item.secaoId, $item.livroOrigemId, $item.livrosOrigemIds, [double]$item.preco, $item.moeda, [double]$item.espacos,
            $item.habilidade, $item.variavel, $item.descricao, $item.efeitosJson, $item.combateId, $item.empunhaduraId, $item.dano, $item.margemOriginal, $item.margemCritico, $item.multiplicadorCritico,
            $item.alcance, $item.tiposDanoIds, $item.tiposDano, $item.propriedadesIds, $item.propriedades, $item.gruposArmaIds, $item.corpoACorpo, $item.arremesso, $item.disparo, $item.leve,
            $item.umaMao, $item.duasMaos, $item.atributo, $item.armaAna, $item.armaduraCategoria, $item.defesa, $item.penalidadeArmadura, $item.usaDestrezaDefesa, $item.escudoCategoria, $item.bonusDefesaEscudo,
            $item.penalidadeEscudo, $item.melhoriaClasse, $item.materialAplicacao, $item.modificaPericia
        ))
    }
    $itemSheet = Get-OrCreateWorksheet $workbook "Base_Itens"
    Write-WorksheetRows $itemSheet $itemHeaders $itemRows

    $improvementHeaders = @("MelhoriaId", "Nome", "CategoriasIds", "LivrosOrigemIds", "Resumo", "PreRequisitosJson", "RestricoesJson", "EscolhasJson", "EfeitosJson", "GrupoAplicacaoIds")
    $improvementRows = New-Object System.Collections.ArrayList
    foreach ($improvement in $catalog.improvements) {
        [void]$improvementRows.Add(@($improvement.id, $improvement.nome, $improvement.categoriasIds, $improvement.livrosOrigemIds, $improvement.resumo, $improvement.preRequisitosJson, $improvement.restricoesJson, $improvement.escolhasJson, $improvement.efeitosJson, $improvement.grupoAplicacaoIds))
    }
    $improvementSheet = Get-OrCreateWorksheet $workbook "Base_Melhorias"
    Write-WorksheetRows $improvementSheet $improvementHeaders $improvementRows

    $materialHeaders = @("MaterialId", "Nome", "Exibicao", "AplicacaoId", "Custo", "CustoConhecido", "Resumo", "RestricoesJson", "EfeitosJson", "LivrosOrigemIds")
    $materialRows = New-Object System.Collections.ArrayList
    foreach ($material in $catalog.materials) {
        [void]$materialRows.Add(@($material.id, $material.nome, $material.exibicao, $material.aplicacaoId, [double]$material.custo, $material.custoConhecido, $material.resumo, $material.restricoesJson, $material.efeitosJson, $material.livrosOrigemIds))
    }
    $materialSheet = Get-OrCreateWorksheet $workbook "Base_Materiais"
    Write-WorksheetRows $materialSheet $materialHeaders $materialRows

    $listDefinitions = @(
        @{ Key = "arma"; Type = "improvement"; Name = "ListaLojaMelhoriasArma" },
        @{ Key = "municao"; Type = "improvement"; Name = "ListaLojaMelhoriasMunicao" },
        @{ Key = "armadura"; Type = "improvement"; Name = "ListaLojaMelhoriasArmadura" },
        @{ Key = "escudo"; Type = "improvement"; Name = "ListaLojaMelhoriasEscudo" },
        @{ Key = "esoterico"; Type = "improvement"; Name = "ListaLojaMelhoriasEsoterico" },
        @{ Key = "ferramenta"; Type = "improvement"; Name = "ListaLojaMelhoriasFerramenta" },
        @{ Key = "vestuario"; Type = "improvement"; Name = "ListaLojaMelhoriasVestuario" },
        @{ Key = "arma"; Type = "material"; Name = "ListaLojaMateriaisArma" },
        @{ Key = "armadura_leve"; Type = "material"; Name = "ListaLojaMateriaisArmaduraLeve" },
        @{ Key = "armadura_pesada"; Type = "material"; Name = "ListaLojaMateriaisArmaduraPesada" },
        @{ Key = "escudo"; Type = "material"; Name = "ListaLojaMateriaisEscudo" },
        @{ Key = "esoterico"; Type = "material"; Name = "ListaLojaMateriaisEsoterico" }
    )
    $listHeaders = [object[]]($listDefinitions | ForEach-Object { $_.Name })
    $maxListRows = 0
    foreach ($definition in $listDefinitions) {
        $values = if ($definition.Type -eq "improvement") { $catalog.improvementLists.($definition.Key) } else { $catalog.materialLists.($definition.Key) }
        if ($values.Count -gt $maxListRows) { $maxListRows = $values.Count }
    }
    $listRows = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $maxListRows; $i++) {
        $row = New-RowArray $listDefinitions.Count
        for ($c = 0; $c -lt $listDefinitions.Count; $c++) {
            $definition = $listDefinitions[$c]
            $values = if ($definition.Type -eq "improvement") { $catalog.improvementLists.($definition.Key) } else { $catalog.materialLists.($definition.Key) }
            if ($i -lt $values.Count) { $row[$c] = $values[$i] }
        }
        [void]$listRows.Add($row)
    }
    $listSheet = Get-OrCreateWorksheet $workbook "Base_Loja_Listas"
    Write-WorksheetRows $listSheet $listHeaders $listRows
    for ($c = 0; $c -lt $listDefinitions.Count; $c++) {
        $definition = $listDefinitions[$c]
        $values = if ($definition.Type -eq "improvement") { $catalog.improvementLists.($definition.Key) } else { $catalog.materialLists.($definition.Key) }
        if ($values.Count -gt 0) {
            $letter = Column-Letter ($c + 1)
            Add-OrUpdateName $workbook $definition.Name "='Base_Loja_Listas'!`$$letter`$2:`$$letter`$$($values.Count + 1)"
        }
    }

    $itemsById = @{}
    foreach ($item in $catalog.items) { $itemsById[$item.id] = $item }
    $shopRows = New-Object System.Collections.ArrayList
    $sectionRanges = New-Object System.Collections.ArrayList
    $currentRow = 1

    foreach ($section in $catalog.sections) {
        $layout = $catalog.layouts.($section.layout)
        $header = New-RowArray 42
        $header[0] = $section.title
        for ($c = 1; $c -lt $layout.headers.Count; $c++) { $header[$c] = $layout.headers[$c] }
        [void]$shopRows.Add($header)
        $headerRow = $currentRow
        $currentRow++
        $startRow = $currentRow

        foreach ($itemId in $section.itemIds) {
            $item = $itemsById[$itemId]
            $row = New-RowArray 42
            $row[0] = $item.nome
            $row[1] = [double]$item.preco

            switch ($section.layout) {
                "arma" {
                    $row[2] = $item.dano
                    $row[3] = $item.margemCritico
                    $row[4] = $item.multiplicadorCritico
                    $row[5] = $item.alcance
                    $row[6] = $item.tiposDano
                    $row[7] = [double]$item.espacos
                    $row[8] = ($item.corpoACorpo -eq "SIM")
                    $row[9] = ($item.arremesso -eq "SIM")
                    $row[10] = ($item.disparo -eq "SIM")
                    $row[11] = ($item.leve -eq "SIM")
                    $row[12] = ($item.umaMao -eq "SIM")
                    $row[13] = ($item.duasMaos -eq "SIM")
                    $row[14] = $item.atributo
                    $row[15] = $item.propriedades
                    $row[16] = $item.habilidade
                    $row[17] = $item.variavel
                    $row[24] = ($item.armaAna -eq "SIM")
                    $row[27] = $item.descricao
                }
                "municao" {
                    $row[2] = [double]$item.espacos
                    $row[3] = $item.habilidade
                    $row[4] = $item.variavel
                    $row[13] = $item.descricao
                }
                "armadura" {
                    $row[2] = $item.defesa
                    $row[3] = $item.penalidadeArmadura
                    $row[4] = [double]$item.espacos
                    $row[5] = ($item.armaduraCategoria -eq "leve")
                    $row[6] = ($item.armaduraCategoria -eq "pesada")
                    $row[7] = $item.habilidade
                    $row[8] = $item.variavel
                    $row[18] = $item.descricao
                }
                "escudo" {
                    $row[2] = $item.bonusDefesaEscudo
                    $row[3] = $item.penalidadeEscudo
                    $row[4] = [double]$item.espacos
                    $row[5] = ($item.escudoCategoria -eq "leve")
                    $row[6] = ($item.escudoCategoria -eq "pesado")
                    $row[7] = $item.habilidade
                    $row[8] = $item.variavel
                    $row[18] = $item.descricao
                }
                default {
                    $row[2] = [double]$item.espacos
                    $row[3] = $item.habilidade
                    $row[4] = $item.variavel
                    $row[13] = $item.descricao
                }
            }

            $row[28] = $item.id
            $row[29] = $item.tipo
            $row[30] = $item.categoriaId
            $row[31] = $item.melhoriaClasse
            $row[32] = [double]$item.preco
            $row[33] = [int]$layout.improvementStart
            $row[34] = [int]$layout.improvementEnd
            $row[35] = [int]$layout.materialColumn
            $row[36] = [int]$layout.priceColumn
            $row[37] = $item.tiposDanoIds
            $row[38] = $item.armaduraCategoria
            $row[39] = $item.materialAplicacao
            $row[40] = $item.modificaPericia
            $row[41] = "OK"
            [void]$shopRows.Add($row)
            $currentRow++
        }

        $endRow = $currentRow - 1
        [void]$sectionRanges.Add([pscustomobject]@{
            HeaderRow = $headerRow
            StartRow = $startRow
            EndRow = $endRow
            Layout = $section.layout
            VisibleColumns = $layout.headers.Count
            ImprovementStart = [int]$layout.improvementStart
            ImprovementEnd = [int]$layout.improvementEnd
            MaterialColumn = [int]$layout.materialColumn
            PriceColumn = [int]$layout.priceColumn
            CdColumn = [int]$layout.cdColumn
            ImprovementClass = if ($section.itemIds.Count -gt 0) { $itemsById[$section.itemIds[0]].melhoriaClasse } else { "" }
            MaterialApplication = if ($section.itemIds.Count -gt 0) { $itemsById[$section.itemIds[0]].materialAplicacao } else { "" }
        })
        [void]$shopRows.Add((New-RowArray 42))
        $currentRow++
    }
    if ($shopRows.Count -gt 0) { $shopRows.RemoveAt($shopRows.Count - 1); $currentRow-- }

    $shop = Get-OrCreateWorksheet $workbook "Loja"
    try { $shop.Cells.Validation.Delete() } catch {}
    try { $shop.Cells.ClearComments() } catch {}
    $null = $shop.Cells.Clear()
    Write-Host "Writing Loja: $($shopRows.Count) rows x 42 columns"
    $chunkSize = 80
    for ($offset = 0; $offset -lt $shopRows.Count; $offset += $chunkSize) {
        $count = [Math]::Min($chunkSize, $shopRows.Count - $offset)
        $matrix = New-Object 'object[,]' $count, 42
        for ($r = 0; $r -lt $count; $r++) {
            for ($c = 0; $c -lt 42; $c++) { $matrix[$r, $c] = $shopRows[$offset + $r][$c] }
        }
        $range = $shop.Range($shop.Cells($offset + 1, 1), $shop.Cells($offset + $count, 42))
        try { $range.Value2 = $matrix } catch {
            for ($r = 0; $r -lt $count; $r++) { for ($c = 0; $c -lt 42; $c++) { $shop.Cells($offset + $r + 1, $c + 1).Value2 = $matrix[$r, $c] } }
        }
    }

    $improvementNameByClass = @{
        arma = "ListaLojaMelhoriasArma"; municao = "ListaLojaMelhoriasMunicao"; armadura = "ListaLojaMelhoriasArmadura";
        escudo = "ListaLojaMelhoriasEscudo"; esoterico = "ListaLojaMelhoriasEsoterico"; ferramenta = "ListaLojaMelhoriasFerramenta"; vestuario = "ListaLojaMelhoriasVestuario"
    }
    $materialNameByApplication = @{
        arma = "ListaLojaMateriaisArma"; armadura_leve = "ListaLojaMateriaisArmaduraLeve"; armadura_pesada = "ListaLojaMateriaisArmaduraPesada";
        escudo = "ListaLojaMateriaisEscudo"; esoterico = "ListaLojaMateriaisEsoterico"
    }

    foreach ($section in $sectionRanges) {
        if ($section.EndRow -lt $section.StartRow) { continue }
        $startLetter = Column-Letter $section.ImprovementStart
        $endLetter = Column-Letter $section.ImprovementEnd
        $materialLetter = Column-Letter $section.MaterialColumn
        $priceLetter = Column-Letter $section.PriceColumn
        $cdLetter = Column-Letter $section.CdColumn
        for ($r = $section.StartRow; $r -le $section.EndRow; $r++) {
            $countExpression = "COUNTA($startLetter$r`:$endLetter$r)"
            $surcharge = "CHOOSE($countExpression+1,0,300,3000,9000,18000)*IF(`$AD$r=`"municao`",0.5,1)"
            $knownMaterial = "COUNTIFS('Base_Materiais'!`$C:`$C,$materialLetter$r,'Base_Materiais'!`$D:`$D,`$AN$r,'Base_Materiais'!`$F:`$F,`"SIM`")"
            $materialCost = "IFERROR(SUMIFS('Base_Materiais'!`$E:`$E,'Base_Materiais'!`$C:`$C,$materialLetter$r,'Base_Materiais'!`$D:`$D,`$AN$r),0)"
            $shop.Cells($r, $section.PriceColumn).Formula = "=IF(AND($materialLetter$r<>`"`",$knownMaterial=0),`"T$ `"&TEXT(`$AG$r+$surcharge,`"#.##0,00`")&`" + material`",`$AG$r+$surcharge+$materialCost)"
            $shop.Cells($r, $section.CdColumn).Formula = "=$countExpression*5"
        }

        if (-not [string]::IsNullOrWhiteSpace($section.ImprovementClass)) {
            $name = $improvementNameByClass[$section.ImprovementClass]
            if ($name) { Set-ValidationList $shop.Range($shop.Cells($section.StartRow, $section.ImprovementStart), $shop.Cells($section.EndRow, $section.ImprovementEnd)) $name }
        }
        if (-not [string]::IsNullOrWhiteSpace($section.MaterialApplication)) {
            $name = $materialNameByApplication[$section.MaterialApplication]
            if ($name) { Set-ValidationList $shop.Range($shop.Cells($section.StartRow, $section.MaterialColumn), $shop.Cells($section.EndRow, $section.MaterialColumn)) $name }
        }
    }

    $shop.Cells.Font.Name = "Aptos"
    $shop.Cells.Font.Size = 9
    $shop.Cells.VerticalAlignment = -4160
    $shop.Range("A:AB").WrapText = $true
    $shop.Columns("A").ColumnWidth = 24
    $shop.Columns("B").ColumnWidth = 12
    $shop.Columns("C").ColumnWidth = 12
    $shop.Columns("D:E").ColumnWidth = 16
    $shop.Columns("F:G").ColumnWidth = 14
    $shop.Columns("H").ColumnWidth = 8
    $shop.Columns("I:O").ColumnWidth = 13
    $shop.Columns("P").ColumnWidth = 20
    $shop.Columns("Q:R").ColumnWidth = 38
    $shop.Columns("S:V").ColumnWidth = 18
    $shop.Columns("W:X").ColumnWidth = 22
    $shop.Columns("Y").ColumnWidth = 11
    $shop.Columns("Z").ColumnWidth = 16
    $shop.Columns("AA").ColumnWidth = 13
    $shop.Columns("AB").ColumnWidth = 52
    $shop.Columns("AC:AP").Hidden = $true
    $shop.Range("B:B").NumberFormatLocal = '"T$" #.##0,00'
    $shop.Range("E:E").NumberFormat = '0"x"'
    $shop.Range("AA:AA").NumberFormat = '"+"0'
    $shop.Range("H:O").HorizontalAlignment = -4108
    $shop.Range("Y:Y").HorizontalAlignment = -4108

    foreach ($section in $sectionRanges) {
        $headerRange = $shop.Range($shop.Cells($section.HeaderRow, 1), $shop.Cells($section.HeaderRow, $section.VisibleColumns))
        $dataRange = $shop.Range($shop.Cells($section.StartRow, 1), $shop.Cells($section.EndRow, $section.VisibleColumns))
        $shop.Range($shop.Cells($section.StartRow, $section.PriceColumn), $shop.Cells($section.EndRow, $section.PriceColumn)).NumberFormatLocal = '"T$" #.##0,00'
        $color = switch ($section.Layout) {
            "arma" { 3618672 }
            "municao" { 2519145 }
            "armadura" { 5133369 }
            "escudo" { 5133369 }
            default { 4342338 }
        }
        $headerRange.Interior.Color = $color
        $headerRange.Font.Color = 16777215
        $headerRange.Font.Bold = $true
        $headerRange.HorizontalAlignment = -4108
        $shop.Rows($section.HeaderRow).RowHeight = 34
        $dataRange.Borders.LineStyle = 1
        $dataRange.Borders.Color = 14277081
        $dataRange.Interior.Color = 16777215
        $shop.Range($shop.Cells($section.StartRow, $section.ImprovementStart), $shop.Cells($section.EndRow, $section.ImprovementEnd)).Interior.Color = 13434879
        $shop.Range($shop.Cells($section.StartRow, $section.MaterialColumn), $shop.Cells($section.EndRow, $section.MaterialColumn)).Interior.Color = 13434879
        $shop.Range($shop.Cells($section.StartRow, $section.PriceColumn), $shop.Cells($section.EndRow, $section.PriceColumn)).Interior.Color = 14348258
        $shop.Range($shop.Cells($section.StartRow, $section.CdColumn), $shop.Cells($section.EndRow, $section.CdColumn)).Interior.Color = 15132390
        for ($r = $section.StartRow; $r -le $section.EndRow; $r++) {
            $shop.Rows($r).RowHeight = if ($section.Layout -eq "arma" -or $section.Layout -eq "armadura" -or $section.Layout -eq "escudo") { 54 } else { 42 }
            if (($r - $section.StartRow) % 2 -eq 1) {
                $shop.Range($shop.Cells($r, 1), $shop.Cells($r, [Math]::Min(18, $section.VisibleColumns))).Interior.Color = 16119285
            }
        }
    }
    $shop.UsedRange.Font.Strikethrough = $false
    $shop.Tab.Color = 3618672
    $shop.Visible = -1

    $itemSheet.Visible = 2
    $improvementSheet.Visible = 2
    $materialSheet.Visible = 2
    $listSheet.Visible = 2

    Replace-CodeModule $workbook "modLojaT20" $moduleFile -StripAttribute
    $shopCodeName = $shop.CodeName
    Replace-CodeModule $workbook $shopCodeName $sheetCodeFile

    $compileControl = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compileControl -and $compileControl.Enabled) { $compileControl.Execute() }

    $shop.Activate()
    $excel.ActiveWindow.SplitColumn = 1
    $excel.ActiveWindow.SplitRow = 1
    $excel.ActiveWindow.FreezePanes = $true
    $excel.ActiveWindow.Zoom = 75
    $excel.Run("'$($workbook.Name)'!modLojaT20.AtualizarStatusTodasLinhasLoja")
    $shop.Range("A1").Select()
    $workbook.Save()

    [pscustomobject]@{
        Workbook = $workbook.FullName
        Backup = $backupPath
        Version = $excel.Run("'$($workbook.Name)'!modLojaT20.CodexLojaT20Version")
        Items = $catalog.items.Count
        Improvements = $catalog.improvements.Count
        MaterialRows = $catalog.materials.Count
        Sections = $catalog.sections.Count
        ShopRows = $shopRows.Count
        Saved = $workbook.Saved
    }
} finally {
    if ($null -ne $workbook) { $workbook.Close($false) }
    $excel.Quit()
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
