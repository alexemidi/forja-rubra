Attribute VB_Name = "modPrincipalRostoT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_DADOS As String = "Dados"
Private Const PLANILHA_BASE_HABILIDADES_CLASSE As String = "Base_Habilidades_Classe"
Private Const PLANILHA_BASE_SLOTS_PODER_CLASSE As String = "Base_Slots_Poder_Classe"
Private Const PLANILHA_PODERES_CLASSE_SELECIONADOS As String = "Poderes_Classe_Selecionados"
Private Const PLANILHA_BASE_HABILIDADES_RACA As String = "Base_Habilidades_Raca"
Private Const PLANILHA_BASE_DEUSES As String = "Base_Deuses"
Private Const PLANILHA_BASE_COMPLICACOES As String = "Base_Complicacoes"
Private Const PLANILHA_BASE_RESUMOS_ROSTO As String = "Base_Resumos_Rosto"
Private Const PLANILHA_EFEITOS_ATIVOS As String = "Efeitos_Ativos"
Private Const PLANILHA_ESCOLHAS_ATIVAS As String = "Escolhas_Ativas"

Public Function CodexPrincipalRostoVersion() As String
    CodexPrincipalRostoVersion = "T20 principal layout atualizacao 2026-08-28"
End Function

Public Sub AtualizarRostoPrincipal()
    Dim ws As Worksheet
    Dim nivel As Long
    Dim classe As String
    Dim raca As String

    On Error GoTo TrataErro
    If Not PlanilhaExisteLocal(PLANILHA_PRINCIPAL) Then Exit Sub

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    nivel = CLng(Val(CStr(ws.Range("F1").Value)))
    If nivel < 1 Then nivel = 1
    If nivel > 20 Then nivel = 20

    classe = Trim$(CStr(ws.Range("F2").Value))
    raca = Trim$(CStr(ws.Range("B2").Value))

    PreencherProgressaoClasse ws, classe, nivel
    PreencherHabilidadesRaca ws, raca
    AtualizarDivindade ws
    AtualizarComplicacao ws
    PreencherResumoEfeitos ws, classe, raca, nivel
    PreencherMagiasRosto ws
    FormatarRosto ws
    Exit Sub

TrataErro:
    Debug.Print "AtualizarRostoPrincipal: " & Err.Number & " - " & Err.Description
End Sub

Private Sub PreencherProgressaoClasse(ByVal ws As Worksheet, ByVal classe As String, ByVal nivelAtual As Long)
    Dim classeId As String
    Dim n As Long
    Dim linha As Long

    classeId = ClasseIdPorNomeLocal(classe)
    For n = 1 To 20
        linha = n + 35
        ws.Cells(linha, 1).Value = n
        ws.Cells(linha, 2).Value = TextoClasseNivel(classeId, classe, n, nivelAtual)
    Next n
End Sub

Private Function TextoClasseNivel(ByVal classeId As String, ByVal classe As String, ByVal nivel As Long, ByVal nivelAtual As Long) As String
    Dim itens As Collection
    Dim texto As String

    Set itens = New Collection
    AdicionarHabilidadesAutomaticas itens, classeId, classe, nivel
    AdicionarPoderesSelecionados itens, classeId, classe, nivel
    If Not NivelTemPoderSelecionado(classeId, classe, nivel) Then
        If ClasseTemSlotPoderNoNivel(classeId, classe, nivel) Then
            If nivel > nivelAtual Then
                AdicionarUnico itens, "Poder de classe"
            Else
                AdicionarUnico itens, "Poder de classe pendente"
            End If
        End If
    End If

    texto = TextoColecao(itens, ", ")
    If Len(texto) > 0 And nivel > nivelAtual Then texto = "(" & texto & ")"
    TextoClasseNivel = texto
End Function

