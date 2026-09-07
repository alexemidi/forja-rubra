Attribute VB_Name = "modAssistenteCriacaoT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_ESCOLHAS As String = "Escolhas_Ativas"
Private Const SEP_FORM As String = "|#|"
Private Const TEXTO_NAO_DEVOTO As String = "Nao devoto"

Public Function CodexAssistenteVersion() As String
    CodexAssistenteVersion = "T20 assistente de criacao por fases 2026-08-30"
End Function

Public Sub IniciarCriacaoCompleta()
    Dim ws As Worksheet
    Dim nivel As Long
    Dim raca As String
    Dim classe As String
    Dim origem As String
    Dim divindade As String
    Dim rapido As Boolean
    Dim concluido As Boolean

    If MsgBox("Iniciar uma nova criacao apaga as escolhas atuais da ficha. Continuar?", _
        vbYesNo + vbQuestion + vbDefaultButton2, "Forja T20 - Iniciar") <> vbYes Then Exit Sub

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    On Error GoTo TrataErro
    modEstadoExcelT20.IniciarModoRapido
    rapido = True
    modFluxoT20.LimparFichaParaCriacao
    DefinirEstado "Fluxo|Estado", "EM_CRIACAO", "Criacao guiada em andamento."

    DefinirFase "0_NIVEL", "Fase 0 de 12 - Nivel"
    nivel = EscolherNivelInicial()
    If nivel = 0 Then GoTo Cancelada
    ws.Range("F1").Value = nivel

    DefinirFase "1_ATRIBUTOS", "Fase 1 de 12 - Atributos"
    If Not EscolherAtributosBase(ws) Then GoTo Cancelada
    modEstadoExcelT20.CalcularAtributosAgora

    DefinirFase "2_RACA", "Fase 2 de 12 - Raca"
    raca = EscolherRacaCatalogo()
    If Len(raca) = 0 Then GoTo Cancelada
    ws.Range("B2").Value = raca
    modAutomacaoT20.AtualizarAtributosDaRaca False
    modEstadoExcelT20.CalcularAtributosAgora
    DefinirEstado "Fluxo|UltimaRaca", raca

    DefinirFase "3_CLASSE", "Fase 3 de 12 - Classe"
    classe = EscolherClasseCatalogo()
    If Len(classe) = 0 Then GoTo Cancelada
    ws.Range("F2").Value = classe
    modMagiasT20.ReiniciarEscolhasClasse vbNullString
    modRegrasT20.AtualizarEfeitosAtivos
    DefinirEstado "Fluxo|UltimaClasse", classe

    DefinirFase "4_PERICIAS_CLASSE", "Fase 4 de 12 - Pericias de classe"
    modAutomacaoT20.RecalcularTreinosClasseSomente False
    modEstadoExcelT20.CalcularPericiasAgora

    DefinirFase "5_ORIGEM", "Fase 5 de 12 - Origem"
    origem = EscolherOrigemCatalogo()
    If Len(origem) = 0 Then GoTo Cancelada
    ws.Range("D2").Value = origem
    modOrigensT20.PrepararAlteracaoOrigem
    DefinirEstado "Fluxo|UltimaOrigem", origem

    DefinirFase "6_BENEFICIOS_ORIGEM", "Fase 6 de 12 - Beneficios da origem"
    modPoderesT20.AtualizarPoderesEscopo "origem"
    modEstadoExcelT20.CalcularPericiasAgora

    DefinirFase "7_PERICIAS_INT", "Fase 7 de 12 - Pericias por Inteligencia"
    modAutomacaoT20.AtualizarTreinoPorInteligencia True
    modEstadoExcelT20.CalcularPericiasAgora

    DefinirFase "8_RACA_PODERES", "Fase 8 de 12 - Pericias e poderes da raca"
    modAutomacaoT20.AtualizarTreinoRaca
    modEstadoExcelT20.CalcularPericiasAgora
    modPoderesT20.AtualizarPoderesEscopo "raca"

    Do While Not modPoderesT20.ConfirmarRequisitosClasse(classe)
        If Not ReescolherAtributosAtuais() Then Exit Do
        modAutomacaoT20.RecalcularTreinosTudo False
        modEstadoExcelT20.CalcularPericiasAgora
    Loop

    DefinirFase "8_2_PODERES_CLASSE", "Fase 8 de 12 - Poderes por nivel"
    modPoderesT20.AtualizarPoderesEscopo "classe"

    DefinirFase "9_DIVINDADE", "Fase 9 de 12 - Divindade"
    divindade = EscolherDivindadeCatalogo(classe, raca)
    If Len(divindade) = 0 Then GoTo Cancelada
    If EhNaoDevoto(divindade) Then
        ws.Range("G2").Value = TextoNaoDevotoPlanilha()
    Else
        ws.Range("G2").Value = divindade
    End If
    modPrincipalRostoT20.AtualizarDivindade ws

    DefinirFase "9_2_PODER_CONCEDIDO", "Fase 9 de 12 - Poder concedido"
    If Not EhNaoDevoto(divindade) Then
        ws.Range(modLayoutT20.CELULA_PODER_DIVINDADE).Value = EscolherPoderConcedidoCatalogo(divindade)
    Else
        ws.Range(modLayoutT20.CELULA_PODER_DIVINDADE).ClearContents
    End If
    modPoderesT20.AtualizarPoderesEscopo "resumo"
    modRegrasT20.AtualizarEfeitosAtivos

    DefinirFase "10_MAGIAS", "Fase 10 de 12 - Magias"
    modMagiasT20.EscolherMagiasCriacaoGuiada

    DefinirFase "11_ITENS_INICIAIS", "Fase 11 de 12 - Itens iniciais"
    modRegrasT20.AtualizarEfeitosAtivos
    EscolherItensIniciais nivel, classe, origem

    DefinirFase "12_LOJA", "Fase 12 de 12 - Loja"
    If nivel >= 2 Then ExecutarLojaInicial nivel

    modRegrasT20.AtualizarEfeitosAtivos
    modPrincipalRostoT20.AtualizarRostoPrincipal
    modInventarioT20.AtualizarInventario False
    modMagiasT20.AtualizarMagiasPersonagem True
    DefinirEstado "Fluxo|Estado", "CONCLUIDO", "Criacao guiada concluida."
    DefinirEstado "Fluxo|Etapa", "CONCLUIDA"
    concluido = True
    MsgBox "Criacao inicial concluida.", vbInformation, "Forja T20"
    GoTo Saida

Cancelada:
    DefinirEstado "Fluxo|Estado", "PAUSADO", "Criacao interrompida pelo usuario."
    MsgBox "Criacao interrompida na etapa atual.", vbInformation, "Forja T20"

Saida:
    Application.StatusBar = False
    If rapido Then modEstadoExcelT20.FinalizarModoRapido True
    If concluido Then ws.Activate
    Exit Sub

TrataErro:
    DefinirEstado "Fluxo|Estado", "ERRO", Err.Description
    MsgBox "Nao foi possivel concluir a criacao: " & Err.Description, vbExclamation, "Forja T20"
    Resume Saida
End Sub

