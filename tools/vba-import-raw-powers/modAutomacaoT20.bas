Attribute VB_Name = "modAutomacaoT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_CLASSES As String = "Classes"
Private Const PLANILHA_PERICIAS_CLASSES As String = "Pericias_Classes"
Private Const PLANILHA_TREINO As String = "Treino_Pericias"
Private Const PLANILHA_DADOS As String = "Dados"
Private Const CELULA_CLASSE As String = "F2"
Private Const CELULA_RACA As String = "B2"
Private Const RANGE_BONUS_RACIAL As String = "A5:F5"
Private Const PRIMEIRA_LINHA_PERICIA_PRINCIPAL As Long = 4
Private Const PRIMEIRA_LINHA_TREINO As Long = 2
Private Const COL_CLASSE_OBRIG As Long = 5
Private Const COL_CLASSE_FLEX As Long = 6
Private Const COL_CLASSE_ESCOLHA As Long = 7
Private Const COL_CLASSE_ESPECIAL As Long = 8
Private Const COL_INT As Long = 9
Private Const COL_RACA As Long = 10
Private Const COL_PODER As Long = 11
Private Const COL_MANUAL As Long = 12
Private Const COL_FINAL As Long = 13
Private Const COL_ORIGEM As Long = 14
Private Const MAX_ESCOLHAS_ATRIBUTOS As Long = 3
Private Const MINIMO_LINHAS_OFICIO As Long = 2

Public Function CodexAutoVersion() As String
    CodexAutoVersion = "T20 automation racas-complexas 2026-08-25"
End Function

Public Sub AtualizarAtributosDaRaca(Optional ByVal AtualizarEfeitos As Boolean = True)
    Dim wsP As Worksheet
    Dim wsR As Worksheet
    Dim raca As String
    Dim linha As Long
    Dim total(1 To 6) As Long
    Dim qtdFlex As Long
    Dim permitidos As Collection
    Dim usados As Collection
    Dim disponiveis As Collection
    Dim escolha As String
    Dim posicao As Long
    Dim i As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsR = PlanilhaRacas()

    raca = Trim$(CStr(wsP.Range(CELULA_RACA).Value))
    linha = LinhaDaRaca(wsR, raca)

    If linha = 0 Then
        wsP.Range(RANGE_BONUS_RACIAL).Value = 0

        If AtualizarEfeitos Then modRegrasT20.AtualizarEfeitosAtivos
        Exit Sub
    End If

    For i = 1 To 6
        total(i) = CLng(Val(CStr(wsR.Cells(linha, i + 1).Value)))
    Next i

    If modRegrasT20.AplicarAtributosComplexosRaca(raca, total) Then


        EscreverBonusRacial wsP, total


        If AtualizarEfeitos Then modRegrasT20.AtualizarEfeitosAtivos


        Exit Sub


    End If



    If modRegrasT20.AplicarAtributosRacaSelecionada(raca, total) Then
        EscreverBonusRacial wsP, total
        If AtualizarEfeitos Then modRegrasT20.AtualizarEfeitosAtivos
        Exit Sub
    End If

    qtdFlex = CLng(Val(CStr(wsR.Cells(linha, "H").Value)))
    If qtdFlex > MAX_ESCOLHAS_ATRIBUTOS Then qtdFlex = MAX_ESCOLHAS_ATRIBUTOS

    If qtdFlex > 0 Then
        Set permitidos = ListaPermitidosAtributos(CStr(wsR.Cells(linha, "I").Value))
        Set usados = New Collection

        For i = 1 To qtdFlex
            Set disponiveis = DisponiveisSemUsados(permitidos, usados)
            If disponiveis.Count = 0 Then Exit For

            escolha = EscolherAtributoPorFormulario(disponiveis, raca, i, qtdFlex)
            If Len(escolha) = 0 Then Exit For

            posicao = PosicaoAtributo(escolha)
            If posicao > 0 Then
                total(posicao) = total(posicao) + 1
                usados.Add escolha
            End If
        Next i
    End If

    EscreverBonusRacial wsP, total


    If AtualizarEfeitos Then modRegrasT20.AtualizarEfeitosAtivos
End Sub

Public Sub RecalcularTreinosTudo(Optional ByVal AtualizarEfeitos As Boolean = True)
    ResetarOficiosParaPadrao
    GarantirMinimoLinhasOficio
    PrepararTreinoPericias
    LimparColunasTreino COL_CLASSE_OBRIG, COL_RACA
    AplicarTreinosClasse
    AtualizarTreinoPorInteligencia True
    AtualizarTreinoRaca

    If AtualizarEfeitos Then modRegrasT20.AtualizarEfeitosAtivos
End Sub

Public Sub AtualizarTreinoPorInteligencia(Optional ByVal Forcar As Boolean = False)
    Dim wsP As Worksheet
    Dim qtdNecessaria As Long
    Dim qtdAtual As Long
    Dim opcoes As Collection

    GarantirMinimoLinhasOficio
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    qtdNecessaria = CLng(Val(CStr(wsP.Range("D6").Value)))
    If qtdNecessaria < 0 Then qtdNecessaria = 0

    qtdAtual = ContarTreinosNaColuna(COL_INT)
    If Not Forcar Then
        If qtdAtual = qtdNecessaria Then Exit Sub
    End If

    LimparOficiosPorFonte COL_INT


    LimparColunaTreino COL_INT
    If qtdNecessaria <= 0 Then Exit Sub

    Set opcoes = TodasAsPericias()
    EscolherMultiplasPericias opcoes, qtdNecessaria, COL_INT, "Pericia por Inteligencia"
End Sub

Public Sub AtualizarTreinoRaca()
    Dim wsP As Worksheet
    Dim wsR As Worksheet
    Dim raca As String
    Dim linha As Long
    Dim qtd As Long
    Dim opcoes As Collection
    Dim textoPermitido As String

    GarantirMinimoLinhasOficio
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsR = PlanilhaRacas()

    raca = Trim$(CStr(wsP.Range(CELULA_RACA).Value))
    linha = LinhaDaRaca(wsR, raca)

    LimparOficiosPorFonte COL_RACA


    LimparColunaTreino COL_RACA
    If linha = 0 Then Exit Sub


    If AplicarTreinoRacaEspecial(raca) Then Exit Sub

    qtd = CLng(Val(CStr(wsR.Cells(linha, "J").Value)))
    If qtd <= 0 Then Exit Sub

    textoPermitido = Trim$(CStr(wsR.Cells(linha, "K").Value))
    If Len(textoPermitido) = 0 Then
        Set opcoes = TodasAsPericias()
    Else
        Set opcoes = ListaPericiasPorTexto(textoPermitido)
    End If

    EscolherMultiplasPericias opcoes, qtd, COL_RACA, "Pericia de raca: " & raca
End Sub

Public Sub EscolherPericiaPorPoder(Optional ByVal quantidade As Long = 1)
    If quantidade < 1 Then quantidade = 1
    GarantirMinimoLinhasOficio
    PrepararTreinoPericias
    EscolherMultiplasPericias TodasAsPericias(), quantidade, COL_PODER, "Pericia por poder"
End Sub

Public Sub EscolherPericiaManual(Optional ByVal quantidade As Long = 1)
    If quantidade < 1 Then quantidade = 1
    GarantirMinimoLinhasOficio
    PrepararTreinoPericias
    EscolherMultiplasPericias TodasAsPericias(), quantidade, COL_MANUAL, "Pericia manual"
End Sub

' BEGIN CODEX_T20_RACE_TRAINING
Private Function AplicarTreinoRacaEspecial(ByVal raca As String) As Boolean
    Dim opcoes As Collection
    Dim escolha As String
    Dim qtd As Long

    If MesmoTextoLocal(raca, "Humano") Then
        Set opcoes = CriarListaOpcoesLocal("Duas pericias", "Uma pericia e um poder geral")
        escolha = GarantirEscolhaLocal("Raca_Humano_Versatil", "Raca: Humano" & vbCrLf & "Versatil.", opcoes)
        If MesmoTextoLocal(escolha, "Uma pericia e um poder geral") Then qtd = 1 Else qtd = 2
        EscolherMultiplasPericias TodasAsPericias(), qtd, COL_RACA, "Pericia de raca: Humano"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Osteon") Then
        AplicarTreinoOpcaoPericiaOuPoder "Raca_Osteon_Memoria_Postuma", "Raca: Osteon" & vbCrLf & "Memoria Postuma.", "Osteon"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Yidishan") Then
        AplicarTreinoOpcaoPericiaOuPoder "Raca_Yidishan_Natureza_Organica", "Raca: Yidishan" & vbCrLf & "Natureza Organica.", "Yidishan"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Kliren") Then
        EscolherMultiplasPericias TodasAsPericias(), 1, COL_RACA, "Pericia de raca: Kliren"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Galokk") Then
        EscolherMultiplasPericias TodasAsPericias(), 1, COL_RACA, "Pericia de raca: Galokk"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Meio-Orc") Then
        EscolherMultiplasPericias TodasAsPericias(), 1, COL_RACA, "Pericia de raca: Meio-Orc"
        AplicarTreinoRacaEspecial = True
    ElseIf MesmoTextoLocal(raca, "Ceratops") Then
        Set opcoes = CriarListaOpcoesLocal("Cura", NomeIntimidacaoLocal(), NomeOficioLocal(), NomeSobrevivenciaLocal())
        EscolherMultiplasPericias opcoes, 1, COL_RACA, "Pericia de raca: Ceratops"
        AplicarTreinoRacaEspecial = True
    End If