Private Sub AdicionarHabilidadesAutomaticas(ByVal itens As Collection, ByVal classeId As String, ByVal classe As String, ByVal nivel As Long)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long

    If Not PlanilhaExisteLocal(PLANILHA_BASE_HABILIDADES_CLASSE) Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES_CLASSE)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If LinhaDaClasse(ws, r, classeId, classe) Then
            If CLng(Val(CStr(ws.Cells(r, 4).Value))) = nivel Then
                If MesmoTexto(ws.Cells(r, 11).Value, "SIM") Then
                    AdicionarUnico itens, Trim$(CStr(ws.Cells(r, 5).Value))
                End If
            End If
        End If
    Next r
End Sub

Private Sub AdicionarPoderesSelecionados(ByVal itens As Collection, ByVal classeId As String, ByVal classe As String, ByVal nivel As Long)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nomePoder As String
    Dim motivo As String

    If Not PlanilhaExisteLocal(PLANILHA_PODERES_CLASSE_SELECIONADOS) Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PODERES_CLASSE_SELECIONADOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If CLng(Val(CStr(ws.Cells(r, 2).Value))) = nivel Then
            If LinhaDaClasseSelecionada(ws, r, classeId, classe) Then
                nomePoder = Trim$(CStr(ws.Cells(r, 7).Value))
                motivo = Trim$(CStr(ws.Cells(r, 9).Value))
                If Len(nomePoder) > 0 Then
                    AdicionarUnico itens, nomePoder
                ElseIf Len(motivo) > 0 Then
                    AdicionarUnico itens, motivo
                End If
            End If
        End If
    Next r
End Sub

Private Function NivelTemPoderSelecionado(ByVal classeId As String, ByVal classe As String, ByVal nivel As Long) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nomePoder As String
    Dim motivo As String

    If Not PlanilhaExisteLocal(PLANILHA_PODERES_CLASSE_SELECIONADOS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PODERES_CLASSE_SELECIONADOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If CLng(Val(CStr(ws.Cells(r, 2).Value))) = nivel Then
            If LinhaDaClasseSelecionada(ws, r, classeId, classe) Then
                nomePoder = Trim$(CStr(ws.Cells(r, 7).Value))
                motivo = Trim$(CStr(ws.Cells(r, 9).Value))
                If Len(nomePoder) > 0 Or Len(motivo) > 0 Then
                    NivelTemPoderSelecionado = True
                    Exit Function
                End If
            End If
        End If
    Next r
End Function

Private Function ClasseTemSlotPoderNoNivel(ByVal classeId As String, ByVal classe As String, ByVal nivel As Long) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nivelInicial As Long
    Dim frequencia As String

    If Not PlanilhaExisteLocal(PLANILHA_BASE_SLOTS_PODER_CLASSE) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_SLOTS_PODER_CLASSE)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If LinhaDaClasseSlot(ws, r, classeId, classe) Then
            nivelInicial = CLng(Val(CStr(ws.Cells(r, 6).Value)))
            If nivelInicial <= 0 Then nivelInicial = 2
            frequencia = LCase$(Trim$(CStr(ws.Cells(r, 7).Value)))

            Select Case frequencia
                Case "", "todo_nivel"
                    If nivel >= nivelInicial Then ClasseTemSlotPoderNoNivel = True
                Case "nivel_par"
                    If nivel >= nivelInicial And nivel Mod 2 = 0 Then ClasseTemSlotPoderNoNivel = True
                Case "nivel_impar"
                    If nivel >= nivelInicial And nivel Mod 2 = 1 Then ClasseTemSlotPoderNoNivel = True
                Case Else
                    If nivel = nivelInicial Then ClasseTemSlotPoderNoNivel = True
            End Select
            If ClasseTemSlotPoderNoNivel Then Exit Function
        End If
    Next r
End Function

Private Sub PreencherHabilidadesRaca(ByVal wsPrincipal As Worksheet, ByVal raca As String)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nome As String
    Dim tipo As String
    Dim descricao As String
    Dim linhaSaida As Long

    wsPrincipal.Range("F35:F39").ClearContents
    For linhaSaida = 35 To 39
        PrepararAreaMesclada wsPrincipal.Range("G" & CStr(linhaSaida) & ":H" & CStr(linhaSaida))
        On Error Resume Next
        wsPrincipal.Range("G" & CStr(linhaSaida)).ClearComments
        On Error GoTo 0
    Next linhaSaida
    If Len(raca) = 0 Then Exit Sub
    If Not PlanilhaExisteLocal(PLANILHA_BASE_HABILIDADES_RACA) Then Exit Sub

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES_RACA)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    linhaSaida = 35

    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 2).Value, raca) Then
            nome = Trim$(CStr(ws.Cells(r, 4).Value))
            descricao = Trim$(CStr(ws.Cells(r, 5).Value))
            tipo = LCase$(Trim$(CStr(ws.Cells(r, 6).Value)))
            If Len(nome) > 0 And linhaSaida <= 39 Then
                If tipo = "escolha" And InStr(1, nome, "escolha", vbTextCompare) = 0 Then
                    nome = nome & " (escolha)"
                End If
                wsPrincipal.Cells(linhaSaida, 6).Value = nome
                wsPrincipal.Cells(linhaSaida, 7).Value = descricao
                On Error Resume Next
                If Len(descricao) > 0 Then wsPrincipal.Cells(linhaSaida, 7).AddComment descricao
                On Error GoTo 0
                linhaSaida = linhaSaida + 1
            End If
        End If
    Next r
End Sub

Private Sub PreencherMagiasRosto(ByVal wsPrincipal As Worksheet)
    Dim wsControle As Worksheet
    Dim wsMagias As Worksheet
    Dim temMagias As Boolean
    Dim ultimaLinha As Long
    Dim r As Long
    Dim linhaSaida As Long
    Dim nome As String
    Dim detalhe As String

    If Not PlanilhaExisteLocal("Magias_Controle") Or Not PlanilhaExisteLocal("Magias_Conhecidas") Then Exit Sub
    Set wsControle = ThisWorkbook.Worksheets("Magias_Controle")
    Set wsMagias = ThisWorkbook.Worksheets("Magias_Conhecidas")
    temMagias = MesmoTexto(wsControle.Range("C2").Value, "SIM")

    wsPrincipal.Range("E44:H44,E46:H55").ClearContents
    For r = 48 To 55
        On Error Resume Next
        wsPrincipal.Cells(r, 5).ClearComments
        On Error GoTo 0
    Next r
    If Not temMagias Then
        wsPrincipal.Range("E45:H45").ClearContents
        Exit Sub
    End If

    wsPrincipal.Range("E44").Value = "MAGIAS"
    wsPrincipal.Range("E45").Value = "Atributo-chave"
    If Len(Trim$(CStr(wsPrincipal.Range("F45").Value))) = 0 Then wsPrincipal.Range("F45").Value = wsControle.Range("X2").Value
    wsPrincipal.Range("G45").Value = "CD"
    wsPrincipal.Range("H45").Value = wsControle.Range("H2").Value
    wsPrincipal.Range("E46").Value = "Tipo"
    wsPrincipal.Range("F46").Value = wsControle.Range("D2").Value
    wsPrincipal.Range("G46").Value = "Escolas"
    wsPrincipal.Range("H46").Value = wsControle.Range("J2").Value
    wsPrincipal.Range("E47").Value = "Magias"

    ultimaLinha = wsMagias.Cells(wsMagias.Rows.Count, 3).End(xlUp).Row
    linhaSaida = 48
    For r = 2 To ultimaLinha
        nome = Trim$(CStr(wsMagias.Cells(r, 3).Value))
        If Len(nome) > 0 And linhaSaida <= 55 Then
            wsPrincipal.Cells(linhaSaida, 5).Value = nome
            wsPrincipal.Cells(linhaSaida, 6).Value = CStr(wsMagias.Cells(r, 5).Value) & ChrW$(186)
            wsPrincipal.Cells(linhaSaida, 7).Value = wsMagias.Cells(r, 6).Value
            wsPrincipal.Cells(linhaSaida, 8).Value = wsMagias.Cells(r, 2).Value
            detalhe = modMagiasT20.DetalheMagia(nome)
            On Error Resume Next
            If Len(detalhe) > 0 Then wsPrincipal.Cells(linhaSaida, 5).AddComment detalhe
            On Error GoTo 0
            linhaSaida = linhaSaida + 1
        End If
    Next r
