Attribute VB_Name = "modFluxoT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_ESCOLHAS As String = "Escolhas_Ativas"
Private Const ESTADO_CONCLUIDO As String = "CONCLUIDO"
Private Const ESTADO_CRIACAO As String = "EM_CRIACAO"

Private emProcessamento As Boolean
Private criacaoGuiada As Boolean

Public Function CodexFluxoT20Version() As String
    CodexFluxoT20Version = "T20 fluxo incremental por fonte 2026-08-29"
End Function

Public Sub ProcessarAlteracaoPrincipal(ByVal ws As Worksheet, ByVal alvo As Range)
    Dim endereco As String
    Dim rapido As Boolean

    If emProcessamento Then Exit Sub
    If Not AlteracaoMonitorada(ws, alvo) Then Exit Sub

    On Error GoTo TrataErro
    emProcessamento = True
    modEstadoExcelT20.IniciarModoRapido
    rapido = True
    endereco = alvo.Address(False, False)

    If EhCelulaInventario(ws, alvo) Then
        modInventarioT20.ProcessarAlteracaoInventario ws, alvo
    Else
        Select Case endereco
            Case "B2": ProcessarRaca True
            Case "D2": ProcessarOrigem True
            Case "F2": ProcessarClasse True
            Case "G2": ProcessarDivindade
            Case "F1": ProcessarNivel
            Case modLayoutT20.CELULA_BENEFICIO_ORIGEM_1: ProcessarBeneficioOrigem 1, vbNullString
            Case modLayoutT20.CELULA_BENEFICIO_ORIGEM_2: ProcessarBeneficioOrigem 2, vbNullString
            Case modLayoutT20.CELULA_PODER_DIVINDADE: ProcessarPoderConcedido
            Case modLayoutT20.CELULA_IDADE: ProcessarIdade
            Case modLayoutT20.CELULA_COMPLICACAO: ProcessarComplicacao
            Case modLayoutT20.CELULA_ATRIBUTO_MAGIA: ProcessarAtributoMagia
            Case Else
                If Not Intersect(alvo, ws.Range("A4:F5")) Is Nothing Then
                    ProcessarAtributos alvo
                Else
                    ProcessarResumoEfeitos
                End If
        End Select
    End If

Saida:
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    emProcessamento = False
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel atualizar esta parte da ficha: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Public Sub ReprocessarFonte(ByVal fonte As String)
    Dim rapido As Boolean
    If emProcessamento Then Exit Sub

    On Error GoTo TrataErro
    emProcessamento = True
    modEstadoExcelT20.IniciarModoRapido
    rapido = True

    Select Case LCase$(Trim$(fonte))
        Case "raca": ProcessarRaca True
        Case "classe": ProcessarClasse True
        Case "origem": ProcessarOrigem True
        Case "divindade": ProcessarDivindade
        Case "nivel": ProcessarNivel
    End Select

Saida:
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    emProcessamento = False
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel refazer as escolhas: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Public Sub ReescolherBeneficioOrigem(ByVal indice As Long)
    Dim rapido As Boolean
    If indice < 1 Or indice > 2 Or emProcessamento Then Exit Sub

    On Error GoTo TrataErro
    emProcessamento = True
    modEstadoExcelT20.IniciarModoRapido
    rapido = True
    ProcessarBeneficioOrigem indice, vbNullString

Saida:
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    emProcessamento = False
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel rever o beneficio de origem: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Public Sub IniciarCriacaoGuiada()
    modAssistenteCriacaoT20.IniciarCriacaoCompleta
End Sub

Public Sub LimparFichaParaCriacao()
    LimparFichaInterna False
End Sub

Public Sub ResetarFichaCompleta()
    Dim rapido As Boolean
    If MsgBox("Apagar todas as escolhas e voltar a ficha ao estado inicial?", vbYesNo + vbQuestion + vbDefaultButton2, "Forja T20 - Resetar") <> vbYes Then Exit Sub
    If emProcessamento Then Exit Sub

    On Error GoTo TrataErro
    emProcessamento = True
    modEstadoExcelT20.IniciarModoRapido
    rapido = True
    LimparFichaInterna False
    MsgBox "Ficha resetada.", vbInformation, "Forja T20"