End Function

Private Sub AplicarTreinoOpcaoPericiaOuPoder(ByVal chave As String, ByVal titulo As String, ByVal raca As String)
    Dim opcoes As Collection
    Dim escolha As String

    Set opcoes = CriarListaOpcoesLocal("Pericia treinada", "Poder geral", "Heranca racial")
    escolha = GarantirEscolhaLocal(chave, titulo, opcoes)
    If MesmoTextoLocal(escolha, "Pericia treinada") Then
        EscolherMultiplasPericias TodasAsPericias(), 1, COL_RACA, "Pericia de raca: " & raca
    End If
End Sub

Private Function GarantirEscolhaLocal(ByVal chave As String, ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim escolha As String
    escolha = ValorEscolhaLocal(chave)
    If Len(escolha) = 0 Then
        escolha = EscolherPericiaPorFormulario(opcoes, titulo)
        If Len(escolha) > 0 Then DefinirEscolhaLocal chave, escolha
    End If
    GarantirEscolhaLocal = escolha
End Function

Private Function ValorEscolhaLocal(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    If Len(Trim$(chave)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets("Escolhas_Ativas")
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEscolhaLocal = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEscolhaLocal(ByVal chave As String, ByVal valor As String)
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long
    If Len(Trim$(chave)) = 0 Then Exit Sub
    Set ws = ThisWorkbook.Worksheets("Escolhas_Ativas")
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If IsError(resultado) Then
        linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
        ws.Cells(linha, 1).Value = chave
    Else
        linha = CLng(resultado)
    End If
    ws.Cells(linha, 2).Value = valor
End Sub

Private Function CriarListaOpcoesLocal(ParamArray itens() As Variant) As Collection
    Dim lista As Collection
    Dim i As Long
    Set lista = New Collection
    For i = LBound(itens) To UBound(itens)
        AdicionarUnico lista, CStr(itens(i))
    Next i
    Set CriarListaOpcoesLocal = lista
End Function

Private Function MesmoTextoLocal(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTextoLocal = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function

Private Function NomeIntimidacaoLocal() As String
    NomeIntimidacaoLocal = "Intimida" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function NomeOficioLocal() As String
    NomeOficioLocal = "Of" & ChrW$(237) & "cio"
End Function

Private Function NomeSobrevivenciaLocal() As String
    NomeSobrevivenciaLocal = "Sobreviv" & ChrW$(234) & "ncia"
End Function
' END CODEX_T20_RACE_TRAINING
Private Sub AplicarTreinosClasse()
    Dim classe As String
    Dim obrigatorias As Collection
    Dim escolhas As Collection
    Dim qtdEscolhas As Long

    classe = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range(CELULA_CLASSE).Value))
    If Len(classe) = 0 Then Exit Sub

    Set obrigatorias = PericiasDaClassePorTipo(classe, "Obrigat" & ChrW$(243) & "ria")
    MarcarListaPericias obrigatorias, COL_CLASSE_OBRIG

    AplicarFlexiveisClasse classe

    qtdEscolhas = QuantidadeEscolhasClasse(classe)
    If qtdEscolhas > 0 Then
        Set escolhas = PericiasDaClassePorTipo(classe, "Escolha")
        EscolherMultiplasPericias escolhas, qtdEscolhas, COL_CLASSE_ESCOLHA, "Pericias de classe: " & classe
    End If
End Sub

Private Sub AplicarFlexiveisClasse(ByVal classe As String)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim grupos As Object
    Dim ordem As Collection
    Dim r As Long
    Dim grupo As String
    Dim pericia As String
    Dim key As Variant
    Dim opcoes As Collection
    Dim escolha As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PERICIAS_CLASSES)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    Set grupos = CreateObject("Scripting.Dictionary")
    Set ordem = New Collection

    For r = 2 To ultimaLinha
        If StrComp(Trim$(CStr(ws.Cells(r, 1).Value)), classe, vbTextCompare) = 0 Then
            If TipoEh(ws.Cells(r, 2).Value, "Flex" & ChrW$(237) & "vel") Then
                grupo = Trim$(CStr(ws.Cells(r, 3).Value))
                If Len(grupo) = 0 Then grupo = "Flex"
                pericia = Trim$(CStr(ws.Cells(r, 4).Value))
                If Len(pericia) > 0 Then
                    If Not grupos.Exists(grupo) Then
                        grupos.Add grupo, New Collection
                        ordem.Add grupo
                    End If
                    grupos(grupo).Add pericia
                End If
            End If
        End If
    Next r

    For Each key In ordem
        Set opcoes = grupos(CStr(key))
        If opcoes.Count > 0 Then
            escolha = EscolherPericiaPorFormulario(opcoes, "Pericia obrigatoria flexivel: " & classe)
            If Len(escolha) > 0 Then MarcarPericia escolha, COL_CLASSE_FLEX
        End If
    Next key
End Sub

Private Function PericiasDaClassePorTipo(ByVal classe As String, ByVal tipo As String) As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim lista As Collection
    Dim r As Long
    Dim pericia As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PERICIAS_CLASSES)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    Set lista = New Collection

    For r = 2 To ultimaLinha
        If StrComp(Trim$(CStr(ws.Cells(r, 1).Value)), classe, vbTextCompare) = 0 Then
            If TipoEh(ws.Cells(r, 2).Value, tipo) Then
                pericia = NomeBasePericia(Trim$(CStr(ws.Cells(r, 4).Value)))
                If Len(pericia) > 0 Then AdicionarUnico lista, pericia
            End If
        End If
    Next r

    Set PericiasDaClassePorTipo = lista
End Function

Private Function QuantidadeEscolhasClasse(ByVal classe As String) As Long
    Dim ws As Worksheet
    Dim resultado As Variant

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CLASSES)
    resultado = Application.Match(classe, ws.Columns(1), 0)
    If Not IsError(resultado) Then
        QuantidadeEscolhasClasse = CLng(Val(CStr(ws.Cells(CLng(resultado), "F").Value)))
    End If
End Function

Private Sub EscolherMultiplasPericias(ByVal opcoesBase As Collection, ByVal quantidade As Long, ByVal colunaFonte As Long, ByVal titulo As String)
    Dim i As Long
    Dim disponiveis As Collection
    Dim escolha As String

    If quantidade <= 0 Then Exit Sub

    For i = 1 To quantidade
        Set disponiveis = FiltrarPericiasNaoTreinadas(opcoesBase)
        If disponiveis.Count = 0 Then Exit For

        escolha = EscolherPericiaPorFormulario(disponiveis, titulo & " (" & i & " de " & quantidade & ")")
        If Len(escolha) = 0 Then Exit For

        MarcarPericia escolha, colunaFonte
    Next i
End Sub

Private Function EscolherAtributoPorFormulario(ByVal opcoes As Collection, ByVal raca As String, ByVal indice As Long, ByVal total As Long) As String
    EscolherAtributoPorFormulario = EscolherItemPorFormulario( _
        "Ra" & ChrW$(231) & "a: " & raca & vbCrLf & "Escolha " & indice & " de " & total & ".", _
        opcoes, True)
End Function

Private Function EscolherPericiaPorFormulario(ByVal opcoes As Collection, ByVal titulo As String) As String
    EscolherPericiaPorFormulario = EscolherItemPorFormulario(titulo, opcoes, False)
End Function

Private Function EscolherItemPorFormulario(ByVal titulo As String, ByVal opcoes As Collection, ByVal opcoesSaoAtributos As Boolean) As String
    Dim formulario As Object

    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, opcoesSaoAtributos
    formulario.Show vbModal

    If Not formulario.Cancelado Then EscolherItemPorFormulario = formulario.escolha
    Unload formulario
End Function

Public Sub GarantirMinimoLinhasOficio()
    GarantirMinimoLinhasOficioBasico
    CompactarOficiosVazios
End Sub

Public Sub ResetarOficiosParaPadrao(Optional ByVal preservarPoderManual As Boolean = True)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim r As Long
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    GarantirMinimoLinhasOficioBasico

    For r = UltimaLinhaPericiaPrincipal() To PRIMEIRA_LINHA_PERICIA_PRINCIPAL Step -1
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If preservarPoderManual And LinhaTemPoderOuManual(linhaTreino) Then
                ConfigurarFormulasLinhaOficio r
            Else
                wsT.Range(wsT.Cells(linhaTreino, COL_CLASSE_OBRIG), wsT.Cells(linhaTreino, COL_MANUAL)).Value = False
                ConfigurarLinhaOficio r
            End If
        End If
    Next r

    CompactarOficiosVazios
    GarantirMinimoLinhasOficioBasico
End Sub

