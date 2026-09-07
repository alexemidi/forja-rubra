$ErrorActionPreference = "Stop"
$excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$workbook = $null

function Assert-Equal {
    param($Actual, $Expected, [string]$Message)
    if ($Actual -ne $Expected) { throw "$Message. Esperado: '$Expected'; obtido: '$Actual'." }
}

function Find-ItemRow {
    param($Sheet, [string]$ItemId)
    $found = $Sheet.Columns(29).Find($ItemId)
    if ($null -eq $found) { throw "Item nao encontrado na Loja: $ItemId" }
    return [int]$found.Row
}

try {
    foreach ($candidate in $excel.Workbooks) {
        if ([string]::Equals([string]$candidate.Name, "Planilha T20 Macro.xlsm", [StringComparison]::OrdinalIgnoreCase)) {
            $workbook = $candidate
            break
        }
    }
    if ($null -eq $workbook) { throw "Planilha T20 Macro.xlsm nao esta aberta no Excel." }
    $shop = $workbook.Worksheets("Loja")

    Assert-Equal $excel.Run("'$($workbook.Name)'!modLojaT20.CodexLojaT20Version") "T20 loja itens-melhorias-materiais 2026-08-27" "Modulo da loja inesperado"
    Assert-Equal ($workbook.Worksheets("Base_Itens").UsedRange.Rows.Count - 1) 489 "Quantidade de itens"
    Assert-Equal ($workbook.Worksheets("Base_Melhorias").UsedRange.Rows.Count - 1) 48 "Quantidade de melhorias"
    Assert-Equal ($workbook.Worksheets("Base_Materiais").UsedRange.Rows.Count - 1) 60 "Quantidade de aplicacoes de materiais"
    Assert-Equal $workbook.Worksheets("Base_Itens").Visible 2 "Base_Itens deve estar muito oculta"

    $adaga = Find-ItemRow $shop "adaga"
    $foice = Find-ItemRow $shop "foice"
    $machadinha = Find-ItemRow $shop "machadinha"
    Assert-Equal ([int]$shop.Cells($adaga, 4).Value2) 1 "Margem critica da Adaga"
    Assert-Equal ([int]$shop.Cells($foice, 4).Value2) 0 "Margem critica da Foice"
    Assert-Equal ([int]$shop.Cells($foice, 5).Value2) 3 "Multiplicador critico da Foice"
    Assert-Equal ([bool]$shop.Cells($machadinha, 25).Value2) $true "Machadinha deve ser arma ana"
    Assert-Equal ([string]$shop.Cells($adaga, 2).Text) "T$ 2,00" "Formato monetario"
    Assert-Equal ([string]$shop.Cells(1, 25).Text) ("Arma an" + [char]227) "Cabecalho de arma ana"
    Assert-Equal ([int]$shop.Cells($adaga, 19).Validation.Type) 3 "Lista da primeira melhoria"
    Assert-Equal ([int]$shop.Cells($adaga, 22).Validation.Type) 3 "Lista da quarta melhoria"
    Assert-Equal ([int]$shop.Cells($adaga, 23).Validation.Type) 3 "Lista de material especial"

    $formulaErrors = 0
    foreach ($cell in $shop.UsedRange.SpecialCells(-4123)) {
        if ($cell.Text -match '^#') { $formulaErrors++ }
    }
    Assert-Equal $formulaErrors 0 "Erros de formula na Loja"
    Assert-Equal ([bool]$shop.UsedRange.Font.Strikethrough) $false "Texto tachado na Loja"

    [pscustomobject]@{
        Workbook = $workbook.FullName
        ActiveSheet = $workbook.ActiveSheet.Name
        ShopRows = $shop.UsedRange.Rows.Count
        Items = 489
        Improvements = 48
        MaterialApplications = 60
        FormulaErrors = $formulaErrors
        Saved = $workbook.Saved
    }
} finally {
    if ($null -ne $workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