End Sub

Public Sub AtualizarDivindade(ByVal wsPrincipal As Worksheet)
    Dim wsDados As Worksheet
    Dim wsDeuses As Worksheet
    Dim ultimaLinhaDeuses As Long
    Dim ultimaLinhaLista As Long
    Dim r As Long
    Dim linhaSaida As Long
    Dim deus As String
    Dim poderAtual As String
    Dim poder As String
    Dim poderes As Collection

    If Not PlanilhaExisteLocal(PLANILHA_DADOS) Then Exit Sub
    Set wsDados = ThisWorkbook.Worksheets(PLANILHA_DADOS)

    ultimaLinhaLista = wsDados.Cells(wsDados.Rows.Count, 8).End(xlUp).Row
    If ultimaLinhaLista >= 2 Then AplicarValidacaoLista wsPrincipal.Range("G2"), "=" & PLANILHA_DADOS & "!$H$2:$H$" & CStr(ultimaLinhaLista)

    wsDados.Range("I2:I200").ClearContents
    poderAtual = Trim$(CStr(wsPrincipal.Range("F42").Value))
    deus = Trim$(CStr(wsPrincipal.Range("G2").Value))

    If Len(deus) = 0 Or Not PlanilhaExisteLocal(PLANILHA_BASE_DEUSES) Then
        LimparValidacao wsPrincipal.Range("F42")
        If Len(deus) = 0 Then wsPrincipal.Range("F42").ClearContents
        Exit Sub
    End If

    Set poderes = New Collection
    Set wsDeuses = ThisWorkbook.Worksheets(PLANILHA_BASE_DEUSES)
    ultimaLinhaDeuses = wsDeuses.Cells(wsDeuses.Rows.Count, 1).End(xlUp).Row
    linhaSaida = 2

    For r = 2 To ultimaLinhaDeuses
        If MesmoTexto(wsDeuses.Cells(r, 1).Value, deus) Then
            poder = Trim$(CStr(wsDeuses.Cells(r, 2).Value))
            If Len(poder) > 0 Then
                AdicionarUnico poderes, poder
                wsDados.Cells(linhaSaida, 9).Value = poder
                linhaSaida = linhaSaida + 1
            End If
        End If
    Next r

    If linhaSaida > 2 Then
        AplicarValidacaoLista wsPrincipal.Range("F42"), "=" & PLANILHA_DADOS & "!$I$2:$I$" & CStr(linhaSaida - 1)
        If Len(poderAtual) > 0 And Not ColecaoContem(poderes, poderAtual) Then wsPrincipal.Range("F42").ClearContents
    Else
        LimparValidacao wsPrincipal.Range("F42")
        wsPrincipal.Range("F42").ClearContents
    End If
End Sub

Private Sub AtualizarComplicacao(ByVal wsPrincipal As Worksheet)
    Dim wsDados As Worksheet
    Dim ultimaLinhaLista As Long

    If Not PlanilhaExisteLocal(PLANILHA_DADOS) Then Exit Sub
    Set wsDados = ThisWorkbook.Worksheets(PLANILHA_DADOS)

    ultimaLinhaLista = wsDados.Cells(wsDados.Rows.Count, 10).End(xlUp).Row
    If ultimaLinhaLista >= 2 Then AplicarValidacaoLista wsPrincipal.Range("H43"), "=" & PLANILHA_DADOS & "!$J$2:$J$" & CStr(ultimaLinhaLista)
End Sub

