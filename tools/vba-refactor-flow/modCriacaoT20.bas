Attribute VB_Name = "modCriacaoT20"
Option Explicit

Public Sub IniciarCriacaoPersonagem()
    modFluxoT20.IniciarCriacaoGuiada
End Sub

Public Sub ResetarFicha()
    modFluxoT20.ResetarFichaCompleta
End Sub

Public Sub ReverPericias()
    Dim rapido As Boolean
    On Error GoTo TrataErro
    modEstadoExcelT20.IniciarModoRapido
    rapido = True
    modAutomacaoT20.RecalcularTreinosTudo False
    modEstadoExcelT20.CalcularPericiasAgora
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
Saida:
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    Exit Sub
TrataErro:
    MsgBox "Nao foi possivel revisar as pericias: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub
