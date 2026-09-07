Attribute VB_Name = "modPoderesT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_BASE_HABILIDADES As String = "Base_Habilidades_Classe"
Private Const PLANILHA_BASE_SLOTS As String = "Base_Slots_Poder_Classe"
Private Const PLANILHA_CATALOGO As String = "Base_Poderes_Catalogo"
Private Const PLANILHA_MAPA_CLASSE As String = "Base_Poderes_Classe_Map"
Private Const PLANILHA_ORIGENS As String = "Base_Origens"
Private Const PLANILHA_SELECIONADOS As String = "Poderes_Classe_Selecionados"
Private Const PLANILHA_ATIVAS As String = "Habilidades_Classe_Ativas"
Private Const PLANILHA_ESCOLHAS As String = "Escolhas_Ativas"
Private Const PLANILHA_BASE_PERICIAS As String = "Base_Pericias"
Private Const PLANILHA_TREINO As String = "Treino_Pericias"
Private Const PLANILHA_DADOS As String = "Dados"
Private Const PLANILHA_EFEITOS_ATIVOS As String = "Efeitos_Ativos"

Private Const PRIMEIRA_LINHA_PERICIA As Long = 4
Private Const PRIMEIRA_LINHA_TREINO As Long = 2
Private Const COL_TREINO_ORIGEM As Long = 14
Private Const SEP_FORM As String = "|#|"
Private Const RETORNAR As String = "#VOLTAR#"

Public Function CodexPoderesT20Version() As String
    CodexPoderesT20Version = "T20 poderes catalogo + efeitos estruturados 2026-08-27"
End Function

Public Sub AtualizarPoderesClasse(Optional ByVal ApenasResumo As Boolean = False)
    Dim wsP As Worksheet
    Dim classe As String
    Dim classeId As String
    Dim raca As String
    Dim nivel As Long
    Dim qtdAuto As Long
    Dim qtdSlots As Long
    Dim qtdSelecionados As Long
    Dim qtdPendentes As Long
    Dim proximaAtiva As Long
    Dim selecionadosIds As Collection
    Dim selecionadosNomes As Collection

    On Error GoTo TrataErro
    If Not PlanilhaExiste(PLANILHA_CATALOGO) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_BASE_SLOTS) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_BASE_HABILIDADES) Then Exit Sub

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    classe = Trim$(CStr(wsP.Range("F2").Value))
    raca = Trim$(CStr(wsP.Range("B2").Value))
    nivel = CLng(Val(CStr(wsP.Range("F1").Value)))
    If nivel < 1 Then nivel = 1
    If nivel > 20 Then nivel = 20
    classeId = ClasseIdPorNome(classe)

    PrepararSaidas
    LimparTreinoOrigem
    proximaAtiva = 2
    Set selecionadosIds = New Collection
    Set selecionadosNomes = New Collection

    If Len(classeId) > 0 Then qtdAuto = EscreverHabilidadesAutomaticas(classeId, nivel, proximaAtiva)
    AtualizarPoderesOrigemSeguro classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    AtualizarPoderesRaca classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    If Len(classeId) > 0 Then AtualizarSlotsPoderes classeId, classe, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSlots, qtdSelecionados, qtdPendentes

    modEstadoExcelT20.SolicitarRecalculo
    Exit Sub

TrataErro:
    Debug.Print "AtualizarPoderesClasse/T20: " & Err.Number & " - " & Err.Description
End Sub

Public Function DetalhePoderCatalogoPorNome(ByVal nome As String) As String
    Dim linha As Long
    On Error GoTo TrataErro
    linha = LinhaPoderPorNome(nome)
    If linha > 0 Then DetalhePoderCatalogoPorNome = DetalhePoderPorLinha(linha)
    Exit Function

TrataErro:
    DetalhePoderCatalogoPorNome = "ERRO DETALHE PODER: " & Err.Number & " - " & Err.Description
End Function

Public Function DetalhePoderCatalogoPorId(ByVal poderId As String) As String
    Dim linha As Long
    On Error GoTo TrataErro
    linha = LinhaPoderPorId(poderId)
    If linha > 0 Then DetalhePoderCatalogoPorId = DetalhePoderPorLinha(linha)
    Exit Function

TrataErro:
    DetalhePoderCatalogoPorId = "ERRO DETALHE PODER: " & Err.Number & " - " & Err.Description
End Function

Public Sub AplicarEfeitosPoderesSelecionados(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim wsS As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim poderId As String
    Dim poderNome As String
    Dim linhaCatalogo As Long
    Dim efeitosJson As String
    Dim escolha As String
    Dim fonteChave As String
    Dim nivel As Long

    On Error GoTo TrataErro
    If Not PlanilhaExiste(PLANILHA_SELECIONADOS) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_CATALOGO) Then Exit Sub

    nivel = NivelPersonagem()
    Set wsS = ThisWorkbook.Worksheets(PLANILHA_SELECIONADOS)
    ultimaLinha = wsS.Cells(wsS.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(wsS.Cells(r, 8).Value, "SIM") Then
            poderId = Trim$(CStr(wsS.Cells(r, 6).Value))
            poderNome = Trim$(CStr(wsS.Cells(r, 7).Value))
            fonteChave = Trim$(CStr(wsS.Cells(r, 12).Value))
            If Len(poderId) > 0 Then
                linhaCatalogo = LinhaPoderPorId(poderId)
                If linhaCatalogo > 0 Then
                    poderNome = NomePoderPorId(poderId)
                    efeitosJson = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linhaCatalogo, 16).Value)
                    If MesmoTexto(poderNome, "Aumento de Atributo") Then
                        escolha = Trim$(CStr(wsS.Cells(r, 13).Value))
                        If Len(escolha) = 0 And Len(fonteChave) > 0 Then escolha = ValorEscolha(fonteChave & "|atributo")
                        If Len(escolha) > 0 Then AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, "Aumento de Atributo", "bonus_atributo", "Atributo", UCase$(escolha), UCase$(escolha), 1, "+1 por Aumento de Atributo."
                    End If
                    AplicarEfeitosJsonSimples wsA, proximaLinha, poderNome, efeitosJson, nivel, DescricaoPoderPorLinha(linhaCatalogo)
                End If
            End If
        End If
    Next r
    Exit Sub

TrataErro:
    Debug.Print "AplicarEfeitosPoderesSelecionados: " & Err.Number & " - " & Err.Description
End Sub

