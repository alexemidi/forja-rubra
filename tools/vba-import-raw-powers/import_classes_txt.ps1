param(
    [string]$WorkbookFile = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$workbookPath = if ($WorkbookFile) { (Resolve-Path -LiteralPath $WorkbookFile).Path } else { Join-Path $projectRoot "Planilha T20 Macro.xlsm" }
$builderPath = Join-Path $PSScriptRoot "build_classes_txt_catalog.js"
$dataPath = Join-Path $PSScriptRoot "classes_txt_import.json"
$modulePath = Join-Path $PSScriptRoot "modPoderesT20.bas"
$magicModulePath = Join-Path $PSScriptRoot "modMagiasT20.bas"
$formCodePath = Join-Path $PSScriptRoot "UserFormMagia.code.bas"
$backupDir = Join-Path $projectRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBaseName = [IO.Path]::GetFileNameWithoutExtension($workbookPath)
$backupPath = Join-Path $backupDir "$backupBaseName-pre-classes-txt-$timestamp.xlsm"

function Convert-ToKey {
    param([object]$Value)
    if ($null -eq $Value) { return "" }
    $text = ([string]$Value).Normalize([Text.NormalizationForm]::FormD)
    $builder = New-Object Text.StringBuilder
    foreach ($char in $text.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($char)
        }
    }
    return ([regex]::Replace($builder.ToString().ToLowerInvariant(), '[^a-z0-9]+', ' ')).Trim()
}

function Convert-ToId {
    param([object]$Value)
    return (Convert-ToKey $Value) -replace ' ', '_'
}

function Convert-ToCompactJson {
    param([object]$Value)
    if ($null -eq $Value) { return "[]" }
    return ($Value | ConvertTo-Json -Compress -Depth 40)
}

function Convert-ToMatrix {
    param(
        [object[]]$Header,
        [System.Collections.IEnumerable]$Rows
    )
    $rowList = New-Object System.Collections.ArrayList
    foreach ($row in $Rows) { [void]$rowList.Add(@($row)) }
    $matrix = New-Object "object[,]" ($rowList.Count + 1), $Header.Count
    for ($column = 0; $column -lt $Header.Count; $column++) { $matrix[0, $column] = $Header[$column] }
    for ($rowIndex = 0; $rowIndex -lt $rowList.Count; $rowIndex++) {
        $row = @($rowList[$rowIndex])
        for ($column = 0; $column -lt $Header.Count; $column++) {
            $value = if ($column -lt $row.Count -and $null -ne $row[$column]) { $row[$column] } else { "" }
            if ($value -is [Array]) { throw "Nested array at row $($rowIndex + 2), column $($column + 1)." }
            if ($value -isnot [string] -and $value -isnot [ValueType]) { $value = [string]$value }
            $matrix[($rowIndex + 1), $column] = $value
        }
    }
    return ,$matrix
}

function Read-WorksheetRows {
    param($Worksheet, [int]$ColumnCount)
    $rows = New-Object System.Collections.ArrayList
    $lastRow = $Worksheet.Cells($Worksheet.Rows.Count, 1).End(-4162).Row
    if ($lastRow -lt 2) { return ,$rows }
    $values = $Worksheet.Range($Worksheet.Cells(2, 1), $Worksheet.Cells($lastRow, $ColumnCount)).Value2
    for ($row = 1; $row -le $lastRow - 1; $row++) {
        $item = @()
        for ($column = 1; $column -le $ColumnCount; $column++) { $item += $values[$row, $column] }
        [void]$rows.Add($item)
    }
    return ,$rows
}