Private Sub LimparOficiosPorFonte(ByVal colunaFonte As Long)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim r As Long
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If CBool(wsT.Cells(linhaTreino, colunaFonte).Value) Then
                wsT.Cells(linhaTreino, colunaFonte).Value = False
                If Not LinhaTemFonteTreino(linhaTreino) Then ConfigurarLinhaOficio r
            End If
        End If
    Next r

    NormalizarOficiosSemFonte
End Sub

Private Sub NormalizarOficiosSemFonte()
    Dim wsP As Worksheet
    Dim r As Long
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If Not LinhaTemFonteTreino(linhaTreino) Then
                If Not EhOficioVazio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then ConfigurarLinhaOficio r
            End If
        End If
    Next r

    CompactarOficiosVazios
    GarantirMinimoLinhasOficioBasico
End Sub

Private Sub GarantirMinimoLinhasOficioBasico()
    Dim qtd As Long
    qtd = ContarLinhasOficio()
    Do While qtd < MINIMO_LINHAS_OFICIO
        InserirLinhaOficio
        qtd = qtd + 1
    Loop
End Sub

Private Sub CompactarOficiosVazios()
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim r As Long
    Dim linhaTreino As Long
    Dim qtd As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    qtd = ContarLinhasOficio()

    For r = UltimaLinhaPericiaPrincipal() To PRIMEIRA_LINHA_PERICIA_PRINCIPAL Step -1
        If qtd <= MINIMO_LINHAS_OFICIO Then Exit For
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If EhOficioVazio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) And Not LinhaTemFonteTreino(linhaTreino) Then
                wsT.Rows(linhaTreino).Delete
                wsP.Range(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(r, modLayoutT20.COL_PERICIA_OBS)).Delete Shift:=xlUp
                qtd = qtd - 1
            End If
        End If
    Next r
End Sub

Private Function ContarLinhasOficio() As Long
    Dim ws As Worksheet
    Dim r As Long

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If EhOficio(ws.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then ContarLinhasOficio = ContarLinhasOficio + 1
    Next r
End Function

Private Sub MarcarOficioEspecifico(ByVal colunaFonte As Long)
    Dim opcoes As Collection
    Dim escolhido As String
    Dim linhaPrincipal As Long
    Dim linhaTreino As Long

    Set opcoes = OficiosDisponiveis()
    If opcoes.Count = 0 Then
        MsgBox "Nao ha oficios disponiveis para selecionar.", vbInformation, "Forja T20"
        Exit Sub
    End If

    escolhido = EscolherPericiaPorFormulario(opcoes, "Escolha o oficio especifico")
    If Len(escolhido) = 0 Then Exit Sub

    linhaPrincipal = LinhaOficioParaUsar(escolhido)
    linhaTreino = LinhaTreinoPorLinhaPrincipal(linhaPrincipal)

    ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_NOME).Value = escolhido
    ThisWorkbook.Worksheets(PLANILHA_TREINO).Cells(linhaTreino, colunaFonte).Value = True
    ConfigurarFormulasLinhaOficio linhaPrincipal
End Sub

Private Function OficiosDisponiveis() As Collection
    Dim lista As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim oficio As String

    Set lista = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_DADOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 5).End(xlUp).Row

    For r = 2 To ultimaLinha
        oficio = Trim$(CStr(ws.Cells(r, 5).Value))
        If Len(oficio) > 0 Then
            If Not OficioJaTreinado(oficio) Then AdicionarUnico lista, oficio
        End If
    Next r

    Set OficiosDisponiveis = lista
End Function

Private Function OficioJaTreinado(ByVal oficio As String) As Boolean
    Dim wsP As Worksheet
    Dim r As Long
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If StrComp(Trim$(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)), oficio, vbTextCompare) = 0 Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If LinhaTemFonteTreino(linhaTreino) Then
                OficioJaTreinado = True
                Exit Function
            End If
        End If
    Next r
End Function

Private Function LinhaOficioParaUsar(ByVal oficio As String) As Long
    Dim wsP As Worksheet
    Dim r As Long
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If StrComp(Trim$(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)), oficio, vbTextCompare) = 0 Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If Not LinhaTemFonteTreino(linhaTreino) Then
                LinhaOficioParaUsar = r
                Exit Function
            End If
        End If
    Next r

    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipal(r)
            If EhOficioVazio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) And Not LinhaTemFonteTreino(linhaTreino) Then
                LinhaOficioParaUsar = r
                Exit Function
            End If
        End If
    Next r

    LinhaOficioParaUsar = InserirLinhaOficio()
End Function

