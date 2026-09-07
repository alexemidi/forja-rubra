Attribute VB_Name = "modRegrasT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_BASE_EFEITOS As String = "Base_Efeitos"
Private Const PLANILHA_BASE_PROFICIENCIAS As String = "Base_Proficiencias"
Private Const PLANILHA_EFEITOS_ATIVOS As String = "Efeitos_Ativos"
Private Const PLANILHA_ESCOLHAS_ATIVAS As String = "Escolhas_Ativas"
Private Const CELULA_CLASSE As String = "F2"
Private Const CELULA_RACA As String = "B2"
Private Const PRIMEIRA_LINHA_PERICIA As Long = 4
Private Const PRIMEIRA_LINHA_TREINO As Long = 2

Public Sub AtualizarEfeitosAtivos()
    Dim wsA As Worksheet
    Dim proximaLinha As Long

    On Error GoTo TrataErro
    Set wsA = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
    GarantirCabecalhoAtivos wsA
    LimparAtivos wsA

    proximaLinha = 2
    AplicarProficienciasAtivas wsA, proximaLinha
    AplicarEfeitosBase wsA, proximaLinha

    AplicarEscolhasEspeciaisRaca wsA, proximaLinha
    modPoderesT20.AplicarEfeitosPoderesSelecionados wsA, proximaLinha
    AtualizarTextoProficiencias wsA
    AtualizarBonusPericiasPrincipal
    modPoderesT20.AtualizarDicasPericiasPoderesClasse
    modEstadoExcelT20.SolicitarRecalculo
    Exit Sub

TrataErro:
    Debug.Print "AtualizarEfeitosAtivos: " & Err.Description
End Sub

Private Sub EscreverListaProficiencias(ByVal ws As Worksheet, ByVal itens As Variant)
    Dim i As Long
    Dim destino As Long
    Dim textoRestante As String

    ws.Range("G17:G19").ClearContents
    For i = LBound(itens) To UBound(itens)
        If i - LBound(itens) < 2 Then
            destino = 17 + (i - LBound(itens))
            ws.Cells(destino, 7).Value = CStr(itens(i))
        Else
            If Len(textoRestante) > 0 Then textoRestante = textoRestante & ", "
            textoRestante = textoRestante & CStr(itens(i))
        End If
    Next i
    If Len(textoRestante) > 0 Then ws.Range("G19").Value = textoRestante
End Sub

Public Function AplicarAtributosRacaSelecionada(ByVal raca As String, ByRef total() As Long) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim opcoes As Collection
    Dim escolha As String
    Dim escolhaChave As String
    Dim pos As Long
    Dim atributo As String

    On Error GoTo TrataErro
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_EFEITOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    Set opcoes = New Collection

    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, "Raca") And MesmoTexto(ws.Cells(r, 2).Value, raca) Then
            If MesmoTexto(ws.Cells(r, 5).Value, "bonus_atributo") Then
                escolhaChave = Trim$(CStr(ws.Cells(r, 17).Value))
                If Len(escolhaChave) > 0 Then AdicionarUnico opcoes, CStr(ws.Cells(r, 18).Value)
            End If
        End If
    Next r

    If opcoes.Count = 0 Then Exit Function

    escolha = EscolherOpcaoFormulario("Raca: " & raca & vbCrLf & "Escolha a linhagem.", opcoes)
    If Len(escolha) = 0 Then escolha = ValorEscolha(escolhaChave)
    If Len(escolha) = 0 Then escolha = CStr(opcoes(1))
    DefinirEscolha escolhaChave, escolha

    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 1).Value, "Raca") And MesmoTexto(ws.Cells(r, 2).Value, raca) Then
            If MesmoTexto(ws.Cells(r, 5).Value, "bonus_atributo") Then
                If MesmoTexto(ws.Cells(r, 17).Value, escolhaChave) And MesmoTexto(ws.Cells(r, 18).Value, escolha) Then
                    atributo = CStr(ws.Cells(r, 12).Value)
                    pos = PosicaoAtributoLocal(atributo)
                    If pos > 0 Then total(pos) = total(pos) + CLng(Val(CStr(ws.Cells(r, 9).Value)))
                End If
            End If
        End If
    Next r

    AplicarAtributosRacaSelecionada = True
    Exit Function

TrataErro:
    AplicarAtributosRacaSelecionada = False
End Function

' BEGIN CODEX_T20_COMPLEX_RACE_ATTRS
Public Function AplicarAtributosComplexosRaca(ByVal raca As String, ByRef total() As Long) As Boolean
    If MesmoTexto(raca, "Duende") Then
        AplicarAtributosDuende total
        AplicarAtributosComplexosRaca = True
    ElseIf MesmoTexto(raca, "Golem Desperto") Then
        AplicarAtributosGolemDesperto total
        AplicarAtributosComplexosRaca = True
    ElseIf MesmoTexto(raca, "Moreau") Then
        AplicarAtributosMoreau total
        AplicarAtributosComplexosRaca = True
    ElseIf MesmoTexto(raca, "Nagah") Then
        AplicarAtributosNagah total
        AplicarAtributosComplexosRaca = True
    End If
End Function

Private Sub AplicarAtributosDuende(ByRef total() As Long)
    Dim natureza As String
    Dim tamanho As String
    Dim atributoNatureza As String
    Dim dons As Collection
    Dim item As Variant

    Set dons = GarantirEscolhasAtributosRaca("Raca_Duende_Dom_", "Raca: Duende" & vbCrLf & "Dons: escolha o atributo.", AtributosTodos(), 2, False)
    For Each item In dons
        AplicarAtributoTotal total, CStr(item), 1
    Next item

    natureza = GarantirEscolhaRaca("Raca_Duende_Natureza", "Raca: Duende" & vbCrLf & "Escolha a Natureza.", CriarListaOpcoes("Animal", "Vegetal", "Mineral"))
    If MesmoTexto(natureza, "Animal") Then
        atributoNatureza = GarantirEscolhaAtributoRaca("Raca_Duende_Natureza_Atributo", "Raca: Duende" & vbCrLf & "Natureza Animal: escolha o atributo +1.", AtributosTodos())
        AplicarAtributoTotal total, atributoNatureza, 1
    End If

    tamanho = GarantirEscolhaRaca("Raca_Duende_Tamanho", "Raca: Duende" & vbCrLf & "Escolha o Tamanho.", CriarListaOpcoes(NomeMinusculo(), "Pequeno", NomeMedio(), "Grande"))
    If MesmoTexto(tamanho, NomeMinusculo()) Then
        AplicarAtributoTotal total, "FOR", -1
    ElseIf MesmoTexto(tamanho, "Grande") Then
        AplicarAtributoTotal total, "DES", -1
    End If