function Write-WorksheetRows {
    param(
        $Worksheet,
        [object[]]$Header,
        [System.Collections.IEnumerable]$Rows
    )
    $rowList = New-Object System.Collections.ArrayList
    foreach ($row in $Rows) { [void]$rowList.Add(@($row)) }
    $newLastRow = $rowList.Count + 1
    $oldLastRow = $Worksheet.Cells($Worksheet.Rows.Count, 1).End(-4162).Row
    $clearLastRow = [Math]::Max($oldLastRow, $newLastRow)
    $lastColumn = $Header.Count
    $Worksheet.Range($Worksheet.Cells(1, 1), $Worksheet.Cells($clearLastRow, $lastColumn)).ClearContents()
    $matrix = Convert-ToMatrix -Header $Header -Rows $rowList
    $batchSize = 150
    Write-Host "Writing $($Worksheet.Name): $newLastRow rows x $lastColumn columns"
    for ($start = 0; $start -lt $newLastRow; $start += $batchSize) {
        $count = [Math]::Min($batchSize, $newLastRow - $start)
        $batch = New-Object "object[,]" $count, $lastColumn
        for ($rowOffset = 0; $rowOffset -lt $count; $rowOffset++) {
            for ($column = 0; $column -lt $lastColumn; $column++) {
                $batch[$rowOffset, $column] = $matrix[($start + $rowOffset), $column]
            }
        }
        try {
            $Worksheet.Range($Worksheet.Cells($start + 1, 1), $Worksheet.Cells($start + $count, $lastColumn)).Value2 = $batch
        } catch {
            for ($rowOffset = 0; $rowOffset -lt $count; $rowOffset++) {
                for ($column = 0; $column -lt $lastColumn; $column++) {
                    try {
                        $Worksheet.Cells($start + $rowOffset + 1, $column + 1).Value2 = $batch[$rowOffset, $column]
                    } catch {
                        throw "Failed writing $($Worksheet.Name), cell $($start + $rowOffset + 1),$($column + 1): $($_.Exception.Message)"
                    }
                }
            }
        }
    }
    $Worksheet.Rows.Item(1).Font.Bold = $true
    if ($Worksheet.AutoFilterMode) { $Worksheet.AutoFilterMode = $false }
    $Worksheet.Range($Worksheet.Cells(1, 1), $Worksheet.Cells($newLastRow, $lastColumn)).AutoFilter() | Out-Null
}

function Get-OrCreateWorksheet {
    param($Workbook, [string]$Name)
    try { return $Workbook.Worksheets.Item($Name) } catch { }
    $sheet = $Workbook.Worksheets.Add([Type]::Missing, $Workbook.Worksheets.Item($Workbook.Worksheets.Count))
    $sheet.Name = $Name
    return $sheet
}

function Replace-CodeModule {
    param(
        $Workbook,
        [string]$ComponentName,
        [string]$CodePath,
        [switch]$StripAttribute
    )
    $code = Get-Content -Raw -Encoding UTF8 $CodePath
    if ($StripAttribute) { $code = [regex]::Replace($code, '^Attribute VB_Name = "[^"]+"\r?\n', '') }
    $module = $Workbook.VBProject.VBComponents.Item($ComponentName).CodeModule
    if ($module.CountOfLines -gt 0) { $module.DeleteLines(1, $module.CountOfLines) }
    $module.AddFromString($code)
}