Private Function InserirLinhaOficio() As Long
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim linhaModelo As Long
    Dim linhaNova As Long
    Dim linhaTreinoNova As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    linhaModelo = UltimaLinhaOficio()
    If linhaModelo = 0 Then linhaModelo = 21

    linhaNova = linhaModelo + 1
    linhaTreinoNova = LinhaTreinoPorLinhaPrincipal(linhaNova)

    wsT.Rows(linhaTreinoNova).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove
    wsP.Range(wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_OBS)).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove

    wsP.Range(wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_OBS)).Copy
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormats
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormulas
    Application.CutCopyMode = False

    ConfigurarLinhaOficio linhaNova

    wsT.Range(wsT.Cells(linhaTreinoNova, COL_CLASSE_OBRIG), wsT.Cells(linhaTreinoNova, COL_MANUAL)).Value = False
    wsT.Cells(linhaTreinoNova, COL_FINAL).Formula = "=OR(E" & linhaTreinoNova & ":L" & linhaTreinoNova & ",N" & linhaTreinoNova & ")"

    InserirLinhaOficio = linhaNova
End Function

Private Sub ConfigurarLinhaOficio(ByVal linhaPrincipal As Long)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    linhaTreino = LinhaTreinoPorLinhaPrincipal(linhaPrincipal)

    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_NOME).Value = NomeOficioVazio()
    wsT.Range(wsT.Cells(linhaTreino, COL_CLASSE_OBRIG), wsT.Cells(linhaTreino, COL_MANUAL)).Value = False
    ConfigurarFormulasLinhaOficio linhaPrincipal
End Sub

Private Sub ConfigurarFormulasLinhaOficio(ByVal linhaPrincipal As Long)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    linhaTreino = LinhaTreinoPorLinhaPrincipal(linhaPrincipal)

    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_ATRIBUTO).Value = "INT"
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TOTAL).Formula = modRegrasT20.FormulaTotalPericiaPrincipal(linhaPrincipal, linhaTreino)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TREINO).Formula = "=" & PLANILHA_TREINO & "!M" & linhaTreino
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_BONUS).Formula = modRegrasT20.FormulaBonusPericiaPrincipal(linhaPrincipal)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_OBS).ClearContents

    wsT.Cells(linhaTreino, 1).Formula = "=INT(Principal!$F$1/2)"
    wsT.Cells(linhaTreino, 2).Formula = "=IF(Principal!L" & linhaPrincipal & ",2,0)"
    wsT.Cells(linhaTreino, 3).Value = "SIM"
    wsT.Cells(linhaTreino, 4).Value = "NAO"
    wsT.Cells(linhaTreino, COL_FINAL).Formula = "=OR(E" & linhaTreino & ":L" & linhaTreino & ",N" & linhaTreino & ")"
End Sub

Private Function UltimaLinhaOficio() As Long
    Dim wsP As Worksheet
    Dim r As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = UltimaLinhaPericiaPrincipal() To PRIMEIRA_LINHA_PERICIA_PRINCIPAL Step -1
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            UltimaLinhaOficio = r
            Exit Function
        End If
    Next r
End Function

Private Function NomeOficioBase() As String
    NomeOficioBase = "Of" & ChrW$(237) & "cio"
End Function

Private Function NomeOficioVazio() As String
    NomeOficioVazio = NomeOficioBase() & " ( )"
End Function

Private Function EhOficio(ByVal valor As Variant) As Boolean
    EhOficio = (StrComp(Left$(Trim$(CStr(valor)), Len(NomeOficioBase())), NomeOficioBase(), vbTextCompare) = 0)
End Function

Private Function EhOficioVazio(ByVal valor As Variant) As Boolean
    EhOficioVazio = (StrComp(Trim$(CStr(valor)), NomeOficioVazio(), vbTextCompare) = 0)
End Function

Private Function NomeBasePericia(ByVal pericia As String) As String
    If EhOficio(pericia) Then
        NomeBasePericia = NomeOficioBase()
    Else
        NomeBasePericia = Trim$(pericia)
    End If
End Function

Private Function LinhaTemFonteTreino(ByVal linhaTreino As Long) As Boolean
    Dim ws As Worksheet
    Dim c As Long

    If linhaTreino <= 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    For c = COL_CLASSE_OBRIG To COL_ORIGEM
        If CBool(ws.Cells(linhaTreino, c).Value) Then
            LinhaTemFonteTreino = True
            Exit Function
        End If
    Next c
End Function

Private Function LinhaTemPoderOuManual(ByVal linhaTreino As Long) As Boolean
    Dim ws As Worksheet
    If linhaTreino <= 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    LinhaTemPoderOuManual = (CBool(ws.Cells(linhaTreino, COL_PODER).Value) Or CBool(ws.Cells(linhaTreino, COL_MANUAL).Value))