Private Sub AtualizarPoderesOrigemSeguro(ByVal classeId As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    Dim wsP As Worksheet
    Dim wsO As Worksheet
    Dim origem As String
    Dim linhaOrigem As Long
    Dim i As Long
    Dim linhaSaida As Long
    Dim chave As String
    Dim escolhaBeneficio As String
    Dim textoSaida As String
    Dim descricaoSaida As String

    On Error GoTo TrataErro
    If Not PlanilhaExiste(PLANILHA_ORIGENS) Then Exit Sub
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    origem = Trim$(CStr(wsP.Range("D2").Value))
    If Len(origem) = 0 Then
        LimparBeneficiosOrigemPrincipal wsP
        Exit Sub
    End If
    LimparBeneficiosOrigemPrincipal wsP
    If MesmoTexto(raca, "Golem") Or MesmoTexto(raca, "Golem Desperto") Then
        wsP.Range("F40").Value = "Sem origem pela raca."
        Exit Sub
    End If

    Set wsO = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    linhaOrigem = LinhaOrigemPorNome(origem)
    If linhaOrigem = 0 Then Exit Sub
    If MesmoTexto(wsO.Cells(linhaOrigem, 7).Value, "Regional") Then
        AplicarOrigemRegional wsP, wsO, linhaOrigem, origem, classeId, classe, ApenasResumo, proximaAtiva
        Exit Sub
    End If

    For i = 1 To 2
        linhaSaida = i + 39
        chave = "Origem|" & origem & "|Beneficio|" & CStr(i)
        escolhaBeneficio = ValorEscolha(chave)
        If Len(escolhaBeneficio) = 0 And Not ApenasResumo Then
            escolhaBeneficio = EscolherBeneficioOrigem(origem, linhaOrigem, i)
            If Len(escolhaBeneficio) > 0 Then DefinirEscolha chave, escolhaBeneficio, "Beneficio de origem."
        End If
        textoSaida = AplicarBeneficioOrigem(escolhaBeneficio, chave, origem, classeId, classe, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes)
        descricaoSaida = DescricaoBeneficioOrigem(escolhaBeneficio, chave, linhaOrigem)
        wsP.Cells(linhaSaida, 6).Value = textoSaida
        wsP.Cells(linhaSaida, 7).Value = descricaoSaida
        DefinirComentarioBeneficio wsP.Cells(linhaSaida, 7), descricaoSaida
    Next i
    Exit Sub

TrataErro:
    Debug.Print "AtualizarPoderesOrigemSeguro: " & Err.Number & " - " & Err.Description
End Sub

Private Function EscolherBeneficioOrigem(ByVal origem As String, ByVal linhaOrigem As Long, ByVal indice As Long) As String
    Dim opcoes As Collection
    Dim ws As Worksheet
    Dim pericias As Collection
    Dim poderes As Collection
    Dim item As Variant
    Dim poder As String
    Dim unico As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    Set opcoes = New Collection
    Set pericias = ListaPorTexto(CStr(ws.Cells(linhaOrigem, 2).Value))
    Set poderes = ListaPorTexto(CStr(ws.Cells(linhaOrigem, 3).Value))

    For Each item In pericias
        AdicionarUnico opcoes, "Pericia: " & CStr(item)
    Next item
    For Each item In poderes
        poder = CStr(item)
        If InStr(1, poder, "poder de combate", vbTextCompare) > 0 Then
            AdicionarUnico opcoes, "Poder geral: combate"
        ElseIf InStr(1, poder, "poder geral", vbTextCompare) > 0 Then
            AdicionarUnico opcoes, "Poder geral"
        Else
            AdicionarUnico opcoes, "Poder: " & poder
        End If
    Next item

    unico = Trim$(CStr(ws.Cells(linhaOrigem, 4).Value))
    If Len(unico) > 0 Then AdicionarUnico opcoes, "Poder unico: " & unico
    If opcoes.Count = 0 Then Exit Function

    EscolherBeneficioOrigem = EscolherOpcaoSimples("Origem: " & origem & vbCrLf & "Beneficio " & CStr(indice) & " de 2.", opcoes)
End Function

Private Function AplicarBeneficioOrigem(ByVal escolhaBeneficio As String, ByVal chave As String, ByVal origem As String, ByVal classeId As String, ByVal classe As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long) As String
    Dim nome As String
    Dim poderId As String
    Dim categoriaFiltro As String
    Dim linha As Long

    escolhaBeneficio = Trim$(escolhaBeneficio)
    If Len(escolhaBeneficio) = 0 Then Exit Function

    If InStr(1, escolhaBeneficio, "Pericia: ", vbTextCompare) = 1 Then
        nome = Mid$(escolhaBeneficio, Len("Pericia: ") + 1)
        AplicarBeneficioOrigem = MarcarPericiaOrigem(nome, chave, ApenasResumo)
        If Len(AplicarBeneficioOrigem) = 0 Then
            AplicarBeneficioOrigem = "Pericia de origem pendente"
            qtdPendentes = qtdPendentes + 1
        End If
    ElseIf InStr(1, escolhaBeneficio, "Poder geral: ", vbTextCompare) = 1 Then
        categoriaFiltro = Trim$(Mid$(escolhaBeneficio, Len("Poder geral: ") + 1))
        poderId = GarantirPoderDireto(chave & "|poder", "Origem: " & origem & vbCrLf & escolhaBeneficio, "Geral", vbNullString, categoriaFiltro, nivel, ApenasResumo, selecionadosIds, selecionadosNomes)
        If Len(poderId) > 0 Then
            linha = LinhaPoderPorId(poderId)
            AplicarBeneficioOrigem = NomePoderPorLinha(linha)
            RegistrarPoderSelecionado 0, 1, classeId, classe, "Origem", poderId, "SIM", vbNullString, chave & "|poder", origem, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados
        Else
            AplicarBeneficioOrigem = "Poder de origem pendente"
            qtdPendentes = qtdPendentes + 1
        End If
    ElseIf escolhaBeneficio = "Poder geral" Then
        poderId = GarantirPoderDireto(chave & "|poder", "Origem: " & origem & vbCrLf & "Poder geral.", "Geral", vbNullString, vbNullString, nivel, ApenasResumo, selecionadosIds, selecionadosNomes)
        If Len(poderId) > 0 Then
            linha = LinhaPoderPorId(poderId)
            AplicarBeneficioOrigem = NomePoderPorLinha(linha)
            RegistrarPoderSelecionado 0, 1, classeId, classe, "Origem", poderId, "SIM", vbNullString, chave & "|poder", origem, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados
        Else
            AplicarBeneficioOrigem = "Poder de origem pendente"
            qtdPendentes = qtdPendentes + 1
        End If
    ElseIf InStr(1, escolhaBeneficio, "Poder: ", vbTextCompare) = 1 Then
        nome = Mid$(escolhaBeneficio, Len("Poder: ") + 1)
        poderId = PoderIdPorNome(nome, "Geral")
        If Len(poderId) > 0 Then
            RegistrarPoderSelecionado 0, 1, classeId, classe, "Origem", poderId, "SIM", vbNullString, chave, origem, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados
        End If
        AplicarBeneficioOrigem = nome
    ElseIf InStr(1, escolhaBeneficio, "Poder unico: ", vbTextCompare) = 1 Then
        nome = Mid$(escolhaBeneficio, Len("Poder unico: ") + 1)
        RegistrarPoderUnicoOrigem origem, nome, classeId, classe, proximaAtiva
        AplicarBeneficioOrigem = nome
    Else
        AplicarBeneficioOrigem = escolhaBeneficio
    End If
End Function

Private Sub AtualizarPoderesRaca(ByVal classeId As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    If Len(raca) = 0 Then Exit Sub

    If MesmoTexto(raca, "Humano") Then
        If MesmoTexto(ValorEscolha("Raca_Humano_Versatil"), "Uma pericia e um poder geral") Then
            AplicarFontePoderFlex "Raca|Humano|Versatil|Poder", "Raca: Humano" & vbCrLf & "Versatil: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
        End If
    ElseIf MesmoTexto(raca, "Osteon") Then
        If MesmoTexto(ValorEscolha("Raca_Osteon_Memoria_Postuma"), "Poder geral") Then
            AplicarFontePoderFlex "Raca|Osteon|MemoriaPostuma|Poder", "Raca: Osteon" & vbCrLf & "Memoria Postuma: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
        End If
    ElseIf MesmoTexto(raca, "Yidishan") Then
        If MesmoTexto(ValorEscolha("Raca_Yidishan_Natureza_Organica"), "Poder geral") Then
            AplicarFontePoderFlex "Raca|Yidishan|NaturezaOrganica|Poder", "Raca: Yidishan" & vbCrLf & "Natureza Organica: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
        End If
    ElseIf MesmoTexto(raca, "Golem") Then
        AplicarFontePoderFlex "Raca|Golem|PropositoCriacao|Poder", "Raca: Golem" & vbCrLf & "Proposito de Criacao: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(raca, "Golem Desperto") Then
        AplicarFontePoderFlex "Raca|GolemDesperto|PropositoCriacao|Poder", "Raca: Golem Desperto" & vbCrLf & "Proposito de Criacao: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(raca, "Minauro") Then
        AplicarFontePoderFlex "Raca|Minauro|Plurivalente|Poder", "Raca: Minauro" & vbCrLf & "Plurivalente: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(raca, "Kaijin") Then
        AplicarFontePoderFlex "Raca|Kaijin|TerrorVivo|Poder", "Raca: Kaijin" & vbCrLf & "Terror Vivo: poder da Tormenta.", "Raca", "tormenta", classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(raca, "Lefou") Then
        AplicarLefouPoder classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(raca, "Meio-Elfo") Then
        AplicarMeioElfoPoder classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    End If
End Sub

Private Sub AplicarFontePoderFlex(ByVal chave As String, ByVal titulo As String, ByVal fonteTipo As String, ByVal categoriaFiltro As String, ByVal classeId As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    Dim poderId As String
    poderId = GarantirPoderDireto(chave, titulo, "Geral", vbNullString, categoriaFiltro, nivel, ApenasResumo, selecionadosIds, selecionadosNomes)
    If Len(poderId) > 0 Then
        RegistrarPoderSelecionado 0, 1, classeId, classe, fonteTipo, poderId, "SIM", vbNullString, chave, raca, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados
    ElseIf Not ApenasResumo Then
        qtdPendentes = qtdPendentes + 1
        EscreverPoderSelecionado 0, 1, classeId, classe, fonteTipo, vbNullString, vbNullString, "PENDENTE", "Poder pendente.", vbNullString, chave, raca, vbNullString
    End If
End Sub

Private Sub AplicarLefouPoder(ByVal classeId As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    Dim escolha As String
    Dim opcoes As Collection
    escolha = ValorEscolha("Raca_Lefou_Deformidade_Poder")
    If Len(escolha) = 0 And Not ApenasResumo Then
        Set opcoes = New Collection
        opcoes.Add "Manter bonus de pericia"
        opcoes.Add "Trocar um bonus por poder da Tormenta"
        escolha = EscolherOpcaoSimples("Raca: Lefou" & vbCrLf & "Deformidade.", opcoes)
        If Len(escolha) > 0 Then DefinirEscolha "Raca_Lefou_Deformidade_Poder", escolha, "Escolha racial Lefou."
    End If
    If MesmoTexto(escolha, "Trocar um bonus por poder da Tormenta") Then
        AplicarFontePoderFlex "Raca|Lefou|Deformidade|Poder", "Raca: Lefou" & vbCrLf & "Deformidade: poder da Tormenta.", "Raca", "tormenta", classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    End If
End Sub

Private Sub AplicarMeioElfoPoder(ByVal classeId As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    Dim escolha As String
    Dim opcoes As Collection
    Dim nomeUnico As String
    escolha = ValorEscolha("Raca_MeioElfo_Ambicao_Herdada")
    If Len(escolha) = 0 And Not ApenasResumo Then
        Set opcoes = New Collection
        opcoes.Add "Poder geral"
        opcoes.Add "Poder unico de origem"
        escolha = EscolherOpcaoSimples("Raca: Meio-Elfo" & vbCrLf & "Ambicao Herdada.", opcoes)
        If Len(escolha) > 0 Then DefinirEscolha "Raca_MeioElfo_Ambicao_Herdada", escolha, "Escolha racial Meio-Elfo."
    End If
    If MesmoTexto(escolha, "Poder geral") Then
        AplicarFontePoderFlex "Raca|MeioElfo|AmbicaoHerdada|Poder", "Raca: Meio-Elfo" & vbCrLf & "Ambicao Herdada: poder geral.", "Raca", vbNullString, classeId, classe, raca, nivel, ApenasResumo, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados, qtdPendentes
    ElseIf MesmoTexto(escolha, "Poder unico de origem") Then
        nomeUnico = ValorEscolha("Raca_MeioElfo_Ambicao_Herdada|unico")
        If Len(nomeUnico) = 0 And Not ApenasResumo Then
            nomeUnico = EscolherPoderUnicoOrigem("Raca: Meio-Elfo" & vbCrLf & "Escolha um poder unico de origem.")
            If Len(nomeUnico) > 0 Then DefinirEscolha "Raca_MeioElfo_Ambicao_Herdada|unico", nomeUnico, "Poder unico de origem por raca."
        End If
        If Len(nomeUnico) > 0 Then RegistrarPoderUnicoOrigem "Meio-Elfo", nomeUnico, classeId, classe, proximaAtiva
    End If
End Sub

Private Sub AtualizarSlotsPoderes(ByVal classeId As String, ByVal classe As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSlots As Long, ByRef qtdSelecionados As Long, ByRef qtdPendentes As Long)
    Dim wsS As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim qtdRegra As Long
    Dim i As Long
    Dim slotGlobal As Long
    Dim nivelSlot As Long
    Dim chave As String
    Dim poderId As String
    Dim valido As Boolean
    Dim motivo As String
    Dim tipoEscolha As String
    Dim poolClasseIds As String
    Dim permiteGeral As Boolean

    Set wsS = ThisWorkbook.Worksheets(PLANILHA_BASE_SLOTS)
    ultimaLinha = wsS.Cells(wsS.Rows.Count, 1).End(xlUp).Row
    slotGlobal = 0

    For r = 2 To ultimaLinha
        If MesmoTexto(wsS.Cells(r, 1).Value, classeId) Then
            poolClasseIds = Trim$(CStr(wsS.Cells(r, 3).Value))
            permiteGeral = ValorSim(wsS.Cells(r, 10).Value)
            qtdRegra = QuantidadeSlots(nivel, CLng(Val(CStr(wsS.Cells(r, 6).Value))), CStr(wsS.Cells(r, 7).Value))
            For i = 1 To qtdRegra
                slotGlobal = slotGlobal + 1
                qtdSlots = qtdSlots + 1
                nivelSlot = NivelDoSlot(CLng(Val(CStr(wsS.Cells(r, 6).Value))), CStr(wsS.Cells(r, 7).Value), i)
                chave = "ClassePoder|" & classeId & "|" & CStr(slotGlobal)
                poderId = ValorEscolha(chave & "|poder")
                tipoEscolha = ValorEscolha(chave & "|tipo")
                valido = False
                motivo = vbNullString

                If Len(poderId) > 0 Then
                    valido = PoderElegivel(poderId, nivelSlot, selecionadosIds, selecionadosNomes, motivo)
                    If valido Then valido = PoderFontePermitida(poderId, tipoEscolha, classeId, poolClasseIds, permiteGeral, motivo)
                End If

                If Len(poderId) > 0 And Not valido And ApenasResumo Then
                    EscreverPoderSelecionado slotGlobal, nivelSlot, classeId, classe, tipoEscolha, poderId, NomePoderPorId(poderId), "NAO", motivo, PreReqResumoPorId(poderId), chave, classe, EscolhaDetalhePoder(chave, poderId)
                    qtdPendentes = qtdPendentes + 1
                Else
                    If Len(poderId) > 0 And Not valido Then poderId = vbNullString
                    If Len(poderId) = 0 And Not ApenasResumo Then
                        poderId = EscolherPoderSlotClasse("Poder de nivel " & CStr(nivelSlot) & ": " & classe, classeId, poolClasseIds, permiteGeral, nivelSlot, selecionadosIds, selecionadosNomes, chave)
                    End If

                    If Len(poderId) > 0 Then
                        RegistrarPoderSelecionado slotGlobal, nivelSlot, classeId, classe, tipoEscolhaEscolhida(chave, poderId), poderId, "SIM", vbNullString, chave, classe, selecionadosIds, selecionadosNomes, proximaAtiva, qtdSelecionados
                    Else
                        EscreverPoderSelecionado slotGlobal, nivelSlot, classeId, classe, "Classe/Geral", vbNullString, vbNullString, "PENDENTE", "Sem escolha registrada.", vbNullString, chave, classe, vbNullString
                        qtdPendentes = qtdPendentes + 1
                    End If
                End If
            Next i
        End If
    Next r
End Sub

Private Function EscolherPoderSlotClasse(ByVal titulo As String, ByVal classeId As String, ByVal poolClasseIds As String, ByVal permiteGeral As Boolean, ByVal nivelSlot As Long, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByVal chave As String) As String
    Dim opcoesTipo As Collection
    Dim tipo As String
    Dim poderId As String

    Set opcoesTipo = New Collection
    If SlotTemPoderesClasseCatalogados(classeId, poolClasseIds) Then opcoesTipo.Add "Poder de classe"
    If permiteGeral Then opcoesTipo.Add "Poder geral"
    If opcoesTipo.Count = 0 Then
        MsgBox "Nao ha poderes cadastrados para esta escolha.", vbInformation, "Forja T20"
        Exit Function
    End If

    Do
        tipo = ValorEscolha(chave & "|tipo")
        If Len(tipo) = 0 Or Not ColecaoContem(opcoesTipo, tipo) Then
            tipo = EscolherOpcaoSimples(titulo & vbCrLf & "Escolha o tipo de poder.", opcoesTipo)
            If Len(tipo) = 0 Then Exit Function
        End If

        If MesmoTexto(tipo, "Poder de classe") Then
            poderId = EscolherPoderCatalogo(titulo, "Classe", classeId, vbNullString, nivelSlot, selecionadosIds, selecionadosNomes, poolClasseIds)
        Else
            poderId = EscolherPoderCatalogo(titulo, "Geral", vbNullString, vbNullString, nivelSlot, selecionadosIds, selecionadosNomes)
        End If

        If poderId = RETORNAR Then
            DefinirEscolha chave & "|tipo", vbNullString
            tipo = vbNullString
        ElseIf Len(poderId) > 0 Then
            DefinirEscolha chave & "|tipo", IIf(MesmoTexto(tipo, "Poder de classe"), "Classe", "Geral"), "Tipo de poder do nivel."
            DefinirEscolha chave & "|poder", poderId, "Poder escolhido por nivel."
            GarantirEscolhasInternasPoder chave, poderId, nivelSlot, selecionadosIds, selecionadosNomes
            EscolherPoderSlotClasse = poderId
            Exit Function
        Else
            Exit Function
        End If
    Loop
End Function

Private Function GarantirPoderDireto(ByVal chave As String, ByVal titulo As String, ByVal origemTipo As String, ByVal classeId As String, ByVal categoriaFiltro As String, ByVal nivel As Long, ByVal ApenasResumo As Boolean, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection) As String
    Dim poderId As String
    Dim motivo As String

    poderId = ValorEscolha(chave)
    If Len(poderId) > 0 Then
        If PoderElegivel(poderId, nivel, selecionadosIds, selecionadosNomes, motivo) Then
            GarantirPoderDireto = poderId
            Exit Function
        ElseIf ApenasResumo Then
            GarantirPoderDireto = poderId
            Exit Function
        End If
    End If

    If ApenasResumo Then Exit Function
    poderId = EscolherPoderCatalogo(titulo, origemTipo, classeId, categoriaFiltro, nivel, selecionadosIds, selecionadosNomes)
    If poderId = RETORNAR Then poderId = vbNullString
    If Len(poderId) > 0 Then
        DefinirEscolha chave, poderId, "Poder escolhido."
        GarantirEscolhasInternasPoder chave, poderId, nivel, selecionadosIds, selecionadosNomes
    End If
    GarantirPoderDireto = poderId
End Function

Private Function EscolherPoderCatalogo(ByVal titulo As String, ByVal origemTipo As String, ByVal classeId As String, ByVal categoriaFiltro As String, ByVal nivel As Long, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, Optional ByVal poolClasseIds As String = "") As String
    Dim opcoes As Collection
    Dim formulario As Object

    Set opcoes = OpcoesPoderesCatalogo(origemTipo, classeId, categoriaFiltro, nivel, selecionadosIds, selecionadosNomes, poolClasseIds)
    If opcoes.Count = 0 Then
        MsgBox "Nao ha poderes cadastrados para esta escolha.", vbInformation, "Forja T20"
        Exit Function
    End If

    Set formulario = VBA.UserForms.Add("UserFormMagia")
    formulario.Carregar titulo, opcoes, "PODER_CATALOGO"
    formulario.Show vbModal

    If formulario.VoltarSolicitado Then
        EscolherPoderCatalogo = RETORNAR
    ElseIf Not formulario.Cancelado Then
        EscolherPoderCatalogo = formulario.escolha
    End If
    Unload formulario
End Function

Private Function OpcoesPoderesCatalogo(ByVal origemTipo As String, ByVal classeId As String, ByVal categoriaFiltro As String, ByVal nivel As Long, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, Optional ByVal poolClasseIds As String = "") As Collection
    Dim ws As Worksheet
    Dim lista As Collection
    Dim disponiveis As Collection
    Dim bloqueados As Collection
    Dim ultimaLinha As Long
    Dim r As Long
    Dim motivo As String
    Dim poderId As String
    Dim nome As String
    Dim categoria As String
    Dim origem As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    Set lista = New Collection
    Set disponiveis = New Collection
    Set bloqueados = New Collection
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        origem = CStr(ws.Cells(r, 3).Value)
        categoria = CStr(ws.Cells(r, 4).Value)
        If FiltroOrigemPoder(r, origemTipo, classeId, categoriaFiltro, poolClasseIds) Then
            poderId = CStr(ws.Cells(r, 1).Value)
            nome = CStr(ws.Cells(r, 2).Value)
            motivo = vbNullString
            If PoderElegivel(poderId, nivel, selecionadosIds, selecionadosNomes, motivo) Then
                disponiveis.Add MontarOpcaoPoder(nome & TextoCategoria(categoria, origem), poderId, "SIM", vbNullString)
            Else
                bloqueados.Add MontarOpcaoPoder(nome & " (Req: " & ResumoCurtoReq(motivo) & ")" & TextoCategoria(categoria, origem), poderId, "NAO", motivo)
            End If
        End If
    Next r

    If disponiveis.Count > 0 Then
        AdicionarColecao lista, disponiveis
    End If
    If bloqueados.Count > 0 Then
        lista.Add MontarOpcaoPoder(vbNullString, vbNullString, "CAB", vbNullString)
        lista.Add MontarOpcaoPoder(TituloNaoCumprePreRequisito(), vbNullString, "CAB", vbNullString)
        lista.Add MontarOpcaoPoder(vbNullString, vbNullString, "CAB", vbNullString)
        AdicionarColecao lista, bloqueados
    End If

    Set OpcoesPoderesCatalogo = lista
End Function

Private Function FiltroOrigemPoder(ByVal linha As Long, ByVal origemTipo As String, ByVal classeId As String, ByVal categoriaFiltro As String, Optional ByVal poolClasseIds As String = "") As Boolean
    Dim ws As Worksheet
    Dim origem As String
    Dim categoria As String
    Dim poderId As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    origem = CStr(ws.Cells(linha, 3).Value)
    categoria = CStr(ws.Cells(linha, 4).Value)
    poderId = CStr(ws.Cells(linha, 1).Value)

    If Len(categoriaFiltro) > 0 Then
        If Not MesmoTexto(categoria, categoriaFiltro) Then Exit Function
    End If

    If MesmoTexto(origemTipo, "Classe") Then
        If Not MesmoTexto(origem, "Classe") Then Exit Function
        If Len(Trim$(poolClasseIds)) > 0 Then
            FiltroOrigemPoder = PoderCatalogoPertencePool(linha, poderId, poolClasseIds)
        Else
            FiltroOrigemPoder = MapaClasseTemPoder(classeId, poderId)
        End If
    Else
        FiltroOrigemPoder = MesmoTexto(origem, "Geral")
    End If
End Function

Private Function PoderElegivel(ByVal poderId As String, ByVal nivel As Long, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef motivo As String) As Boolean
    Dim linha As Long
    Dim ws As Worksheet
    Dim falhas As Collection
    Dim repetivel As Boolean
    Dim nome As String
    Dim minNivel As Long
    Dim rawReq As String

    linha = LinhaPoderPorId(poderId)
    If linha = 0 Then
        motivo = "poder nao encontrado"
        Exit Function
    End If

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    Set falhas = New Collection
    nome = CStr(ws.Cells(linha, 2).Value)
    repetivel = MesmoTexto(ws.Cells(linha, 8).Value, "SIM")
    If Not repetivel Then
        If Contem(selecionadosIds, poderId) Or Contem(selecionadosNomes, nome) Then falhas.Add "ja escolhido"
    End If

    minNivel = CLng(Val(CStr(ws.Cells(linha, 9).Value)))
    If minNivel > 0 And nivel < minNivel Then falhas.Add "nivel " & CStr(minNivel)

    ValidarReqAtributos CStr(ws.Cells(linha, 10).Value), falhas
    ValidarReqPoderes CStr(ws.Cells(linha, 11).Value), selecionadosIds, selecionadosNomes, falhas
    ValidarReqPericias CStr(ws.Cells(linha, 12).Value), falhas
    ValidarReqProficiencias CStr(ws.Cells(linha, 13).Value), falhas
    ValidarReqDivindade CStr(ws.Cells(linha, 17).Value), falhas
    ValidarReqRaca CStr(ws.Cells(linha, 18).Value), falhas

    rawReq = Trim$(CStr(ws.Cells(linha, 14).Value))
    If Len(rawReq) > 0 And Len(CStr(ws.Cells(linha, 10).Value) & CStr(ws.Cells(linha, 11).Value) & CStr(ws.Cells(linha, 12).Value) & CStr(ws.Cells(linha, 13).Value)) = 0 Then
        ValidarReqTexto rawReq, nivel, selecionadosNomes, falhas
    End If

    If falhas.Count = 0 Then
        PoderElegivel = True
    Else
        motivo = TextoColecao(falhas, "; ")
    End If
End Function

Private Sub ValidarReqAtributos(ByVal texto As String, ByVal falhas As Collection)
    Dim itens As Collection
    Dim item As Variant
    Dim partes() As String
    Dim atributo As String
    Dim minimo As Long

    Set itens = ListaPorTexto(texto)
    For Each item In itens
        partes = Split(CStr(item), ">=")
        If UBound(partes) = 1 Then
            atributo = Trim$(partes(0))
            minimo = CLng(Val(partes(1)))
            If ValorAtributo(atributo) < minimo Then falhas.Add UCase$(atributo) & " " & CStr(minimo)
        End If
    Next item
End Sub

Private Sub ValidarReqPoderes(ByVal texto As String, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByVal falhas As Collection)
    Dim itens As Collection
    Dim item As Variant
    Dim nome As String

    Set itens = ListaPorTexto(texto)
    For Each item In itens
        nome = NomePoderPorId(CStr(item))
        If Not Contem(selecionadosIds, CStr(item)) And Not Contem(selecionadosNomes, nome) Then falhas.Add "poder: " & nome
    Next item
End Sub

Private Sub ValidarReqPericias(ByVal texto As String, ByVal falhas As Collection)
    Dim itens As Collection
    Dim item As Variant
    Set itens = ListaPorTexto(texto)
    For Each item In itens
        If Not PericiaTreinada(CStr(item)) Then falhas.Add "treinado em " & NomePericia(CStr(item))
    Next item
End Sub

Private Sub ValidarReqProficiencias(ByVal texto As String, ByVal falhas As Collection)
    Dim itens As Collection
    Dim item As Variant
    Set itens = ListaPorTexto(texto)
    For Each item In itens
        If Not TemProficiencia(CStr(item)) Then falhas.Add "prof: " & CStr(item)
    Next item
End Sub

Private Sub ValidarReqDivindade(ByVal deusesIds As String, ByVal falhas As Collection)
    Dim deusAtual As String
    If Len(Trim$(deusesIds)) = 0 Then Exit Sub
    deusAtual = IdTexto(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G2").Value)
    If Len(deusAtual) = 0 Or InStr(1, ";" & LCase$(deusesIds) & ";", ";" & deusAtual & ";", vbTextCompare) = 0 Then falhas.Add "devoto"
End Sub

Private Sub ValidarReqRaca(ByVal racasTexto As String, ByVal falhas As Collection)
    Dim racaAtual As String
    If Len(Trim$(racasTexto)) = 0 Then Exit Sub
    racaAtual = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("B2").Value))
    If InStr(1, racasTexto, "Todas", vbTextCompare) > 0 Then Exit Sub
    If Len(racaAtual) = 0 Or InStr(1, racasTexto, racaAtual, vbTextCompare) = 0 Then falhas.Add "raca"
End Sub

Private Sub ValidarReqTexto(ByVal texto As String, ByVal nivel As Long, ByVal selecionadosNomes As Collection, ByVal falhas As Collection)
    Dim clausulas() As String
    Dim i As Long
    Dim clausula As String

    texto = Replace(texto, vbCrLf, ",")
    texto = Replace(texto, vbLf, ",")
    clausulas = Split(texto, ",")
    For i = LBound(clausulas) To UBound(clausulas)
        clausula = Trim$(clausulas(i))
        If Len(clausula) > 0 Then
            If Not ClausulaReqCumprida(clausula, nivel, selecionadosNomes) Then falhas.Add clausula
        End If
    Next i
End Sub

Private Function ClausulaReqCumprida(ByVal clausula As String, ByVal nivel As Long, ByVal selecionadosNomes As Collection) As Boolean
    Dim alternativas() As String
    Dim i As Long
    alternativas = Split(Replace(clausula, " OU ", " ou "), " ou ")
    For i = LBound(alternativas) To UBound(alternativas)
        If AlternativaReqCumprida(Trim$(alternativas(i)), nivel, selecionadosNomes) Then
            ClausulaReqCumprida = True
            Exit Function
        End If
    Next i
End Function

Private Function AlternativaReqCumprida(ByVal texto As String, ByVal nivel As Long, ByVal selecionadosNomes As Collection) As Boolean
    Dim atributo As String
    Dim minimo As Long
    Dim lista As Collection
    Dim item As Variant
    Dim todos As Boolean

    If Len(texto) = 0 Then
        AlternativaReqCumprida = True
        Exit Function
    End If

    atributo = AtributoInicio(texto)
    If Len(atributo) > 0 Then
        minimo = PrimeiroNumero(texto)
        AlternativaReqCumprida = (ValorAtributo(atributo) >= minimo)
        Exit Function
    End If

    If InStr(1, texto, "nivel", vbTextCompare) > 0 Or InStr(1, texto, "n" & ChrW$(237) & "vel", vbTextCompare) > 0 Then
        minimo = PrimeiroNumero(texto)
        AlternativaReqCumprida = (minimo <= 0 Or nivel >= minimo)
        Exit Function
    End If

    If InStr(1, texto, "treinado em ", vbTextCompare) = 1 Then
        texto = Trim$(Mid$(texto, Len("treinado em ") + 1))
        texto = Replace(texto, " e ", ";")
        Set lista = ListaPorTexto(texto)
        todos = True
        For Each item In lista
            If Not PericiaTreinada(CStr(item)) Then todos = False
        Next item
        AlternativaReqCumprida = todos
        Exit Function
    End If

    If InStr(1, texto, "profici", vbTextCompare) > 0 Then
        AlternativaReqCumprida = TemProficiencia(texto)
        Exit Function
    End If

    AlternativaReqCumprida = Contem(selecionadosNomes, texto)
End Function

Private Sub RegistrarPoderSelecionado(ByVal slot As Long, ByVal nivel As Long, ByVal classeId As String, ByVal classe As String, ByVal fonteTipo As String, ByVal poderId As String, ByVal valido As String, ByVal motivo As String, ByVal fonteChave As String, ByVal origemNome As String, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection, ByRef proximaAtiva As Long, ByRef qtdSelecionados As Long)
    Dim linha As Long
    Dim poderNome As String
    Dim detalheEscolha As String

    linha = LinhaPoderPorId(poderId)
    poderNome = NomePoderPorLinha(linha)
    detalheEscolha = EscolhaDetalhePoder(fonteChave, poderId)
    EscreverPoderSelecionado slot, nivel, classeId, classe, fonteTipo, poderId, poderNome, valido, motivo, PreReqResumoPorLinha(linha), fonteChave, origemNome, detalheEscolha
    EscreverHabilidadeAtiva fonteTipo, nivel, classeId, classe, poderId, NomeComEscolha(poderNome, detalheEscolha), "Escolha", DescricaoPoderPorLinha(linha), PreReqResumoPorLinha(linha), origemNome, proximaAtiva
    If MesmoTexto(valido, "SIM") Then
        AdicionarUnico selecionadosIds, poderId
        AdicionarUnico selecionadosNomes, poderNome
        qtdSelecionados = qtdSelecionados + 1
    End If
End Sub

Private Sub RegistrarPoderUnicoOrigem(ByVal origem As String, ByVal nome As String, ByVal classeId As String, ByVal classe As String, ByRef proximaAtiva As Long)
    Dim ws As Worksheet
    Dim linha As Long
    Dim descricao As String
    linha = LinhaOrigemPorPoderUnico(nome)
    If linha > 0 Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
        descricao = CStr(ws.Cells(linha, 5).Value)
    End If
    EscreverHabilidadeAtiva "Origem", 1, classeId, classe, "origem_" & IdTexto(nome), nome, "Poder unico", descricao, vbNullString, origem, proximaAtiva
End Sub

Private Sub GarantirEscolhasInternasPoder(ByVal chave As String, ByVal poderId As String, ByVal nivel As Long, ByVal selecionadosIds As Collection, ByVal selecionadosNomes As Collection)
    If MesmoTexto(NomePoderPorId(poderId), "Aumento de Atributo") Then GarantirEscolhaAumentoAtributo chave, nivel
End Sub

Private Sub GarantirEscolhaAumentoAtributo(ByVal chave As String, ByVal nivel As Long)
    Dim escolha As String
    Dim opcoes As Collection
    escolha = ValorEscolha(chave & "|atributo")
    Set opcoes = AtributosDisponiveisAumento(nivel, chave)
    If Len(escolha) > 0 And ColecaoContem(opcoes, escolha) Then Exit Sub
    If opcoes.Count = 0 Then
        MsgBox "Aumento de Atributo: todos os atributos ja foram escolhidos neste patamar.", vbInformation, "Forja T20"
        Exit Sub
    End If
    escolha = EscolherAtributoSimples("Aumento de Atributo" & vbCrLf & "Escolha o atributo +1.", opcoes)
    If Len(escolha) > 0 Then DefinirEscolha chave & "|atributo", escolha, "Atributo do Aumento de Atributo."
End Sub

Private Function AtributosDisponiveisAumento(ByVal nivel As Long, ByVal chaveAtual As String) As Collection
    Dim opcoes As Collection
    Dim usados As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim chave As String
    Dim atributo As String
    Dim nivelSlot As Long
    Dim patamarAtual As Long

    Set opcoes = New Collection
    Set usados = New Collection
    patamarAtual = PatamarPorNivel(nivel)

    If PlanilhaExiste(PLANILHA_SELECIONADOS) Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_SELECIONADOS)
        ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        For r = 2 To ultimaLinha
            If MesmoTexto(ws.Cells(r, 7).Value, "Aumento de Atributo") Then
                chave = CStr(ws.Cells(r, 12).Value)
                If Not MesmoTexto(chave, chaveAtual) Then
                    nivelSlot = CLng(Val(CStr(ws.Cells(r, 2).Value)))
                    If PatamarPorNivel(nivelSlot) = patamarAtual Then
                        atributo = Trim$(CStr(ws.Cells(r, 13).Value))
                        If Len(atributo) = 0 Then atributo = ValorEscolha(chave & "|atributo")
                        AdicionarUnico usados, atributo
                    End If
                End If
            End If
        Next r
    End If

    AdicionarAtributoDisponivel opcoes, usados, "FOR"
    AdicionarAtributoDisponivel opcoes, usados, "DES"
    AdicionarAtributoDisponivel opcoes, usados, "CON"
    AdicionarAtributoDisponivel opcoes, usados, "INT"
    AdicionarAtributoDisponivel opcoes, usados, "SAB"
    AdicionarAtributoDisponivel opcoes, usados, "CAR"
    Set AtributosDisponiveisAumento = opcoes
End Function

Private Sub AdicionarAtributoDisponivel(ByVal opcoes As Collection, ByVal usados As Collection, ByVal atributo As String)
    If Not Contem(usados, atributo) Then opcoes.Add atributo
End Sub

Private Function EscolhaDetalhePoder(ByVal chave As String, ByVal poderId As String) As String
    Dim atributo As String
    If MesmoTexto(NomePoderPorId(poderId), "Aumento de Atributo") Then
        atributo = ValorEscolha(chave & "|atributo")
        If Len(atributo) > 0 Then EscolhaDetalhePoder = UCase$(atributo)
    End If
End Function

Private Function tipoEscolhaEscolhida(ByVal chave As String, ByVal poderId As String) As String
    tipoEscolhaEscolhida = ValorEscolha(chave & "|tipo")
    If Len(tipoEscolhaEscolhida) = 0 Then tipoEscolhaEscolhida = ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(LinhaPoderPorId(poderId), 3).Value
End Function

Private Sub EscreverPoderSelecionado(ByVal slot As Long, ByVal nivel As Long, ByVal classeId As String, ByVal classe As String, ByVal fonteTipo As String, ByVal poderId As String, ByVal poder As String, ByVal valido As String, ByVal motivo As String, ByVal prereqResumo As String, ByVal fonteChave As String, ByVal origemNome As String, ByVal escolhaDetalhe As String)
    Dim ws As Worksheet
    Dim linha As Long
    Dim linhaCatalogo As Long

    Set ws = ThisWorkbook.Worksheets(PLANILHA_SELECIONADOS)
    linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    linhaCatalogo = LinhaPoderPorId(poderId)
    ws.Cells(linha, 1).Value = slot
    ws.Cells(linha, 2).Value = nivel
    ws.Cells(linha, 3).Value = classeId
    ws.Cells(linha, 4).Value = classe
    ws.Cells(linha, 5).Value = fonteTipo
    ws.Cells(linha, 6).Value = poderId
    ws.Cells(linha, 7).Value = NomeComEscolha(poder, escolhaDetalhe)
    ws.Cells(linha, 8).Value = valido
    ws.Cells(linha, 9).Value = motivo
    ws.Cells(linha, 10).Value = prereqResumo
    If linhaCatalogo > 0 Then ws.Cells(linha, 11).Value = ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linhaCatalogo, 4).Value
    ws.Cells(linha, 12).Value = fonteChave
    ws.Cells(linha, 13).Value = escolhaDetalhe
    ws.Cells(linha, 14).Value = origemNome
    If linhaCatalogo > 0 Then ws.Cells(linha, 15).Value = DescricaoPoderPorLinha(linhaCatalogo)
End Sub

Private Sub EscreverHabilidadeAtiva(ByVal origem As String, ByVal nivel As Long, ByVal classeId As String, ByVal classe As String, ByVal id As String, ByVal nome As String, ByVal tipo As String, ByVal descricao As String, ByVal prereqResumo As String, ByVal observacao As String, ByRef proximaLinha As Long)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ATIVAS)
    ws.Cells(proximaLinha, 1).Value = origem
    ws.Cells(proximaLinha, 2).Value = nivel
    ws.Cells(proximaLinha, 3).Value = classeId
    ws.Cells(proximaLinha, 4).Value = classe
    ws.Cells(proximaLinha, 5).Value = id
    ws.Cells(proximaLinha, 6).Value = nome
    ws.Cells(proximaLinha, 7).Value = tipo
    ws.Cells(proximaLinha, 8).Value = descricao
    ws.Cells(proximaLinha, 9).Value = prereqResumo
    ws.Cells(proximaLinha, 10).Value = observacao
    proximaLinha = proximaLinha + 1
End Sub

Private Sub PrepararSaidas()
    Dim ws As Worksheet
    Set ws = GarantirPlanilha(PLANILHA_SELECIONADOS)
    ws.Cells.Clear
    ws.Range("A1:O1").Value = Array("Slot", "Nivel", "ClasseId", "Classe", "FonteTipo", "PoderId", "Poder", "Valido", "Motivo", "PreReqResumo", "Categoria", "FonteChave", "EscolhaDetalhe", "OrigemNome", "Descricao")
    ws.Rows(1).Font.Bold = True
    ws.Columns("A:F").ColumnWidth = 16
    ws.Columns("G:O").ColumnWidth = 36

    Set ws = GarantirPlanilha(PLANILHA_ATIVAS)
    ws.Cells.Clear
    ws.Range("A1:J1").Value = Array("Origem", "Nivel", "ClasseId", "Classe", "Id", "Nome", "Tipo", "Descricao", "PreReqResumo", "Observacao")
    ws.Rows(1).Font.Bold = True
    ws.Columns("A:G").ColumnWidth = 18
    ws.Columns("H:J").ColumnWidth = 45
End Sub

Private Function EscreverHabilidadesAutomaticas(ByVal classeId As String, ByVal nivel As Long, ByRef proximaAtiva As Long) As Long
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim classe As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, classeId) Then
            If CLng(Val(CStr(ws.Cells(r, 4).Value))) <= nivel Then
                If MesmoTexto(ws.Cells(r, 11).Value, "SIM") Then
                    classe = CStr(ws.Cells(r, 2).Value)
                    EscreverHabilidadeAtiva "Classe", CLng(Val(CStr(ws.Cells(r, 4).Value))), classeId, classe, CStr(ws.Cells(r, 3).Value), CStr(ws.Cells(r, 5).Value), "Automatica", CStr(ws.Cells(r, 6).Value), vbNullString, ObservacaoHabilidade(ws, r), proximaAtiva
                    EscreverHabilidadesAutomaticas = EscreverHabilidadesAutomaticas + 1
                End If
            End If
        End If
    Next r
