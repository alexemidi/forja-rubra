Attribute VB_Name = "modCriacaoT20"
Option Explicit

Public Sub ReverPericias()
    Dim modoRapidoIniciado As Boolean
    On Error GoTo TrataErro
    modEstadoExcelT20.IniciarModoRapido
    modoRapidoIniciado = True
    modAutomacaoT20.RecalcularTreinosTudo False
    modEstadoExcelT20.CalcularPericiasAgora
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
Saida:
    If modoRapidoIniciado Then modEstadoExcelT20.FinalizarModoRapido True
    Exit Sub
TrataErro:
    MsgBox "Nao foi possivel revisar as pericias: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Public Sub IniciarCriacaoPersonagem()
    Dim ws As Worksheet
    Dim escolha As String
    Dim modoRapidoIniciado As Boolean

    If MsgBox("Iniciar uma nova criacao limpa escolhas de classe, poderes, pericias e magias. Continuar?", vbYesNo + vbQuestion, "Forja T20") <> vbYes Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(modLayoutT20.PLANILHA_PRINCIPAL)

    On Error GoTo TrataErro
    modEstadoExcelT20.IniciarModoRapido
    modoRapidoIniciado = True
    LimparEstadoCriacao

    escolha = EscolherDaPlanilha("Escolha a raca.", "Dados", 3, 2)
    If Len(escolha) = 0 Then GoTo Saida
    ws.Range(modLayoutT20.CELULA_RACA).Value = escolha
    modAutomacaoT20.AtualizarAtributosDaRaca False
    modEstadoExcelT20.CalcularAtributosAgora

    escolha = EscolherDaPlanilha("Escolha a classe.", "Classes", 1, 2)
    If Len(escolha) = 0 Then GoTo Saida
    ws.Range(modLayoutT20.CELULA_CLASSE).Value = escolha
    modAutomacaoT20.RecalcularTreinosTudo False
    modEstadoExcelT20.CalcularPericiasAgora
    modRegrasT20.AtualizarEfeitosAtivos
    modMagiasT20.ForcarEscolhaCaminhoArcanista

    escolha = EscolherDaPlanilha("Escolha a origem geral ou regional.", "Base_Origens", 1, 2)
    If Len(escolha) = 0 Then GoTo Saida
    ws.Range(modLayoutT20.CELULA_ORIGEM).Value = escolha
    modOrigensT20.PrepararAlteracaoOrigem

    modPoderesClasseT20.AtualizarPoderesClasse False

    escolha = EscolherDaPlanilha("Escolha a divindade.", "Dados", 8, 2)
    If Len(escolha) > 0 Then ws.Range(modLayoutT20.CELULA_DIVINDADE).Value = escolha
    modPrincipalRostoT20.AtualizarDivindade ws
    escolha = EscolherDaPlanilha("Escolha o poder concedido.", "Dados", 9, 2)
    If Len(escolha) > 0 Then ws.Range("F42").Value = escolha

    modRegrasT20.AtualizarEfeitosAtivos
    modMagiasT20.AtualizarMagiasPersonagem False
    modPrincipalRostoT20.AtualizarRostoPrincipal
    modInventarioT20.AtualizarInventario False
    ws.Range("B8:E8").Calculate
    ws.Range("C8").Value = ws.Range("B8").Value
    ws.Range("E8").Value = ws.Range("D8").Value
    MsgBox "Criacao inicial concluida. Os itens podem ser escolhidos na mochila.", vbInformation, "Forja T20"

Saida:
    If modoRapidoIniciado Then modEstadoExcelT20.FinalizarModoRapido True
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel concluir a criacao: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Private Function EscolherDaPlanilha(ByVal titulo As String, ByVal planilha As String, ByVal coluna As Long, ByVal primeiraLinha As Long) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim opcoes As Collection
    Dim formulario As Object
    Dim valor As String

    Set ws = ThisWorkbook.Worksheets(planilha)
    ultimaLinha = ws.Cells(ws.Rows.Count, coluna).End(xlUp).Row
    Set opcoes = New Collection
    For r = primeiraLinha To ultimaLinha
        valor = Trim$(CStr(ws.Cells(r, coluna).Value))
        If Len(valor) > 0 Then AdicionarUnico opcoes, valor
    Next r
    If opcoes.Count = 0 Then Exit Function

    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherDaPlanilha = formulario.escolha
    Unload formulario
End Function

Private Sub LimparEstadoCriacao()
    LimparDados "Escolhas_Ativas", 2
    LimparDados "Poderes_Classe_Selecionados", 2
    LimparDados "Habilidades_Classe_Ativas", 2
    LimparDados "Magias_Conhecidas", 2
    LimparDados "Magias_Extras", 2
    With ThisWorkbook.Worksheets("Treino_Pericias")
        .Range("E2:L" & .Cells(.Rows.Count, 1).End(xlUp).Row).Value = False
        .Range("N2:N" & .Cells(.Rows.Count, 1).End(xlUp).Row).Value = False
    End With
End Sub

Private Sub LimparDados(ByVal nome As String, ByVal primeiraLinha As Long)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    On Error GoTo 0
    If ws Is Nothing Then Exit Sub
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultimaLinha >= primeiraLinha Then ws.Rows(CStr(primeiraLinha) & ":" & CStr(ultimaLinha)).ClearContents
End Sub

Private Sub AdicionarUnico(ByVal itens As Collection, ByVal valor As String)
    Dim item As Variant
    For Each item In itens
        If StrComp(CStr(item), valor, vbTextCompare) = 0 Then Exit Sub
    Next item
    itens.Add valor
End Sub