End Sub

Private Sub AplicarAtributosGolemDesperto(ByRef total() As Long)
    Dim chassi As String
    Dim tamanho As String
    Dim flex As Collection
    Dim item As Variant

    chassi = GarantirEscolhaRaca("Raca_GolemDesperto_Chassi", "Raca: Golem Desperto" & vbCrLf & "Escolha o Chassi.", CriarListaOpcoes("Barro", "Bronze", "Carne", "Espelhos", "Ferro", "Gelo Eterno", "Pedra", "Sucata"))

    If MesmoTexto(chassi, "Barro") Then
        AplicarAtributoTotal total, "CON", 2
    ElseIf MesmoTexto(chassi, "Bronze") Then
        Set flex = GarantirEscolhasAtributosRaca("Raca_GolemDesperto_Bronze_Atributo_", "Raca: Golem Desperto" & vbCrLf & "Chassi Bronze: escolha o atributo.", AtributosTodos(), 2, False)
        For Each item In flex
            AplicarAtributoTotal total, CStr(item), 1
        Next item
    ElseIf MesmoTexto(chassi, "Carne") Then
        AplicarAtributoTotal total, "CON", 2
        AplicarAtributoTotal total, "FOR", 1
        AplicarAtributoTotal total, "CAR", -1
    ElseIf MesmoTexto(chassi, "Espelhos") Then
        AplicarAtributoTotal total, "CAR", 2
        AplicarAtributoTotal total, "SAB", 1
        AplicarAtributoTotal total, "CON", -1
    ElseIf MesmoTexto(chassi, "Ferro") Then
        AplicarAtributoTotal total, "FOR", 1
        AplicarAtributoTotal total, "CON", 1
    ElseIf MesmoTexto(chassi, "Gelo Eterno") Then
        AplicarAtributoTotal total, "CON", 2
    ElseIf MesmoTexto(chassi, "Pedra") Then
        AplicarAtributoTotal total, "CON", 2
    ElseIf MesmoTexto(chassi, "Sucata") Then
        AplicarAtributoTotal total, "FOR", 1
        AplicarAtributoTotal total, "CON", 1
    End If

    tamanho = GarantirEscolhaRaca("Raca_GolemDesperto_Tamanho", "Raca: Golem Desperto" & vbCrLf & "Escolha o Tamanho.", CriarListaOpcoes("Pequeno", NomeMedio(), "Grande"))
    If MesmoTexto(tamanho, "Pequeno") Then
        AplicarAtributoTotal total, "DES", 1
    ElseIf MesmoTexto(tamanho, "Grande") Then
        AplicarAtributoTotal total, "DES", -1
    End If
End Sub

Private Sub AplicarAtributosMoreau(ByRef total() As Long)
    Dim heranca As String
    Dim flex As Collection
    Dim item As Variant

    heranca = GarantirEscolhaRaca("Raca_Moreau_Heranca", "Raca: Moreau" & vbCrLf & "Escolha a Heranca.", CriarListaOpcoes("Coruja", "Hiena", "Raposa", "Serpente", "Bufalo", "Coelho", "Crocodilo", "Gato", "Leao", "Lobo", "Morcego", "Urso"))

    If MesmoTexto(heranca, "Coruja") Or MesmoTexto(heranca, "Hiena") Then
        AplicarAtributoTotal total, "SAB", 1
    ElseIf MesmoTexto(heranca, "Raposa") Or MesmoTexto(heranca, "Serpente") Then
        AplicarAtributoTotal total, "INT", 1
    ElseIf MesmoTexto(heranca, "Bufalo") Or MesmoTexto(heranca, "Leao") Then
        AplicarAtributoTotal total, "FOR", 1
    ElseIf MesmoTexto(heranca, "Coelho") Or MesmoTexto(heranca, "Morcego") Then
        AplicarAtributoTotal total, "DES", 1
    ElseIf MesmoTexto(heranca, "Crocodilo") Or MesmoTexto(heranca, "Urso") Then
        AplicarAtributoTotal total, "CON", 1
    ElseIf MesmoTexto(heranca, "Gato") Or MesmoTexto(heranca, "Lobo") Then
        AplicarAtributoTotal total, "CAR", 1
    End If

    Set flex = GarantirEscolhasAtributosRaca("Raca_Moreau_Atributo_", "Raca: Moreau" & vbCrLf & "Escolha o atributo flexivel.", AtributosTodos(), 2, False)
    For Each item In flex
        AplicarAtributoTotal total, CStr(item), 1
    Next item
End Sub

Private Sub AplicarAtributosNagah(ByRef total() As Long)
    Dim sexo As String
    sexo = GarantirEscolhaRaca("Raca_Nagah_Sexo", "Raca: Nagah" & vbCrLf & "Escolha o sexo.", CriarListaOpcoes("Macho", "Femea"))
    If MesmoTexto(sexo, "Macho") Then
        AplicarAtributoTotal total, "FOR", 1
        AplicarAtributoTotal total, "DES", 1
        AplicarAtributoTotal total, "CON", 1
    ElseIf MesmoTexto(sexo, "Femea") Then
        AplicarAtributoTotal total, "INT", 1
        AplicarAtributoTotal total, "SAB", 1
        AplicarAtributoTotal total, "CAR", 1
    End If
End Sub

Private Function GarantirEscolhaRaca(ByVal chave As String, ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim escolha As String
    escolha = ValorEscolha(chave)
    If Len(escolha) = 0 Or Not Contem(opcoes, escolha) Then
        escolha = EscolherOpcaoFormulario(titulo, opcoes)
        If Len(escolha) > 0 Then DefinirEscolha chave, escolha
    End If
    GarantirEscolhaRaca = escolha
End Function

Private Function GarantirEscolhaAtributoRaca(ByVal chave As String, ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim escolha As String
    escolha = ValorEscolha(chave)
    If Len(escolha) = 0 Or Not Contem(opcoes, escolha) Then
        escolha = EscolherAtributoFormularioRaca(titulo, opcoes)
        If Len(escolha) > 0 Then DefinirEscolha chave, escolha
    End If
    GarantirEscolhaAtributoRaca = escolha
End Function

Private Function GarantirEscolhasAtributosRaca(ByVal prefixoChave As String, ByVal titulo As String, ByVal permitidos As Collection, ByVal quantidade As Long, ByVal permitirRepetir As Boolean) As Collection
    Dim escolhidos As Collection
    Dim usados As Collection
    Dim disponiveis As Collection
    Dim escolha As String
    Dim i As Long

    Set escolhidos = New Collection
    Set usados = New Collection

    For i = 1 To quantidade
        escolha = ValorEscolha(prefixoChave & CStr(i))
        If Len(escolha) > 0 And (permitirRepetir Or Not Contem(usados, escolha)) And Contem(permitidos, escolha) Then
            escolhidos.Add escolha
            If Not permitirRepetir Then usados.Add escolha
        Else
            Set disponiveis = OpcoesSemUsados(permitidos, usados)
            If disponiveis.Count = 0 Then Exit For
            escolha = EscolherAtributoFormularioRaca(titulo & " (" & i & " de " & quantidade & ")", disponiveis)
            If Len(escolha) = 0 Then Exit For
            DefinirEscolha prefixoChave & CStr(i), escolha
            escolhidos.Add escolha
            If Not permitirRepetir Then usados.Add escolha
        End If
    Next i

    Set GarantirEscolhasAtributosRaca = escolhidos
End Function

Private Function EscolherAtributoFormularioRaca(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, True
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherAtributoFormularioRaca = formulario.escolha
    Unload formulario
End Function

Private Function AtributosTodos() As Collection
    Set AtributosTodos = CriarListaOpcoes("FOR", "DES", "CON", "INT", "SAB", "CAR")
End Function

Private Function OpcoesSemUsados(ByVal opcoes As Collection, ByVal usados As Collection) As Collection
    Dim lista As Collection
    Dim item As Variant
    Set lista = New Collection
    For Each item In opcoes
        If Not Contem(usados, CStr(item)) Then lista.Add CStr(item)
    Next item
    Set OpcoesSemUsados = lista
End Function

Private Sub AplicarAtributoTotal(ByRef total() As Long, ByVal atributo As String, ByVal valor As Long)
    Dim pos As Long
    pos = PosicaoAtributoLocal(atributo)
    If pos > 0 Then total(pos) = total(pos) + valor
End Sub

Private Function CriarListaOpcoes(ParamArray itens() As Variant) As Collection
    Dim lista As Collection
    Dim i As Long
    Set lista = New Collection
    For i = LBound(itens) To UBound(itens)
        AdicionarUnico lista, CStr(itens(i))
    Next i
    Set CriarListaOpcoes = lista
End Function

Private Function NomeMinusculo() As String
    NomeMinusculo = "Min" & ChrW$(250) & "sculo"
End Function

Private Function NomeMedio() As String
    NomeMedio = "M" & ChrW$(233) & "dio"
End Function
' END CODEX_T20_COMPLEX_RACE_ATTRS
Public Function FormulaBonusPericiaPrincipal(ByVal linhaPrincipal As Long) As String
    Dim aspas As String
    Dim baseExpr As String
    Dim exactSum As String
    Dim baseSum As String

    aspas = Chr$(34)
    baseExpr = "LEFT(I" & linhaPrincipal & ",IFERROR(FIND(" & aspas & " (" & aspas & ",I" & linhaPrincipal & ")-1,LEN(I" & linhaPrincipal & ")))"
    exactSum = "IFERROR(SUMIFS(Efeitos_Ativos!$H$2:$H$500,Efeitos_Ativos!$D$2:$D$500," & aspas & "bonus_pericia" & aspas & ",Efeitos_Ativos!$G$2:$G$500,I" & linhaPrincipal & "),0)"
    baseSum = "IFERROR(SUMIFS(Efeitos_Ativos!$H$2:$H$500,Efeitos_Ativos!$D$2:$D$500," & aspas & "bonus_pericia" & aspas & ",Efeitos_Ativos!$G$2:$G$500," & baseExpr & "),0)"

    FormulaBonusPericiaPrincipal = "=IF(" & baseExpr & "=I" & linhaPrincipal & "," & exactSum & "," & exactSum & "+" & baseSum & ")"
End Function

Public Function FormulaTotalPericiaPrincipal(ByVal linhaPrincipal As Long, ByVal linhaTreino As Long) As String
    Dim aspas As String
    Dim formulaErro As String

    aspas = Chr$(34)
    formulaErro = aspas & ChrW$(&H274C) & aspas
    FormulaTotalPericiaPrincipal = "=IF(AND(UPPER(Treino_Pericias!C" & linhaTreino & ")=""SIM"",L" & linhaPrincipal & "=FALSE)," & formulaErro & ",IFERROR(INDEX($A$6:$F$6,1,MATCH(J" & linhaPrincipal & ",{""FOR"";""DES"";""CON"";""INT"";""SAB"";""CAR""},0)),0)+IFERROR(M" & linhaPrincipal & ",0)+IFERROR(Treino_Pericias!A" & linhaTreino & ",0)+IFERROR(Treino_Pericias!B" & linhaTreino & ",0)-IF(AND(UPPER(Treino_Pericias!D" & linhaTreino & ")=""SIM"",COUNTIFS(Efeitos_Ativos!$D$2:$D$500,""proficiencia"",Efeitos_Ativos!$E$2:$E$500,""Armadura"")=0),IFERROR(modInventarioT20.PenalidadeArmaduraAtiva(),0),0))"
End Function

Public Sub AtualizarBonusPericiasPrincipal()
    Dim wsP As Worksheet
    Dim wsB As Worksheet
    Dim ultimaLinha As Long
    Dim linhaPrincipal As Long
    Dim linhaTreino As Long
    Dim classe As String
    Dim raca As String
    Dim nivel As Long
    Dim pericia As String
    Dim obs As String

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsB = ThisWorkbook.Worksheets(PLANILHA_BASE_EFEITOS)
    classe = Trim$(CStr(wsP.Range(CELULA_CLASSE).Value))
    raca = Trim$(CStr(wsP.Range(CELULA_RACA).Value))
    nivel = NivelPersonagem()
    ultimaLinha = modLayoutT20.UltimaLinhaPericia()

    For linhaPrincipal = PRIMEIRA_LINHA_PERICIA To ultimaLinha
        linhaTreino = PRIMEIRA_LINHA_TREINO + (linhaPrincipal - PRIMEIRA_LINHA_PERICIA)
        pericia = NomeBasePericiaPrincipal(CStr(wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_NOME).Value))
        wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TOTAL).Formula = FormulaTotalPericiaPrincipal(linhaPrincipal, linhaTreino)
        wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_BONUS).Formula = FormulaBonusPericiaPrincipal(linhaPrincipal)
        obs = ObservacoesCondicionaisPericia(wsB, pericia, classe, raca, nivel)
        wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_OBS).Value = JuntarObservacoes(obs, ObservacoesAtivasCondicionaisPericia(pericia))
    Next linhaPrincipal
End Sub

Private Function ObservacoesAtivasCondicionaisPericia(ByVal pericia As String) As String
    Dim wsA As Worksheet
    Dim dict As Object
    Dim ultimaLinha As Long
    Dim r As Long
    Dim obs As String

    If Not PlanilhaExisteLocal(PLANILHA_EFEITOS_ATIVOS) Then Exit Function
    Set dict = CreateObject("Scripting.Dictionary")
    Set wsA = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
    ultimaLinha = wsA.Cells(wsA.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(wsA.Cells(r, 4).Value, "bonus_pericia_condicional") Then
            If MesmoTexto(wsA.Cells(r, 7).Value, pericia) Then
                obs = Trim$(CStr(wsA.Cells(r, 9).Value))
                If Len(obs) > 0 Then
                    If Not dict.Exists(obs) Then dict.Add obs, True
                End If
            End If
        End If
    Next r
    If dict.Count > 0 Then ObservacoesAtivasCondicionaisPericia = Join(dict.Keys, "; ")
End Function

Private Function JuntarObservacoes(ByVal esquerda As String, ByVal direita As String) As String
    esquerda = Trim$(esquerda)
    direita = Trim$(direita)
    If Len(esquerda) = 0 Then
        JuntarObservacoes = direita
    ElseIf Len(direita) = 0 Then
        JuntarObservacoes = esquerda
    Else
        JuntarObservacoes = esquerda & "; " & direita
    End If
End Function

Private Function ObservacoesCondicionaisPericia(ByVal wsB As Worksheet, ByVal pericia As String, ByVal classe As String, ByVal raca As String, ByVal nivel As Long) As String
    Dim dict As Object
    Dim ultimaLinha As Long
    Dim r As Long
    Dim condicao As String
    Dim obs As String
    Dim nivelMinimo As Long

    Set dict = CreateObject("Scripting.Dictionary")
    ultimaLinha = wsB.Cells(wsB.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If OrigemAtual(wsB.Cells(r, 1).Value, wsB.Cells(r, 2).Value, classe, raca) Then
            If MesmoTexto(wsB.Cells(r, 5).Value, "bonus_pericia") Then
                If MesmoTexto(wsB.Cells(r, 8).Value, pericia) Then
                    condicao = Trim$(CStr(wsB.Cells(r, 16).Value))
                    If Len(condicao) > 0 Then
                        nivelMinimo = CLng(Val(CStr(wsB.Cells(r, 15).Value)))
                        If nivelMinimo <= 0 Or nivel >= nivelMinimo Then
                            If EscolhaPermiteObservacao(CStr(wsB.Cells(r, 17).Value), CStr(wsB.Cells(r, 18).Value)) Then
                                obs = TextoObservacaoBonus(wsB, r)
                                If Len(obs) > 0 Then
                                    If Not dict.Exists(obs) Then dict.Add obs, True
                                End If
                            End If
                        End If
                    End If
                End If
            End If
        End If
    Next r

    If dict.Count > 0 Then ObservacoesCondicionaisPericia = Join(dict.Keys, "; ")
End Function

Private Function TextoObservacaoBonus(ByVal ws As Worksheet, ByVal linha As Long) As String
    Dim valor As Double
    Dim condicao As String

    valor = Val(CStr(ws.Cells(linha, 9).Value))
    condicao = CondicaoLegivel(CStr(ws.Cells(linha, 16).Value))
    If valor > 0 Then
        TextoObservacaoBonus = "+" & NumeroLegivel(valor) & " em " & condicao
    ElseIf valor < 0 Then
        TextoObservacaoBonus = NumeroLegivel(valor) & " em " & condicao
    Else
        TextoObservacaoBonus = condicao
    End If
End Function

Private Function NumeroLegivel(ByVal valor As Double) As String
    If Abs(valor - Fix(valor)) < 0.000001 Then
        NumeroLegivel = CStr(CLng(valor))
    Else
        NumeroLegivel = CStr(valor)
    End If
End Function

Private Function CondicaoLegivel(ByVal condicao As String) As String
    condicao = LCase$(Trim$(condicao))
    Select Case condicao
        Case "subterraneo"
            CondicaoLegivel = "subterr" & ChrW$(&HE2) & "neo"
        Case "usando_ferramenta_necessaria"
            CondicaoLegivel = "usando ferramenta necess" & ChrW$(&HE1) & "ria"
        Case Else
            CondicaoLegivel = Replace(condicao, "_", " ")
    End Select
End Function

Private Function EscolhaPermiteObservacao(ByVal escolhaChave As String, ByVal escolhaValor As String) As Boolean
    escolhaChave = Trim$(escolhaChave)
    escolhaValor = Trim$(escolhaValor)
    If Len(escolhaChave) = 0 Then
        EscolhaPermiteObservacao = True
    Else
        EscolhaPermiteObservacao = MesmoTexto(ValorEscolha(escolhaChave), escolhaValor)
    End If
End Function

Private Sub AplicarEscolhasEspeciaisRaca(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim raca As String
    raca = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range(CELULA_RACA).Value))

    If MesmoTexto(raca, "Kliren") Then AplicarVanguardistaKliren wsA, proximaLinha
    If MesmoTexto(raca, "Moreau") Then AplicarEfeitosMoreau wsA, proximaLinha
    If MesmoTexto(raca, "Golem") Then AplicarEfeitosGolem wsA, proximaLinha
    If MesmoTexto(raca, "Golem Desperto") Then AplicarEfeitosGolemDesperto wsA, proximaLinha
End Sub

' BEGIN CODEX_T20_COMPLEX_RACE_EFFECTS
Private Sub AplicarEfeitosMoreau(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim heranca As String
    heranca = ValorEscolha("Raca_Moreau_Heranca")
    If Len(heranca) = 0 Then Exit Sub

    If MesmoTexto(heranca, "Coruja") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca da Coruja", NomePericia("percepcao"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca da Coruja", NomePericia("vontade"), 2
    ElseIf MesmoTexto(heranca, "Serpente") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca da Serpente", NomePericia("furtividade"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca da Serpente", NomePericia("diplomacia"), 2
    ElseIf MesmoTexto(heranca, "Coelho") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Coelho", NomePericia("percepcao"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Coelho", NomePericia("reflexos"), 2
    ElseIf MesmoTexto(heranca, "Crocodilo") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Crocodilo", NomePericia("furtividade"), 2
        AdicionarAtivo wsA, proximaLinha, "Raca", "Moreau", "Heranca do Crocodilo", "bonus_defesa", "Defesa", "defesa", "Defesa", 1, "+1 Defesa da heranca do Crocodilo."
    ElseIf MesmoTexto(heranca, "Gato") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Gato", NomePericia("furtividade"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Gato", NomePericia("percepcao"), 2
    ElseIf MesmoTexto(heranca, "Leao") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Leao", NomePericia("intimidacao"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Leao", NomePericia("percepcao"), 2
    ElseIf MesmoTexto(heranca, "Morcego") Then
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Morcego", NomePericia("furtividade"), 2
        AdicionarBonusPericiaRaca wsA, proximaLinha, "Moreau", "Heranca do Morcego", NomePericia("percepcao"), 2
    End If
End Sub

Private Sub AplicarEfeitosGolem(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    AdicionarAtivo wsA, proximaLinha, "Raca", "Golem", "Chassi", "bonus_defesa", "Defesa", "defesa", "Defesa", 2, "+2 Defesa do chassi."
End Sub

Private Sub AplicarEfeitosGolemDesperto(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim chassi As String
    chassi = ValorEscolha("Raca_GolemDesperto_Chassi")
    If MesmoTexto(chassi, "Ferro") Then
        AdicionarAtivo wsA, proximaLinha, "Raca", "Golem Desperto", "Chassi Ferro", "bonus_defesa", "Defesa", "defesa", "Defesa", 2, "+2 Defesa do chassi Ferro."
    End If
End Sub

Private Sub AdicionarBonusPericiaRaca(ByVal wsA As Worksheet, ByRef proximaLinha As Long, ByVal raca As String, ByVal fonte As String, ByVal pericia As String, ByVal valor As Double)
    AdicionarAtivo wsA, proximaLinha, "Raca", raca, fonte, "bonus_pericia", "Pericia", IdPericia(pericia), pericia, valor, fonte & ": " & IIf(valor >= 0, "+", "") & CStr(valor) & " em " & pericia & "."
End Sub

Private Function NomePericia(ByVal id As String) As String
    Select Case LCase$(Trim$(id))
        Case "adestramento": NomePericia = "Adestramento"
        Case "atuacao": NomePericia = "Atua" & ChrW$(231) & ChrW$(227) & "o"
        Case "diplomacia": NomePericia = "Diplomacia"
        Case "enganacao": NomePericia = "Engana" & ChrW$(231) & ChrW$(227) & "o"
        Case "furtividade": NomePericia = "Furtividade"
        Case "intimidacao": NomePericia = "Intimida" & ChrW$(231) & ChrW$(227) & "o"
        Case "investigacao": NomePericia = "Investiga" & ChrW$(231) & ChrW$(227) & "o"
        Case "percepcao": NomePericia = "Percep" & ChrW$(231) & ChrW$(227) & "o"
        Case "reflexos": NomePericia = "Reflexos"
        Case "sobrevivencia": NomePericia = "Sobreviv" & ChrW$(234) & "ncia"
        Case "vontade": NomePericia = "Vontade"
        Case Else: NomePericia = id
    End Select
End Function

Private Function IdPericia(ByVal pericia As String) As String
    Dim texto As String
    texto = LCase$(Trim$(pericia))
    texto = Replace(texto, " ", "_")
    texto = Replace(texto, ChrW$(225), "a")
    texto = Replace(texto, ChrW$(227), "a")
    texto = Replace(texto, ChrW$(231), "c")
    texto = Replace(texto, ChrW$(233), "e")
    texto = Replace(texto, ChrW$(234), "e")
    texto = Replace(texto, ChrW$(237), "i")
    texto = Replace(texto, ChrW$(243), "o")
    texto = Replace(texto, ChrW$(245), "o")
    texto = Replace(texto, ChrW$(250), "u")
    IdPericia = texto
End Function
' END CODEX_T20_COMPLEX_RACE_EFFECTS
Private Sub AplicarVanguardistaKliren(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim escolha As String
    Dim opcoes As Collection
    Dim linhaPrincipal As Long

    escolha = ValorEscolha("Raca_Kliren_Vanguardista_Oficio")
    If Len(escolha) = 0 Then
        Set opcoes = OficiosParaEscolha()
        If opcoes.Count = 0 Then Exit Sub
        escolha = EscolherOpcaoFormulario("Raca: Kliren" & vbCrLf & "Vanguardista: escolha o Oficio que recebe +2.", opcoes)
        If Len(escolha) = 0 Then Exit Sub
        DefinirEscolha "Raca_Kliren_Vanguardista_Oficio", escolha
    End If

    linhaPrincipal = GarantirLinhaOficioEscolhido(escolha)
    If linhaPrincipal > 0 Then
        AdicionarAtivo wsA, proximaLinha, "Raca", "Kliren", "Vanguardista", "bonus_pericia", "Pericia", IdOficio(escolha), escolha, 2, "Vanguardista: +2 no Oficio escolhido."
    End If
End Sub

Private Function OficiosParaEscolha() As Collection
    Dim lista As Collection
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim oficio As String

    Set lista = New Collection
    Set ws = ThisWorkbook.Worksheets("Dados")
    ultimaLinha = ws.Cells(ws.Rows.Count, 5).End(xlUp).Row

    For r = 2 To ultimaLinha
        oficio = Trim$(CStr(ws.Cells(r, 5).Value))
        If Len(oficio) > 0 Then AdicionarUnico lista, oficio
    Next r

    Set OficiosParaEscolha = lista
End Function

Private Function GarantirLinhaOficioEscolhido(ByVal oficio As String) As Long
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim r As Long
    Dim linhaTreino As Long
    Dim linhaModelo As Long
    Dim linhaNova As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets("Treino_Pericias")

    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericiaPrincipalLocal()
        If StrComp(Trim$(CStr(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value)), oficio, vbTextCompare) = 0 Then
            GarantirLinhaOficioEscolhido = r
            Exit Function
        End If
    Next r

    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericiaPrincipalLocal()
        If EhOficioLocal(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            linhaTreino = LinhaTreinoPorLinhaPrincipalLocal(r)
            If EhOficioVazioLocal(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) And Not LinhaTemFonteTreinoLocal(linhaTreino) Then
                wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value = oficio
                ConfigurarLinhaOficioBonus r
                GarantirLinhaOficioEscolhido = r
                Exit Function
            End If
        End If
    Next r

    linhaModelo = UltimaLinhaOficioLocal()
    If linhaModelo = 0 Then linhaModelo = 21
    linhaNova = linhaModelo + 1
    linhaTreino = LinhaTreinoPorLinhaPrincipalLocal(linhaNova)

    wsT.Rows(linhaTreino).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove
    wsP.Range(wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_OBS)).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove
    wsP.Range(wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_NOME), wsP.Cells(linhaModelo, modLayoutT20.COL_PERICIA_OBS)).Copy
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormats
    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).PasteSpecial xlPasteFormulas
    Application.CutCopyMode = False

    wsP.Cells(linhaNova, modLayoutT20.COL_PERICIA_NOME).Value = oficio
    ConfigurarLinhaOficioBonus linhaNova
    GarantirLinhaOficioEscolhido = linhaNova
End Function

Private Sub ConfigurarLinhaOficioBonus(ByVal linhaPrincipal As Long)
    Dim wsP As Worksheet
    Dim wsT As Worksheet
    Dim linhaTreino As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsT = ThisWorkbook.Worksheets("Treino_Pericias")
    linhaTreino = LinhaTreinoPorLinhaPrincipalLocal(linhaPrincipal)

    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_ATRIBUTO).Value = "INT"
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TOTAL).Formula = FormulaTotalPericiaPrincipal(linhaPrincipal, linhaTreino)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_TREINO).Formula = "=Treino_Pericias!M" & linhaTreino
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_BONUS).Formula = FormulaBonusPericiaPrincipal(linhaPrincipal)
    wsP.Cells(linhaPrincipal, modLayoutT20.COL_PERICIA_OBS).ClearContents

    wsT.Cells(linhaTreino, 1).Formula = "=INT(Principal!$F$1/2)"
    wsT.Cells(linhaTreino, 2).Formula = "=IF(Principal!L" & linhaPrincipal & ",2,0)"
    wsT.Cells(linhaTreino, 3).Value = "SIM"
    wsT.Cells(linhaTreino, 4).Value = "NAO"
    wsT.Range(wsT.Cells(linhaTreino, 5), wsT.Cells(linhaTreino, 12)).Value = False
    wsT.Cells(linhaTreino, 13).Formula = "=OR(E" & linhaTreino & ":L" & linhaTreino & ",N" & linhaTreino & ")"
End Sub

Private Function LinhaTemFonteTreinoLocal(ByVal linhaTreino As Long) As Boolean
    Dim ws As Worksheet
    Dim c As Long
    Set ws = ThisWorkbook.Worksheets("Treino_Pericias")
    For c = 5 To 12
        If CBool(ws.Cells(linhaTreino, c).Value) Then
            LinhaTemFonteTreinoLocal = True
            Exit Function
        End If
    Next c
End Function

Private Function UltimaLinhaOficioLocal() As Long
    Dim wsP As Worksheet
    Dim r As Long
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = UltimaLinhaPericiaPrincipalLocal() To PRIMEIRA_LINHA_PERICIA Step -1
        If EhOficioLocal(wsP.Cells(r, modLayoutT20.COL_PERICIA_NOME).Value) Then
            UltimaLinhaOficioLocal = r
            Exit Function
        End If
    Next r
End Function

Private Function UltimaLinhaPericiaPrincipalLocal() As Long
    Dim wsP As Worksheet
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    UltimaLinhaPericiaPrincipalLocal = wsP.Cells(wsP.Rows.Count, modLayoutT20.COL_PERICIA_NOME).End(xlUp).Row
    If UltimaLinhaPericiaPrincipalLocal < PRIMEIRA_LINHA_PERICIA Then UltimaLinhaPericiaPrincipalLocal = PRIMEIRA_LINHA_PERICIA