End Function

Private Function ObservacaoHabilidade(ByVal ws As Worksheet, ByVal linha As Long) As String
    If MesmoTexto(ws.Cells(linha, 8).Value, "SIM") Then ObservacaoHabilidade = "Tem escolha interna cadastrada; escolhas especificas ficam nos modulos proprios."
End Function

Private Function TextoHabilidadesNivel(ByVal classeId As String, ByVal nivel As Long, ByVal nivelAtual As Long) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim lista As Collection
    Dim texto As String

    Set lista = New Collection
    If Len(classeId) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, classeId) And MesmoTexto(ws.Cells(r, 11).Value, "SIM") Then
            If CLng(Val(CStr(ws.Cells(r, 4).Value))) = nivel Then AdicionarUnico lista, CStr(ws.Cells(r, 5).Value)
        End If
    Next r
    texto = TextoColecao(lista, ", ")
    If Len(texto) > 0 And nivel > nivelAtual Then texto = "(" & texto & ")"
    TextoHabilidadesNivel = texto
End Function

Private Function TextoPoderesNivel(ByVal classeId As String, ByVal nivel As Long, ByVal nivelAtual As Long) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim lista As Collection
    Dim valor As String

    Set lista = New Collection
    If PlanilhaExiste(PLANILHA_SELECIONADOS) Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_SELECIONADOS)
        ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        For r = 2 To ultimaLinha
            If CLng(Val(CStr(ws.Cells(r, 2).Value))) = nivel Then
                valor = Trim$(CStr(ws.Cells(r, 7).Value))
                If Len(valor) = 0 Then valor = Trim$(CStr(ws.Cells(r, 9).Value))
                If Len(valor) > 0 Then AdicionarUnico lista, valor
            End If
        Next r
    End If
    If lista.Count = 0 Then
        If ClasseTemSlotPoderNoNivel(classeId, nivel) Then
            If nivel > nivelAtual Then TextoPoderesNivel = "(Poder de classe/geral)" Else TextoPoderesNivel = "Poder pendente"
        End If
    Else
        TextoPoderesNivel = TextoColecao(lista, ", ")
        If nivel > nivelAtual Then TextoPoderesNivel = "(" & TextoPoderesNivel & ")"
    End If