End Function

Private Sub PrepararTreinoPericias()
    Dim ws As Worksheet
    Dim r As Long

    GarantirMinimoLinhasOficio
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    For r = PRIMEIRA_LINHA_TREINO To UltimaLinhaTreino()
        ws.Cells(r, COL_FINAL).Formula = "=OR(E" & r & ":L" & r & ",N" & r & ")"
    Next r
End Sub

Private Sub LimparColunasTreino(ByVal primeiraColuna As Long, ByVal ultimaColuna As Long)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    ws.Range(ws.Cells(PRIMEIRA_LINHA_TREINO, primeiraColuna), ws.Cells(UltimaLinhaTreino(), ultimaColuna)).Value = False
End Sub

Private Sub LimparColunaTreino(ByVal coluna As Long)
    LimparColunasTreino coluna, coluna
End Sub

Private Sub MarcarListaPericias(ByVal lista As Collection, ByVal colunaFonte As Long)
    Dim item As Variant
    For Each item In lista
        MarcarPericia CStr(item), colunaFonte
    Next item
End Sub

Private Sub MarcarPericia(ByVal pericia As String, ByVal colunaFonte As Long)
    Dim linha As Long
    Dim nomeBase As String

    nomeBase = NomeBasePericia(pericia)
    If EhOficio(nomeBase) Then
        MarcarOficioEspecifico colunaFonte
        Exit Sub
    End If

    linha = LinhaTreinoPericia(nomeBase)
    If linha > 0 Then ThisWorkbook.Worksheets(PLANILHA_TREINO).Cells(linha, colunaFonte).Value = True
End Sub

Private Function LinhaTreinoPericia(ByVal pericia As String) As Long
    Dim wsP As Worksheet
    Dim r As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        If StrComp(NomeBasePericia(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)), pericia, vbTextCompare) = 0 Then
            LinhaTreinoPericia = LinhaTreinoPorLinhaPrincipal(r)
            Exit Function
        End If
    Next r
End Function

Private Function LinhaTreinoPorLinhaPrincipal(ByVal linhaPrincipal As Long) As Long
    LinhaTreinoPorLinhaPrincipal = PRIMEIRA_LINHA_TREINO + (linhaPrincipal - PRIMEIRA_LINHA_PERICIA_PRINCIPAL)
End Function

Private Function UltimaLinhaTreino() As Long
    UltimaLinhaTreino = LinhaTreinoPorLinhaPrincipal(UltimaLinhaPericiaPrincipal())
End Function

Private Function UltimaLinhaPericiaPrincipal() As Long
    Dim wsP As Worksheet
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    UltimaLinhaPericiaPrincipal = wsP.Cells(wsP.Rows.Count, modLayoutT20.COL_PERICIA_NOME).End(xlUp).Row
    If UltimaLinhaPericiaPrincipal < PRIMEIRA_LINHA_PERICIA_PRINCIPAL Then UltimaLinhaPericiaPrincipal = PRIMEIRA_LINHA_PERICIA_PRINCIPAL
End Function

Private Function TodasAsPericias() As Collection
    Dim wsP As Worksheet
    Dim lista As Collection
    Dim r As Long
    Dim nomeBase As String

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set lista = New Collection

    For r = PRIMEIRA_LINHA_PERICIA_PRINCIPAL To UltimaLinhaPericiaPrincipal()
        nomeBase = NomeBasePericia(Trim$(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)))
        If Len(nomeBase) > 0 Then AdicionarUnico lista, nomeBase
    Next r

    Set TodasAsPericias = lista
End Function

Private Function ListaPericiasPorTexto(ByVal texto As String) As Collection
    Dim lista As Collection
    Dim partes As Variant
    Dim parte As Variant
    Dim valor As String

    Set lista = New Collection
    texto = Replace(texto, ";", ",")
    partes = Split(texto, ",")

    For Each parte In partes
        valor = NomeBasePericia(Trim$(CStr(parte)))
        If Len(valor) > 0 Then AdicionarUnico lista, valor
    Next parte

    Set ListaPericiasPorTexto = lista
End Function

Private Function FiltrarPericiasNaoTreinadas(ByVal opcoes As Collection) As Collection
    Dim lista As Collection
    Dim item As Variant
    Dim nomeBase As String

    Set lista = New Collection
    For Each item In opcoes
        nomeBase = NomeBasePericia(CStr(item))
        If Not PericiaTreinada(nomeBase) Then AdicionarUnico lista, nomeBase
    Next item

    Set FiltrarPericiasNaoTreinadas = lista
End Function

