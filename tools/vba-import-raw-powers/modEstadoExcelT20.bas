Attribute VB_Name = "modEstadoExcelT20"
Option Explicit

Private profundidadeModoRapido As Long
Private calculoAnterior As XlCalculation
Private eventosAnteriores As Boolean
Private telaAnterior As Boolean
Private barraStatusAnterior As Boolean
Private recalculoPendente As Boolean

Public Function CodexPerformanceVersion() As String
    CodexPerformanceVersion = "T20 atualizacao incremental 2026-08-28"
End Function

Public Sub IniciarModoRapido()
    If profundidadeModoRapido = 0 Then
        calculoAnterior = Application.Calculation
        eventosAnteriores = Application.EnableEvents
        telaAnterior = Application.ScreenUpdating
        barraStatusAnterior = Application.DisplayStatusBar
        recalculoPendente = False
    End If

    profundidadeModoRapido = profundidadeModoRapido + 1
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    Application.DisplayStatusBar = True
    Application.StatusBar = "Forja T20: atualizando ficha..."
    Application.Calculation = xlCalculationManual
End Sub

Public Function ModoRapidoAtivo() As Boolean
    ModoRapidoAtivo = (profundidadeModoRapido > 0)
End Function

Public Sub SolicitarRecalculo()
    If ModoRapidoAtivo Then
        recalculoPendente = True
    Else
        Application.Calculate
    End If
End Sub

Public Sub CalcularAtributosAgora()
    On Error Resume Next
    ThisWorkbook.Worksheets(modLayoutT20.PLANILHA_PRINCIPAL).Range("A4:F6").Calculate
    On Error GoTo 0
End Sub

Public Sub CalcularPericiasAgora()
    On Error Resume Next
    ThisWorkbook.Worksheets("Treino_Pericias").UsedRange.Calculate
    ThisWorkbook.Worksheets(modLayoutT20.PLANILHA_PRINCIPAL).Range("A4:N34").Calculate
    On Error GoTo 0
End Sub

Public Sub FinalizarModoRapido(Optional ByVal Recalcular As Boolean = True)
    If profundidadeModoRapido <= 0 Then
        RestaurarAutomacaoExcel Recalcular
        Exit Sub
    End If

    If Recalcular Then recalculoPendente = True
    profundidadeModoRapido = profundidadeModoRapido - 1
    If profundidadeModoRapido > 0 Then Exit Sub

    On Error Resume Next
    If recalculoPendente Then Application.Calculate
    recalculoPendente = False
    Application.Calculation = calculoAnterior
    Application.EnableEvents = eventosAnteriores
    Application.ScreenUpdating = telaAnterior
    Application.DisplayStatusBar = barraStatusAnterior
    Application.StatusBar = False
    On Error GoTo 0
End Sub

Public Sub RestaurarAutomacaoExcel(Optional ByVal RecalcularTudo As Boolean = False)
    On Error Resume Next
    If profundidadeModoRapido > 0 Then
        profundidadeModoRapido = 1
        FinalizarModoRapido RecalcularTudo
    Else
        Application.EnableEvents = True
        Application.ScreenUpdating = True
        Application.Calculation = xlCalculationAutomatic
        Application.StatusBar = False
        If RecalcularTudo Then Application.Calculate
    End If
    On Error GoTo 0
End Sub

Public Sub CodexRestaurarAutomacaoT20()
    RestaurarAutomacaoExcel True
End Sub
