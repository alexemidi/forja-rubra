param(
    [string]$WorkbookFile = "backups\shop-test.xlsm"
)

$ErrorActionPreference = "Stop"
$path = (Resolve-Path -LiteralPath $WorkbookFile).Path
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$workbook = $null

function Find-ItemRow {
    param($Sheet, [string]$ItemId)
    $found = $Sheet.Columns(29).Find($ItemId)
    if ($null -eq $found) { throw "Item nao encontrado na Loja: $ItemId" }
    return [int]$found.Row
}

function Assert-Equal {
    param($Actual, $Expected, [string]$Message)
    if ($Actual -ne $Expected) {
        throw "$Message. Esperado: '$Expected'; obtido: '$Actual'."
    }
}

try {
    $workbook = $excel.Workbooks.Open($path, 0, $false)
    $shop = $workbook.Worksheets("Loja")

    Assert-Equal $excel.Run("'$($workbook.Name)'!modLojaT20.CodexLojaT20Version") "T20 loja itens-melhorias-materiais 2026-08-27" "Versao inesperada do modulo da loja"
    Assert-Equal $workbook.Worksheets("Base_Itens").Visible 2 "Base_Itens deve estar muito oculta"
    Assert-Equal $workbook.Worksheets("Base_Melhorias").Visible 2 "Base_Melhorias deve estar muito oculta"
    Assert-Equal $workbook.Worksheets("Base_Materiais").Visible 2 "Base_Materiais deve estar muito oculta"

    $espada = Find-ItemRow $shop "espada_longa"
    $shop.Range($shop.Cells($espada, 19), $shop.Cells($espada, 23)).ClearContents()
    $shop.Calculate()
    Assert-Equal ([int]$shop.Cells($espada, 4).Value2) 1 "Margem critica da Espada Longa"
    Assert-Equal ([int]$shop.Cells($espada, 5).Value2) 2 "Multiplicador critico da Espada Longa"

    $adaga = Find-ItemRow $shop "adaga"
    Assert-Equal ([string]$shop.Cells($adaga, 2).Text) "T$ 2,00" "Formato monetario do preco base"
    Assert-Equal ([int]$shop.Cells($adaga, 4).Value2) 1 "Margem critica da Adaga"
    Assert-Equal ([int]$shop.Cells($adaga, 5).Value2) 2 "Multiplicador critico da Adaga"

    $foice = Find-ItemRow $shop "foice"
    Assert-Equal ([int]$shop.Cells($foice, 4).Value2) 0 "Margem critica da Foice"
    Assert-Equal ([int]$shop.Cells($foice, 5).Value2) 3 "Multiplicador critico da Foice"

    $machadinha = Find-ItemRow $shop "machadinha"
    Assert-Equal ([bool]$shop.Cells($machadinha, 25).Value2) $true "Machadinha deve ser arma ana"

    $shop.Cells($espada, 19).Value2 = "Material Especial"
    $shop.Cells($espada, 23).Value2 = "Mitral"
    $shop.Calculate()
    Assert-Equal ([double]$shop.Cells($espada, 26).Value2) 1815 "Preco da Espada Longa de Mitral com uma melhoria"
    Assert-Equal ([string]$shop.Cells($espada, 26).Text) "T$ 1.815,00" "Formato monetario do preco final"
    Assert-Equal ([int]$shop.Cells($espada, 27).Value2) 5 "CD adicional com uma melhoria"

    $shop.Cells($espada, 20).Value2 = "Certeira"
    $shop.Cells($espada, 21).Value2 = "Cruel"
    $shop.Cells($espada, 22).Value2 = "Equilibrada"
    $shop.Calculate()
    Assert-Equal ([double]$shop.Cells($espada, 26).Value2) 19515 "Preco da Espada Longa de Mitral com quatro melhorias"
    Assert-Equal ([int]$shop.Cells($espada, 27).Value2) 20 "CD adicional com quatro melhorias"

    $shop.Range($shop.Cells($espada, 20), $shop.Cells($espada, 22)).ClearContents()
    $shop.Cells($espada, 23).Value2 = "Prata"
    $shop.Calculate()
    Assert-Equal ([string]$shop.Cells($espada, 26).Value2) "T$ 315,00 + material" "Material sem custo cadastrado deve sinalizar valor pendente"

    $municao = Find-ItemRow $shop "flechas"
    $shop.Range($shop.Cells($municao, 6), $shop.Cells($municao, 10)).ClearContents()
    if ([string]::IsNullOrWhiteSpace([string]$shop.Cells($municao, 1).Value2)) {
        throw "Linha de municao sem nome visivel."
    }
    $shop.Cells($municao, 6).Value2 = "Certeira"
    $shop.Calculate()
    $baseMunicao = [double]$shop.Cells($municao, 33).Value2
    Assert-Equal ([double]$shop.Cells($municao, 12).Value2) ($baseMunicao + 150) "Melhoria de municao deve custar metade"

    $espadaCurta = Find-ItemRow $shop "espada_curta"
    $shop.Range($shop.Cells($espadaCurta, 19), $shop.Cells($espadaCurta, 23)).ClearContents()
    $shop.Cells($espadaCurta, 19).Value2 = "Certeira"
    $excel.Run("'$($workbook.Name)'!modLojaT20.ProcessarAlteracaoLoja", $shop, $shop.Cells($espadaCurta, 19))
    Assert-Equal ([string]$shop.Cells($espadaCurta, 19).Value2) "Certeira" "Melhoria Certeira valida foi removida"
    if ($null -eq $shop.Cells($espadaCurta, 19).Comment) { throw "Certeira deveria receber comentario explicativo." }

    $shop.Cells($espadaCurta, 20).Value2 = "Pungente"
    $excel.Run("'$($workbook.Name)'!modLojaT20.ProcessarAlteracaoLoja", $shop, $shop.Cells($espadaCurta, 20))
    Assert-Equal ([string]$shop.Cells($espadaCurta, 20).Value2) "Pungente" "Pungente deveria aceitar Certeira como pre-requisito"
    if ($null -eq $shop.Cells($espadaCurta, 20).Comment) { throw "Pungente deveria receber comentario explicativo." }

    $formulaErrors = 0
    $used = $shop.UsedRange
    foreach ($cell in $used.SpecialCells(-4123)) {
        if ($cell.Text -match '^#') { $formulaErrors++ }
    }
    Assert-Equal $formulaErrors 0 "A Loja contem erros de formula"
    Assert-Equal ([bool]$shop.UsedRange.Font.Strikethrough) $false "A Loja nao pode conter texto tachado"

    [pscustomobject]@{
        Workbook = $workbook.FullName
        ShopRows = $shop.UsedRange.Rows.Count
        Items = $workbook.Worksheets("Base_Itens").UsedRange.Rows.Count - 1
        EspadaLongaMitralUmaMelhoria = 1815
        EspadaLongaMitralQuatroMelhorias = 19515
        AmmoOneImprovementSurcharge = 150
        PrerequisiteChain = "Certeira > Pungente"
        FormulaErrors = $formulaErrors
    }
} finally {
    if ($null -ne $workbook) { $workbook.Close($false) }
    $excel.Quit()
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