Private Function PericiaTreinada(ByVal pericia As String) As Boolean
    Dim ws As Worksheet
    Dim linha As Long
    Dim c As Long

    If EhOficio(pericia) Then
        PericiaTreinada = (OficiosDisponiveis().Count = 0)
        Exit Function
    End If

    linha = LinhaTreinoPericia(pericia)
    If linha = 0 Then Exit Function

    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    For c = COL_CLASSE_OBRIG To COL_ORIGEM
        If CBool(ws.Cells(linha, c).Value) Then
            PericiaTreinada = True
            Exit Function
        End If
    Next c
End Function

Private Function ContarTreinosNaColuna(ByVal coluna As Long) As Long
    Dim ws As Worksheet
    Dim r As Long

    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    For r = PRIMEIRA_LINHA_TREINO To UltimaLinhaTreino()
        If CBool(ws.Cells(r, coluna).Value) Then ContarTreinosNaColuna = ContarTreinosNaColuna + 1
    Next r
End Function

Private Sub EscreverBonusRacial(ByVal wsP As Worksheet, ByRef total() As Long)
    Dim valores(1 To 1, 1 To 6) As Variant
    Dim i As Long

    For i = 1 To 6
        valores(1, i) = total(i)
    Next i

    wsP.Range(RANGE_BONUS_RACIAL).Value = valores
End Sub

Private Function PlanilhaRacas() As Worksheet
    Set PlanilhaRacas = ThisWorkbook.Worksheets("Ra" & ChrW$(231) & "as")
End Function

Private Function LinhaDaRaca(ByVal wsR As Worksheet, ByVal raca As String) As Long
    Dim resultado As Variant
    If Len(raca) = 0 Then Exit Function

    resultado = Application.Match(raca, wsR.Columns(1), 0)
    If Not IsError(resultado) Then LinhaDaRaca = CLng(resultado)
End Function

Private Function ListaPermitidosAtributos(ByVal texto As String) As Collection
    Dim lista As Collection
    Dim partes As Variant
    Dim parte As Variant
    Dim atributo As String

    Set lista = New Collection
    partes = Split(texto, ",")

    For Each parte In partes
        atributo = UCase$(Trim$(CStr(parte)))
        If Len(atributo) > 0 Then AdicionarUnico lista, atributo
    Next parte

    Set ListaPermitidosAtributos = lista
End Function

Private Function DisponiveisSemUsados(ByVal permitidos As Collection, ByVal usados As Collection) As Collection
    Dim lista As Collection
    Dim item As Variant

    Set lista = New Collection
    For Each item In permitidos
        If Not Contem(usados, CStr(item)) Then lista.Add CStr(item)
    Next item

    Set DisponiveisSemUsados = lista
End Function

Private Function PosicaoAtributo(ByVal atributo As String) As Long
    Select Case UCase$(Trim$(atributo))
        Case "FOR": PosicaoAtributo = 1
        Case "DES": PosicaoAtributo = 2
        Case "CON": PosicaoAtributo = 3
        Case "INT": PosicaoAtributo = 4
        Case "SAB": PosicaoAtributo = 5
        Case "CAR": PosicaoAtributo = 6
    End Select
End Function

Public Function NomeCompletoAtributo(ByVal atributo As String) As String
    Select Case UCase$(Trim$(atributo))
        Case "FOR": NomeCompletoAtributo = "For" & ChrW$(231) & "a"
        Case "DES": NomeCompletoAtributo = "Destreza"
        Case "CON": NomeCompletoAtributo = "Constitui" & ChrW$(231) & ChrW$(227) & "o"
        Case "INT": NomeCompletoAtributo = "Intelig" & ChrW$(234) & "ncia"
        Case "SAB": NomeCompletoAtributo = "Sabedoria"
        Case "CAR": NomeCompletoAtributo = "Carisma"
        Case Else: NomeCompletoAtributo = atributo
    End Select
End Function

Private Function TipoEh(ByVal valorAtual As Variant, ByVal esperado As String) As Boolean
    TipoEh = (StrComp(Trim$(CStr(valorAtual)), esperado, vbTextCompare) = 0)
End Function

Private Sub AdicionarUnico(ByVal lista As Collection, ByVal valor As String)
    If Len(valor) = 0 Then Exit Sub
    If Not Contem(lista, valor) Then lista.Add valor
End Sub

Private Function Contem(ByVal lista As Collection, ByVal valor As String) As Boolean
    Dim item As Variant

    For Each item In lista
        If StrComp(CStr(item), valor, vbTextCompare) = 0 Then
            Contem = True
            Exit Function
        End If
    Next item
End Function











