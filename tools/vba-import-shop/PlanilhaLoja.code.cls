Option Explicit

Private Sub Worksheet_Change(ByVal Target As Range)
    If Target.CountLarge > 1 Then Exit Sub
    If Not modLojaT20.EhColunaConfiguracaoLoja(Me, Target.Row, Target.Column) Then Exit Sub

    On Error GoTo TrataErro
    Application.EnableEvents = False
    modLojaT20.ProcessarAlteracaoLoja Me, Target

Saida:
    Application.EnableEvents = True
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel atualizar a loja: " & Err.Description, vbExclamation, "Forja T20 - Loja"
    Resume Saida
End Sub

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    If Target.CountLarge > 1 Then Exit Sub
    If Target.Row < 2 Then Exit Sub
    If Len(Trim$(CStr(Me.Cells(Target.Row, 29).Value))) = 0 Then Exit Sub
    Cancel = True
    modLojaT20.MostrarDetalhesItem Target.Row
End Sub