Private Function EscolherNivelInicial() As Long
    Dim resposta As Variant
    Do
        resposta = Application.InputBox("Nivel inicial do personagem (1 a 20):", "Forja T20 - Nivel", 1, Type:=1)
        If VarType(resposta) = vbBoolean Then
            If resposta = False Then Exit Function
        End If
        If IsNumeric(resposta) Then
            If CDbl(resposta) = Fix(CDbl(resposta)) Then
                If CLng(resposta) >= 1 And CLng(resposta) <= 20 Then
                    EscolherNivelInicial = CLng(resposta)
                    Exit Function
                End If
            End If
        End If
        MsgBox "Informe um nivel inteiro entre 1 e 20.", vbExclamation, "Forja T20"
    Loop
End Function

Private Function EscolherRacaCatalogo() As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim nome As String

    Set ws = ThisWorkbook.Worksheets("Ra" & ChrW$(231) & "as")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        nome = Trim$(CStr(ws.Cells(r, 1).Value))
        If Len(nome) > 0 Then AdicionarOpcaoCatalogoUnica opcoes, nome, nome, DetalheRaca(ws, r, nome)
    Next r
    EscolherRacaCatalogo = EscolherCatalogo("Escolha a raca. Consulte os atributos e as habilidades raciais ao lado.", opcoes)
End Function

