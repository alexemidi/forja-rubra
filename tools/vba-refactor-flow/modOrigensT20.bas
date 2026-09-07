Attribute VB_Name = "modOrigensT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_ORIGENS As String = "Base_Origens"
Private Const PLANILHA_ESCOLHAS As String = "Escolhas_Ativas"

Public Function CodexOrigensT20Version() As String
    CodexOrigensT20Version = "T20 origens gerais-regionais 2026-08-28"
End Function

Public Sub PrepararAlteracaoOrigem()
    LimparEscolhasOrigem
    AtualizarComentarioOrigem
End Sub

Public Sub AtualizarComentarioOrigem()
    Dim wsP As Worksheet
    Dim wsO As Worksheet
    Dim origem As String
    Dim linha As Long
    Dim texto As String

    If Not PlanilhaExiste(PLANILHA_PRINCIPAL) Or Not PlanilhaExiste(PLANILHA_ORIGENS) Then Exit Sub
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsO = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    origem = Trim$(CStr(wsP.Range("D2").Value))

    On Error Resume Next
    wsP.Range("D2").ClearComments
    On Error GoTo 0
    If Len(origem) = 0 Then Exit Sub

    linha = linhaOrigem(origem)
    If linha = 0 Then Exit Sub
    texto = origem & vbCrLf & String$(44, "-") & vbCrLf
    texto = texto & "Tipo: " & CStr(wsO.Cells(linha, 7).Value) & vbCrLf
    If Len(Trim$(CStr(wsO.Cells(linha, 8).Value))) > 0 Then texto = texto & "Regiao: " & CStr(wsO.Cells(linha, 8).Value) & vbCrLf
    If Len(Trim$(CStr(wsO.Cells(linha, 9).Value))) > 0 Then
        texto = texto & vbCrLf & "Beneficio" & vbCrLf & CStr(wsO.Cells(linha, 9).Value) & vbCrLf
    Else
        texto = texto & vbCrLf & "Pericias: " & CStr(wsO.Cells(linha, 2).Value) & vbCrLf
        texto = texto & "Poderes: " & CStr(wsO.Cells(linha, 3).Value) & vbCrLf
        If Len(Trim$(CStr(wsO.Cells(linha, 4).Value))) > 0 Then texto = texto & "Poder unico: " & CStr(wsO.Cells(linha, 4).Value) & vbCrLf
    End If
    If Len(Trim$(CStr(wsO.Cells(linha, 6).Value))) > 0 Then texto = texto & vbCrLf & "Itens" & vbCrLf & CStr(wsO.Cells(linha, 6).Value)

    On Error Resume Next
    wsP.Range("D2").AddComment texto
    On Error GoTo 0
End Sub

Private Sub LimparEscolhasOrigem()
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim chave As String

    If Not PlanilhaExiste(PLANILHA_ESCOLHAS) Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = ultimaLinha To 2 Step -1
        chave = Trim$(CStr(ws.Cells(r, 1).Value))
        If StrComp(Left$(chave, Len("Origem|")), "Origem|", vbTextCompare) = 0 Then ws.Rows(r).Delete
    Next r
End Sub

Private Function linhaOrigem(ByVal origem As String) As Long
    Dim resultado As Variant
    resultado = Application.match(origem, ThisWorkbook.Worksheets(PLANILHA_ORIGENS).Columns(1), 0)
    If Not IsError(resultado) Then linhaOrigem = CLng(resultado)
End Function

Private Function PlanilhaExiste(ByVal nome As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    PlanilhaExiste = Not ws Is Nothing
    On Error GoTo 0
End Function