function Test-IdOverlap {
    param([string]$Left, [string]$Right)
    $leftIds = @($Left -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $rightIds = @($Right -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    foreach ($id in $leftIds) { if ($rightIds -contains $id) { return $true } }
    return $false
}

function Get-PreservedEffects {
    param([object[]]$ExistingRow, [string]$Description, [object]$IncomingEffects)
    $manual = Convert-ToCompactJson @([ordered]@{ tipo = "regra_manual"; aplicacao = "manual"; descricao = $Description })
    if ($null -eq $ExistingRow -or -not [string]$ExistingRow[15]) {
        if ($null -ne $IncomingEffects) { return Convert-ToCompactJson $IncomingEffects }
        return $manual
    }
    try {
        $parsed = [string]$ExistingRow[15] | ConvertFrom-Json
        $items = @($parsed)
        if ($items.Count -eq 1 -and [string]$items[0].tipo -eq "regra_manual") { return $manual }
    } catch { }
    return [string]$ExistingRow[15]
}

function Find-ExistingPowerRow {
    param(
        [hashtable]$Index,
        $Power
    )
    if ([string]$Power.id -eq "classe_aumento_de_atributo") {
        foreach ($row in @($Index[(Convert-ToKey "Aumento de Atributo")])) {
            if ([string]$row[0] -eq "classe_aumento_de_atributo") { return ,$row }
        }
    }
    $key = Convert-ToKey $Power.nome
    $candidates = @()
    if ($Index.ContainsKey($key)) {
        foreach ($candidate in $Index[$key]) {
            if ($null -ne $candidate) { $candidates += ,$candidate }
        }
    }
    if ($candidates.Count -eq 0) { return $null }
    $incomingIds = (@($Power.classeIds) -join ';')
    $overlap = @()
    foreach ($candidate in $candidates) {
        if (@($candidate).Count -gt 4 -and (Test-IdOverlap ([string]$candidate[4]) $incomingIds)) { $overlap += ,$candidate }
    }
    if ($overlap.Count -eq 1) { return ,$overlap[0] }
    $incomingReq = Convert-ToKey $Power.preReqResumo
    foreach ($row in @($overlap + $candidates)) {
        if ((Convert-ToKey $row[13]) -eq $incomingReq) { return ,$row }
    }
    return ,$candidates[0]
}

function Get-ClassNameById {
    param([hashtable]$Map, [string]$Id)
    if ($Map.ContainsKey($Id)) { return [string]$Map[$Id] }
    return $Id
}

if (-not (Test-Path -LiteralPath $workbookPath)) { throw "Workbook not found: $workbookPath" }
if (-not (Test-Path -LiteralPath $builderPath)) { throw "Builder not found: $builderPath" }

& node $builderPath
if ($LASTEXITCODE -ne 0) { throw "classes.txt parser failed with exit code $LASTEXITCODE" }
$data = Get-Content -Raw -Encoding UTF8 $dataPath | ConvertFrom-Json
if ([int]$data.summary.classes -ne 33 -or [int]$data.summary.progressionComplete -ne 33) {
    throw "Parser validation failed: expected 33 complete class progressions."
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item -LiteralPath $workbookPath -Destination $backupPath

$catalogHeader = @(
    "PoderId", "Nome", "OrigemTipo", "Categoria", "ClasseIds", "Livro", "Descricao", "Repetivel",
    "NivelMinimo", "ReqAtributos", "ReqPoderes", "ReqPericias", "ReqProficiencias", "PreReqResumo",
    "EscolhasJson", "EfeitosJson", "DeusesIds", "RacasTexto", "OrigemNome"
)
$basePowerHeader = @(
    "ClasseId", "Classe", "PoderId", "Nome", "Descricao", "Repetivel", "NivelMinimo", "ReqAtributos",
    "ReqPoderes", "ReqPericias", "PreReqJson", "EscolhasJson", "EfeitosJson", "PreReqResumo"
)
$mapHeader = @("ClasseId", "Classe", "PoderId", "PoderClasseId")
$classHeader = @("Classe", "PV Base", "PV Nível", "PM Nível", "Proficiência", "Escolhas")
$skillHeader = @("Classe", "Tipo", "Grupo", "Perícia")
$abilityHeader = @("ClasseId", "Classe", "HabilidadeId", "Nivel", "Nome", "Descricao", "TiposEfeito", "TemEscolhas", "EfeitosJson", "EscolhasJson", "Automatico")
$slotHeader = @("OrigemClasseId", "OrigemClasse", "PoderClasseId", "HabilidadeId", "Habilidade", "NivelInicial", "Frequencia", "Categoria", "Quantidade", "PermiteGeral", "OrigemRegra", "Observacao")
$conjurationHeader = @("Classe", "ClasseId", "TipoMagia", "AtributoChave", "EscolasModo", "EscolasFixas", "EscolasEscolhaQtd", "EscolasBloqueadas", "MagiasFixasIniciais", "MagiasIniciaisEscolha", "AprendizadoModo", "PrimeiroNivelAprendizado", "Circulo2Nivel", "Circulo3Nivel", "Circulo4Nivel", "Circulo5Nivel", "Observacao")

$excel = $null
$workbook = $null
$saved = $false
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.EnableEvents = $false
    $excel.ScreenUpdating = $false
    $workbook = $excel.Workbooks.Open($workbookPath, 0, $false)
    $excel.Calculation = -4135
    try { $workbook.AutoSaveOn = $false } catch { }

    $resetControl = $excel.VBE.CommandBars.FindControl(1, 228)
    if ($null -ne $resetControl -and $resetControl.Enabled) { $resetControl.Execute() }

    $classNameById = @{}
    $variantBaseById = @{}
    foreach ($classEntry in $data.classes) {
        $classNameById[[string]$classEntry.id] = [string]$classEntry.nome
        if ([string]$classEntry.varianteDeId) { $variantBaseById[[string]$classEntry.id] = [string]$classEntry.varianteDeId }
    }

    $catalogSheet = $workbook.Worksheets.Item("Base_Poderes_Catalogo")
    $existingCatalogRows = Read-WorksheetRows -Worksheet $catalogSheet -ColumnCount $catalogHeader.Count
    $generalRows = New-Object System.Collections.ArrayList
    $existingClassPowerIndex = @{}
    foreach ($row in $existingCatalogRows) {
        if ([string]$row[2] -eq "Geral") {
            [void]$generalRows.Add($row)
            continue
        }
        $key = Convert-ToKey $row[1]
        if (-not $existingClassPowerIndex.ContainsKey($key)) { $existingClassPowerIndex[$key] = New-Object System.Collections.ArrayList }
        [void]$existingClassPowerIndex[$key].Add($row)
    }
    if ($generalRows.Count -ne 396) { throw "Expected 396 general powers, found $($generalRows.Count)." }

    $newClassCatalogRows = New-Object System.Collections.ArrayList
    $powerById = @{}
    foreach ($power in $data.poderesCatalogo) {
        $existing = Find-ExistingPowerRow -Index $existingClassPowerIndex -Power $power
        $powerId = if ($null -ne $existing -and [string]$existing[0]) { [string]$existing[0] } else { [string]$power.id }
        $classIds = @($power.classeIds) -join ';'
        $books = @($power.fontes | ForEach-Object { [string]$_.livro } | Where-Object { $_ } | Sort-Object -Unique)
        $book = if ($books.Count -gt 0) { $books -join '; ' } else { [string]$power.livro }
        $description = [string]$power.descricao
        $choices = if ($null -ne $existing -and [string]$existing[14]) { [string]$existing[14] } else { Convert-ToCompactJson $power.escolhas }
        if ($powerId -eq "classe_aumento_de_atributo") { $choices = Convert-ToCompactJson $power.escolhas }
        $effects = Get-PreservedEffects -ExistingRow $existing -Description $description -IncomingEffects $power.efeitos
        if ($powerId -eq "classe_aumento_de_atributo") { $effects = Convert-ToCompactJson $power.efeitos }
        $row = @(
            $powerId, [string]$power.nome, "Classe", "classe", $classIds, $book, $description,
            $(if ($power.repetivel) { "SIM" } else { "NAO" }),
            $(if ($null -ne $power.nivelMinimo) { $power.nivelMinimo } else { "" }),
            $(if ($null -ne $existing) { $existing[9] } else { "" }),
            $(if ($null -ne $existing) { $existing[10] } else { "" }),
            $(if ($null -ne $existing) { $existing[11] } else { "" }),
            $(if ($null -ne $existing) { $existing[12] } else { "" }),
            [string]$power.preReqResumo, $choices, $effects, "", "", ""
        )
        [void]$newClassCatalogRows.Add($row)
        $powerById[$powerId] = $row
    }

    $allCatalogRows = New-Object System.Collections.ArrayList
    foreach ($row in $newClassCatalogRows) { [void]$allCatalogRows.Add($row) }
    foreach ($row in $generalRows) { [void]$allCatalogRows.Add($row) }
    Write-WorksheetRows -Worksheet $catalogSheet -Header $catalogHeader -Rows $allCatalogRows

    $basePowerRows = New-Object System.Collections.ArrayList
    $powerMapRows = New-Object System.Collections.ArrayList
    $mapSeen = @{}
    foreach ($row in $newClassCatalogRows) {
        $directIds = @(([string]$row[4]) -split ';' | Where-Object { $_ })
        $targetIds = if ($directIds -contains "classe") { @($classNameById.Keys) } else { $directIds }
        foreach ($classId in $targetIds) {
            if ($classId -eq "classe") { continue }
            [void]$basePowerRows.Add(@(
                $classId, (Get-ClassNameById $classNameById $classId), $row[0], $row[1], $row[6], $row[7], $row[8],
                $row[9], $row[10], $row[11], "", $row[14], $row[15], $row[13]
            ))
            $mapKey = "$classId|$($row[0])|$classId"
            if (-not $mapSeen.ContainsKey($mapKey)) {
                [void]$powerMapRows.Add(@($classId, (Get-ClassNameById $classNameById $classId), $row[0], $classId))
                $mapSeen[$mapKey] = $true
            }
        }
        if (-not ($directIds -contains "classe")) {
            foreach ($variantId in $variantBaseById.Keys) {
                $baseId = [string]$variantBaseById[$variantId]
                if (-not ($directIds -contains $baseId)) { continue }
                $mapKey = "$variantId|$($row[0])|$baseId"
                if ($mapSeen.ContainsKey($mapKey)) { continue }
                [void]$powerMapRows.Add(@($variantId, (Get-ClassNameById $classNameById $variantId), $row[0], $baseId))
                $mapSeen[$mapKey] = $true
            }
        }
    }
    Write-WorksheetRows -Worksheet $workbook.Worksheets.Item("Base_Poderes_Classe") -Header $basePowerHeader -Rows $basePowerRows
    Write-WorksheetRows -Worksheet $workbook.Worksheets.Item("Base_Poderes_Classe_Map") -Header $mapHeader -Rows $powerMapRows

    $classSheet = $workbook.Worksheets.Item("Classes")
    $existingClassRows = Read-WorksheetRows -Worksheet $classSheet -ColumnCount $classHeader.Count
    $existingClassByName = @{}
    foreach ($row in $existingClassRows) { $existingClassByName[(Convert-ToKey $row[0])] = $row }
    $newClassRows = New-Object System.Collections.ArrayList
    foreach ($classEntry in $data.classes) {
        $existing = $existingClassByName[(Convert-ToKey $classEntry.nome)]
        $characteristics = $classEntry.caracteristicas
        $pvBase = if ($null -ne $characteristics -and $null -ne $characteristics.pvBase) { $characteristics.pvBase } elseif ($null -ne $existing) { $existing[1] } else { "" }
        $pvLevel = if ($null -ne $characteristics -and $null -ne $characteristics.pvNivel) { $characteristics.pvNivel } elseif ($null -ne $existing) { $existing[2] } else { "" }
        $pmLevel = if ($null -ne $characteristics -and $null -ne $characteristics.pmNivel) { $characteristics.pmNivel } elseif ($null -ne $existing) { $existing[3] } else { "" }
        $proficiencies = if ($null -ne $characteristics -and [string]$characteristics.proficiencias) { ([string]$characteristics.proficiencias).TrimEnd('.') } elseif ($null -ne $existing) { $existing[4] } else { "" }
        $choices = if ($null -ne $characteristics -and $null -ne $characteristics.escolhasPericia) { $characteristics.escolhasPericia } elseif ($null -ne $existing) { $existing[5] } else { "" }
        [void]$newClassRows.Add(@([string]$classEntry.nome, $pvBase, $pvLevel, $pmLevel, $proficiencies, $choices))
    }
    Write-WorksheetRows -Worksheet $classSheet -Header $classHeader -Rows $newClassRows

    $skillSheet = $workbook.Worksheets.Item("Pericias_Classes")
    $existingSkillRows = Read-WorksheetRows -Worksheet $skillSheet -ColumnCount $skillHeader.Count
    $existingSkillsByClass = @{}
    foreach ($row in $existingSkillRows) {
        $key = Convert-ToKey $row[0]
        if (-not $existingSkillsByClass.ContainsKey($key)) { $existingSkillsByClass[$key] = New-Object System.Collections.ArrayList }
        [void]$existingSkillsByClass[$key].Add($row)
    }
    $newSkillRows = New-Object System.Collections.ArrayList
    foreach ($classEntry in $data.classes) {
        if (@($classEntry.periciasEstruturadas).Count -gt 0) {
            foreach ($skill in $classEntry.periciasEstruturadas) {
                [void]$newSkillRows.Add(@([string]$classEntry.nome, [string]$skill.tipo, [string]$skill.grupo, [string]$skill.pericia))
            }
        } else {
            foreach ($row in @($existingSkillsByClass[(Convert-ToKey $classEntry.nome)])) { [void]$newSkillRows.Add($row) }
        }
    }
    Write-WorksheetRows -Worksheet $skillSheet -Header $skillHeader -Rows $newSkillRows

    $abilitySheet = $workbook.Worksheets.Item("Base_Habilidades_Classe")
    $existingAbilityRows = Read-WorksheetRows -Worksheet $abilitySheet -ColumnCount $abilityHeader.Count
    $existingAbilityByKey = @{}
    foreach ($row in $existingAbilityRows) { $existingAbilityByKey["$($row[0])|$(Convert-ToKey $row[4])"] = $row }
    $newAbilityRows = New-Object System.Collections.ArrayList
    foreach ($classEntry in $data.classes) {
        foreach ($ability in $classEntry.habilidades) {
            $key = "$($classEntry.id)|$(Convert-ToKey $ability.nome)"
            $existing = $existingAbilityByKey[$key]
            $description = if ([string]$ability.descricao) { [string]$ability.descricao } elseif ($null -ne $existing) { [string]$existing[5] } else { "" }
            $effects = if ($null -ne $existing -and [string]$existing[8]) { [string]$existing[8] } else { Convert-ToCompactJson @([ordered]@{ tipo = "regra_manual"; aplicacao = "manual"; descricao = $description }) }
            [void]$newAbilityRows.Add(@(
                [string]$classEntry.id, [string]$classEntry.nome,
                $(if ($null -ne $existing -and [string]$existing[2]) { $existing[2] } else { [string]$ability.id }),
                $ability.nivel, [string]$ability.nome, $description,
                $(if ($null -ne $existing -and [string]$existing[6]) { $existing[6] } else { "regra_manual" }),
                $(if ($null -ne $existing -and [string]$existing[7]) { $existing[7] } else { "NAO" }),
                $effects,
                $(if ($null -ne $existing -and [string]$existing[9]) { $existing[9] } else { "" }),
                "SIM"
            ))
        }
    }
    Write-WorksheetRows -Worksheet $abilitySheet -Header $abilityHeader -Rows $newAbilityRows

    $slotRows = New-Object System.Collections.ArrayList
    foreach ($classEntry in $data.classes) {
        foreach ($slot in $classEntry.slotsPoder) {
            [void]$slotRows.Add(@(
                $slot.origemClasseId, $slot.origemClasse, $slot.poderClasseId, $slot.habilidadeId, $slot.habilidade,
                $slot.nivelInicial, $slot.frequencia, $slot.categoria, $slot.quantidade, $slot.permiteGeral,
                $slot.origemRegra, $slot.observacao
            ))
        }
    }
    Write-WorksheetRows -Worksheet $workbook.Worksheets.Item("Base_Slots_Poder_Classe") -Header $slotHeader -Rows $slotRows

    $conjurationSheet = $workbook.Worksheets.Item("Base_Conjuracao")
    $conjurationRows = Read-WorksheetRows -Worksheet $conjurationSheet -ColumnCount $conjurationHeader.Count
    $conjurationClassIds = @{}
    foreach ($row in $conjurationRows) { $conjurationClassIds[[string]$row[1]] = $true }
    foreach ($classEntry in $data.classes) {
        if ($conjurationClassIds.ContainsKey([string]$classEntry.id)) { continue }
        $magicAbility = @($classEntry.habilidades | Where-Object { (Convert-ToKey $_.nome) -eq "magias" } | Select-Object -First 1)
        if ($magicAbility.Count -eq 0) { continue }
        $descriptionKey = Convert-ToKey $magicAbility[0].descricao
        $magicType = if ($descriptionKey -match 'magias divinas') { "divina" } elseif ($descriptionKey -match 'magias arcanas') { "arcana" } else { "" }
        $keyAttribute = if ($descriptionKey -match 'atributo chave[^.]*sabedoria') { "SAB" } elseif ($descriptionKey -match 'atributo chave[^.]*carisma') { "CAR" } elseif ($descriptionKey -match 'atributo chave[^.]*inteligencia') { "INT" } else { "" }
        $circleLevels = @{}
        foreach ($progression in $classEntry.progressao) {
            foreach ($item in $progression.itens) {
                if ((Convert-ToKey $item) -notmatch '^magias') { continue }
                $circle = [regex]::Match((Convert-ToKey $item), '(\d+)o\s+circulo')
                if ($circle.Success) { $circleLevels[[int]$circle.Groups[1].Value] = [int]$progression.nivel }
            }
        }
        [void]$conjurationRows.Add(@(
            [string]$classEntry.nome, [string]$classEntry.id, $magicType, $keyAttribute, "livre", "", "", "", "", "",
            "classes.txt", 1,
            $(if ($circleLevels.ContainsKey(2)) { $circleLevels[2] } else { "" }),
            $(if ($circleLevels.ContainsKey(3)) { $circleLevels[3] } else { "" }),
            $(if ($circleLevels.ContainsKey(4)) { $circleLevels[4] } else { "" }),
            $(if ($circleLevels.ContainsKey(5)) { $circleLevels[5] } else { "" }),
            "Cadastro mínimo gerado de classes.txt; regras detalhadas permanecem em Base_Habilidades_Classe."
        ))
    }
    Write-WorksheetRows -Worksheet $conjurationSheet -Header $conjurationHeader -Rows $conjurationRows

    $auditClassRows = New-Object System.Collections.ArrayList
    $auditProgressionRows = New-Object System.Collections.ArrayList
    $auditAbilityRows = New-Object System.Collections.ArrayList
    $auditPowerRows = New-Object System.Collections.ArrayList
    foreach ($classEntry in $data.classes) {
        $characteristics = $classEntry.caracteristicas
        [void]$auditClassRows.Add(@(
            $classEntry.id, $classEntry.nome, $classEntry.varianteDeId, $classEntry.sourceLine,
            $(if ($null -ne $characteristics) { $characteristics.pontosVida } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.pontosMana } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.pericias } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.proficiencias } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.pvBase } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.pvNivel } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.pmNivel } else { "" }),
            $(if ($null -ne $characteristics) { $characteristics.escolhasPericia } else { "" })
        ))
        foreach ($progression in $classEntry.progressao) { [void]$auditProgressionRows.Add(@($classEntry.id, $classEntry.nome, $progression.nivel, $progression.habilidadesTexto, $progression.sourceLine)) }
        foreach ($ability in $classEntry.habilidades) { [void]$auditAbilityRows.Add(@($classEntry.id, $classEntry.nome, $ability.nivel, $ability.nome, $ability.descricao, $ability.progressaoTexto, $ability.descricaoHerdadaDe, $ability.sourceLine)) }
        foreach ($power in $classEntry.poderesLocais) { [void]$auditPowerRows.Add(@($classEntry.id, $classEntry.nome, $power.nome, $power.descricao, $power.preReqResumo, $power.repetivel, $power.livro, $power.origemTrecho, $power.sourceLine)) }
    }
    $auditSheets = @(
        @("Base_Classes_TXT", @("ClasseId", "Classe", "VarianteDeId", "LinhaFonte", "PontosVida", "PontosMana", "Pericias", "Proficiencias", "PVBase", "PVNivel", "PMNivel", "EscolhasPericia"), $auditClassRows),
        @("Base_Progressao_Classes", @("ClasseId", "Classe", "Nivel", "HabilidadesTexto", "LinhaFonte"), $auditProgressionRows),
        @("Base_Habilidades_Classe_TXT", @("ClasseId", "Classe", "Nivel", "Nome", "Descricao", "ProgressaoTexto", "DescricaoHerdadaDe", "LinhaFonte"), $auditAbilityRows),
        @("Base_Poderes_Classe_TXT", @("ClasseId", "Classe", "Nome", "Descricao", "PreReqResumo", "Repetivel", "Livro", "OrigemTrecho", "LinhaFonte"), $auditPowerRows)
    )
    foreach ($definition in $auditSheets) {
        $sheet = Get-OrCreateWorksheet -Workbook $workbook -Name $definition[0]
        Write-WorksheetRows -Worksheet $sheet -Header $definition[1] -Rows $definition[2]
        $sheet.Visible = 2
    }

    $catalogSheet.Visible = 2
    $workbook.Worksheets.Item("Base_Poderes_Classe_Map").Visible = 2

    $classListReference = "='Classes'!`$A`$2:`$A`$" + [string]($newClassRows.Count + 1)
    try {
        $listName = $workbook.Names.Item("ListaClassesT20")
        $listName.RefersTo = $classListReference
    } catch {
        [void]$workbook.Names.Add("ListaClassesT20", $classListReference)
    }
    $classCell = $workbook.Worksheets.Item("Principal").Range("D2")
    $validationReady = $false
    try {
        $validationReady = ([int]$classCell.Validation.Type -eq 3 -and [string]$classCell.Validation.Formula1 -eq "=ListaClassesT20")
    } catch {}
    if (-not $validationReady) {
        $classCell.Validation.Delete()
        try {
            $classCell.Validation.Add(3, 1, 1, "=ListaClassesT20")
        } catch {
            Start-Sleep -Milliseconds 250
            $classCell.Validation.Add(3, 1, 1, "=ListaClassesT20")
        }
    }
    $classCell.Validation.IgnoreBlank = $true
    $classCell.Validation.InCellDropdown = $true

    Replace-CodeModule -Workbook $workbook -ComponentName "modPoderesT20" -CodePath $modulePath -StripAttribute
    Replace-CodeModule -Workbook $workbook -ComponentName "modMagiasT20" -CodePath $magicModulePath -StripAttribute

    $form = $workbook.VBProject.VBComponents.Item("UserFormMagia")
    try {
        $viewMagicButton = $form.Designer.Controls.Item("cmdVerMagias")
    } catch {
        $viewMagicButton = $form.Designer.Controls.Add("Forms.CommandButton.1", "cmdVerMagias", $true)
    }
    $viewMagicButton.Caption = "Ver magias"
    $viewMagicButton.Visible = $false
    $viewMagicButton.TabStop = $true
    Replace-CodeModule -Workbook $workbook -ComponentName "UserFormMagia" -CodePath $formCodePath

    $form.Designer.Controls.Item("lstMagias").IntegralHeight = $false
    $form.Designer.Controls.Item("txtDetalhes").MultiLine = $true
    $form.Designer.Controls.Item("txtDetalhes").WordWrap = $true
    $form.Designer.Controls.Item("txtDetalhes").ScrollBars = 2
    $form.Designer.Controls.Item("txtDetalhes").Locked = $true

    $compileControl = $excel.VBE.CommandBars.FindControl(1, 578)
    if ($null -ne $compileControl -and $compileControl.Enabled) { $compileControl.Execute() }

    foreach ($sheet in $workbook.Worksheets) { $sheet.UsedRange.Font.Strikethrough = $false }

    $excel.Calculation = -4105
    $excel.EnableEvents = $true
    $excel.ScreenUpdating = $true
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
        Classes = $newClassRows.Count
        GeneralPowers = $generalRows.Count
        ClassPowers = $newClassCatalogRows.Count
        PowerMappings = $powerMapRows.Count
        Abilities = $newAbilityRows.Count
        Slots = $slotRows.Count
        Skills = $newSkillRows.Count
        Saved = $workbook.Saved
    } | Format-List
}
finally {
    if ($null -ne $workbook) { $workbook.Close($saved) }
    if ($null -ne $excel) { $excel.Quit() }
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    if ($null -ne $excel) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