Private Function DetalheRaca(ByVal wsRaca As Worksheet, ByVal linhaRaca As Long, ByVal raca As String) As String
    Dim texto As String
    Dim codigos As Variant
    Dim nomes As Variant
    Dim i As Long
    Dim valor As Long
    Dim qtdFlex As Long
    Dim qtdPericias As Long
    Dim wsH As Worksheet
    Dim ultima As Long
    Dim r As Long

    codigos = Array("FOR", "DES", "CON", "INT", "SAB", "CAR")
    nomes = Array("For" & ChrW$(231) & "a", "Destreza", "Constitui" & ChrW$(231) & ChrW$(227) & "o", _
        "Intelig" & ChrW$(234) & "ncia", "Sabedoria", "Carisma")
    texto = raca & vbCrLf & String$(48, "-") & vbCrLf & "ATRIBUTOS" & vbCrLf
    For i = 0 To 5
        valor = CLng(Val(CStr(wsRaca.Cells(linhaRaca, i + 2).Value)))
        If valor <> 0 Then texto = texto & CStr(nomes(i)) & ": " & IIf(valor > 0, "+", vbNullString) & CStr(valor) & vbCrLf
    Next i

    qtdFlex = CLng(Val(CStr(wsRaca.Cells(linhaRaca, 8).Value)))
    If qtdFlex > 0 Then
        texto = texto & "Escolhas de atributo: " & CStr(qtdFlex)
        If Len(Trim$(CStr(wsRaca.Cells(linhaRaca, 9).Value))) > 0 Then texto = texto & " entre " & CStr(wsRaca.Cells(linhaRaca, 9).Value)
        texto = texto & vbCrLf
    End If
    qtdPericias = CLng(Val(CStr(wsRaca.Cells(linhaRaca, 10).Value)))
    If qtdPericias > 0 Then
        texto = texto & "Pericias raciais: escolha " & CStr(qtdPericias)
        If Len(Trim$(CStr(wsRaca.Cells(linhaRaca, 11).Value))) > 0 Then texto = texto & " entre " & CStr(wsRaca.Cells(linhaRaca, 11).Value)
        texto = texto & vbCrLf
    End If

    texto = texto & vbCrLf & "HABILIDADES RACIAIS" & vbCrLf
    Set wsH = ThisWorkbook.Worksheets("Base_Habilidades_Raca")
    ultima = wsH.Cells(wsH.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(wsH.Cells(r, 2).Value, raca) Then
            texto = texto & vbCrLf & CStr(wsH.Cells(r, 4).Value) & vbCrLf
            texto = texto & CStr(wsH.Cells(r, 5).Value) & vbCrLf
        End If
    Next r
    DetalheRaca = texto
End Function

Private Function EscolherAtributosBase(ByVal ws As Worksheet) As Boolean
    Dim formulario As Object
    Dim i As Long

    Set formulario = VBA.UserForms.Add("frmAtributosT20")
    formulario.Carregar
    formulario.Show vbModal
    If Not formulario.Cancelado Then
        For i = 1 To 6
            ws.Cells(4, i).Value = formulario.ValorAtributo(i)
        Next i
        EscolherAtributosBase = True
    End If
    Unload formulario
End Function

Public Function ReescolherAtributosAtuais() As Boolean
    Dim ws As Worksheet
    Dim formulario As Object
    Dim i As Long

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set formulario = VBA.UserForms.Add("frmAtributosT20")
    formulario.Carregar CLng(Val(CStr(ws.Range("A4").Value))), CLng(Val(CStr(ws.Range("B4").Value))), _
        CLng(Val(CStr(ws.Range("C4").Value))), CLng(Val(CStr(ws.Range("D4").Value))), _
        CLng(Val(CStr(ws.Range("E4").Value))), CLng(Val(CStr(ws.Range("F4").Value)))
    formulario.Show vbModal
    If Not formulario.Cancelado Then
        For i = 1 To 6
            ws.Cells(4, i).Value = formulario.ValorAtributo(i)
        Next i
        modEstadoExcelT20.CalcularAtributosAgora
        ReescolherAtributosAtuais = True
    End If
    Unload formulario
End Function

Private Function EscolherClasseCatalogo() As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim nome As String
    Dim classeId As String

    Set ws = ThisWorkbook.Worksheets("Base_Classes_TXT")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        classeId = Trim$(CStr(ws.Cells(r, 1).Value))
        nome = Trim$(CStr(ws.Cells(r, 2).Value))
        If Len(nome) > 0 Then opcoes.Add OpcaoCatalogo(nome, nome, "SIM", DetalheClasse(ws, r, classeId))
    Next r
    EscolherClasseCatalogo = EscolherCatalogo("Escolha a classe. As habilidades exibidas sao as recebidas no 1o nivel.", opcoes)
End Function

Private Function DetalheClasse(ByVal ws As Worksheet, ByVal linha As Long, ByVal classeId As String) As String
    Dim texto As String
    Dim wsH As Worksheet
    Dim ultima As Long
    Dim r As Long

    texto = CStr(ws.Cells(linha, 2).Value) & vbCrLf & String$(42, "-") & vbCrLf
    AdicionarDetalhe texto, "Pontos de vida", ws.Cells(linha, 5).Value
    AdicionarDetalhe texto, "Pontos de mana", ws.Cells(linha, 6).Value
    AdicionarDetalhe texto, "Pericias", ws.Cells(linha, 7).Value
    AdicionarDetalhe texto, "Proficiencias", ws.Cells(linha, 8).Value
    texto = texto & vbCrLf & "HABILIDADES DO 1o NIVEL" & vbCrLf

    Set wsH = ThisWorkbook.Worksheets("Base_Habilidades_Classe_TXT")
    ultima = wsH.Cells(wsH.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(wsH.Cells(r, 1).Value, classeId) And CLng(Val(CStr(wsH.Cells(r, 3).Value))) = 1 Then
            texto = texto & vbCrLf & CStr(wsH.Cells(r, 4).Value) & vbCrLf & CStr(wsH.Cells(r, 5).Value) & vbCrLf
        End If
    Next r
    DetalheClasse = texto
End Function

Private Function EscolherOrigemCatalogo() As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim nome As String
    Dim tipo As String

    Set ws = ThisWorkbook.Worksheets("Base_Origens")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        nome = Trim$(CStr(ws.Cells(r, 1).Value))
        tipo = Trim$(CStr(ws.Cells(r, 7).Value))
        If Len(nome) > 0 Then opcoes.Add OpcaoCatalogo(nome & IIf(Len(tipo) > 0, " [" & tipo & "]", vbNullString), nome, "SIM", DetalheOrigem(ws, r))
    Next r
    EscolherOrigemCatalogo = EscolherCatalogo("Escolha uma origem geral ou regional.", opcoes)
End Function

Private Function DetalheOrigem(ByVal ws As Worksheet, ByVal linha As Long) As String
    Dim texto As String
    texto = CStr(ws.Cells(linha, 1).Value) & vbCrLf & String$(42, "-") & vbCrLf
    AdicionarDetalhe texto, "Tipo", ws.Cells(linha, 7).Value
    AdicionarDetalhe texto, "Regiao", ws.Cells(linha, 8).Value
    texto = texto & vbCrLf & "BENEFICIOS POSSIVEIS" & vbCrLf
    AdicionarDetalhe texto, "Pericias", ws.Cells(linha, 2).Value
    AdicionarDetalhe texto, "Poderes", ws.Cells(linha, 3).Value
    AdicionarDetalhe texto, "Poder unico", ws.Cells(linha, 4).Value
    AdicionarDetalhe texto, "Descricao", ws.Cells(linha, 5).Value
    AdicionarDetalhe texto, "Beneficio fixo", ws.Cells(linha, 9).Value
    texto = texto & vbCrLf & "ITENS" & vbCrLf & CStr(ws.Cells(linha, 6).Value)
    DetalheOrigem = texto
End Function

Private Function EscolherDivindadeCatalogo(ByVal classe As String, ByVal raca As String) As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim vistos As Object
    Dim ultima As Long
    Dim r As Long
    Dim deus As String
    Dim obrigatorio As Boolean
    Dim permitido As Boolean
    Dim escolha As String

    If MesmoTexto(classe, "Usurpador") Then
        EscolherDivindadeCatalogo = TEXTO_NAO_DEVOTO
        Exit Function
    End If
    obrigatorio = ClasseExigeDivindade(classe)

    Set ws = ThisWorkbook.Worksheets("Base_Deuses")
    Set opcoes = New Collection
    Set vistos = CreateObject("Scripting.Dictionary")
    If Not obrigatorio Then opcoes.Add OpcaoCatalogo("Nao devoto", TEXTO_NAO_DEVOTO, "SIM", "O personagem nao segue uma divindade e nao recebe poder concedido.")

    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        deus = Trim$(CStr(ws.Cells(r, 1).Value))
        If Len(deus) > 0 And Not vistos.Exists(LCase$(deus)) Then
            vistos.Add LCase$(deus), True
            permitido = DivindadePermitida(ws, r, classe, raca)
            opcoes.Add OpcaoCatalogo(deus & IIf(permitido, vbNullString, " (restrito)"), deus, "SIM", DetalheDivindade(ws, r, deus))
        End If
    Next r

    Do
        escolha = EscolherCatalogo("Escolha a divindade.", opcoes)
        If Len(escolha) > 0 Then
            If EhNaoDevoto(escolha) Or DivindadeEscolhidaPermitida(escolha, classe, raca) Or ConfirmarDevocaoRestrita(escolha) Then
                EscolherDivindadeCatalogo = escolha
                Exit Function
            End If
        End If
        If Not obrigatorio Then Exit Function
        MsgBox "Esta classe deve escolher uma divindade.", vbExclamation, "Forja T20"
    Loop
End Function

Public Function ConfirmarDivindadeAtual() As Boolean
    Dim ws As Worksheet
    Dim deus As String
    Dim classe As String
    Dim raca As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    deus = Trim$(CStr(ws.Range("G2").Value))
    classe = Trim$(CStr(ws.Range("F2").Value))
    raca = Trim$(CStr(ws.Range("B2").Value))
    If Len(deus) = 0 Then
        ConfirmarDivindadeAtual = True
    ElseIf EhNaoDevoto(deus) Then
        If ClasseExigeDivindade(classe) Then
            MsgBox "Esta classe deve escolher uma divindade.", vbExclamation, "Forja T20 - Devo" & ChrW$(231) & ChrW$(227) & "o"
        Else
            ConfirmarDivindadeAtual = True
        End If
    ElseIf DivindadeEscolhidaPermitida(deus, classe, raca) Then
        ConfirmarDivindadeAtual = True
    Else
        ConfirmarDivindadeAtual = ConfirmarDevocaoRestrita(deus)
    End If
End Function

Private Function DivindadeEscolhidaPermitida(ByVal deus As String, ByVal classe As String, ByVal raca As String) As Boolean
    Dim ws As Worksheet
    Dim ultima As Long
    Dim linha As Long

    If EhNaoDevoto(deus) Then
        DivindadeEscolhidaPermitida = Not ClasseExigeDivindade(classe)
        Exit Function
    End If
    Set ws = ThisWorkbook.Worksheets("Base_Deuses")
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For linha = 2 To ultima
        If MesmoTexto(ws.Cells(linha, 1).Value, deus) Then
            DivindadeEscolhidaPermitida = DivindadePermitida(ws, linha, classe, raca)
            Exit Function
        End If
    Next linha
    DivindadeEscolhidaPermitida = True
End Function

Private Function EhNaoDevoto(ByVal valor As String) As Boolean
    EhNaoDevoto = (Replace(Normalizar(valor), " ", vbNullString) = "naodevoto")
End Function

Private Function ClasseExigeDivindade(ByVal classe As String) As Boolean
    Select Case Normalizar(classe)
        Case "clerigo", "druida", "paladino", "frade", "santo"
            ClasseExigeDivindade = True
    End Select
End Function

Private Function ConfirmarDevocaoRestrita(ByVal deus As String) As Boolean
    Dim mensagem As String
    mensagem = "Esse deus n" & ChrW$(227) & "o te aceita, mas se voc" & ChrW$(234) & _
        " rezar insistindo muito (e o mestre permitir), quem sabe ele n" & ChrW$(227) & "o te aceite." & vbCrLf & vbCrLf & _
        "Manter a devo" & ChrW$(231) & ChrW$(227) & "o a " & deus & " mesmo assim?"
    ConfirmarDevocaoRestrita = (MsgBox(mensagem, vbYesNo + vbQuestion + vbDefaultButton2, "Forja T20 - Devo" & ChrW$(231) & ChrW$(227) & "o") = vbYes)
End Function

Private Function DetalheDivindade(ByVal ws As Worksheet, ByVal linha As Long, ByVal deus As String) As String
    Dim texto As String
    Dim poderes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim item As Variant

    texto = deus & vbCrLf & String$(42, "-") & vbCrLf
    AdicionarDetalhe texto, "Simbolo", ws.Cells(linha, 3).Value
    AdicionarDetalhe texto, "Energia", ws.Cells(linha, 4).Value
    AdicionarDetalhe texto, "Arma preferida", ws.Cells(linha, 5).Value
    AdicionarDetalhe texto, "Obrigacoes e restricoes", ws.Cells(linha, 6).Value
    AdicionarDetalhe texto, "Racas devotas", ws.Cells(linha, 7).Value
    AdicionarDetalhe texto, "Classes devotas", ws.Cells(linha, 8).Value
    Set poderes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(ws.Cells(r, 1).Value, deus) Then AdicionarUnico poderes, CStr(ws.Cells(r, 2).Value)
    Next r
    texto = texto & vbCrLf & "PODERES CONCEDIDOS" & vbCrLf
    For Each item In poderes
        texto = texto & CStr(item) & vbCrLf
    Next item
    DetalheDivindade = texto
End Function

Private Function DivindadePermitida(ByVal ws As Worksheet, ByVal linha As Long, ByVal classe As String, ByVal raca As String) As Boolean
    Dim listaRacas As String
    Dim listaClasses As String
    Dim restringeRaca As Boolean
    Dim restringeClasse As Boolean

    listaRacas = CStr(ws.Cells(linha, 7).Value)
    listaClasses = CStr(ws.Cells(linha, 8).Value)
    restringeRaca = ListaTemRestricao(listaRacas)
    restringeClasse = ListaTemRestricao(listaClasses)

    If restringeRaca And restringeClasse Then
        DivindadePermitida = ListaPermite(listaRacas, raca) Or ListaPermite(listaClasses, classe)
    ElseIf restringeRaca Then
        DivindadePermitida = ListaPermite(listaRacas, raca)
    ElseIf restringeClasse Then
        DivindadePermitida = ListaPermite(listaClasses, classe)
    Else
        DivindadePermitida = True
    End If
End Function

Private Function ListaTemRestricao(ByVal lista As String) As Boolean
    Dim base As String
    base = Normalizar(lista)
    ListaTemRestricao = (Len(base) > 0 And _
        InStr(1, base, "todas", vbTextCompare) = 0 And _
        InStr(1, base, "todos", vbTextCompare) = 0)
End Function

Private Function ListaPermite(ByVal lista As String, ByVal valor As String) As Boolean
    Dim base As String
    Dim termo As String
    base = Normalizar(lista)
    termo = Normalizar(valor)
    If Len(base) = 0 Or InStr(1, base, "todas", vbTextCompare) > 0 Or InStr(1, base, "todos", vbTextCompare) > 0 Then
        ListaPermite = True
    ElseIf Len(termo) = 0 Then
        ListaPermite = True
    Else
        base = Replace(base, "oes", "ao")
        ListaPermite = (InStr(1, base, termo, vbTextCompare) > 0)
    End If
End Function

Private Function EscolherPoderConcedidoCatalogo(ByVal divindade As String) As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim nome As String
    Dim detalhe As String

    Set ws = ThisWorkbook.Worksheets("Base_Deuses")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(ws.Cells(r, 1).Value, divindade) Then
            nome = Trim$(CStr(ws.Cells(r, 2).Value))
            If Len(nome) > 0 Then
                detalhe = modPoderesT20.DetalhePoderCatalogoPorNome(nome)
                If Len(detalhe) = 0 Then detalhe = "Poder concedido por " & divindade & "."
                AdicionarOpcaoCatalogoUnica opcoes, nome, nome, detalhe
            End If
        End If
    Next r
    If opcoes.Count > 0 Then EscolherPoderConcedidoCatalogo = EscolherCatalogo("Escolha o poder concedido por " & divindade & ".", opcoes)
End Function

Private Sub EscolherItensIniciais(ByVal nivel As Long, ByVal classe As String, ByVal origem As String)
    Dim opcoes As Collection
    Dim escolha As String

    If nivel = 1 Then
        AdicionarItemMochila "Mochila", 1
        AdicionarItemMochila "Saco de Dormir", 1
        AdicionarItemMochila "Traje de Viajante", 1

        escolha = EscolherItemCategoria("simples", "Escolha uma arma simples inicial.", True)
        If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1

        If TemProficiencia("armas_marciais") Then
            escolha = EscolherItemCategoria("marcial", "Escolha uma arma marcial inicial.", True)
            If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1
        End If

        If Not MesmoTexto(classe, "Arcanista") Then
            Set opcoes = New Collection
            AdicionarItemExato opcoes, "Armadura de Couro"
            AdicionarItemExato opcoes, "Couro Batido"
            AdicionarItemExato opcoes, "Gib" & ChrW$(227) & "o de Peles"
            If TemProficiencia("armaduras_pesadas") Then AdicionarItemExato opcoes, "Brunea"
            escolha = EscolherCatalogo("Escolha a armadura inicial.", opcoes)
            If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1
        End If

        If TemProficiencia("escudos") Then AdicionarItemMochila NomeItemBase("Escudo Leve"), 1
    End If

    AdicionarItensOrigem origem
    AdicionarItemHeranca origem
    AdicionarItensClasse classe
    modInventarioT20.AtualizarInventario False
End Sub

Private Sub AdicionarItensOrigem(ByVal origem As String)
    Dim ws As Worksheet
    Dim linha As Variant
    Dim itens As Variant
    Dim item As Variant
    Dim texto As String
    Dim escolha As String

    If Len(origem) = 0 Then Exit Sub
    Set ws = ThisWorkbook.Worksheets("Base_Origens")
    linha = Application.Match(origem, ws.Columns(1), 0)
    If IsError(linha) Then Exit Sub
    itens = Split(CStr(ws.Cells(CLng(linha), 6).Value), ";")
    For Each item In itens
        texto = Trim$(CStr(item))
        If Len(texto) = 0 Then GoTo Proximo
        If Left$(texto, 2) = "T$" Then
            ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range(modLayoutT20.CELULA_TIBARES).Value = _
                Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range(modLayoutT20.CELULA_TIBARES).Value)) + ValorTibarTexto(texto)
        ElseIf Len(NomeItemBase(texto)) > 0 Then
            AdicionarItemMochila NomeItemBase(texto), 1
        ElseIf InStr(1, Normalizar(texto), "arma simples ou marcial", vbTextCompare) > 0 Then
            escolha = EscolherArmaSimplesOuMarcial("Item da origem: escolha uma arma simples ou marcial.")
            If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1
        ElseIf InStr(1, Normalizar(texto), "arma marcial", vbTextCompare) > 0 Then
            escolha = EscolherItemCategoria("marcial", "Item da origem: escolha uma arma marcial.")
            If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1
        ElseIf InStr(1, Normalizar(texto), "arma simples", vbTextCompare) > 0 Then
            escolha = EscolherItemCategoria("simples", "Item da origem: escolha uma arma simples.")
            If Len(escolha) > 0 Then AdicionarItemMochila escolha, 1
        Else
            escolha = EscolherAlternativaItem(texto)
            If Len(escolha) > 0 Then
                AdicionarItemMochila escolha, 1
            Else
                AdicionarItemMochila texto, 1
            End If
        End If
