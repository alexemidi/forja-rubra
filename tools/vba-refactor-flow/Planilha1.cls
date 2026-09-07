Attribute VB_Name = "Planilha1"
Option Explicit

Private Sub Worksheet_Change(ByVal Target As Range)
    If Target.Areas.Count > 1 Then Exit Sub
    modFluxoT20.ProcessarAlteracaoPrincipal Me, Target.Cells(1, 1)
End Sub

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    If Target.Areas.Count > 1 Then Exit Sub

    If Intersect(Target.Cells(1, 1), Me.Range("B2,D2,F1:F2,G2," & modLayoutT20.CELULA_BENEFICIO_ORIGEM_1 & ":" & modLayoutT20.CELULA_BENEFICIO_ORIGEM_2 & ",G3:G4")) Is Nothing Then Exit Sub

    Cancel = True
    Select Case Target.Cells(1, 1).Address(False, False)
        Case "G3": modCriacaoT20.IniciarCriacaoPersonagem
        Case "G4": modFluxoT20.ResetarFichaCompleta
        Case modLayoutT20.CELULA_BENEFICIO_ORIGEM_1: modFluxoT20.ReescolherBeneficioOrigem 1
        Case modLayoutT20.CELULA_BENEFICIO_ORIGEM_2: modFluxoT20.ReescolherBeneficioOrigem 2
        Case "B2": modFluxoT20.ReprocessarFonte "raca"
        Case "D2": modFluxoT20.ReprocessarFonte "origem"
        Case "F2": modFluxoT20.ReprocessarFonte "classe"
        Case "G2": modFluxoT20.ReprocessarFonte "divindade"
        Case "F1": modFluxoT20.ReprocessarFonte "nivel"
    End Select
End Sub