Private Sub PreencherResumoEfeitos(ByVal wsPrincipal As Worksheet, ByVal classe As String, ByVal raca As String, ByVal nivelAtual As Long)
    wsPrincipal.Range("F18").Value = TextoManobras(wsPrincipal, classe, raca, nivelAtual)
    wsPrincipal.Range("D18").Value = TextoResumoCombinado("Imunidade", "imun", classe, raca, nivelAtual, True)
    wsPrincipal.Range("D17").Value = TextoResumoCombinado("RD", "reducao", classe, raca, nivelAtual, True)
End Sub

Private Function TextoManobras(ByVal wsPrincipal As Worksheet, ByVal classe As String, ByVal raca As String, ByVal nivelAtual As Long) As String
    Dim itens As Collection
    Dim linhaLuta As Variant
    Dim baseLuta As String
    Dim resumo As String

    Set itens = New Collection
    linhaLuta = Application.Match("Luta", wsPrincipal.Columns(modLayoutT20.COL_PERICIA_NOME), 0)
    If Not IsError(linhaLuta) Then
        baseLuta = Trim$(CStr(wsPrincipal.Cells(CLng(linhaLuta), modLayoutT20.COL_PERICIA_TOTAL).Text))
        If Len(baseLuta) > 0 Then AdicionarUnico itens, "Teste: " & baseLuta
    End If

    resumo = TextoResumoCombinado("Manobra", "manobra", classe, raca, nivelAtual, False)
    If Len(resumo) > 0 Then AdicionarUnico itens, resumo
    TextoManobras = TextoColecao(itens, "; ")
End Function

Private Function TextoResumoCombinado(ByVal categoria As String, ByVal termoAtivo As String, ByVal classe As String, ByVal raca As String, ByVal nivelAtual As Long, ByVal usarNenhuma As Boolean) As String
    Dim itens As Collection
    Dim textoAtivos As String
    Dim textoBase As String

    Set itens = New Collection
    textoAtivos = TextoEfeitosAtivosPorTipo(termoAtivo)
    textoBase = TextoBaseResumoRosto(categoria, classe, raca, nivelAtual)
    AdicionarItensTexto itens, textoAtivos, ", "
    AdicionarItensTexto itens, textoBase, ", "

    If itens.Count = 0 And usarNenhuma Then
        TextoResumoCombinado = "Nenhuma"
    Else
        TextoResumoCombinado = TextoColecao(itens, ", ")
    End If
End Function

Private Sub AdicionarItensTexto(ByVal itens As Collection, ByVal texto As String, ByVal separador As String)
    Dim partes() As String
    Dim i As Long

    texto = Trim$(texto)
    If Len(texto) = 0 Then Exit Sub
    partes = Split(texto, separador)
    For i = LBound(partes) To UBound(partes)
        AdicionarUnico itens, Trim$(partes(i))
    Next i
End Sub

Private Function TextoEfeitosAtivosPorTipo(ByVal termoTipo As String) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim itens As Collection
    Dim tipo As String
    Dim alvo As String
    Dim valor As String
    Dim fonte As String

    If Not PlanilhaExisteLocal(PLANILHA_EFEITOS_ATIVOS) Then Exit Function
    Set itens = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        tipo = LCase$(Trim$(CStr(ws.Cells(r, 4).Value)))
        If InStr(1, tipo, termoTipo, vbTextCompare) > 0 Then
            fonte = Trim$(CStr(ws.Cells(r, 3).Value))
            alvo = Trim$(CStr(ws.Cells(r, 7).Value))
            If Len(alvo) = 0 Then alvo = Trim$(CStr(ws.Cells(r, 6).Value))
            alvo = TextoAlvoLegivel(alvo)
            valor = Trim$(CStr(ws.Cells(r, 8).Value))
            If Len(alvo) = 0 Then alvo = tipo
            If Len(valor) > 0 Then alvo = alvo & " " & valor
            If Len(fonte) > 0 Then alvo = alvo & " (" & fonte & ")"
            AdicionarUnico itens, alvo
        End If
    Next r

    TextoEfeitosAtivosPorTipo = TextoColecao(itens, ", ")
