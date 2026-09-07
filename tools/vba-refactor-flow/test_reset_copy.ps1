$ErrorActionPreference = 'Stop'
$path = Join-Path (Get-Location) 'tmp\reset-verification.xlsm'
$xl = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application')
$live = $xl.Workbooks.Item('Planilha T20 Macro.xlsm')
$live.SaveCopyAs($path)
$oldEvents = $xl.EnableEvents
$oldAlerts = $xl.DisplayAlerts
$test = $null

try {
    $xl.EnableEvents = $false
    $xl.DisplayAlerts = $false
    $test = $xl.Workbooks.Open($path, 0, $false)
    $name = $test.Name
    $xl.Run("'$name'!modFluxoT20.LimparFichaParaCriacao") | Out-Null
    $principal = $test.Worksheets.Item('Principal')
    Write-Output "after_reset_core=B2:$($principal.Range('B2').Text)|D2:$($principal.Range('D2').Text)|F2:$($principal.Range('F2').Text)|G2:$($principal.Range('G2').Text)|F1:$($principal.Range('F1').Text)"
    Write-Output "after_reset_attributes=$($principal.Range('A4').Text),$($principal.Range('B4').Text),$($principal.Range('C4').Text),$($principal.Range('D4').Text),$($principal.Range('E4').Text),$($principal.Range('F4').Text)"
    Write-Output "after_reset_worn=$($principal.Range('D34').Text)|$($principal.Range('D35').Text)|$($principal.Range('D36').Text)|$($principal.Range('D37').Text)"

    $choices = $test.Worksheets.Item('Escolhas_Ativas')
    $state = $xl.Match('Inventario|VestidosInicializados', $choices.Columns(1), 0)
    Write-Output "state_after_empty_reset=$state"

    $principal.Range('A25').Value2 = 'Mochila'
    $principal.Range('B25').Value2 = 1
    $principal.Range('A26').Value2 = 'Traje de Viajante'
    $principal.Range('B26').Value2 = 1
    $principal.Range('A27').Value2 = 'Armadura de Couro'
    $principal.Range('B27').Value2 = 1
    $xl.Run("'$name'!modInventarioT20.AtualizarInventario", $false) | Out-Null
    Write-Output "worn_after_items=$($principal.Range('D34').Text)|$($principal.Range('D35').Text)|$($principal.Range('D36').Text)|$($principal.Range('D37').Text)"
    Write-Output "armor_used=$($principal.Range('D21').Text)"
}
finally {
    if ($null -ne $test) { $test.Close($false) }
    $xl.EnableEvents = $oldEvents
    $xl.DisplayAlerts = $oldAlerts
}