End Function

Private Function LinhaTreinoPorLinhaPrincipalLocal(ByVal linhaPrincipal As Long) As Long
    LinhaTreinoPorLinhaPrincipalLocal = PRIMEIRA_LINHA_TREINO + (linhaPrincipal - PRIMEIRA_LINHA_PERICIA)
End Function

Private Function EhOficioLocal(ByVal valor As Variant) As Boolean
    EhOficioLocal = (StrComp(Left$(Trim$(CStr(valor)), Len(NomeOficioBaseLocal())), NomeOficioBaseLocal(), vbTextCompare) = 0)
End Function

Private Function EhOficioVazioLocal(ByVal valor As Variant) As Boolean
    EhOficioVazioLocal = (StrComp(Trim$(CStr(valor)), NomeOficioVazioLocal(), vbTextCompare) = 0)
End Function

Private Function NomeOficioBaseLocal() As String
    NomeOficioBaseLocal = "Of" & ChrW$(237) & "cio"
End Function

Private Function NomeOficioVazioLocal() As String
    NomeOficioVazioLocal = NomeOficioBaseLocal() & " ( )"
End Function

Private Function IdOficio(ByVal oficio As String) As String
    Dim texto As String
    texto = LCase$(oficio)
    texto = Replace(texto, " ", "_")
    texto = Replace(texto, "(", "")
    texto = Replace(texto, ")", "")
    texto = Replace(texto, ChrW$(237), "i")
    IdOficio = texto