End Function

Private Function TextoBaseResumoRosto(ByVal categoria As String, ByVal classe As String, ByVal raca As String, ByVal nivelAtual As Long) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim itens As Collection

    If Not PlanilhaExisteLocal(PLANILHA_BASE_RESUMOS_ROSTO) Then Exit Function
    Set itens = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_RESUMOS_ROSTO)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 5).Value, categoria) Then
            If ResumoOrigemAtual(ws, r, classe, raca) Then
                If ResumoNivelAtual(ws, r, nivelAtual) Then
                    If ResumoEscolhaAtual(ws, r) Then
                        AdicionarUnico itens, TextoLinhaResumo(ws, r)
                    End If
                End If
            End If
        End If
    Next r

    TextoBaseResumoRosto = TextoColecao(itens, ", ")
End Function

Private Function ResumoOrigemAtual(ByVal ws As Worksheet, ByVal linha As Long, ByVal classe As String, ByVal raca As String) As Boolean
    Dim origemTipo As String
    Dim origemNome As String

    origemTipo = LCase$(Trim$(CStr(ws.Cells(linha, 1).Value)))
    origemNome = Trim$(CStr(ws.Cells(linha, 2).Value))
    Select Case origemTipo
        Case "raca"
            ResumoOrigemAtual = MesmoTexto(origemNome, raca)
        Case "classe"
            ResumoOrigemAtual = MesmoTexto(origemNome, classe)
        Case Else
            ResumoOrigemAtual = False
    End Select
End Function

Private Function ResumoNivelAtual(ByVal ws As Worksheet, ByVal linha As Long, ByVal nivelAtual As Long) As Boolean
    Dim nivelMinimo As Long
    nivelMinimo = CLng(Val(CStr(ws.Cells(linha, 9).Value)))
    ResumoNivelAtual = (nivelMinimo <= 0 Or nivelAtual >= nivelMinimo)
End Function

Private Function ResumoEscolhaAtual(ByVal ws As Worksheet, ByVal linha As Long) As Boolean
    Dim chave As String
    Dim valorEsperado As String
    Dim valorAtual As String

    chave = Trim$(CStr(ws.Cells(linha, 10).Value))
    valorEsperado = Trim$(CStr(ws.Cells(linha, 11).Value))
    If Len(chave) = 0 Then
        ResumoEscolhaAtual = True
        Exit Function
    End If

    valorAtual = ValorEscolhaLocal(chave)
    If Len(valorAtual) = 0 Then
        ResumoEscolhaAtual = False
    Else
        ResumoEscolhaAtual = MesmoTexto(valorAtual, valorEsperado)
    End If
End Function