End Function

Private Function TextoRacaOrigemNivel(ByVal nivel As Long) As String
    Dim wsP As Worksheet
    Dim texto As String
    Dim origem As String
    If nivel <> 1 Then Exit Function
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    texto = "Raca: " & Trim$(CStr(wsP.Range("B2").Value))
    origem = Trim$(CStr(wsP.Range("D2").Value))
    If Len(origem) > 0 Then texto = texto & "; Origem: " & origem
    TextoRacaOrigemNivel = texto
End Function

Private Function TextoFontesExtrasNivel(ByVal nivel As Long) As String
    If nivel = 1 Then TextoFontesExtrasNivel = "Origem, raca, divindade, idade e complicacao."
End Function

Private Function TextoMagiasNivel(ByVal nivel As Long) As String
    Dim wsC As Worksheet
    Dim texto As String
    If nivel <> 1 Then Exit Function
    If Not PlanilhaExiste("Magias_Controle") Then Exit Function
    Set wsC = ThisWorkbook.Worksheets("Magias_Controle")
    If MesmoTexto(wsC.Range("C2").Value, "SIM") Then
        texto = "CD " & CStr(wsC.Range("H2").Value) & "; " & CStr(wsC.Range("K2").Value) & "/" & CStr(wsC.Range("L2").Value) & " magias"
        If Val(CStr(wsC.Range("R2").Value)) > 0 Then texto = texto & "; extras " & CStr(wsC.Range("R2").Value)
        TextoMagiasNivel = texto
    End If
End Function

Private Function DetalhePoderPorLinha(ByVal linha As Long) As String
    Dim ws As Worksheet
    Dim texto As String
    Dim prereq As String
    Dim descricao As String

    If linha <= 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    texto = CStr(ws.Cells(linha, 2).Value) & vbCrLf
    texto = texto & String$(46, "-") & vbCrLf
    texto = texto & RotuloPoderCatalogo(linha) & vbCrLf
    If MesmoTexto(ws.Cells(linha, 8).Value, "SIM") Then texto = texto & "Repet" & ChrW$(237) & "vel: sim" & vbCrLf
    prereq = Trim$(CStr(ws.Cells(linha, 14).Value))
    If Len(prereq) > 0 Then texto = texto & "Pr" & ChrW$(233) & "-requisitos: " & prereq & vbCrLf
    descricao = Trim$(CStr(ws.Cells(linha, 7).Value))
    If Len(descricao) > 0 Then texto = texto & vbCrLf & descricao
    DetalhePoderPorLinha = texto
End Function

Private Function RotuloPoderCatalogo(ByVal linha As Long) As String
    Dim ws As Worksheet
    Dim origem As String
    Dim categoria As String
    Dim classeIds As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    origem = Trim$(CStr(ws.Cells(linha, 3).Value))
    categoria = Trim$(CStr(ws.Cells(linha, 4).Value))
    classeIds = Trim$(CStr(ws.Cells(linha, 5).Value))

    If MesmoTexto(origem, "Classe") Then
        RotuloPoderCatalogo = "Poder de " & ClassePoderLegivel(classeIds)
    Else
        RotuloPoderCatalogo = CategoriaPoderLegivel(categoria)
    End If
End Function

Private Function CategoriaPoderLegivel(ByVal categoria As String) As String
    categoria = LCase$(Trim$(categoria))
    Select Case categoria
        Case "combate"
            CategoriaPoderLegivel = "Poder de combate"
        Case "destino"
            CategoriaPoderLegivel = "Poder de destino"
        Case "magia"
            CategoriaPoderLegivel = "Poder de magia"
        Case "concedido"
            CategoriaPoderLegivel = "Poder concedido"
        Case "tormenta"
            CategoriaPoderLegivel = "Poder da Tormenta"
        Case "raca"
            CategoriaPoderLegivel = "Poder de ra" & ChrW$(231) & "a"
        Case "grupo"
            CategoriaPoderLegivel = "Poder de grupo"
        Case Else
            CategoriaPoderLegivel = "Poder geral"
    End Select
End Function

Private Function ClassePoderLegivel(ByVal classeIds As String) As String
    Dim partes() As String
    Dim nomes As Collection
    Dim i As Long
    Dim classeId As String
    classeIds = Trim$(classeIds)
    If Len(classeIds) = 0 Or MesmoTexto(classeIds, "classe") Then
        ClassePoderLegivel = "classe"
        Exit Function
    End If
    Set nomes = New Collection
    partes = Split(classeIds, ";")
    For i = LBound(partes) To UBound(partes)
        classeId = Trim$(partes(i))
        If Len(classeId) > 0 And Not MesmoTexto(classeId, "classe") Then
            AdicionarUnico nomes, LCase$(NomeClasseCatalogoPorId(classeId))
        End If
    Next i
    If nomes.Count = 0 Then
        ClassePoderLegivel = "classe"
    Else
        ClassePoderLegivel = TextoColecao(nomes, ", ")
    End If
End Function

Private Function NomeClasseCatalogoPorId(ByVal classeId As String) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    If Len(Trim$(classeId)) = 0 Then Exit Function
    If PlanilhaExiste(PLANILHA_BASE_SLOTS) Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_SLOTS)
        ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        For r = 2 To ultimaLinha
            If MesmoTexto(ws.Cells(r, 1).Value, classeId) Then
                NomeClasseCatalogoPorId = Trim$(CStr(ws.Cells(r, 2).Value))
                If Len(NomeClasseCatalogoPorId) > 0 Then Exit Function
            End If
        Next r
    End If
    NomeClasseCatalogoPorId = Replace(classeId, "_", " ")
End Function

Private Sub AplicarEfeitosJsonSimples(ByVal wsA As Worksheet, ByRef proximaLinha As Long, ByVal poderNome As String, ByVal efeitosJson As String, ByVal nivel As Long, ByVal descricao As String)
    Dim pericia As String
    Dim bonus As Double
    If Len(efeitosJson) = 0 Then Exit Sub

    If InStr(1, efeitosJson, """bonus_defesa""", vbTextCompare) > 0 Then
        bonus = ExtrairNumeroApos(efeitosJson, "bonus")
        If bonus <> 0 Then AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_defesa", "Defesa", "defesa", "Defesa", bonus, "Bonus de Defesa por poder."
    End If

    If InStr(1, efeitosJson, """bonus_pericia""", vbTextCompare) > 0 Then
        ExtrairBonusPericia efeitosJson, pericia, bonus
        If Len(pericia) > 0 And bonus <> 0 Then AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_pericia", "Pericia", pericia, NomePericia(pericia), bonus, "Bonus de pericia por poder."
    End If

    If InStr(1, efeitosJson, """bonus_pv_por_nivel""", vbTextCompare) > 0 Then
        bonus = ExtrairNumeroApos(efeitosJson, "bonus")
        If bonus <> 0 Then AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_pv", "PV", "pv", "PV", bonus * nivel, "Bonus de PV por nivel."
    End If

    If InStr(1, efeitosJson, """bonus_pm_por_nivel""", vbTextCompare) > 0 Then
        bonus = ExtrairNumeroApos(efeitosJson, "bonus")
        If bonus <> 0 Then AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_pm", "PM", "pm", "PM", bonus * nivel, "Bonus de PM por nivel."
    End If

    If InStr(1, efeitosJson, """regra_manual""", vbTextCompare) > 0 _
        Or InStr(1, efeitosJson, """bonus_pericia_condicional""", vbTextCompare) > 0 Then
        AplicarBonusPericiasPorDescricao wsA, proximaLinha, poderNome, descricao
    End If

    RegistrarEfeitosEstruturados wsA, proximaLinha, poderNome, efeitosJson, descricao
End Sub

Private Sub LimparBeneficiosOrigemPrincipal(ByVal wsP As Worksheet)
    wsP.Range("F40").MergeArea.ClearContents
    wsP.Range("F41").MergeArea.ClearContents
    wsP.Range("G40").MergeArea.ClearContents
    wsP.Range("G41").MergeArea.ClearContents
    On Error Resume Next
    wsP.Range("G40").MergeArea.ClearComments
    wsP.Range("G41").MergeArea.ClearComments
    On Error GoTo 0
End Sub

Private Sub AplicarOrigemRegional(ByVal wsP As Worksheet, ByVal wsO As Worksheet, ByVal linhaOrigem As Long, ByVal origem As String, ByVal classeId As String, ByVal classe As String, ByVal ApenasResumo As Boolean, ByRef proximaAtiva As Long)
    Dim descricao As String
    Dim regiao As String
    Dim itens As String
    Dim pericias As Collection
    Dim pericia As Variant
    Dim indice As Long

    descricao = Trim$(CStr(wsO.Cells(linhaOrigem, 9).Value))
    regiao = Trim$(CStr(wsO.Cells(linhaOrigem, 8).Value))
    itens = Trim$(CStr(wsO.Cells(linhaOrigem, 6).Value))
    Set pericias = ListaPorTexto(CStr(wsO.Cells(linhaOrigem, 10).Value))

    For Each pericia In pericias
        indice = indice + 1
        Call MarcarPericiaOrigem(CStr(pericia), "Origem|" & origem & "|PericiaFixa|" & CStr(indice), ApenasResumo)
    Next pericia

    EscreverHabilidadeAtiva "Origem", 1, classeId, classe, "origem_regional_" & IdTexto(origem), origem, "Beneficio regional", descricao, vbNullString, regiao, proximaAtiva
    wsP.Range("F40").Value = "Beneficio regional"
    wsP.Range("G40").Value = descricao
    DefinirComentarioBeneficio wsP.Range("G40"), descricao
    wsP.Range("F41").Value = "Itens iniciais"
    wsP.Range("G41").Value = itens
    DefinirComentarioBeneficio wsP.Range("G41"), itens
End Sub

Private Function DescricaoBeneficioOrigem(ByVal escolhaBeneficio As String, ByVal chave As String, ByVal linhaOrigem As Long) As String
    Dim nome As String
    Dim poderId As String
    Dim linha As Long

    escolhaBeneficio = Trim$(escolhaBeneficio)
    If InStr(1, escolhaBeneficio, "Pericia: ", vbTextCompare) = 1 Then
        nome = Mid$(escolhaBeneficio, Len("Pericia: ") + 1)
        DescricaoBeneficioOrigem = "Treinado em " & nome & "."
    ElseIf InStr(1, escolhaBeneficio, "Poder geral", vbTextCompare) = 1 Then
        poderId = ValorEscolha(chave & "|poder")
        linha = LinhaPoderPorId(poderId)
        If linha > 0 Then DescricaoBeneficioOrigem = DescricaoPoderPorLinha(linha)
    ElseIf InStr(1, escolhaBeneficio, "Poder: ", vbTextCompare) = 1 Then
        nome = Mid$(escolhaBeneficio, Len("Poder: ") + 1)
        linha = LinhaPoderPorNome(nome)
        If linha > 0 Then DescricaoBeneficioOrigem = DescricaoPoderPorLinha(linha)
    ElseIf InStr(1, escolhaBeneficio, "Poder unico: ", vbTextCompare) = 1 Then
        DescricaoBeneficioOrigem = CStr(ThisWorkbook.Worksheets(PLANILHA_ORIGENS).Cells(linhaOrigem, 5).Value)
    End If
End Function

Private Sub DefinirComentarioBeneficio(ByVal celula As Range, ByVal texto As String)
    Set celula = celula.MergeArea.Cells(1, 1)
    On Error Resume Next
    celula.ClearComments
    If Len(Trim$(texto)) > 0 Then celula.AddComment texto
    On Error GoTo 0
End Sub

Private Sub RegistrarEfeitosEstruturados(ByVal wsA As Worksheet, ByRef proximaLinha As Long, ByVal poderNome As String, ByVal efeitosJson As String, ByVal descricao As String)
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_defesa_condicional", "Defesa", "defesa", "Defesa", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_defesa_escudo_condicional", "Defesa", "escudo", "Defesa do escudo", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_ataque_condicional", "Ataque", "ataque", "Ataque", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_ataque_arma_escolhida", "Ataque", "arma_escolhida", "Arma escolhida", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "penalidade_ataque_condicional", "Ataque", "ataque", "Ataque", "penalidade"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_dano_condicional", "Dano", "dano", "Dano", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_margem_ameaca_condicional", "Critico", "margem_ameaca", "Margem de ameaca", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_multiplicador_critico_condicional", "Critico", "multiplicador_critico", "Multiplicador de critico", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_cd", "Magia", "cd", "CD de magia", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "bonus_cd_magias", "Magia", "cd", "CD de magia", "bonus"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "ataque_extra_condicional", "Acao", "ataque_extra", "Ataque extra", "quantidade"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "acao_movimento_extra", "Acao", "movimento_extra", "Acao de movimento extra", "quantidade"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "reduzir_acao_recarregar_arma_disparo", "Acao", "recarregar", "Recarregar arma", "passos"
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "alterar_acao_sacar_guardar_item", "Acao", "sacar_guardar", "Sacar ou guardar item", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "substituir_atributo_ataque_dano_condicional", "Regra", "atributo_ataque_dano", "Atributo de ataque e dano", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "reducao_dano_reativa", "RD", "reducao_dano", "Reducao de dano", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "substituir_pericia_resistencia", "Regra", "resistencia", "Pericia de resistencia", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "evitar_dano_em_resistencia_sucesso", "Regra", "resistencia_sem_dano", "Resistencia sem dano", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "rolar_dois_dados_usar_melhor", "Regra", "rolar_dois_dados", "Rolar dois dados", vbNullString
    RegistrarEfeitoEstruturado wsA, proximaLinha, poderNome, efeitosJson, descricao, "escolha_melhoria_montaria", "Escolha", "melhoria_montaria", "Melhoria da montaria", vbNullString
End Sub

Private Sub RegistrarEfeitoEstruturado(ByVal wsA As Worksheet, ByRef proximaLinha As Long, ByVal poderNome As String, ByVal efeitosJson As String, ByVal descricao As String, ByVal tipoEfeito As String, ByVal alvoTipo As String, ByVal alvoId As String, ByVal alvoNome As String, ByVal chaveValor As String)
    Dim valor As Double
    If InStr(1, efeitosJson, """" & tipoEfeito & """", vbTextCompare) = 0 Then Exit Sub
    If Len(chaveValor) > 0 Then valor = ExtrairNumeroEfeito(efeitosJson, tipoEfeito, chaveValor)
    AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, tipoEfeito, alvoTipo, alvoId, alvoNome, valor, ResumoEfeitoPoder(descricao)
End Sub

Private Function ExtrairNumeroEfeito(ByVal texto As String, ByVal tipoEfeito As String, ByVal chave As String) As Double
    Dim re As Object
    Dim m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.Pattern = """tipo""\s*:\s*""" & tipoEfeito & """[^{}]*""" & chave & """\s*:\s*(-?\d+(\.\d+)?)"
    re.IgnoreCase = True
    If re.Test(texto) Then
        Set m = re.Execute(texto)(0)
        ExtrairNumeroEfeito = CDbl(m.SubMatches(0))
    End If
End Function

Private Function ResumoEfeitoPoder(ByVal descricao As String) As String
    Dim corte As Long
    descricao = Trim$(Replace(Replace(descricao, vbCrLf, " "), vbLf, " "))
    corte = InStr(1, descricao, ".", vbTextCompare)
    If corte > 0 Then descricao = Left$(descricao, corte)
    If Len(descricao) > 240 Then descricao = Left$(descricao, 237) & "..."
    ResumoEfeitoPoder = descricao
End Function

Private Sub AplicarBonusPericiasPorDescricao(ByVal wsA As Worksheet, ByRef proximaLinha As Long, ByVal poderNome As String, ByVal descricao As String)
    Dim sentencas() As String
    Dim sentenca As String
    Dim pericias As Collection
    Dim pericia As Variant
    Dim bonus As Long
    Dim contexto As String
    Dim i As Long

    descricao = Replace(Replace(descricao, vbCrLf, "."), vbLf, ".")
    sentencas = Split(descricao, ".")
    Set pericias = NomesPericiasCatalogo()

    For i = LBound(sentencas) To UBound(sentencas)
        sentenca = Trim$(sentencas(i))
        If InStr(1, sentenca, "recebe", vbTextCompare) > 0 And InStr(1, sentenca, "+", vbTextCompare) > 0 Then
            bonus = PrimeiroInteiroComSinal(sentenca)
            If bonus <> 0 Then
                For Each pericia In pericias
                    If SentencaContemPericia(sentenca, CStr(pericia)) Then
                        contexto = ContextoBonusPericia(sentenca, CStr(pericia))
                        If Len(contexto) > 0 Then
                            AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_pericia_condicional", "Pericia", IdTexto(pericia), CStr(pericia), bonus, TextoObsBonusContexto(bonus, contexto)
                        Else
                            AdicionarAtivo wsA, proximaLinha, "Poder", poderNome, poderNome, "bonus_pericia", "Pericia", IdTexto(pericia), CStr(pericia), bonus, "Bonus de pericia por poder."
                        End If
                    End If
                Next pericia
            End If
        End If
    Next i
End Sub

Private Function NomesPericiasCatalogo() As Collection
    Dim lista As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nome As String

    Set lista = New Collection
    If Not PlanilhaExiste(PLANILHA_BASE_PERICIAS) Then
        Set NomesPericiasCatalogo = lista
        Exit Function
    End If
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_PERICIAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        nome = Trim$(CStr(ws.Cells(r, 2).Value))
        If Len(nome) > 0 Then AdicionarUnico lista, nome
    Next r
    Set NomesPericiasCatalogo = lista
End Function

Private Function SentencaContemPericia(ByVal sentenca As String, ByVal pericia As String) As Boolean
    SentencaContemPericia = (InStr(1, sentenca, pericia, vbTextCompare) > 0)
End Function

Private Function ContextoBonusPericia(ByVal sentenca As String, ByVal pericia As String) As String
    Dim posPericia As Long
    Dim posPara As Long
    Dim texto As String
    Dim corte As Long
    Dim cortes As Variant
    Dim item As Variant

    posPericia = InStr(1, sentenca, pericia, vbTextCompare)
    If posPericia = 0 Then Exit Function
    posPara = InStr(posPericia + Len(pericia), sentenca, " para ", vbTextCompare)
    If posPara = 0 Then Exit Function

    texto = Trim$(Mid$(sentenca, posPara + Len(" para ")))
    cortes = Array(" e pode ", ",", ";", ":")
    For Each item In cortes
        corte = InStr(1, texto, CStr(item), vbTextCompare)
        If corte > 0 Then texto = Left$(texto, corte - 1)
    Next item
    If Len(texto) > 36 Then texto = Left$(texto, 33) & "..."
    ContextoBonusPericia = Trim$(texto)
End Function

Private Function TextoObsBonusContexto(ByVal bonus As Long, ByVal contexto As String) As String
    If bonus > 0 Then
        TextoObsBonusContexto = "+" & CStr(bonus) & " para " & contexto
    Else
        TextoObsBonusContexto = CStr(bonus) & " para " & contexto
    End If
End Function

Private Function PrimeiroInteiroComSinal(ByVal texto As String) As Long
    Dim i As Long
    Dim ch As String
    Dim sinal As Long
    Dim digitos As String

    For i = 1 To Len(texto) - 1
        ch = Mid$(texto, i, 1)
        If (ch = "+" Or ch = "-") And Mid$(texto, i + 1, 1) Like "#" Then
            If ch = "-" Then sinal = -1 Else sinal = 1
            i = i + 1
            Do While i <= Len(texto) And Mid$(texto, i, 1) Like "#"
                digitos = digitos & Mid$(texto, i, 1)
                i = i + 1
            Loop
            PrimeiroInteiroComSinal = sinal * CLng(Val(digitos))
            Exit Function
        End If
    Next i
End Function

Private Function ExtrairTextoApos(ByVal texto As String, ByVal chave As String) As String
    Dim re As Object
    Dim m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.Pattern = """" & chave & """\s*:\s*""([^""]+)"""
    re.IgnoreCase = True
    If re.Test(texto) Then
        Set m = re.Execute(texto)(0)
        ExtrairTextoApos = CStr(m.SubMatches(0))
    End If
End Function

Private Sub ExtrairBonusPericia(ByVal texto As String, ByRef pericia As String, ByRef bonus As Double)
    Dim re As Object
    Dim m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.Pattern = "\{[^{}]*""tipo""\s*:\s*""bonus_pericia""[^{}]*""periciaId""\s*:\s*""([^""]+)""[^{}]*""bonus""\s*:\s*(-?\d+(\.\d+)?)"
    re.IgnoreCase = True
    If re.Test(texto) Then
        Set m = re.Execute(texto)(0)
        pericia = CStr(m.SubMatches(0))
        bonus = CDbl(m.SubMatches(1))
    End If
End Sub

Private Function ExtrairNumeroApos(ByVal texto As String, ByVal chave As String) As Double
    Dim re As Object
    Dim m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.Pattern = """" & chave & """\s*:\s*(-?\d+(\.\d+)?)"
    re.IgnoreCase = True
    If re.Test(texto) Then
        Set m = re.Execute(texto)(0)
        ExtrairNumeroApos = CDbl(m.SubMatches(0))
    End If
End Function

Private Function MarcarPericiaOrigem(ByVal pericia As String, ByVal chave As String, ByVal ApenasResumo As Boolean) As String
    Dim linha As Long
    Dim oficio As String
    GarantirColunaOrigemTreino
    If EhOficio(pericia) Then
        oficio = ValorEscolha(chave & "|oficio")
        If Len(oficio) = 0 And Not ApenasResumo Then
            oficio = EscolherOficioEspecifico("Origem" & vbCrLf & "Escolha o oficio especifico.")
            If Len(oficio) > 0 Then DefinirEscolha chave & "|oficio", oficio, "Oficio especifico por origem."
        End If
        If Len(oficio) = 0 Then Exit Function
        linha = GarantirLinhaOficio(oficio)
        MarcarPericiaOrigem = oficio
    Else
        linha = LinhaTreinoPericia(pericia)
        MarcarPericiaOrigem = NomePericia(pericia)
    End If
    If linha > 0 Then ThisWorkbook.Worksheets(PLANILHA_TREINO).Cells(linha, COL_TREINO_ORIGEM).Value = True
End Function

Private Sub LimparTreinoOrigem()
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    GarantirColunaOrigemTreino
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultimaLinha >= PRIMEIRA_LINHA_TREINO Then ws.Range(ws.Cells(PRIMEIRA_LINHA_TREINO, COL_TREINO_ORIGEM), ws.Cells(ultimaLinha, COL_TREINO_ORIGEM)).Value = False
    AtualizarFormulasTreinoFinal
End Sub

Private Sub GarantirColunaOrigemTreino()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    If Trim$(CStr(ws.Cells(1, COL_TREINO_ORIGEM).Value)) = vbNullString Then ws.Cells(1, COL_TREINO_ORIGEM).Value = "Treino_Origem"
End Sub

Private Sub AtualizarFormulasTreinoFinal()
    Dim ws As Worksheet
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    For r = PRIMEIRA_LINHA_TREINO To ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        ws.Cells(r, 13).Formula = "=OR(E" & r & ":L" & r & ",N" & r & ")"
    Next r
End Sub

Private Function LinhaTreinoPericia(ByVal pericia As String) As Long
    Dim wsP As Worksheet
    Dim r As Long
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericiaPrincipal()
        If MesmoTexto(NomeBasePericia(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)), NomeBasePericia(pericia)) Then
            LinhaTreinoPericia = PRIMEIRA_LINHA_TREINO + (r - PRIMEIRA_LINHA_PERICIA)
            Exit Function
        End If
    Next r
End Function

Private Function GarantirLinhaOficio(ByVal oficio As String) As Long
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim r As Long
    Dim linhaTreino As Long
    Dim linhaModelo As Long
    Dim linhaNova As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)

    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericiaPrincipal()
        If MesmoTexto(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value, oficio) Then
            GarantirLinhaOficio = PRIMEIRA_LINHA_TREINO + (r - PRIMEIRA_LINHA_PERICIA)
            Exit Function
        End If
    Next r

    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericiaPrincipal()
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) And MesmoTexto(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value, NomeOficioVazio()) Then
            linhaTreino = PRIMEIRA_LINHA_TREINO + (r - PRIMEIRA_LINHA_PERICIA)
            wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value = oficio
            ConfigurarLinhaOficio r
            GarantirLinhaOficio = linhaTreino
            Exit Function
        End If
    Next r

    linhaModelo = UltimaLinhaOficio()
    If linhaModelo = 0 Then linhaModelo = 21
    linhaNova = linhaModelo + 1
    linhaTreino = PRIMEIRA_LINHA_TREINO + (linhaNova - PRIMEIRA_LINHA_PERICIA)
    wsT.Rows(linhaTreino).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove
    wsP.Range(wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_OBS)).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove
    wsP.Range(wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_OBS)).Copy
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormats
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormulas
    Application.CutCopyMode = False
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).Value = oficio
    ConfigurarLinhaOficio linhaNova
    GarantirLinhaOficio = linhaTreino
End Function

Private Sub ConfigurarLinhaOficio(ByVal linhaPrincipal As Long)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim linhaTreino As Long
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    linhaTreino = PRIMEIRA_LINHA_TREINO + (linhaPrincipal - PRIMEIRA_LINHA_PERICIA)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_ATRIBUTO).Value = "INT"
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TOTAL).Formula = modRegrasT20.FormulaTotalPericiaPrincipal(linhaPrincipal, linhaTreino)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TREINO).Formula = "=" & PLANILHA_TREINO & "!M" & linhaTreino
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_BONUS).Formula = modRegrasT20.FormulaBonusPericiaPrincipal(linhaPrincipal)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_OBS).ClearContents
    wsT.Cells(linhaTreino, 1).Formula = "=INT(Principal!$F$1/2)"
    wsT.Cells(linhaTreino, 2).Formula = "=IF(Principal!L" & linhaPrincipal & ",2,0)"
    wsT.Cells(linhaTreino, 3).Value = "SIM"
    wsT.Cells(linhaTreino, 4).Value = "NAO"
    wsT.Cells(linhaTreino, 13).Formula = "=OR(E" & linhaTreino & ":L" & linhaTreino & ",N" & linhaTreino & ")"
End Sub

Private Function EscolherOficioEspecifico(ByVal titulo As String) As String
    Dim opcoes As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim oficio As String

    Set opcoes = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_DADOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 5).End(xlUp).Row
    For r = 2 To ultimaLinha
        oficio = Trim$(CStr(ws.Cells(r, 5).Value))
        If Len(oficio) > 0 Then AdicionarUnico opcoes, oficio
    Next r
    If opcoes.Count > 0 Then EscolherOficioEspecifico = EscolherOpcaoSimples(titulo, opcoes)
End Function

Private Function EscolherPoderUnicoOrigem(ByVal titulo As String) As String
    Dim opcoes As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set opcoes = New Collection
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If Len(Trim$(CStr(ws.Cells(r, 4).Value))) > 0 Then AdicionarUnico opcoes, CStr(ws.Cells(r, 4).Value)
    Next r
    If opcoes.Count > 0 Then EscolherPoderUnicoOrigem = EscolherOpcaoSimples(titulo, opcoes)
End Function

Private Function PericiaTreinada(ByVal pericia As String) As Boolean
    Dim linha As Long
    Dim ws As Worksheet
    Dim c As Long
    linha = LinhaTreinoPericia(NomePericia(pericia))
    If linha <= 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_TREINO)
    For c = 5 To COL_TREINO_ORIGEM
        If ValorVerdadeiro(ws.Cells(linha, c).Value) Then
            PericiaTreinada = True
            Exit Function
        End If
    Next c
End Function

Private Function TemProficiencia(ByVal texto As String) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim alvo As String

    texto = LCase$(texto)
    If PlanilhaExiste(PLANILHA_EFEITOS_ATIVOS) Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
        ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        For r = 2 To ultimaLinha
            If MesmoTexto(ws.Cells(r, 4).Value, "proficiencia") Then
                alvo = LCase$(CStr(ws.Cells(r, 7).Value) & " " & CStr(ws.Cells(r, 6).Value) & " " & CStr(ws.Cells(r, 5).Value))
                If InStr(1, texto, "escudo", vbTextCompare) > 0 And InStr(1, alvo, "escudo", vbTextCompare) > 0 Then TemProficiencia = True
                If InStr(1, texto, "armadura", vbTextCompare) > 0 And InStr(1, alvo, "armadura", vbTextCompare) > 0 Then TemProficiencia = True
                If InStr(1, texto, "arma", vbTextCompare) > 0 And InStr(1, alvo, "arma", vbTextCompare) > 0 Then TemProficiencia = True
                If TemProficiencia Then Exit Function
            End If
        Next r
    End If

    alvo = LCase$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G17").Value) & " " & CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G18").Value) & " " & CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G19").Value))
    If InStr(1, texto, "escudo", vbTextCompare) > 0 And InStr(1, alvo, "escudo", vbTextCompare) > 0 Then TemProficiencia = True
    If InStr(1, texto, "armadura", vbTextCompare) > 0 And InStr(1, alvo, "armadura", vbTextCompare) > 0 Then TemProficiencia = True
    If InStr(1, texto, "arma", vbTextCompare) > 0 And InStr(1, alvo, "arma", vbTextCompare) > 0 Then TemProficiencia = True
End Function

Private Function ValorAtributo(ByVal atributo As String) As Double
    Dim pos As Variant
    atributo = UCase$(Trim$(atributo))
    pos = Application.Match(atributo, Array("FOR", "DES", "CON", "INT", "SAB", "CAR"), 0)
    If Not IsError(pos) Then ValorAtributo = Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Cells(6, CLng(pos)).Value))
End Function

Private Function AtributoInicio(ByVal texto As String) As String
    Dim partes() As String
    partes = Split(Trim$(texto), " ")
    If UBound(partes) < 0 Then Exit Function
    Select Case UCase$(partes(0))
        Case "FOR", "DES", "CON", "INT", "SAB", "CAR"
            AtributoInicio = UCase$(partes(0))
    End Select
End Function

Private Function PrimeiroNumero(ByVal texto As String) As Long
    Dim i As Long
    Dim digitos As String
    For i = 1 To Len(texto)
        If Mid$(texto, i, 1) Like "#" Then
            digitos = digitos & Mid$(texto, i, 1)
        ElseIf Len(digitos) > 0 Then
            Exit For
        End If
    Next i
    PrimeiroNumero = CLng(Val(digitos))
End Function

Private Function ClasseIdPorNome(ByVal classe As String) As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    If Len(classe) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_HABILIDADES)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 2).Value, classe) Or MesmoTexto(ws.Cells(r, 1).Value, classe) Then
            ClasseIdPorNome = Trim$(CStr(ws.Cells(r, 1).Value))
            Exit Function
        End If
    Next r
    If PlanilhaExiste(PLANILHA_BASE_SLOTS) Then
        Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_SLOTS)
        ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        For r = 2 To ultimaLinha
            If MesmoTexto(ws.Cells(r, 2).Value, classe) Or MesmoTexto(ws.Cells(r, 1).Value, classe) Then
                ClasseIdPorNome = Trim$(CStr(ws.Cells(r, 1).Value))
                Exit Function
            End If
        Next r
    End If
End Function

Private Function ClasseTemPoderesCatalogados(ByVal classeId As String) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_MAPA_CLASSE)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, classeId) Then
            ClasseTemPoderesCatalogados = True
            Exit Function
        End If
    Next r
End Function

Private Function SlotTemPoderesClasseCatalogados(ByVal classeId As String, ByVal poolClasseIds As String) As Boolean
    Dim pools As Collection
    Dim item As Variant

    Set pools = ListaPorTexto(poolClasseIds)
    If pools.Count = 0 Then
        SlotTemPoderesClasseCatalogados = ClasseTemPoderesCatalogados(classeId)
        Exit Function
    End If

    If PoderCatalogoExiste("classe_aumento_de_atributo") Then
        SlotTemPoderesClasseCatalogados = True
        Exit Function
    End If

    For Each item In pools
        If PoolClasseTemPoderesCatalogados(CStr(item)) Then
            SlotTemPoderesClasseCatalogados = True
            Exit Function
        End If
    Next item
End Function

Private Function PoolClasseTemPoderesCatalogados(ByVal poolClasseId As String) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long

    If Len(Trim$(poolClasseId)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 3).Value, "Classe") Then
            If PoderCatalogoPertencePool(r, CStr(ws.Cells(r, 1).Value), poolClasseId) Then
                PoolClasseTemPoderesCatalogados = True
                Exit Function
            End If
        End If
    Next r
End Function

Private Function MapaClasseTemPoder(ByVal classeId As String, ByVal poderId As String) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_MAPA_CLASSE)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, classeId) And MesmoTexto(ws.Cells(r, 3).Value, poderId) Then
            MapaClasseTemPoder = True
            Exit Function
        End If
    Next r
End Function

Private Function PoderFontePermitida(ByVal poderId As String, ByVal tipoEscolha As String, ByVal classeId As String, ByVal poolClasseIds As String, ByVal permiteGeral As Boolean, ByRef motivo As String) As Boolean
    Dim linha As Long
    Dim origem As String

    linha = LinhaPoderPorId(poderId)
    If linha = 0 Then
        motivo = "poder nao encontrado"
        Exit Function
    End If

    origem = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linha, 3).Value)
    If MesmoTexto(origem, "Geral") Then
        If permiteGeral Then
            PoderFontePermitida = True
        Else
            motivo = "este slot exige poder de classe"
        End If
        Exit Function
    End If

    If MesmoTexto(origem, "Classe") Then
        If Len(Trim$(poolClasseIds)) > 0 Then
            PoderFontePermitida = PoderCatalogoPertencePool(linha, poderId, poolClasseIds)
        Else
            PoderFontePermitida = MapaClasseTemPoder(classeId, poderId)
        End If
        If Not PoderFontePermitida Then motivo = "poder fora da classe deste slot"
    End If
End Function

Private Function PoderCatalogoPertencePool(ByVal linha As Long, ByVal poderId As String, ByVal poolClasseIds As String) As Boolean
    Dim pools As Collection
    Dim item As Variant
    Dim catalogoPools As String

    If MesmoTexto(poderId, "classe_aumento_de_atributo") Then
        PoderCatalogoPertencePool = True
        Exit Function
    End If

    Set pools = ListaPorTexto(poolClasseIds)
    If pools.Count = 0 Then Exit Function

    catalogoPools = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linha, 5).Value)
    For Each item In pools
        If ListaTextoContem(catalogoPools, CStr(item)) Then
            PoderCatalogoPertencePool = True
            Exit Function
        End If
    Next item
End Function

Private Function PoderCatalogoExiste(ByVal poderId As String) As Boolean
    PoderCatalogoExiste = (LinhaPoderPorId(poderId) > 0)
End Function

Private Function LinhaPoderPorId(ByVal poderId As String) As Long
    Dim ws As Worksheet
    Dim resultado As Variant
    If Len(Trim$(poderId)) = 0 Or Not PlanilhaExiste(PLANILHA_CATALOGO) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    resultado = Application.Match(poderId, ws.Columns(1), 0)
    If Not IsError(resultado) Then LinhaPoderPorId = CLng(resultado)
End Function

Private Function LinhaPoderPorNome(ByVal nome As String) As Long
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 2).Value, nome) Then
            LinhaPoderPorNome = r
            Exit Function
        End If
    Next r
End Function

Private Function PoderIdPorNome(ByVal nome As String, Optional ByVal origemTipo As String = "") As String
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CATALOGO)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If Len(origemTipo) = 0 Or MesmoTexto(ws.Cells(r, 3).Value, origemTipo) Then
            If MesmoTexto(ws.Cells(r, 2).Value, nome) Then
                PoderIdPorNome = CStr(ws.Cells(r, 1).Value)
                Exit Function
            End If
        End If
    Next r
End Function

Private Function NomePoderPorId(ByVal poderId As String) As String
    NomePoderPorId = NomePoderPorLinha(LinhaPoderPorId(poderId))
    If Len(NomePoderPorId) = 0 Then NomePoderPorId = poderId
End Function

Private Function NomePoderPorLinha(ByVal linha As Long) As String
    If linha > 0 Then NomePoderPorLinha = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linha, 2).Value)
End Function

Private Function DescricaoPoderPorLinha(ByVal linha As Long) As String
    If linha > 0 Then DescricaoPoderPorLinha = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linha, 7).Value)
End Function

Private Function PreReqResumoPorLinha(ByVal linha As Long) As String
    If linha > 0 Then PreReqResumoPorLinha = CStr(ThisWorkbook.Worksheets(PLANILHA_CATALOGO).Cells(linha, 14).Value)
End Function

Private Function PreReqResumoPorId(ByVal poderId As String) As String
    PreReqResumoPorId = PreReqResumoPorLinha(LinhaPoderPorId(poderId))
End Function

Private Function LinhaOrigemPorNome(ByVal origem As String) As Long
    Dim ws As Worksheet
    Dim resultado As Variant
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    resultado = Application.Match(origem, ws.Columns(1), 0)
    If Not IsError(resultado) Then LinhaOrigemPorNome = CLng(resultado)
End Function

Private Function LinhaOrigemPorPoderUnico(ByVal nome As String) As Long
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ORIGENS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 4).Value, nome) Then
            LinhaOrigemPorPoderUnico = r
            Exit Function
        End If
    Next r
End Function