Proximo:
    Next item
End Sub

Private Sub AdicionarItemHeranca(ByVal origem As String)
    Dim quantidade As Long
    Dim limite As Double
    Dim escolha As String

    If Not MesmoTexto(origem, "Herdeiro") Then Exit Sub
    quantidade = QuantidadeBeneficioHeranca(origem)
    If quantidade = 0 Then Exit Sub

    limite = 1000# * quantidade
    escolha = EscolherItemFiltrado("Heranca: escolha um item de ate T$ " & NumeroLegivel(limite) & ".", limite)
    If Len(escolha) > 0 Then
        If AdicionarItemMochila(escolha, 1) Then _
            DefinirEstado "ItemOrigem|Herdeiro|Heranca", escolha, "Limite da Heranca: T$ " & NumeroLegivel(limite) & "."
    End If
End Sub

Private Function QuantidadeBeneficioHeranca(ByVal origem As String) As Long
    Dim i As Long
    Dim valor As String
    For i = 1 To 2
        valor = ValorEstado("Origem|" & origem & "|Beneficio|" & CStr(i))
        If InStr(1, Normalizar(valor), "poder unico: heranca", vbTextCompare) = 1 Then _
            QuantidadeBeneficioHeranca = QuantidadeBeneficioHeranca + 1
    Next i