Private Function ValorEscolhaLocal(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long

    If Not PlanilhaExisteLocal(PLANILHA_ESCOLHAS_ATIVAS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS_ATIVAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, chave) Then
            ValorEscolhaLocal = Trim$(CStr(ws.Cells(r, 2).Value))
            Exit Function
        End If
    Next r
End Function

Private Function TextoLinhaResumo(ByVal ws As Worksheet, ByVal linha As Long) As String
    Dim categoria As String
    Dim fonte As String
    Dim alvo As String
    Dim valor As String
    Dim condicao As String
    Dim texto As String

    categoria = Trim$(CStr(ws.Cells(linha, 5).Value))
    fonte = Trim$(CStr(ws.Cells(linha, 4).Value))
    alvo = TextoAlvoLegivel(Trim$(CStr(ws.Cells(linha, 7).Value)))
    valor = Trim$(CStr(ws.Cells(linha, 8).Value))
    condicao = TextoAlvoLegivel(Trim$(CStr(ws.Cells(linha, 12).Value)))

    Select Case LCase$(categoria)
        Case "rd"
            texto = "RD"
            If Len(valor) > 0 Then texto = texto & " " & valor
            If Len(alvo) > 0 Then texto = texto & " " & alvo
        Case "imunidade"
            If Len(alvo) > 0 Then
                texto = alvo
            Else
                texto = "Imunidade"
            End If
        Case "manobra"
            If Len(valor) > 0 Then
                If Left$(valor, 1) <> "-" And Left$(valor, 1) <> "+" Then valor = "+" & valor
                texto = valor
                If Len(alvo) > 0 Then texto = texto & " " & alvo
            ElseIf Len(alvo) > 0 Then
                texto = alvo
            Else
                texto = "Manobra"
            End If
        Case Else
            texto = alvo
    End Select

    If Len(condicao) > 0 Then texto = texto & " [" & condicao & "]"
    If Len(fonte) > 0 Then texto = texto & " (" & fonte & ")"
    TextoLinhaResumo = texto
End Function

Private Function TextoAlvoLegivel(ByVal texto As String) As String
    texto = Trim$(texto)
    If Len(texto) = 0 Then
        TextoAlvoLegivel = texto
        Exit Function
    End If

    texto = Replace(texto, "cansaco", "cansa" & ChrW$(231) & "o", , , vbTextCompare)
    texto = Replace(texto, "metabolico", "metab" & ChrW$(243) & "lico", , , vbTextCompare)
    texto = Replace(texto, "perfuracao", "perfura" & ChrW$(231) & ChrW$(227) & "o", , , vbTextCompare)
    texto = Replace(texto, "acido", ChrW$(225) & "cido", , , vbTextCompare)
    texto = Replace(texto, "eletrico", "el" & ChrW$(233) & "trico", , , vbTextCompare)
    texto = Replace(texto, "criticos", "cr" & ChrW$(237) & "ticos", , , vbTextCompare)
    texto = Replace(texto, "efeitos_de_movimento", "efeitos de movimento", , , vbTextCompare)
    texto = Replace(texto, "_", " ")
    TextoAlvoLegivel = texto
End Function

Private Function TextoProficiencias() As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim itens As Collection
    Dim tipo As String
    Dim nome As String

    If Not PlanilhaExisteLocal(PLANILHA_EFEITOS_ATIVOS) Then
        TextoProficiencias = "Nenhuma"
        Exit Function
    End If

    Set itens = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        tipo = LCase$(Trim$(CStr(ws.Cells(r, 4).Value)))
        If InStr(1, tipo, "proficiencia", vbTextCompare) > 0 Then
            nome = Trim$(CStr(ws.Cells(r, 7).Value))
            If Len(nome) = 0 Then nome = Trim$(CStr(ws.Cells(r, 6).Value))
            If Len(nome) = 0 Then nome = Trim$(CStr(ws.Cells(r, 3).Value))
            If Len(nome) > 0 Then AdicionarUnico itens, nome
        End If
    Next r

    If itens.Count = 0 Then
        TextoProficiencias = "Nenhuma"
    Else
        TextoProficiencias = TextoColecao(itens, ", ")
    End If
End Function

Private Sub FormatarRosto(ByVal ws As Worksheet)
    With ws.Range("B36:C55,F35:H55,D17:D18,F18,G17:G19")
        .WrapText = True
        .VerticalAlignment = xlCenter
    End With
    ws.Range("A36:A55").HorizontalAlignment = xlCenter
    ws.Range("B36:C55,F35:H55,D17:D18,F18,G17:G19").HorizontalAlignment = xlLeft
End Sub

Private Sub AjustarAlturaLinhaTexto(ByVal ws As Worksheet, ByVal numeroLinha As Long, ByVal texto As String, ByVal alturaMinima As Double, ByVal alturaMaxima As Double, ByVal caracteresPorLinha As Long)
    Dim linhas As Long
    Dim altura As Double

    If caracteresPorLinha <= 0 Then caracteresPorLinha = 34
    linhas = (Len(texto) + caracteresPorLinha - 1) \ caracteresPorLinha
    If linhas < 1 Then linhas = 1
    altura = 14 * linhas + 6
    If altura < alturaMinima Then altura = alturaMinima
    If altura > alturaMaxima Then altura = alturaMaxima
    If ws.Rows(numeroLinha).RowHeight < altura Then ws.Rows(numeroLinha).RowHeight = altura
End Sub

Private Function ClasseIdPorNomeLocal(ByVal classe As String) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long

    If Len(classe) = 0 Then Exit Function
    If Not PlanilhaExisteLocal(PLANILHA_BASE_HABILIDADES_CLASSE) Then Exit Function

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES_CLASSE)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 2).Value, classe) Then
            ClasseIdPorNomeLocal = Trim$(CStr(ws.Cells(r, 1).Value))
            Exit Function
        End If
    Next r