Saida:
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    emProcessamento = False
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel resetar a ficha: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Public Sub InstalarFluxoOtimizado()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    ConfigurarBotoesFluxo ws
    modPoderesT20.AtualizarValidacaoBeneficiosOrigem
    modPrincipalRostoT20.AtualizarDivindade ws
    DefinirEstado "Fluxo|UltimaRaca", CStr(ws.Range("B2").Value)
    DefinirEstado "Fluxo|UltimaClasse", CStr(ws.Range("F2").Value)
    DefinirEstado "Fluxo|UltimaOrigem", CStr(ws.Range("D2").Value)
    DefinirEstado "Fluxo|Estado", ESTADO_CONCLUIDO
End Sub

Private Sub ProcessarRaca(ByVal dependenciasConcluidas As Boolean)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    ExcluirEscolhasPrefixo "Raca_"
    ExcluirEscolhasPrefixo "Raca|"
    LimparColunaTreino 10
    modAutomacaoT20.AtualizarAtributosDaRaca False
    modEstadoExcelT20.CalcularAtributosAgora

    If dependenciasConcluidas And FluxoJaConcluido Then
        modAutomacaoT20.AtualizarTreinoPorInteligencia False
        modAutomacaoT20.AtualizarTreinoRaca
        modEstadoExcelT20.CalcularPericiasAgora
        modPoderesT20.AtualizarPoderesEscopo "raca"
        modMagiasT20.AtualizarMagiasPersonagem False
    Else
        modPoderesT20.AtualizarPoderesEscopo "resumo"
        modMagiasT20.AtualizarMagiasPersonagem True
    End If

    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
    DefinirEstado "Fluxo|UltimaRaca", CStr(ws.Range("B2").Value)
End Sub

Private Sub ProcessarClasse(ByVal dependenciasConcluidas As Boolean)
    Dim ws As Worksheet
    Dim classeAnterior As String
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    classeAnterior = ValorEstado("Fluxo|UltimaClasse")

    modMagiasT20.ReiniciarEscolhasClasse classeAnterior
    If dependenciasConcluidas And FluxoJaConcluido Then
        modAutomacaoT20.RecalcularTreinosTudo False
        modEstadoExcelT20.CalcularPericiasAgora
        ConfirmarRequisitosAposPericias
        modPoderesT20.AtualizarPoderesEscopo "classe"
        modMagiasT20.AtualizarMagiasPersonagem False
    Else
        modPoderesT20.AtualizarPoderesEscopo "resumo"
        modMagiasT20.AtualizarMagiasPersonagem True
    End If

    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
    DefinirEstado "Fluxo|UltimaClasse", CStr(ws.Range("F2").Value)
End Sub

Private Sub ConfirmarRequisitosAposPericias()
    Dim classe As String
    classe = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("F2").Value))
    If Len(classe) = 0 Then Exit Sub

    Do While Not modPoderesT20.ConfirmarRequisitosClasse(classe)
        If Not modAssistenteCriacaoT20.ReescolherAtributosAtuais() Then Exit Do
        modAutomacaoT20.RecalcularTreinosTudo False
        modEstadoExcelT20.CalcularPericiasAgora
    Loop
End Sub

Private Sub ProcessarOrigem(ByVal dependenciasConcluidas As Boolean)
    modOrigensT20.PrepararAlteracaoOrigem
    modPoderesT20.AtualizarValidacaoBeneficiosOrigem
    modPoderesT20.AtualizarPoderesEscopo "origem"
    modEstadoExcelT20.CalcularPericiasAgora
    modRegrasT20.AtualizarEfeitosAtivos
    DefinirEstado "Fluxo|UltimaOrigem", CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("D2").Value)
End Sub

Private Sub ProcessarBeneficioOrigem(ByVal indice As Long, ByVal escolhaInicial As String)
    modPoderesT20.ReescolherBeneficioOrigem indice, escolhaInicial
    modEstadoExcelT20.CalcularPericiasAgora
    modRegrasT20.AtualizarEfeitosAtivos
