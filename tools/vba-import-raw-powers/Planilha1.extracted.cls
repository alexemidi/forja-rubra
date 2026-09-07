VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Planilha1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit

' CODEX_T20_AUTO_BEGIN
Private Sub Worksheet_Change(ByVal Target As Range)
    Dim alvo As Range
    Dim modoRapidoIniciado As Boolean
    If Target.Areas.Count > 1 Then Exit Sub
    Set alvo = Target.Cells(1, 1)
    If Intersect(alvo, Me.Range("B2,D2,F1:F2,G2,A4:F5,F42,H43,F45,B17,A10:A14,G10:G14,A21:A22,D21:D22,A25:B30,D25:E30,B31:B33")) Is Nothing Then Exit Sub

    On Error GoTo TrataErro
    Application.EnableCancelKey = xlErrorHandler
    modEstadoExcelT20.IniciarModoRapido
    modoRapidoIniciado = True

    If Not Intersect(alvo, Me.Range("A10:A14,G10:G14,A21:A22,D21:D22,A25:B30,D25:E30,B31:B33")) Is Nothing Then
        modInventarioT20.ProcessarAlteracaoInventario Me, alvo
        GoTo Saida
    ElseIf Not Intersect(alvo, Me.Range("B2")) Is Nothing Then
        modAutomacaoT20.AtualizarAtributosDaRaca False
        modEstadoExcelT20.CalcularAtributosAgora
        modAutomacaoT20.AtualizarTreinoPorInteligencia False
        modAutomacaoT20.AtualizarTreinoRaca
        modEstadoExcelT20.CalcularPericiasAgora
        modMagiasT20.AtualizarMagiasPersonagem False
        modPoderesClasseT20.AtualizarPoderesClasse False
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("F2")) Is Nothing Then
        modAutomacaoT20.RecalcularTreinosTudo False
        modEstadoExcelT20.CalcularPericiasAgora
        modMagiasT20.ForcarEscolhaCaminhoArcanista
        modMagiasT20.AtualizarMagiasPersonagem False
        modPoderesClasseT20.AtualizarPoderesClasse False
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("D2")) Is Nothing Then
        modOrigensT20.PrepararAlteracaoOrigem
        modPoderesClasseT20.AtualizarPoderesClasse False
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("G2,F42,H43")) Is Nothing Then
        modPoderesClasseT20.AtualizarPoderesClasse False
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("F45")) Is Nothing Then
        modMagiasT20.AtualizarOverrideAtributoMagiaPorPainel
        modMagiasT20.AtualizarMagiasPersonagem False
        modPoderesClasseT20.AtualizarPoderesClasse True
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("F1")) Is Nothing Then
        modEstadoExcelT20.CalcularPericiasAgora
        modMagiasT20.AtualizarMagiasPersonagem False
        modPoderesClasseT20.AtualizarPoderesClasse False
        modRegrasT20.AtualizarEfeitosAtivos
    ElseIf Not Intersect(alvo, Me.Range("D4,D5")) Is Nothing Then
        modEstadoExcelT20.CalcularAtributosAgora
        modAutomacaoT20.AtualizarTreinoPorInteligencia False
        modEstadoExcelT20.CalcularPericiasAgora
        modMagiasT20.AtualizarMagiasPersonagem True
        modPoderesClasseT20.AtualizarPoderesClasse True
        modRegrasT20.AtualizarEfeitosAtivos
    Else
        modEstadoExcelT20.CalcularAtributosAgora
        modMagiasT20.AtualizarMagiasPersonagem True
        modPoderesClasseT20.AtualizarPoderesClasse True
        modRegrasT20.AtualizarEfeitosAtivos
    End If
    modPrincipalRostoT20.AtualizarRostoPrincipal

Saida:
    If modoRapidoIniciado Then modEstadoExcelT20.FinalizarModoRapido True
    Application.EnableCancelKey = xlInterrupt
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel atualizar a automacao do personagem: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub
' CODEX_T20_AUTO_END