End Function

Private Sub GarantirCabecalhoAtivos(ByVal ws As Worksheet)
    ws.Range("A1:I1").Value = Array("OrigemTipo", "OrigemNome", "FonteNome", "TipoEfeito", "GrupoOuAlvoTipo", "AlvoId", "AlvoNome", "Valor", "Observacao")
    ws.Rows(1).Font.Bold = True
End Sub

Private Sub LimparAtivos(ByVal ws As Worksheet)
    Dim ultimaLinha As Long
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If ultimaLinha >= 2 Then ws.Range(ws.Rows(2), ws.Rows(ultimaLinha)).ClearContents
End Sub

Private Sub AplicarProficienciasAtivas(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim wsP As Worksheet
    Dim wsB As Worksheet
    Dim classe As String
    Dim raca As String
    Dim ultimaLinha As Long
    Dim r As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsB = ThisWorkbook.Worksheets(PLANILHA_BASE_PROFICIENCIAS)
    classe = Trim$(CStr(wsP.Range(CELULA_CLASSE).Value))
    raca = Trim$(CStr(wsP.Range(CELULA_RACA).Value))
    ultimaLinha = wsB.Cells(wsB.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If OrigemAtual(wsB.Cells(r, 1).Value, wsB.Cells(r, 2).Value, classe, raca) Then
            If PodeAtivar(wsB.Cells(r, 9).Value, CStr(wsB.Cells(r, 6).Value), CStr(wsB.Cells(r, 7).Value), CStr(wsB.Cells(r, 8).Value)) Then
                AdicionarAtivo wsA, proximaLinha, CStr(wsB.Cells(r, 1).Value), CStr(wsB.Cells(r, 2).Value), CStr(wsB.Cells(r, 11).Value), "proficiencia", CStr(wsB.Cells(r, 3).Value), CStr(wsB.Cells(r, 4).Value), CStr(wsB.Cells(r, 5).Value), 1, CStr(wsB.Cells(r, 12).Value)
            End If
        End If
    Next r
End Sub

Private Sub AplicarEfeitosBase(ByVal wsA As Worksheet, ByRef proximaLinha As Long)
    Dim wsP As Worksheet
    Dim wsB As Worksheet
    Dim classe As String
    Dim raca As String
    Dim nivel As Long
    Dim ultimaLinha As Long
    Dim r As Long
    Dim valor As Double
    Dim tipo As String
    Dim nivelMinimo As Long

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Set wsB = ThisWorkbook.Worksheets(PLANILHA_BASE_EFEITOS)
    classe = Trim$(CStr(wsP.Range(CELULA_CLASSE).Value))
    raca = Trim$(CStr(wsP.Range(CELULA_RACA).Value))
    nivel = NivelPersonagem()
    ultimaLinha = wsB.Cells(wsB.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If OrigemAtual(wsB.Cells(r, 1).Value, wsB.Cells(r, 2).Value, classe, raca) Then
            tipo = Trim$(CStr(wsB.Cells(r, 5).Value))
            If tipo <> "bonus_atributo" Then
                nivelMinimo = CLng(Val(CStr(wsB.Cells(r, 15).Value)))
                If nivelMinimo <= 0 Or nivel >= nivelMinimo Then
                    If PodeAtivar(wsB.Cells(r, 19).Value, CStr(wsB.Cells(r, 16).Value), CStr(wsB.Cells(r, 17).Value), CStr(wsB.Cells(r, 18).Value)) Then
                        valor = ValorCalculadoEfeito(wsB, r, nivel)
                        If valor <> 0 Or EfeitoTextualVisivel(tipo) Then
                            AdicionarAtivo wsA, proximaLinha, CStr(wsB.Cells(r, 1).Value), CStr(wsB.Cells(r, 2).Value), CStr(wsB.Cells(r, 4).Value), tipo, CStr(wsB.Cells(r, 6).Value), CStr(wsB.Cells(r, 7).Value), CStr(wsB.Cells(r, 8).Value), valor, CStr(wsB.Cells(r, 20).Value)
                        End If
                    End If
                End If
            End If
        End If
    Next r
End Sub

Private Function EfeitoTextualVisivel(ByVal tipo As String) As Boolean
    tipo = LCase$(Trim$(tipo))
    EfeitoTextualVisivel = (InStr(1, tipo, "imun", vbTextCompare) > 0 _
        Or InStr(1, tipo, "reducao", vbTextCompare) > 0 _
        Or InStr(1, tipo, "manobra", vbTextCompare) > 0 _
        Or InStr(1, tipo, "resist", vbTextCompare) > 0)
End Function

Private Function ValorCalculadoEfeito(ByVal ws As Worksheet, ByVal linha As Long, ByVal nivel As Long) As Double
    Dim modo As String
    Dim valor As Double
    Dim nivel1 As Double
    Dim apos1 As Double
    Dim atributo As String

    modo = LCase$(Trim$(CStr(ws.Cells(linha, 14).Value)))
    valor = Val(CStr(ws.Cells(linha, 9).Value))
    nivel1 = Val(CStr(ws.Cells(linha, 10).Value))
    apos1 = Val(CStr(ws.Cells(linha, 11).Value))
    atributo = Trim$(CStr(ws.Cells(linha, 12).Value))

    Select Case modo
        Case "nivel1_mais_apos1"
            ValorCalculadoEfeito = nivel1 + Application.Max(nivel - 1, 0) * apos1
        Case "por_nivel"
            ValorCalculadoEfeito = nivel * valor
        Case "nivel_impar"
            ValorCalculadoEfeito = ((nivel + 1) \ 2) * valor
        Case "atributo"
            ValorCalculadoEfeito = ValorAtributo(ResolverAtributoEfeito(ws, linha, atributo))
        Case "atributo_inicial"
            ValorCalculadoEfeito = ValorAtributoInicial(ws, linha, atributo, 1)
        Case "atributo_inicial_substitui"
            ValorCalculadoEfeito = ValorAtributoInicial(ws, linha, atributo, 2)
        Case Else
            ValorCalculadoEfeito = valor
    End Select
End Function

Private Function ValorAtributoInicial(ByVal ws As Worksheet, ByVal linha As Long, ByVal atributo As String, ByVal fator As Double) As Double
    Dim atributoResolvido As String
    Dim chave As String
    Dim armazenado As String
    Dim valorAtual As Double

    atributoResolvido = ResolverAtributoEfeito(ws, linha, atributo)
    If Len(atributoResolvido) = 0 Then Exit Function
    If fator = 0 Then fator = 1

    chave = "EfeitoInicial|" & CStr(ws.Cells(linha, 1).Value) & "|" & CStr(ws.Cells(linha, 2).Value) & "|" & CStr(ws.Cells(linha, 3).Value) & "|" & CStr(ws.Cells(linha, 5).Value) & "|" & LCase$(atributoResolvido)
    armazenado = ValorEscolha(chave)
    If Len(armazenado) > 0 Then
        ValorAtributoInicial = Val(CStr(armazenado))
        Exit Function
    End If

    valorAtual = ValorAtributo(atributoResolvido) * fator
    DefinirEscolha chave, CStr(valorAtual)
    ValorAtributoInicial = valorAtual
End Function

Private Function ResolverAtributoEfeito(ByVal ws As Worksheet, ByVal linha As Long, ByVal atributo As String) As String
    atributo = Trim$(atributo)
    If StrComp(atributo, "atributo_chave_magia", vbTextCompare) = 0 Then
        On Error Resume Next
        ResolverAtributoEfeito = modMagiasT20.AtributoChaveMagiaClasse(CStr(ws.Cells(linha, 2).Value))
        On Error GoTo 0
    Else
        ResolverAtributoEfeito = atributo
    End If
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

Private Sub AtualizarTextoProficiencias(ByVal wsA As Worksheet)
    Dim dict As Object
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nome As String

    Set dict = CreateObject("Scripting.Dictionary")
    ultimaLinha = wsA.Cells(wsA.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(wsA.Cells(r, 4).Value, "proficiencia") Then
            nome = Trim$(CStr(wsA.Cells(r, 7).Value))
            If Len(nome) > 0 Then
                If Not dict.Exists(nome) Then dict.Add nome, True
            End If
        End If
    Next r

    If dict.Count = 0 Then
        ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G17:G19").ClearContents
        ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("G17").Value = "Nenhuma"
    Else
        EscreverListaProficiencias ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL), dict.Keys
    End If
End Sub

Private Function OrigemAtual(ByVal origemTipo As Variant, ByVal origemNome As Variant, ByVal classe As String, ByVal raca As String) As Boolean
    If MesmoTexto(origemTipo, "Classe") Then
        OrigemAtual = MesmoTexto(origemNome, classe)
    ElseIf MesmoTexto(origemTipo, "Raca") Then
        OrigemAtual = MesmoTexto(origemNome, raca)
    End If
End Function

Private Function PodeAtivar(ByVal ativoAuto As Variant, ByVal condicao As String, ByVal escolhaChave As String, ByVal escolhaValor As String) As Boolean
    If Not ValorVerdadeiro(ativoAuto) Then Exit Function
    escolhaChave = Trim$(escolhaChave)
    escolhaValor = Trim$(escolhaValor)
    condicao = Trim$(condicao)

    If Len(escolhaChave) > 0 Then
        PodeAtivar = MesmoTexto(ValorEscolha(escolhaChave), escolhaValor)
        Exit Function
    End If

    If Len(condicao) > 0 Then Exit Function
    PodeAtivar = True
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

Private Function ValorAtributo(ByVal atributo As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Select Case LCase$(Trim$(atributo))
        Case "for": ValorAtributo = Val(CStr(ws.Range("A6").Value))
        Case "des": ValorAtributo = Val(CStr(ws.Range("B6").Value))
        Case "con": ValorAtributo = Val(CStr(ws.Range("C6").Value))
        Case "int": ValorAtributo = Val(CStr(ws.Range("D6").Value))
        Case "sab": ValorAtributo = Val(CStr(ws.Range("E6").Value))
        Case "car": ValorAtributo = Val(CStr(ws.Range("F6").Value))
    End Select
End Function

Private Function NivelPersonagem() As Long
    NivelPersonagem = CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("F1").Value)))
    If NivelPersonagem < 1 Then NivelPersonagem = 1
End Function

Private Function ValorEscolha(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    chave = Trim$(chave)
    If Len(chave) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS_ATIVAS)
    resultado = Application.match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEscolha = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEscolha(ByVal chave As String, ByVal valor As String)
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long
    chave = Trim$(chave)
    If Len(chave) = 0 Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS_ATIVAS)
    resultado = Application.match(chave, ws.Columns(1), 0)
    If IsError(resultado) Then
        linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
        ws.Cells(linha, 1).Value = chave
    Else
        linha = CLng(resultado)
    End If
    ws.Cells(linha, 2).Value = valor