End Sub

Private Sub ProcessarDivindade()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    If Not modAssistenteCriacaoT20.ConfirmarDivindadeAtual() Then
        ws.Range("G2").ClearContents
        ws.Range(modLayoutT20.CELULA_PODER_DIVINDADE).ClearContents
        modPrincipalRostoT20.AtualizarDivindade ws
        Exit Sub
    End If
    ws.Range(modLayoutT20.CELULA_PODER_DIVINDADE).ClearContents
    modPrincipalRostoT20.AtualizarDivindade ws
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
End Sub

Private Sub ProcessarPoderConcedido()
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
    modMagiasT20.AtualizarMagiasPersonagem True
    modPrincipalRostoT20.AtualizarRostoPrincipal
End Sub

Private Sub ProcessarNivel()
    modPoderesT20.AtualizarPoderesEscopo "classe"
    modMagiasT20.AtualizarMagiasPersonagem False
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
End Sub

Private Sub ProcessarIdade()
    ExcluirEscolhasPrefixo "Idade|"
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
End Sub

Private Sub ProcessarComplicacao()
    ExcluirEscolhasPrefixo "Complicacao|"
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
End Sub

Private Sub ProcessarAtributoMagia()
    modMagiasT20.AtualizarOverrideAtributoMagiaPorPainel
    modMagiasT20.AtualizarMagiasPersonagem True
    modRegrasT20.AtualizarEfeitosAtivos
End Sub

Private Sub ProcessarAtributos(ByVal alvo As Range)
    modEstadoExcelT20.CalcularAtributosAgora
    If alvo.Column = 4 Then modAutomacaoT20.AtualizarTreinoPorInteligencia False
    modEstadoExcelT20.CalcularPericiasAgora
    modMagiasT20.AtualizarMagiasPersonagem True
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos
End Sub

Private Sub ProcessarResumoEfeitos()
    modRegrasT20.AtualizarEfeitosAtivos
End Sub

Private Sub LimparFichaInterna(ByVal preservarAtributosBase As Boolean)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    LimparDados "Escolhas_Ativas", 2
    LimparDados "Poderes_Classe_Selecionados", 2
    LimparDados "Habilidades_Classe_Ativas", 2
    LimparDados "Magias_Conhecidas", 2
    LimparDados "Magias_Controle", 2
    LimparDados "Efeitos_Ativos", 2

    LimparTodosTreinos
    modAutomacaoT20.ResetarOficiosParaPadrao False
    ws.Range("B2,D2,F2,G2," & modLayoutT20.CELULA_IDADE & "," & modLayoutT20.CELULA_COMPLICACAO & "," & _
        modLayoutT20.CELULA_TIPO_BENEFICIO_ORIGEM_1 & ":" & modLayoutT20.CELULA_BENEFICIO_ORIGEM_2 & "," & _
        modLayoutT20.CELULA_PODER_DIVINDADE & "," & modLayoutT20.CELULA_ATRIBUTO_MAGIA).ClearContents
    ws.Range("F1").Value = 1
    ws.Range("A5:F5").Value = 0
    If Not preservarAtributosBase Then ws.Range("A4:F4").Value = 0
    modEstadoExcelT20.CalcularAtributosAgora
    ws.Range("C8,E8").Value = 0
    LimparConstantes ws.Range("A10:A14,G10:G14,A21:A22,D21:D22,A" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":B" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA) & ",D" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":E" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA_DIREITA) & "," & modLayoutT20.RANGE_ITENS_VESTIDOS & "," & modLayoutT20.CELULA_TIBARES_COBRE & ":" & modLayoutT20.CELULA_TIBARES_OURO)

    On Error Resume Next
    ws.Range(modLayoutT20.CELULA_BENEFICIO_ORIGEM_1 & ":" & modLayoutT20.CELULA_BENEFICIO_ORIGEM_2).Validation.Delete
    ws.Range(modLayoutT20.CELULA_PODER_DIVINDADE).Validation.Delete
    ws.Range(modLayoutT20.CELULA_ATRIBUTO_MAGIA).Validation.Delete
    On Error GoTo 0

    modPoderesT20.AtualizarValidacaoBeneficiosOrigem
    modPrincipalRostoT20.AtualizarDivindade ws
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modMagiasT20.AtualizarMagiasPersonagem True
    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
    modInventarioT20.AtualizarInventario False
    DefinirEstado "Fluxo|Estado", vbNullString
    DefinirEstado "Fluxo|UltimaRaca", vbNullString
    DefinirEstado "Fluxo|UltimaClasse", vbNullString
    DefinirEstado "Fluxo|UltimaOrigem", vbNullString