Private Function ClasseTemSlotPoderNoNivel(ByVal classeId As String, ByVal nivel As Long) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim inicial As Long
    Dim frequencia As String
    If Len(classeId) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_SLOTS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, classeId) Then
            inicial = CLng(Val(CStr(ws.Cells(r, 6).Value)))
            If inicial <= 0 Then inicial = 2
            frequencia = LCase$(Trim$(CStr(ws.Cells(r, 7).Value)))
            If nivel >= inicial Then
                If frequencia = "nivel_par" Then
                    If nivel Mod 2 = 0 Then ClasseTemSlotPoderNoNivel = True
                ElseIf frequencia = "nivel_impar" Then
                    If nivel Mod 2 = 1 Then ClasseTemSlotPoderNoNivel = True
                ElseIf frequencia = "unico" Or frequencia = "pontual" Then
                    If nivel = inicial Then ClasseTemSlotPoderNoNivel = True
                Else
                    ClasseTemSlotPoderNoNivel = True
                End If
            End If
            If ClasseTemSlotPoderNoNivel Then Exit Function
        End If
    Next r
End Function

Private Function QuantidadeSlots(ByVal nivelAtual As Long, ByVal nivelInicial As Long, ByVal frequencia As String) As Long
    Dim n As Long
    If nivelInicial <= 0 Then nivelInicial = 2
    If nivelAtual < nivelInicial Then Exit Function
    Select Case LCase$(Trim$(frequencia))
        Case "todo_nivel", ""
            QuantidadeSlots = nivelAtual - nivelInicial + 1
        Case "nivel_par"
            For n = nivelInicial To nivelAtual
                If n Mod 2 = 0 Then QuantidadeSlots = QuantidadeSlots + 1
            Next n
        Case "nivel_impar"
            For n = nivelInicial To nivelAtual
                If n Mod 2 = 1 Then QuantidadeSlots = QuantidadeSlots + 1
            Next n
        Case Else
            QuantidadeSlots = 1
    End Select
End Function

Private Function NivelDoSlot(ByVal nivelInicial As Long, ByVal frequencia As String, ByVal indice As Long) As Long
    Dim n As Long
    Dim cont As Long
    If nivelInicial <= 0 Then nivelInicial = 2
    Select Case LCase$(Trim$(frequencia))
        Case "todo_nivel", ""
            NivelDoSlot = nivelInicial + indice - 1
        Case "nivel_par"
            For n = nivelInicial To 20
                If n Mod 2 = 0 Then
                    cont = cont + 1
                    If cont = indice Then NivelDoSlot = n: Exit Function
                End If
            Next n
        Case "nivel_impar"
            For n = nivelInicial To 20
                If n Mod 2 = 1 Then
                    cont = cont + 1
                    If cont = indice Then NivelDoSlot = n: Exit Function
                End If
            Next n
        Case Else
            NivelDoSlot = nivelInicial
    End Select
End Function

Private Function PatamarPorNivel(ByVal nivel As Long) As Long
    If nivel <= 4 Then
        PatamarPorNivel = 1
    ElseIf nivel <= 10 Then
        PatamarPorNivel = 2
    ElseIf nivel <= 16 Then
        PatamarPorNivel = 3
    Else
        PatamarPorNivel = 4
    End If
End Function

Private Function NivelPersonagem() As Long
    NivelPersonagem = CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("F1").Value)))
    If NivelPersonagem < 1 Then NivelPersonagem = 1
    If NivelPersonagem > 20 Then NivelPersonagem = 20
End Function

Private Sub AdicionarAtivo(ByVal ws As Worksheet, ByRef proximaLinha As Long, ByVal origemTipo As String, ByVal origemNome As String, ByVal fonteNome As String, ByVal tipoEfeito As String, ByVal grupoOuAlvoTipo As String, ByVal alvoId As String, ByVal alvoNome As String, ByVal valor As Double, ByVal observacao As String)
    ws.Cells(proximaLinha, 1).Value = origemTipo
    ws.Cells(proximaLinha, 2).Value = origemNome
    ws.Cells(proximaLinha, 3).Value = fonteNome
    ws.Cells(proximaLinha, 4).Value = tipoEfeito
    ws.Cells(proximaLinha, 5).Value = grupoOuAlvoTipo
    ws.Cells(proximaLinha, 6).Value = alvoId
    ws.Cells(proximaLinha, 7).Value = alvoNome
    ws.Cells(proximaLinha, 8).Value = valor
    ws.Cells(proximaLinha, 9).Value = observacao
    proximaLinha = proximaLinha + 1
End Sub

Private Function EscolherOpcaoSimples(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcaoSimples = formulario.escolha
    Unload formulario
End Function

Private Function EscolherAtributoSimples(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, True
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherAtributoSimples = formulario.escolha
    Unload formulario
End Function

Private Function ValorEscolha(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    If Len(Trim$(chave)) = 0 Then Exit Function
    If Not PlanilhaExiste(PLANILHA_ESCOLHAS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEscolha = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEscolha(ByVal chave As String, ByVal valor As String, Optional ByVal observacao As String = "")
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long
    If Len(Trim$(chave)) = 0 Then Exit Sub
    Set ws = GarantirPlanilha(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If IsError(resultado) Then
        linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
        If linha < 2 Then linha = 2
        ws.Cells(linha, 1).Value = chave
    Else
        linha = CLng(resultado)
    End If
    ws.Cells(linha, 2).Value = valor
    If Len(observacao) > 0 Then ws.Cells(linha, 3).Value = observacao
End Sub

Private Function ListaPorTexto(ByVal texto As String) As Collection
    Dim lista As Collection
    Dim normalizado As String
    Dim partes() As String
    Dim i As Long
    Set lista = New Collection
    normalizado = Replace(Replace(Replace(texto, vbCrLf, ";"), vbLf, ";"), ",", ";")
    partes = Split(normalizado, ";")
    For i = LBound(partes) To UBound(partes)
        If Len(Trim$(partes(i))) > 0 Then AdicionarUnico lista, Trim$(partes(i))
    Next i
    Set ListaPorTexto = lista
End Function

Private Sub AdicionarColecao(ByVal destino As Collection, ByVal origem As Collection)
    Dim item As Variant
    For Each item In origem
        destino.Add CStr(item)
    Next item
End Sub

Private Sub AdicionarUnico(ByVal lista As Collection, ByVal valor As String)
    If Len(Trim$(valor)) = 0 Then Exit Sub
    If Not Contem(lista, valor) Then lista.Add valor
End Sub

Private Function Contem(ByVal lista As Collection, ByVal valor As String) As Boolean
    Dim item As Variant
    If lista Is Nothing Then Exit Function
    For Each item In lista
        If MesmoTexto(item, valor) Then
            Contem = True
            Exit Function
        End If
    Next item
End Function

Private Function ColecaoContem(ByVal lista As Collection, ByVal valor As String) As Boolean
    ColecaoContem = Contem(lista, valor)
End Function

Private Function ListaTextoContem(ByVal texto As String, ByVal valor As String) As Boolean
    Dim itens As Collection
    Set itens = ListaPorTexto(texto)
    ListaTextoContem = Contem(itens, valor)
End Function

Private Function TextoColecao(ByVal lista As Collection, ByVal separador As String) As String
    Dim item As Variant
    Dim texto As String
    For Each item In lista
        If Len(texto) > 0 Then texto = texto & separador
        texto = texto & CStr(item)
    Next item
    TextoColecao = texto
End Function

Private Function MontarOpcaoPoder(ByVal exibicao As String, ByVal poderId As String, ByVal status As String, ByVal motivo As String) As String
    MontarOpcaoPoder = exibicao & SEP_FORM & poderId & SEP_FORM & status & SEP_FORM & motivo
End Function

Private Function TituloNaoCumprePreRequisito() As String
    TituloNaoCumprePreRequisito = "N" & ChrW$(195) & "O CUMPRE PR" & ChrW$(201) & " REQUISITO"
End Function

Private Function TextoCategoria(ByVal categoria As String, ByVal origem As String) As String
    If MesmoTexto(origem, "Classe") Then Exit Function
    If Len(categoria) > 0 Then TextoCategoria = " [" & categoria & "]"
End Function

Private Function ResumoCurtoReq(ByVal motivo As String) As String
    If Len(motivo) = 0 Then
        ResumoCurtoReq = "pre-requisito"
    ElseIf Len(motivo) > 42 Then
        ResumoCurtoReq = Left$(motivo, 39) & "..."
    Else
        ResumoCurtoReq = motivo
    End If
End Function

Private Function NomeComEscolha(ByVal nome As String, ByVal escolha As String) As String
    If Len(escolha) > 0 Then
        NomeComEscolha = nome & " (" & escolha & ")"
    Else
        NomeComEscolha = nome
    End If
End Function

Private Function NomePericia(ByVal periciaId As String) As String
    Dim ws As Worksheet
    Dim linha As Variant
    If Not PlanilhaExiste(PLANILHA_BASE_PERICIAS) Then
        NomePericia = periciaId
        Exit Function
    End If
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_PERICIAS)
    linha = Application.Match(LCase$(IdTexto(periciaId)), ws.Columns(1), 0)
    If IsError(linha) Then
        NomePericia = periciaId
    Else
        NomePericia = CStr(ws.Cells(CLng(linha), 2).Value)
    End If
End Function

Private Function NomeBasePericia(ByVal pericia As String) As String
    If EhOficio(pericia) Then
        NomeBasePericia = NomeOficioBase()
    Else
        NomeBasePericia = Trim$(pericia)
    End If
End Function

Private Function EhOficio(ByVal valor As Variant) As Boolean
    EhOficio = (StrComp(Left$(Trim$(CStr(valor)), Len(NomeOficioBase())), NomeOficioBase(), vbTextCompare) = 0)
End Function

Private Function NomeOficioBase() As String
    NomeOficioBase = "Of" & ChrW$(237) & "cio"
End Function

Private Function NomeOficioVazio() As String
    NomeOficioVazio = NomeOficioBase() & " ( )"
End Function

Private Function UltimaLinhaPericiaPrincipal() As Long
    Dim wsP As Worksheet
    Dim r As Long
    Dim limite As Long
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    UltimaLinhaPericiaPrincipal = PRIMEIRA_LINHA_PERICIA
    limite = PRIMEIRA_LINHA_PERICIA + 120
    If limite > wsP.Rows.Count Then limite = wsP.Rows.Count
    For r = PRIMEIRA_LINHA_PERICIA To limite
        If Len(Trim$(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value))) = 0 Then Exit For
        UltimaLinhaPericiaPrincipal = r
    Next r
End Function

Private Function UltimaLinhaOficio() As Long
    Dim wsP As Worksheet
    Dim r As Long
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = UltimaLinhaPericiaPrincipal() To PRIMEIRA_LINHA_PERICIA Step -1
        If EhOficio(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            UltimaLinhaOficio = r
            Exit Function
        End If
    Next r
End Function

Private Function ValorVerdadeiro(ByVal valor As Variant) As Boolean
    If VarType(valor) = vbBoolean Then
        ValorVerdadeiro = CBool(valor)
    Else
        Select Case UCase$(Trim$(CStr(valor)))
            Case "TRUE", "VERDADEIRO", "SIM", "1"
                ValorVerdadeiro = True
        End Select
    End If
End Function

Private Function IdTexto(ByVal valor As Variant) As String
    Dim texto As String
    texto = LCase$(Trim$(CStr(valor)))
    texto = Replace(texto, " ", "_")
    texto = Replace(texto, "-", "_")
    texto = Replace(texto, ChrW$(225), "a")
    texto = Replace(texto, ChrW$(227), "a")
    texto = Replace(texto, ChrW$(226), "a")
    texto = Replace(texto, ChrW$(231), "c")
    texto = Replace(texto, ChrW$(233), "e")
    texto = Replace(texto, ChrW$(234), "e")
    texto = Replace(texto, ChrW$(237), "i")
    texto = Replace(texto, ChrW$(243), "o")
    texto = Replace(texto, ChrW$(245), "o")
    texto = Replace(texto, ChrW$(244), "o")
    texto = Replace(texto, ChrW$(250), "u")
    IdTexto = texto
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function

Private Function ValorSim(ByVal valor As Variant) As Boolean
    Dim texto As String
    texto = UCase$(Trim$(CStr(valor)))
    ValorSim = (texto = "SIM" Or texto = "TRUE" Or texto = "VERDADEIRO" Or texto = "1")
End Function

Private Function PlanilhaExiste(ByVal nome As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    PlanilhaExiste = Not ws Is Nothing
    On Error GoTo 0
End Function

Private Function GarantirPlanilha(ByVal nome As String) As Worksheet
    If PlanilhaExiste(nome) Then
        Set GarantirPlanilha = ThisWorkbook.Worksheets(nome)
    Else
        Set GarantirPlanilha = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        GarantirPlanilha.Name = nome
    End If
End Function

Private Sub AdicionarLinhaDetalhe(ByRef texto As String, ByVal rotulo As String, ByVal valor As Variant)
    Dim conteudo As String
    conteudo = Trim$(CStr(valor))
    If Len(conteudo) > 0 Then texto = texto & rotulo & ": " & conteudo & vbCrLf
End Sub