End Function

Private Function LinhaDaClasse(ByVal ws As Worksheet, ByVal linha As Long, ByVal classeId As String, ByVal classe As String) As Boolean
    LinhaDaClasse = (Len(classeId) > 0 And MesmoTexto(ws.Cells(linha, 1).Value, classeId)) Or MesmoTexto(ws.Cells(linha, 2).Value, classe)
End Function

Private Function LinhaDaClasseSlot(ByVal ws As Worksheet, ByVal linha As Long, ByVal classeId As String, ByVal classe As String) As Boolean
    LinhaDaClasseSlot = (Len(classeId) > 0 And MesmoTexto(ws.Cells(linha, 1).Value, classeId)) Or MesmoTexto(ws.Cells(linha, 2).Value, classe)
End Function

Private Function LinhaDaClasseSelecionada(ByVal ws As Worksheet, ByVal linha As Long, ByVal classeId As String, ByVal classe As String) As Boolean
    LinhaDaClasseSelecionada = (Len(classeId) > 0 And MesmoTexto(ws.Cells(linha, 3).Value, classeId)) Or MesmoTexto(ws.Cells(linha, 4).Value, classe)
End Function

Private Sub PrepararAreaMesclada(ByVal rng As Range)
    rng.UnMerge
    rng.ClearContents
    rng.Merge
    rng.WrapText = True
    rng.VerticalAlignment = xlCenter
End Sub

Private Sub AplicarValidacaoLista(ByVal celula As Range, ByVal formulaLista As String)
    On Error Resume Next
    celula.Validation.Delete
    On Error GoTo 0
    celula.Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:=formulaLista
    celula.Validation.IgnoreBlank = True
    celula.Validation.InCellDropdown = True
End Sub

Private Sub LimparValidacao(ByVal celula As Range)
    On Error Resume Next
    celula.Validation.Delete
    On Error GoTo 0
End Sub

Private Function PlanilhaExisteLocal(ByVal nomePlanilha As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nomePlanilha)
    PlanilhaExisteLocal = Not ws Is Nothing
    On Error GoTo 0
End Function

Private Function MesmoTexto(ByVal valorA As Variant, ByVal valorB As Variant) As Boolean
    MesmoTexto = (LCase$(Trim$(CStr(valorA))) = LCase$(Trim$(CStr(valorB))))
End Function

Private Sub AdicionarUnico(ByVal itens As Collection, ByVal texto As String)
    Dim item As Variant
    texto = Trim$(texto)
    If Len(texto) = 0 Then Exit Sub
    For Each item In itens
        If MesmoTexto(CStr(item), texto) Then Exit Sub
    Next item
    itens.Add texto
End Sub

Private Function ColecaoContem(ByVal itens As Collection, ByVal texto As String) As Boolean
    Dim item As Variant
    For Each item In itens
        If MesmoTexto(CStr(item), texto) Then
            ColecaoContem = True
            Exit Function
        End If
    Next item
End Function

Private Function TextoColecao(ByVal itens As Collection, Optional ByVal separador As String = ", ") As String
    Dim item As Variant
    Dim partes As String

    For Each item In itens
        If Len(partes) > 0 Then partes = partes & separador
        partes = partes & CStr(item)
    Next item
    TextoColecao = partes
End Function