End Sub

Private Function EscolherOpcaoFormulario(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcaoFormulario = formulario.escolha
    Unload formulario
End Function

Private Function PosicaoAtributoLocal(ByVal atributo As String) As Long
    Select Case LCase$(Trim$(atributo))
        Case "for": PosicaoAtributoLocal = 1
        Case "des": PosicaoAtributoLocal = 2
        Case "con": PosicaoAtributoLocal = 3
        Case "int": PosicaoAtributoLocal = 4
        Case "sab": PosicaoAtributoLocal = 5
        Case "car": PosicaoAtributoLocal = 6
    End Select
End Function

Private Function NomeBasePericiaPrincipal(ByVal pericia As String) As String
    Dim pos As Long
    pericia = Trim$(pericia)
    pos = InStr(1, pericia, " (", vbTextCompare)
    If pos > 0 Then pericia = Left$(pericia, pos - 1)
    NomeBasePericiaPrincipal = pericia
End Function

Private Sub AdicionarUnico(ByVal lista As Collection, ByVal valor As String)
    If Len(Trim$(valor)) = 0 Then Exit Sub
    If Not Contem(lista, valor) Then lista.Add valor
End Sub

Private Function Contem(ByVal lista As Collection, ByVal valor As String) As Boolean
    Dim item As Variant
    For Each item In lista
        If MesmoTexto(item, valor) Then
            Contem = True
            Exit Function
        End If
    Next item
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function

Private Function PlanilhaExisteLocal(ByVal nome As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    PlanilhaExisteLocal = Not ws Is Nothing
    On Error GoTo 0
End Function




