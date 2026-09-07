param(
    [string]$WorkbookName = 'Planilha T20 Macro.xlsm'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$path = Join-Path $root $WorkbookName
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.EnableEvents = $false
$excel.AutomationSecurity = 1
$workbook = $null

function Get-ListValues($Sheet, [int]$Column, [int]$FirstRow, [int]$LastRow) {
    $values = @()
    for ($row = $FirstRow; $row -le $LastRow; $row++) {
        $value = [string]$Sheet.Cells.Item($row, $Column).Value2
        if ([string]::IsNullOrWhiteSpace($value)) { break }
        $values += $value.Trim()
    }
    return $values
}

try {
    $workbook = $excel.Workbooks.Open($path, 0, $true)
    $excel.Calculation = -4135
    $principal = $workbook.Worksheets.Item('Principal')
    $dados = $workbook.Worksheets.Item('Dados')
    $treino = $workbook.Worksheets.Item('Treino_Pericias')
    $macroDivindade = "'$WorkbookName'!modPrincipalRostoT20.AtualizarDivindade"
    $macroConfirmarDivindade = "'$WorkbookName'!modAssistenteCriacaoT20.ConfirmarDivindadeAtual"
    $macroResumo = "'$WorkbookName'!modPoderesT20.ResumoRequisitosPendentesClasse"
    $naoDevoto = 'N' + [char]227 + 'o devoto'
    $clerigo = 'Cl' + [char]233 + 'rigo'
    $cacador = 'Ca' + [char]231 + 'ador'

    $principal.Range('F2').Value2 = 'Guerreiro'
    $excel.Run($macroDivindade, $principal)
    $listaOpcional = @(Get-ListValues $dados 8 2 200)
    if ($listaOpcional.Count -lt 2 -or $listaOpcional[0] -ne $naoDevoto) {
        throw 'Classe opcional nao recebeu Nao devoto como primeira opcao.'
    }
    $principal.Range('G2').Value2 = $naoDevoto
    if (-not [bool]$excel.Run($macroConfirmarDivindade)) {
        throw 'Nao devoto foi rejeitado para uma classe de devocao opcional.'
    }

    $principal.Range('F2').Value2 = $clerigo
    $principal.Range('G2').Value2 = $naoDevoto
    $excel.Run($macroDivindade, $principal)
    $listaObrigatoria = @(Get-ListValues $dados 8 2 200)
    if ($listaObrigatoria -contains $naoDevoto) {
        throw 'Classe obrigatoria ainda exibe Nao devoto.'
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$principal.Range('G2').Value2)) {
        throw 'Classe obrigatoria manteve uma escolha Nao devoto residual.'
    }

    $principal.Range('F2').Value2 = 'Usurpador'
    $excel.Run($macroDivindade, $principal)
    $listaUsurpador = @(Get-ListValues $dados 8 2 200)
    if ($listaUsurpador.Count -ne 1 -or $listaUsurpador[0] -ne $naoDevoto) {
        throw 'Usurpador deveria ter apenas Nao devoto.'
    }

    $linhaFurtividade = 0
    for ($row = 4; $row -le 130; $row++) {
        if ([string]$principal.Cells.Item($row, 9).Value2 -eq 'Furtividade') {
            $linhaFurtividade = $row
            break
        }
    }
    if ($linhaFurtividade -eq 0) { throw 'Pericia Furtividade nao encontrada na Principal.' }
    $linhaTreino = 2 + ($linhaFurtividade - 4)
    $treino.Range("E${linhaTreino}:N${linhaTreino}").Value2 = $false
    $resumoSemTreino = [string]$excel.Run($macroResumo, $cacador)
    if ($resumoSemTreino -notmatch 'Emboscar' -or $resumoSemTreino -notmatch 'Furtividade') {
        throw 'O resumo do Cacador nao indicou Emboscar/Furtividade sem treinamento.'
    }

    $treino.Cells.Item($linhaTreino, 5).Value2 = $true
    $resumoComTreino = [string]$excel.Run($macroResumo, $cacador)
    $linhaEmboscar = ($resumoComTreino -split "`r?`n" | Where-Object { $_ -match '^Emboscar\s+-' })
    if ($linhaEmboscar -and $linhaEmboscar -match 'Furtividade') {
        throw 'Emboscar continuou acusando Furtividade apos o treinamento.'
    }

    $compile = $excel.VBE.CommandBars.FindControl(1, 578)
    $compileEnabled = if ($null -eq $compile) { $null } else { [bool]$compile.Enabled }
    Write-Output "deity_optional_count=$($listaOpcional.Count)"
    Write-Output 'non_devote_optional_accepted=True'
    Write-Output "deity_required_count=$($listaObrigatoria.Count)"
    Write-Output "deity_usurpador=$($listaUsurpador -join ',')"
    Write-Output "hunter_untrained_hint=$($resumoSemTreino -match 'Emboscar.*Furtividade')"
    Write-Output "hunter_trained_cleared=$(-not ($linhaEmboscar -and $linhaEmboscar -match 'Furtividade'))"
    Write-Output "compile_enabled=$compileEnabled"
}
finally {
    if ($null -ne $workbook) { $workbook.Close($false) }
    $excel.Quit()
    if ($null -ne $workbook) { [Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null }
    [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