End Sub

Private Sub LimparTodosTreinos()
    Dim ws As Worksheet
    Dim ultima As Long
    Set ws = ThisWorkbook.Worksheets("Treino_Pericias")
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultima < 2 Then Exit Sub
    ws.Range(ws.Cells(2, 5), ws.Cells(ultima, 12)).Value = False
    ws.Range(ws.Cells(2, 14), ws.Cells(ultima, 14)).Value = False
End Sub

Private Sub LimparColunaTreino(ByVal coluna As Long)
    Dim ws As Worksheet
    Dim ultima As Long
    Set ws = ThisWorkbook.Worksheets("Treino_Pericias")
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultima >= 2 Then ws.Range(ws.Cells(2, coluna), ws.Cells(ultima, coluna)).Value = False
End Sub

Private Sub LimparConstantes(ByVal intervalo As Range)
    Dim celulas As Range
    On Error Resume Next
    Set celulas = intervalo.SpecialCells(xlCellTypeConstants)
    On Error GoTo 0
    If Not celulas Is Nothing Then celulas.ClearContents
End Sub

Private Sub LimparDados(ByVal nome As String, ByVal primeiraLinha As Long)
    Dim ws As Worksheet
    Dim ultima As Long
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    On Error GoTo 0
    If ws Is Nothing Then Exit Sub
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultima >= primeiraLinha Then ws.Rows(CStr(primeiraLinha) & ":" & CStr(ultima)).ClearContents
End Sub

Private Function FluxoJaConcluido() As Boolean
    Dim estado As String
    estado = ValorEstado("Fluxo|Estado")
    If MesmoTexto(estado, ESTADO_CRIACAO) Then Exit Function
    If MesmoTexto(estado, ESTADO_CONCLUIDO) Then
        FluxoJaConcluido = True
    ElseIf Not criacaoGuiada Then
        FluxoJaConcluido = True
    End If
End Function

Private Sub ExcluirEscolhasPrefixo(ByVal prefixo As String)
    Dim ws As Worksheet
    Dim ultima As Long
    Dim r As Long
    Dim chave As String
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = ultima To 2 Step -1
        chave = Trim$(CStr(ws.Cells(r, 1).Value))
        If StrComp(Left$(chave, Len(prefixo)), prefixo, vbTextCompare) = 0 Then ws.Rows(r).Delete
    Next r
End Sub