End Function

Private Sub AdicionarItensClasse(ByVal classe As String)
    Dim classeId As String
    Dim caminho As String
    Dim escolha As String
    Dim opcoes As Collection

    classeId = ClasseIdPorNome(classe)
    Select Case Normalizar(classeId)
        Case "arcanista"
            caminho = ValorEstado("Classe_arcanista_Caminho")
            If MesmoTexto(caminho, "Bruxo") Then
                AdicionarItemMochila "Foco Arcano", 1
                DefinirEstado "ItemClasse|arcanista|Foco", "Foco Arcano", "Foco do Caminho do Bruxo."
            ElseIf MesmoTexto(caminho, "Mago") Then
                AdicionarItemMochila "Grim" & ChrW$(243) & "rio", 1
                DefinirEstado "ItemClasse|arcanista|Grimorio", "Grim" & ChrW$(243) & "rio", "Grimorio do Caminho do Mago."
            End If

        Case "nobre"
            escolha = EscolherItemFiltrado("Espolio: escolha um item de ate T$ 2.000.", 2000#)
            RegistrarItemClasse classeId, "Espolio", escolha, "Item concedido pela habilidade Espolio."

        Case "inventor"
            Set opcoes = New Collection
            opcoes.Add "Um item superior de ate T$ 500"
            opcoes.Add "Dez itens alquimicos de ate T$ 500 no total"
            escolha = EscolherOpcaoSimplesLocal("Prototipo: escolha o beneficio de equipamento.", opcoes)
            If InStr(1, Normalizar(escolha), "item superior", vbTextCompare) > 0 Then
                escolha = EscolherItemFiltrado("Prototipo: escolha o item-base. A melhoria de item superior custa T$ 300.", 200#)
                RegistrarItemClasse classeId, "Prototipo", escolha, "Item superior com uma melhoria; preco total de ate T$ 500."
            ElseIf Len(escolha) > 0 Then
                EscolherItensAlquimicos classeId, "Prototipo", 10, 500#
            End If

        Case "alquimista"
            AdicionarItemMochila "Instrumentos de Alquimista", 1
            DefinirEstado "ItemClasse|alquimista|Instrumentos", "Instrumentos de Alquimista", "Instrumentos aprimorados."
            EscolherItensAlquimicos classeId, "LaboratorioPessoal", 10, 300#

        Case "inovador"
            escolha = EscolherItemFiltrado("Do Bom e do Melhor: escolha uma arma, armadura ou escudo. A melhoria custa T$ 300.", 200#, "arma|armadura|escudo")
            RegistrarItemClasse classeId, "DoBomEDoMelhor", escolha, "Item superior com uma melhoria; preco total de ate T$ 500."

        Case "samurai"
            escolha = NomeItemBase("Katana")
            RegistrarItemClasse classeId, "ArmaAncestral", escolha, "Katana superior ancestral com uma melhoria; preco total de ate T$ 500."
    End Select
End Sub

Private Sub RegistrarItemClasse(ByVal classeId As String, ByVal fonte As String, ByVal item As String, ByVal observacao As String)
    If Len(Trim$(item)) = 0 Then Exit Sub
    If AdicionarItemMochila(item, 1) Then DefinirEstado "ItemClasse|" & classeId & "|" & fonte, item, observacao
End Sub

Private Sub EscolherItensAlquimicos(ByVal classeId As String, ByVal fonte As String, ByVal limiteQuantidade As Long, ByVal orcamento As Double)
    Dim restantes As Long
    Dim saldo As Double
    Dim opcoes As Collection
    Dim escolha As String
    Dim preco As Double
    Dim resposta As Variant
    Dim quantidade As Long
    Dim totalEscolhido As Long

    restantes = limiteQuantidade
    saldo = orcamento
    Do While restantes > 0
        Set opcoes = OpcoesItensFiltrados(saldo, vbNullString, "alquimico_")
        If opcoes.Count = 0 Then Exit Do
        opcoes.Add OpcaoCatalogo("FINALIZAR ESTA ESCOLHA", "#FINALIZAR#", "SIM", _
            "Encerra a selecao com " & CStr(totalEscolhido) & " de " & CStr(limiteQuantidade) & " itens escolhidos.")
        escolha = EscolherCatalogo("Itens alquimicos: faltam " & CStr(restantes) & "; saldo T$ " & NumeroLegivel(saldo) & ".", opcoes)
        If Len(escolha) = 0 Or escolha = "#FINALIZAR#" Then Exit Do

        preco = PrecoItem(escolha)
        resposta = Application.InputBox("Quantidade de " & escolha & " (maximo " & CStr(restantes) & "):", "Forja T20 - Itens alquimicos", 1, Type:=1)
        If VarType(resposta) = vbBoolean Then
            If resposta = False Then GoTo ProximoAlquimico
        End If
        quantidade = CLng(Val(CStr(resposta)))
        If quantidade < 1 Or quantidade > restantes Then GoTo ProximoAlquimico
        If preco * quantidade > saldo Then
            MsgBox "O valor ultrapassa o saldo desta habilidade.", vbExclamation, "Forja T20"
        ElseIf AdicionarItemMochila(escolha, quantidade) Then
            saldo = saldo - (preco * quantidade)
            restantes = restantes - quantidade
            totalEscolhido = totalEscolhido + quantidade
        End If
ProximoAlquimico:
    Loop
    DefinirEstado "ItemClasse|" & classeId & "|" & fonte, CStr(totalEscolhido) & " itens alquimicos", _
        "Orcamento usado: T$ " & NumeroLegivel(orcamento - saldo) & " de T$ " & NumeroLegivel(orcamento) & "."
End Sub

Private Function EscolherItemFiltrado(ByVal titulo As String, ByVal precoMaximo As Double, Optional ByVal tipos As String = vbNullString) As String
    Dim opcoes As Collection
    Set opcoes = OpcoesItensFiltrados(precoMaximo, tipos)
    If opcoes.Count > 0 Then EscolherItemFiltrado = EscolherCatalogo(titulo, opcoes)
End Function

Private Function OpcoesItensFiltrados(ByVal precoMaximo As Double, Optional ByVal tipos As String = vbNullString, Optional ByVal prefixoCategoria As String = vbNullString) As Collection
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim item As String
    Dim tipo As String
    Dim categoria As String
    Dim preco As Double

    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        item = Trim$(CStr(ws.Cells(r, 1).Value))
        tipo = Normalizar(CStr(ws.Cells(r, 4).Value))
        categoria = Normalizar(CStr(ws.Cells(r, 5).Value))
        preco = PrecoItemPorLinhaInventario(ws, r)
        If Len(item) > 0 And preco >= 0 And preco <= precoMaximo Then
            If TipoItemPermitido(tipo, tipos) And (Len(prefixoCategoria) = 0 Or Left$(categoria, Len(Normalizar(prefixoCategoria))) = Normalizar(prefixoCategoria)) Then
                opcoes.Add OpcaoCatalogo(item & " - T$ " & NumeroLegivel(preco), item, "SIM", DetalheItemPorLinha(ws, r))
            End If
        End If
    Next r
    Set OpcoesItensFiltrados = opcoes
End Function

Private Function TipoItemPermitido(ByVal tipo As String, ByVal tipos As String) As Boolean
    Dim item As Variant
    If Len(Trim$(tipos)) = 0 Then
        TipoItemPermitido = True
        Exit Function
    End If
    For Each item In Split(tipos, "|")
        If MesmoTexto(tipo, CStr(item)) Then
            TipoItemPermitido = True
            Exit Function
        End If
    Next item
End Function

Private Function EscolherOpcaoSimplesLocal(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcaoSimplesLocal = formulario.escolha
    Unload formulario
End Function

Private Function ClasseIdPorNome(ByVal classe As String) As String
    Dim ws As Worksheet
    Dim linha As Variant
    If Len(Trim$(classe)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets("Base_Classes_TXT")
    linha = Application.Match(classe, ws.Columns(2), 0)
    If Not IsError(linha) Then ClasseIdPorNome = CStr(ws.Cells(CLng(linha), 1).Value)
End Function

Private Function ValorEstado(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim linha As Variant
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    linha = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(linha) Then ValorEstado = Trim$(CStr(ws.Cells(CLng(linha), 2).Value))
End Function

Private Function EscolherAlternativaItem(ByVal texto As String) As String
    Dim partes As Variant
    Dim parte As Variant
    Dim opcoes As Collection
    Dim candidato As String
    Dim nomeBase As String

    If InStr(1, texto, " ou ", vbTextCompare) = 0 And InStr(1, texto, ",", vbTextCompare) = 0 Then Exit Function
    texto = Replace(texto, " ou ", ";", 1, -1, vbTextCompare)
    texto = Replace(texto, ",", ";")
    partes = Split(texto, ";")
    Set opcoes = New Collection
    For Each parte In partes
        candidato = Trim$(CStr(parte))
        nomeBase = NomeItemBase(candidato)
        If Len(nomeBase) > 0 Then AdicionarItemExato opcoes, nomeBase
    Next parte
    If opcoes.Count > 0 Then EscolherAlternativaItem = EscolherCatalogo("Escolha o item concedido pela origem.", opcoes)
End Function

Private Function EscolherArmaSimplesOuMarcial(ByVal titulo As String) As String
    Dim opcoes As Collection
    Set opcoes = OpcoesItensCategoria("simples")
    AdicionarColecaoUnica opcoes, OpcoesItensCategoria("marcial")
    EscolherArmaSimplesOuMarcial = EscolherCatalogo(titulo, opcoes)
End Function

Private Function EscolherItemCategoria(ByVal categoria As String, ByVal titulo As String, Optional ByVal permitirNenhuma As Boolean = False) As String
    Dim opcoes As Collection
    Dim opcoesComNenhuma As Collection
    Dim item As Variant
    Dim escolha As String

    Set opcoes = OpcoesItensCategoria(categoria)
    If permitirNenhuma Then
        Set opcoesComNenhuma = New Collection
        opcoesComNenhuma.Add OpcaoCatalogo("Nenhuma arma", "#SEM_ARMA#", "SIM", "Nenhuma arma sera adicionada nesta escolha.")
        For Each item In opcoes
            opcoesComNenhuma.Add item
        Next item
        Set opcoes = opcoesComNenhuma
    End If

    If opcoes.Count > 0 Then escolha = EscolherCatalogo(titulo, opcoes)
    If Not MesmoTexto(escolha, "#SEM_ARMA#") Then EscolherItemCategoria = escolha
End Function

Private Function OpcoesItensCategoria(ByVal categoria As String) As Collection
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim exibicao As String

    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(ws.Cells(r, 4).Value, "arma") And MesmoTexto(ws.Cells(r, 5).Value, categoria) Then
            exibicao = CStr(ws.Cells(r, 1).Value)
            opcoes.Add OpcaoCatalogo(exibicao, exibicao, "SIM", DetalheItemPorLinha(ws, r))
        End If
    Next r
    Set OpcoesItensCategoria = opcoes
End Function

Private Sub AdicionarItemExato(ByVal opcoes As Collection, ByVal nome As String)
    Dim nomeBase As String
    nomeBase = NomeItemBase(nome)
    If Len(nomeBase) > 0 Then AdicionarOpcaoCatalogoUnica opcoes, nomeBase, nomeBase, DetalheItem(nomeBase)
End Sub

Private Function TemProficiencia(ByVal id As String) As Boolean
    Dim ws As Worksheet
    Dim ultima As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets("Efeitos_Ativos")
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        If MesmoTexto(ws.Cells(r, 4).Value, "proficiencia") And MesmoTexto(ws.Cells(r, 6).Value, id) Then
            TemProficiencia = True
            Exit Function
        End If
    Next r
End Function

Private Function AdicionarItemMochila(ByVal item As String, ByVal quantidade As Long) As Boolean
    Dim ws As Worksheet
    Dim i As Long
    Dim celItem As Range
    Dim celQtd As Range

    item = Trim$(item)
    If Len(item) = 0 Then Exit Function
    If quantidade < 1 Then quantidade = 1
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    For i = 1 To modLayoutT20.TOTAL_SLOTS_MOCHILA
        Set celItem = CelulaItemMochila(ws, i)
        Set celQtd = CelulaQuantidadeMochila(ws, i)
        If MesmoTexto(celItem.Value, item) Then
            celQtd.Value = Application.Max(0, Val(CStr(celQtd.Value))) + quantidade
            AdicionarItemMochila = True
            Exit Function
        End If
    Next i

    For i = 1 To modLayoutT20.TOTAL_SLOTS_MOCHILA
        Set celItem = CelulaItemMochila(ws, i)
        Set celQtd = CelulaQuantidadeMochila(ws, i)
        If Len(Trim$(CStr(celItem.Value))) = 0 Then
            celItem.Value = item
            celQtd.Value = quantidade
            AdicionarItemMochila = True
            Exit Function
        End If
    Next i

    MsgBox "A mochila esta sem linhas livres para " & item & ".", vbExclamation, "Forja T20"
End Function

Private Function CelulaItemMochila(ByVal ws As Worksheet, ByVal indice As Long) As Range
    If indice <= modLayoutT20.LINHAS_MOCHILA_POR_COLUNA Then
        Set CelulaItemMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - 1, 1)
    Else
        Set CelulaItemMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - modLayoutT20.LINHAS_MOCHILA_POR_COLUNA - 1, 4)
    End If
End Function

Private Function CelulaQuantidadeMochila(ByVal ws As Worksheet, ByVal indice As Long) As Range
    If indice <= modLayoutT20.LINHAS_MOCHILA_POR_COLUNA Then
        Set CelulaQuantidadeMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - 1, 2)
    Else
        Set CelulaQuantidadeMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - modLayoutT20.LINHAS_MOCHILA_POR_COLUNA - 1, 5)
    End If
End Function

Private Sub ExecutarLojaInicial(ByVal nivel As Long)
    Dim wsP As Worksheet
    Dim saldo As Double
    Dim opcoes As Collection
    Dim escolha As String
    Dim preco As Double
    Dim qtdResposta As Variant
    Dim qtd As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    saldo = DinheiroInicialNivel(nivel) + Val(CStr(wsP.Range(modLayoutT20.CELULA_TIBARES).Value))
    wsP.Range(modLayoutT20.CELULA_TIBARES).Value = saldo

    Do
        Set opcoes = OpcoesLoja(saldo)
        escolha = EscolherCatalogo("Loja inicial - saldo T$ " & NumeroLegivel(saldo) & ".", opcoes)
        If Len(escolha) = 0 Or escolha = "#FINALIZAR#" Then Exit Do
        preco = PrecoItem(escolha)
        qtdResposta = Application.InputBox("Quantidade de " & escolha & ":", "Forja T20 - Loja", 1, Type:=1)
        If VarType(qtdResposta) = vbBoolean Then
            If qtdResposta = False Then GoTo ProximaCompra
        End If
        qtd = CLng(Val(CStr(qtdResposta)))
        If qtd < 1 Then GoTo ProximaCompra
        If preco * qtd > saldo Then
            MsgBox "Saldo insuficiente.", vbExclamation, "Forja T20"
        ElseIf AdicionarItemMochila(escolha, qtd) Then
            saldo = saldo - (preco * qtd)
            wsP.Range(modLayoutT20.CELULA_TIBARES).Value = saldo
            modInventarioT20.AtualizarInventario False
        End If
ProximaCompra:
    Loop
End Sub

Private Function OpcoesLoja(ByVal saldo As Double) As Collection
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim ultima As Long
    Dim r As Long
    Dim item As String
    Dim preco As Double

    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    Set opcoes = New Collection
    opcoes.Add OpcaoCatalogo("FINALIZAR COMPRAS", "#FINALIZAR#", "SIM", "Concluir a etapa da loja com o saldo restante.")
    ultima = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultima
        item = Trim$(CStr(ws.Cells(r, 1).Value))
        preco = PrecoItemPorLinhaInventario(ws, r)
        If Len(item) > 0 And preco >= 0 And preco <= saldo Then
            opcoes.Add OpcaoCatalogo(item & " - T$ " & NumeroLegivel(preco), item, "SIM", DetalheItemPorLinha(ws, r))
        End If
    Next r
    Set OpcoesLoja = opcoes
End Function

Private Function DinheiroInicialNivel(ByVal nivel As Long) As Double
    Select Case nivel
        Case 2: DinheiroInicialNivel = 300
        Case 3: DinheiroInicialNivel = 600
        Case 4: DinheiroInicialNivel = 1000
        Case 5: DinheiroInicialNivel = 2000
        Case 6: DinheiroInicialNivel = 3000
        Case 7: DinheiroInicialNivel = 5000
        Case 8: DinheiroInicialNivel = 7000
        Case 9: DinheiroInicialNivel = 10000
        Case 10: DinheiroInicialNivel = 13000
        Case 11: DinheiroInicialNivel = 19000
        Case 12: DinheiroInicialNivel = 27000
        Case 13: DinheiroInicialNivel = 36000
        Case 14: DinheiroInicialNivel = 49000
        Case 15: DinheiroInicialNivel = 66000
        Case 16: DinheiroInicialNivel = 88000
        Case 17: DinheiroInicialNivel = 110000
        Case 18: DinheiroInicialNivel = 150000
        Case 19: DinheiroInicialNivel = 200000
        Case 20: DinheiroInicialNivel = 260000
    End Select
End Function

Private Function PrecoItem(ByVal exibicao As String) As Double
    Dim ws As Worksheet
    Dim linha As Variant
    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    linha = Application.Match(exibicao, ws.Columns(1), 0)
    If Not IsError(linha) Then PrecoItem = PrecoItemPorLinhaInventario(ws, CLng(linha))
End Function

Private Function PrecoItemPorLinhaInventario(ByVal ws As Worksheet, ByVal linha As Long) As Double
    Dim itemId As String
    Dim base As Worksheet
    Dim linhaBase As Variant
    Dim valor As Double
    Dim moeda As String

    itemId = CStr(ws.Cells(linha, 2).Value)
    Set base = ThisWorkbook.Worksheets("Base_Itens")
    linhaBase = Application.Match(itemId, base.Columns(1), 0)
    If IsError(linhaBase) Then Exit Function
    If IsNumeric(base.Cells(CLng(linhaBase), 8).Value) Then valor = CDbl(base.Cells(CLng(linhaBase), 8).Value)
    moeda = UCase$(Trim$(CStr(base.Cells(CLng(linhaBase), 9).Value)))
    If moeda = "TC" Then valor = valor / 10
    If moeda = "TO" Then valor = valor * 10
    PrecoItemPorLinhaInventario = valor
End Function

Private Function DetalheItem(ByVal exibicao As String) As String
    Dim ws As Worksheet
    Dim linha As Variant
    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    linha = Application.Match(exibicao, ws.Columns(1), 0)
    If Not IsError(linha) Then DetalheItem = DetalheItemPorLinha(ws, CLng(linha))
End Function

Private Function DetalheItemPorLinha(ByVal ws As Worksheet, ByVal linha As Long) As String
    Dim texto As String
    Dim itemId As String
    Dim tipoItem As String
    Dim critico As String
    Dim base As Worksheet
    Dim linhaBase As Variant

    tipoItem = Normalizar(CStr(ws.Cells(linha, 4).Value))
    texto = CStr(ws.Cells(linha, 1).Value) & vbCrLf & String$(42, "-") & vbCrLf
    AdicionarDetalhe texto, "Tipo", ws.Cells(linha, 4).Value
    AdicionarDetalhe texto, "Categoria", ws.Cells(linha, 5).Value
    AdicionarDetalhe texto, "Espacos", ws.Cells(linha, 6).Value
    AdicionarDetalhe texto, "Dano", ws.Cells(linha, 9).Value
    If MesmoTexto(tipoItem, "escudo") Then
        critico = Trim$(CStr(ws.Cells(linha, 10).Value))
        If Len(Trim$(CStr(ws.Cells(linha, 11).Value))) > 0 Then critico = critico & "/" & Trim$(CStr(ws.Cells(linha, 11).Value))
        AdicionarDetalhe texto, "Critico", critico
        AdicionarDetalhe texto, "Tipo de dano", ws.Cells(linha, 13).Value
    End If
    If Not MesmoTexto(tipoItem, "armadura") And Not MesmoTexto(tipoItem, "escudo") Then
        AdicionarDetalhe texto, "Alcance", ws.Cells(linha, 12).Value
    End If
    texto = texto & "Preco: T$ " & NumeroLegivel(PrecoItemPorLinhaInventario(ws, linha)) & vbCrLf

    itemId = CStr(ws.Cells(linha, 2).Value)
    Set base = ThisWorkbook.Worksheets("Base_Itens")
    linhaBase = Application.Match(itemId, base.Columns(1), 0)
    If Not IsError(linhaBase) Then
        AdicionarDetalhe texto, "Habilidade", base.Cells(CLng(linhaBase), 11).Value
        AdicionarDetalhe texto, "Observacao", base.Cells(CLng(linhaBase), 12).Value
        AdicionarDetalhe texto, "Descricao", base.Cells(CLng(linhaBase), 13).Value
    End If
    DetalheItemPorLinha = texto
End Function

Private Function NomeItemBase(ByVal procurado As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    procurado = Trim$(procurado)
    If Len(procurado) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets("Base_Inventario")
    resultado = Application.Match(procurado, ws.Columns(1), 0)
    If Not IsError(resultado) Then NomeItemBase = CStr(ws.Cells(CLng(resultado), 1).Value)
End Function

Private Function ValorTibarTexto(ByVal texto As String) As Double
    Dim regex As Object
    Dim encontrados As Object
    Set regex = CreateObject("VBScript.RegExp")
    regex.Pattern = "T\$\s*([0-9\.]+)"
    regex.IgnoreCase = True
    If regex.Test(texto) Then
        Set encontrados = regex.Execute(texto)
        ValorTibarTexto = Val(Replace(CStr(encontrados(0).SubMatches(0)), ".", vbNullString))
    End If
End Function

Private Function EscolherCatalogo(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserFormMagia")
    formulario.Carregar titulo, opcoes, "CATALOGO_TEXTO"
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherCatalogo = formulario.escolha
    Unload formulario
End Function

Private Function EscolherOpcaoDaColuna(ByVal titulo As String, ByVal planilha As String, ByVal coluna As Long, ByVal primeiraLinha As Long) As String
    Dim ws As Worksheet
    Dim opcoes As Collection
    Dim formulario As Object
    Dim ultima As Long
    Dim r As Long
    Dim valor As String

    Set ws = ThisWorkbook.Worksheets(planilha)
    Set opcoes = New Collection
    ultima = ws.Cells(ws.Rows.Count, coluna).End(xlUp).Row
    For r = primeiraLinha To ultima
        valor = Trim$(CStr(ws.Cells(r, coluna).Value))
        If Len(valor) > 0 Then AdicionarUnico opcoes, valor
    Next r
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcaoDaColuna = formulario.escolha
    Unload formulario
End Function

Private Function OpcaoCatalogo(ByVal exibicao As String, ByVal valor As String, ByVal status As String, ByVal detalhe As String) As String
    OpcaoCatalogo = exibicao & SEP_FORM & valor & SEP_FORM & status & SEP_FORM & detalhe
End Function

Private Sub AdicionarOpcaoCatalogoUnica(ByVal opcoes As Collection, ByVal exibicao As String, ByVal valor As String, ByVal detalhe As String)
    Dim item As Variant
    Dim partes As Variant
    For Each item In opcoes
        partes = Split(CStr(item), SEP_FORM)
        If UBound(partes) >= 1 Then
            If MesmoTexto(partes(1), valor) Then Exit Sub
        End If
    Next item
    opcoes.Add OpcaoCatalogo(exibicao, valor, "SIM", detalhe)
End Sub

Private Sub AdicionarColecaoUnica(ByVal destino As Collection, ByVal origem As Collection)
    Dim item As Variant
    Dim partes As Variant
    For Each item In origem
        partes = Split(CStr(item), SEP_FORM)
        If UBound(partes) >= 3 Then AdicionarOpcaoCatalogoUnica destino, CStr(partes(0)), CStr(partes(1)), CStr(partes(3))
    Next item
End Sub

Private Sub AdicionarDetalhe(ByRef texto As String, ByVal rotulo As String, ByVal valor As Variant)
    If Len(Trim$(CStr(valor))) > 0 Then texto = texto & rotulo & ": " & CStr(valor) & vbCrLf
End Sub

Private Sub AdicionarUnico(ByVal itens As Collection, ByVal valor As String)
    Dim item As Variant
    valor = Trim$(valor)
    If Len(valor) = 0 Then Exit Sub
    For Each item In itens
        If MesmoTexto(item, valor) Then Exit Sub
    Next item
    itens.Add valor
End Sub

Private Sub DefinirFase(ByVal codigo As String, ByVal descricao As String)
    DefinirEstado "Fluxo|Etapa", codigo, descricao
    Application.StatusBar = descricao
End Sub

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

Private Function NumeroLegivel(ByVal valor As Double) As String
    If valor = Fix(valor) Then
        NumeroLegivel = Format$(valor, "#,##0")
    Else
        NumeroLegivel = Format$(valor, "#,##0.0#")
    End If
End Function

Private Function TextoNaoDevotoPlanilha() As String
    TextoNaoDevotoPlanilha = "N" & ChrW$(227) & "o devoto"
End Function

Private Function NomeClerigo() As String
    NomeClerigo = "Cl" & ChrW$(233) & "rigo"
End Function

Private Function Normalizar(ByVal texto As String) As String
    texto = LCase$(Trim$(texto))
    texto = Replace(texto, ChrW$(193), "a"): texto = Replace(texto, ChrW$(225), "a")
    texto = Replace(texto, ChrW$(195), "a"): texto = Replace(texto, ChrW$(227), "a")
    texto = Replace(texto, ChrW$(194), "a"): texto = Replace(texto, ChrW$(226), "a")
    texto = Replace(texto, ChrW$(201), "e"): texto = Replace(texto, ChrW$(233), "e")
    texto = Replace(texto, ChrW$(202), "e"): texto = Replace(texto, ChrW$(234), "e")
    texto = Replace(texto, ChrW$(205), "i"): texto = Replace(texto, ChrW$(237), "i")
    texto = Replace(texto, ChrW$(211), "o"): texto = Replace(texto, ChrW$(243), "o")
    texto = Replace(texto, ChrW$(213), "o"): texto = Replace(texto, ChrW$(245), "o")
    texto = Replace(texto, ChrW$(212), "o"): texto = Replace(texto, ChrW$(244), "o")
    texto = Replace(texto, ChrW$(218), "u"): texto = Replace(texto, ChrW$(250), "u")
    texto = Replace(texto, ChrW$(199), "c"): texto = Replace(texto, ChrW$(231), "c")
    Normalizar = texto
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Normalizar(CStr(a)), Normalizar(CStr(b)), vbTextCompare) = 0)
End Function