Private Function ValorEstado(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEstado = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEstado(ByVal chave As String, ByVal valor As String, Optional ByVal observacao As String = "")
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If IsError(resultado) Then
        linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
        ws.Cells(linha, 1).Value = chave
    Else
        linha = CLng(resultado)
    End If
    ws.Cells(linha, 2).Value = valor
    ws.Cells(linha, 3).Value = observacao
End Sub

Private Function EscolherDaPlanilha(ByVal titulo As String, ByVal planilha As String, ByVal coluna As Long, ByVal primeiraLinha As Long) As String
    Dim ws As Worksheet
    Dim ultima As Long
    Dim r As Long
    Dim opcoes As Collection
    Dim formulario As Object
    Dim valor As String

    Set ws = ThisWorkbook.Worksheets(planilha)
    ultima = ws.Cells(ws.Rows.Count, coluna).End(xlUp).Row
    Set opcoes = New Collection
    For r = primeiraLinha To ultima
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

Private Sub AdicionarUnico(ByVal itens As Collection, ByVal valor As String)
    Dim item As Variant
    For Each item In itens
        If MesmoTexto(item, valor) Then Exit Sub
    Next item
    itens.Add valor
End Sub

Private Function AlteracaoMonitorada(ByVal ws As Worksheet, ByVal alvo As Range) As Boolean
    AlteracaoMonitorada = Not Intersect(alvo, ws.Range("B2,D2,F1:F2,G2,A4:F5," & modLayoutT20.CELULA_IDADE & "," & modLayoutT20.CELULA_COMPLICACAO & "," & modLayoutT20.CELULA_BENEFICIO_ORIGEM_1 & ":" & modLayoutT20.CELULA_BENEFICIO_ORIGEM_2 & "," & modLayoutT20.CELULA_PODER_DIVINDADE & "," & modLayoutT20.CELULA_ATRIBUTO_MAGIA & ",B17,A10:A14,G10:G14,A21:A22,D21:D22,A" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":B" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA) & ",D" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":E" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA_DIREITA) & "," & modLayoutT20.RANGE_ITENS_VESTIDOS & "," & modLayoutT20.CELULA_TIBARES_COBRE & ":" & modLayoutT20.CELULA_TIBARES_OURO)) Is Nothing
End Function

Private Function EhCelulaInventario(ByVal ws As Worksheet, ByVal alvo As Range) As Boolean
    EhCelulaInventario = Not Intersect(alvo, ws.Range("A10:A14,G10:G14,A21:A22,D21:D22,A" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":B" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA) & ",D" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":E" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA_DIREITA) & "," & modLayoutT20.RANGE_ITENS_VESTIDOS & "," & modLayoutT20.CELULA_TIBARES_COBRE & ":" & modLayoutT20.CELULA_TIBARES_OURO)) Is Nothing
End Function

Private Sub ConfigurarBotoesFluxo(ByVal ws As Worksheet)
    On Error Resume Next
    ws.Shapes("btnIniciarCriacao").Delete
    ws.Shapes("btnResetarFicha").Delete
    ws.Shapes("Button 178").Delete
    On Error GoTo 0

    ws.Range("G3:G4").ClearContents
    CriarBotaoFluxo ws, "btnIniciarCriacao", ws.Range("G3"), "INICIAR", _
        RGB(31, 122, 78), RGB(24, 92, 60), "modCriacaoT20.IniciarCriacaoPersonagem"
    CriarBotaoFluxo ws, "btnResetarFicha", ws.Range("G4"), "RESETAR", _
        RGB(166, 48, 48), RGB(118, 31, 31), "modFluxoT20.ResetarFichaCompleta"
End Sub

Private Sub CriarBotaoFluxo(ByVal ws As Worksheet, ByVal nome As String, ByVal celula As Range, _
    ByVal texto As String, ByVal corFundo As Long, ByVal corLinha As Long, ByVal macro As String)
    Dim forma As Shape
    Set forma = ws.Shapes.AddShape(5, celula.Left + 2, celula.Top + 1, celula.Width - 4, celula.Height - 2)
    With forma
        .Name = nome
        .Fill.Visible = -1
        .Fill.ForeColor.RGB = corFundo
        .Line.Visible = -1
        .Line.ForeColor.RGB = corLinha
        .Line.Weight = 0.75
        .TextFrame2.TextRange.Text = texto
        .TextFrame2.TextRange.ParagraphFormat.Alignment = 2
        .TextFrame2.VerticalAnchor = 3
        .TextFrame2.MarginLeft = 1
        .TextFrame2.MarginRight = 1
        .TextFrame2.MarginTop = 0
        .TextFrame2.MarginBottom = 0
        .TextFrame2.TextRange.Font.Name = "Calibri"
        .TextFrame2.TextRange.Font.Size = 8
        .TextFrame2.TextRange.Font.Bold = -1
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .OnAction = "'" & ThisWorkbook.Name & "'!" & macro
        .Placement = xlMoveAndSize
    End With
End Sub

Private Function TextoNaoDevoto() As String
    TextoNaoDevoto = "N" & ChrW$(227) & "o devoto"
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function
