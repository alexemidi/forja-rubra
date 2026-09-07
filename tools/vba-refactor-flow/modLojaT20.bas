Attribute VB_Name = "modLojaT20"
Option Explicit

Private Const PLANILHA_LOJA As String = "Loja"
Private Const PLANILHA_ITENS As String = "Base_Itens"
Private Const PLANILHA_MELHORIAS As String = "Base_Melhorias"
Private Const PLANILHA_MATERIAIS As String = "Base_Materiais"

Private Const COL_ITEM_ID As Long = 29
Private Const COL_TIPO_ITEM As Long = 30
Private Const COL_CATEGORIA_ID As Long = 31
Private Const COL_CLASSE_MELHORIA As Long = 32
Private Const COL_PRECO_BASE As Long = 33
Private Const COL_INICIO_MELHORIAS As Long = 34
Private Const COL_FIM_MELHORIAS As Long = 35
Private Const COL_MATERIAL As Long = 36
Private Const COL_PRECO_FINAL As Long = 37
Private Const COL_TIPOS_DANO As Long = 38
Private Const COL_CATEGORIA_ARMADURA As Long = 39
Private Const COL_APLICACAO_MATERIAL As Long = 40
Private Const COL_MODIFICA_PERICIA As Long = 41
Private Const COL_STATUS As Long = 42

Public Function CodexLojaT20Version() As String
    CodexLojaT20Version = "T20 loja itens-melhorias-materiais 2026-08-27"
End Function

Public Function EhColunaConfiguracaoLoja(ByVal ws As Worksheet, ByVal linha As Long, ByVal coluna As Long) As Boolean
    Dim inicio As Long
    Dim fim As Long
    Dim material As Long

    If linha < 2 Or Len(Trim$(CStr(ws.Cells(linha, COL_ITEM_ID).Value))) = 0 Then Exit Function
    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    material = CLng(Val(CStr(ws.Cells(linha, COL_MATERIAL).Value)))
    EhColunaConfiguracaoLoja = ((inicio > 0 And coluna >= inicio And coluna <= fim) Or (material > 0 And coluna = material))
End Function

Public Sub ProcessarAlteracaoLoja(ByVal ws As Worksheet, ByVal alvo As Range)
    Dim linha As Long
    Dim coluna As Long
    Dim inicio As Long
    Dim fim As Long
    Dim material As Long
    Dim motivo As String
    Dim valor As String

    On Error GoTo TrataErro
    linha = alvo.Row
    coluna = alvo.Column
    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    material = CLng(Val(CStr(ws.Cells(linha, COL_MATERIAL).Value)))
    valor = Trim$(CStr(alvo.Value))

    If inicio > 0 And coluna >= inicio And coluna <= fim Then
        If Len(valor) > 0 Then
            If Not MelhoriaValidaNaLinha(ws, linha, coluna, motivo) Then
                alvo.ClearContents
                alvo.ClearComments
                MsgBox motivo, vbExclamation, "Forja T20 - Loja"
            Else
                AtualizarComentarioMelhoria alvo, valor
                If MesmoTexto(valor, "Material Especial") And material > 0 And Len(Trim$(CStr(ws.Cells(linha, material).Value))) = 0 Then
                    EscolherMaterialParaLinha ws, linha
                End If
            End If
        Else
            alvo.ClearComments
            LimparDependenciasInvalidas ws, linha
        End If
    ElseIf material > 0 And coluna = material Then
        If Len(valor) > 0 Then
            If Not TemMelhoriaMaterialEspecial(ws, linha) Then
                alvo.ClearContents
                MsgBox "Escolha Material Especial em uma das quatro melhorias antes de selecionar o material.", vbExclamation, "Forja T20 - Loja"
            ElseIf Not MaterialValidoNaLinha(ws, linha, valor, motivo) Then
                alvo.ClearContents
                MsgBox motivo, vbExclamation, "Forja T20 - Loja"
            Else
                AtualizarComentarioMaterial alvo, valor, CStr(ws.Cells(linha, COL_APLICACAO_MATERIAL).Value)
            End If
        Else
            alvo.ClearComments
        End If
    End If

    AtualizarStatusLinha ws, linha
    ws.Calculate
    Exit Sub

TrataErro:
    MsgBox "Nao foi possivel validar a configuracao do item: " & Err.Description, vbExclamation, "Forja T20 - Loja"
End Sub

Public Sub MostrarDetalhesItem(ByVal linha As Long)
    Dim ws As Worksheet
    Dim itemId As String
    Dim linhaBase As Long
    Dim texto As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_LOJA)
    itemId = Trim$(CStr(ws.Cells(linha, COL_ITEM_ID).Value))
    If Len(itemId) = 0 Then Exit Sub
    linhaBase = LinhaItemPorId(itemId)
    If linhaBase = 0 Then Exit Sub

    With ThisWorkbook.Worksheets(PLANILHA_ITENS)
        texto = CStr(.Cells(linhaBase, 2).Value) & vbCrLf & String$(48, "-") & vbCrLf
        texto = texto & "Preco base: T$ " & NumeroLegivel(.Cells(linhaBase, 8).Value) & vbCrLf
        texto = texto & "Espacos: " & NumeroLegivel(.Cells(linhaBase, 10).Value) & vbCrLf
        If Len(Trim$(CStr(.Cells(linhaBase, 11).Value))) > 0 Then texto = texto & vbCrLf & "Habilidade" & vbCrLf & CStr(.Cells(linhaBase, 11).Value) & vbCrLf
        If Len(Trim$(CStr(.Cells(linhaBase, 12).Value))) > 0 Then texto = texto & vbCrLf & "Regras" & vbCrLf & CStr(.Cells(linhaBase, 12).Value) & vbCrLf
        If Len(Trim$(CStr(.Cells(linhaBase, 13).Value))) > 0 Then texto = texto & vbCrLf & "Descricao" & vbCrLf & CStr(.Cells(linhaBase, 13).Value)
    End With
    MsgBox texto, vbInformation, "Forja T20 - Loja"
End Sub

Public Sub AtualizarStatusTodasLinhasLoja()
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_LOJA)
    ultimaLinha = ws.Cells(ws.Rows.Count, COL_ITEM_ID).End(xlUp).Row
    For r = 2 To ultimaLinha
        If Len(Trim$(CStr(ws.Cells(r, COL_ITEM_ID).Value))) > 0 Then AtualizarStatusLinha ws, r
    Next r
    ws.Calculate
End Sub

Private Function MelhoriaValidaNaLinha(ByVal ws As Worksheet, ByVal linha As Long, ByVal colunaAtual As Long, ByRef motivo As String) As Boolean
    Dim nome As String
    Dim linhaMelhoria As Long
    Dim categorias As String
    Dim classe As String
    Dim requisitos As String
    Dim restricoes As String

    nome = Trim$(CStr(ws.Cells(linha, colunaAtual).Value))
    linhaMelhoria = LinhaMelhoriaPorNome(nome)
    If linhaMelhoria = 0 Then
        motivo = "Melhoria nao encontrada na base."
        Exit Function
    End If
    If MelhoriaDuplicada(ws, linha, colunaAtual, nome) Then
        motivo = "A mesma melhoria nao pode ser escolhida mais de uma vez."
        Exit Function
    End If

    With ThisWorkbook.Worksheets(PLANILHA_MELHORIAS)
        categorias = CStr(.Cells(linhaMelhoria, 3).Value)
        requisitos = CStr(.Cells(linhaMelhoria, 6).Value)
        restricoes = CStr(.Cells(linhaMelhoria, 7).Value)
    End With
    classe = Trim$(CStr(ws.Cells(linha, COL_CLASSE_MELHORIA).Value))
    If MesmoTexto(classe, "municao") Then classe = "arma"
    If Not ListaContem(categorias, classe) Then
        motivo = "Esta melhoria nao pode ser aplicada a este tipo de item."
        Exit Function
    End If
    If Not RequisitosCumpridos(ws, linha, requisitos, motivo) Then Exit Function
    If Not RestricoesCumpridas(ws, linha, restricoes, motivo) Then Exit Function

    MelhoriaValidaNaLinha = True
End Function

Private Function RequisitosCumpridos(ByVal ws As Worksheet, ByVal linha As Long, ByVal requisitos As String, ByRef motivo As String) As Boolean
    Dim re As Object
    Dim matches As Object
    Dim match As Object
    Dim ids As String
    Dim partes() As String
    Dim i As Long
    Dim algum As Boolean

    RequisitosCumpridos = True
    If Len(Trim$(requisitos)) = 0 Or requisitos = "[]" Then Exit Function

    Set re = CreateObject("VBScript.RegExp")
    re.Global = True
    re.IgnoreCase = True
    re.Pattern = """melhoriaId""\s*:\s*""([^""]+)"""
    Set matches = re.Execute(requisitos)
    For Each match In matches
        If Not MelhoriaSelecionadaPorId(ws, linha, CStr(match.SubMatches(0))) Then
            motivo = "Pre-requisito: escolha primeiro " & NomeMelhoriaPorId(CStr(match.SubMatches(0))) & "."
            RequisitosCumpridos = False
            Exit Function
        End If
    Next match

    re.Pattern = """melhoriasIds""\s*:\s*\[([^\]]+)\]"
    If re.Test(requisitos) Then
        ids = Replace(CStr(re.Execute(requisitos)(0).SubMatches(0)), """", vbNullString)
        partes = Split(ids, ",")
        For i = LBound(partes) To UBound(partes)
            If MelhoriaSelecionadaPorId(ws, linha, Trim$(partes(i))) Then algum = True
        Next i
        If Not algum Then
            motivo = "Pre-requisito: escolha uma das melhorias exigidas antes desta."
            RequisitosCumpridos = False
        End If
    End If
End Function

Private Function RestricoesCumpridas(ByVal ws As Worksheet, ByVal linha As Long, ByVal restricoes As String, ByRef motivo As String) As Boolean
    Dim tipoItem As String
    Dim categoriaArmadura As String
    Dim tiposDano As String
    Dim re As Object
    Dim textoLista As String
    Dim partes() As String
    Dim i As Long
    Dim algum As Boolean

    RestricoesCumpridas = True
    If Len(Trim$(restricoes)) = 0 Or restricoes = "[]" Then Exit Function
    tipoItem = Trim$(CStr(ws.Cells(linha, COL_TIPO_ITEM).Value))

    If InStr(1, restricoes, """tipo"":""municao""", vbTextCompare) > 0 Then
        If Not MesmoTexto(tipoItem, "municao") Then
            motivo = "Esta melhoria e exclusiva para municoes."
            RestricoesCumpridas = False
            Exit Function
        End If
    End If

    If InStr(1, restricoes, """tipo"":""categoria_armadura""", vbTextCompare) > 0 Then
        categoriaArmadura = Trim$(CStr(ws.Cells(linha, COL_CATEGORIA_ARMADURA).Value))
        If InStr(1, restricoes, """categoriaId"":""" & categoriaArmadura & """", vbTextCompare) = 0 Then
            motivo = "Esta melhoria exige outra categoria de armadura."
            RestricoesCumpridas = False
            Exit Function
        End If
    End If

    If InStr(1, restricoes, """tipo"":""item_modifica_pericia""", vbTextCompare) > 0 Then
        If Not MesmoTexto(ws.Cells(linha, COL_MODIFICA_PERICIA).Value, "SIM") Then
            motivo = "Esta melhoria exige um item que modifique uma pericia."
            RestricoesCumpridas = False
            Exit Function
        End If
    End If

    If InStr(1, restricoes, """tipo"":""tipo_dano""", vbTextCompare) > 0 Then
        tiposDano = Trim$(CStr(ws.Cells(linha, COL_TIPOS_DANO).Value))
        Set re = CreateObject("VBScript.RegExp")
        re.IgnoreCase = True
        re.Pattern = """tipoDanoIds""\s*:\s*\[([^\]]+)\]"
        If re.Test(restricoes) Then
            textoLista = Replace(CStr(re.Execute(restricoes)(0).SubMatches(0)), """", vbNullString)
            partes = Split(textoLista, ",")
            For i = LBound(partes) To UBound(partes)
                If ListaContem(tiposDano, Trim$(partes(i))) Then algum = True
            Next i
            If Not algum Then
                motivo = "Esta melhoria exige um tipo de dano compativel."
                RestricoesCumpridas = False
            End If
        End If
    End If
End Function

Private Function MaterialValidoNaLinha(ByVal ws As Worksheet, ByVal linha As Long, ByVal material As String, ByRef motivo As String) As Boolean
    Dim aplicacao As String
    Dim linhaBaseMaterial As Long
    Dim restricoes As String

    aplicacao = Trim$(CStr(ws.Cells(linha, COL_APLICACAO_MATERIAL).Value))
    If Len(aplicacao) = 0 Then
        motivo = "Este tipo de item nao possui materiais especiais cadastrados."
        Exit Function
    End If
    linhaBaseMaterial = LinhaMaterial(material, aplicacao)
    If linhaBaseMaterial = 0 Then
        motivo = "O material escolhido nao pode ser aplicado a este item."
        Exit Function
    End If
    restricoes = CStr(ThisWorkbook.Worksheets(PLANILHA_MATERIAIS).Cells(linhaBaseMaterial, 8).Value)
    If Not RestricoesCumpridas(ws, linha, restricoes, motivo) Then Exit Function
    MaterialValidoNaLinha = True
End Function

Private Sub EscolherMaterialParaLinha(ByVal ws As Worksheet, ByVal linha As Long)
    Dim aplicacao As String
    Dim opcoes As Collection
    Dim escolha As String
    Dim materialCol As Long

    aplicacao = Trim$(CStr(ws.Cells(linha, COL_APLICACAO_MATERIAL).Value))
    materialCol = CLng(Val(CStr(ws.Cells(linha, COL_MATERIAL).Value)))
    Set opcoes = MateriaisPermitidos(ws, linha, aplicacao)
    If opcoes.Count = 0 Then
        MsgBox "Nao ha material especial compativel cadastrado para este item.", vbInformation, "Forja T20 - Loja"
        Exit Sub
    End If
    escolha = EscolherOpcao("Material Especial" & vbCrLf & "Escolha o material do item.", opcoes)
    If Len(escolha) > 0 Then
        ws.Cells(linha, materialCol).Value = escolha
        AtualizarComentarioMaterial ws.Cells(linha, materialCol), escolha, aplicacao
    End If
End Sub

Private Function MateriaisPermitidos(ByVal ws As Worksheet, ByVal linha As Long, ByVal aplicacao As String) As Collection
    Dim lista As Collection
    Dim base As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim motivo As String
    Dim nome As String

    Set lista = New Collection
    If Len(aplicacao) = 0 Then Set MateriaisPermitidos = lista: Exit Function
    Set base = ThisWorkbook.Worksheets(PLANILHA_MATERIAIS)
    ultimaLinha = base.Cells(base.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(base.Cells(r, 4).Value, aplicacao) Then
            nome = Trim$(CStr(base.Cells(r, 3).Value))
            motivo = vbNullString
            If MaterialValidoNaLinha(ws, linha, nome, motivo) Then lista.Add nome
        End If
    Next r
    Set MateriaisPermitidos = lista
End Function

Private Function EscolherOpcao(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function
    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, False
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcao = formulario.escolha
    Unload formulario
End Function

Private Sub LimparDependenciasInvalidas(ByVal ws As Worksheet, ByVal linha As Long)
    Dim inicio As Long
    Dim fim As Long
    Dim c As Long
    Dim motivo As String
    Dim removidas As String

    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    For c = inicio To fim
        If Len(Trim$(CStr(ws.Cells(linha, c).Value))) > 0 Then
            motivo = vbNullString
            If Not MelhoriaValidaNaLinha(ws, linha, c, motivo) Then
                If Len(removidas) > 0 Then removidas = removidas & ", "
                removidas = removidas & CStr(ws.Cells(linha, c).Value)
                ws.Cells(linha, c).ClearContents
                ws.Cells(linha, c).ClearComments
            End If
        End If
    Next c
    If Len(removidas) > 0 Then MsgBox "Melhorias removidas por falta de pre-requisito: " & removidas, vbInformation, "Forja T20 - Loja"
    If Not TemMelhoriaMaterialEspecial(ws, linha) Then
        c = CLng(Val(CStr(ws.Cells(linha, COL_MATERIAL).Value)))
        If c > 0 Then ws.Cells(linha, c).ClearContents: ws.Cells(linha, c).ClearComments
    End If
End Sub

Private Function MelhoriaDuplicada(ByVal ws As Worksheet, ByVal linha As Long, ByVal colunaAtual As Long, ByVal nome As String) As Boolean
    Dim inicio As Long
    Dim fim As Long
    Dim c As Long
    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    For c = inicio To fim
        If c <> colunaAtual And MesmoTexto(ws.Cells(linha, c).Value, nome) Then
            MelhoriaDuplicada = True
            Exit Function
        End If
    Next c
End Function

Private Function TemMelhoriaMaterialEspecial(ByVal ws As Worksheet, ByVal linha As Long) As Boolean
    Dim inicio As Long
    Dim fim As Long
    Dim c As Long
    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    For c = inicio To fim
        If MesmoTexto(ws.Cells(linha, c).Value, "Material Especial") Then TemMelhoriaMaterialEspecial = True: Exit Function
    Next c
End Function

Private Function MelhoriaSelecionadaPorId(ByVal ws As Worksheet, ByVal linha As Long, ByVal melhoriaId As String) As Boolean
    Dim inicio As Long
    Dim fim As Long
    Dim c As Long
    Dim linhaMelhoria As Long
    inicio = CLng(Val(CStr(ws.Cells(linha, COL_INICIO_MELHORIAS).Value)))
    fim = CLng(Val(CStr(ws.Cells(linha, COL_FIM_MELHORIAS).Value)))
    For c = inicio To fim
        If Len(Trim$(CStr(ws.Cells(linha, c).Value))) > 0 Then
            linhaMelhoria = LinhaMelhoriaPorNome(CStr(ws.Cells(linha, c).Value))
            If linhaMelhoria > 0 Then
                If MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_MELHORIAS).Cells(linhaMelhoria, 1).Value, melhoriaId) Then
                    MelhoriaSelecionadaPorId = True
                    Exit Function
                End If
            End If
        End If
    Next c
End Function

Private Sub AtualizarStatusLinha(ByVal ws As Worksheet, ByVal linha As Long)
    Dim materialCol As Long
    Dim material As String
    Dim aplicacao As String
    Dim linhaBaseMaterial As Long
    Dim precoCol As Long

    ws.Cells(linha, COL_STATUS).Value = "OK"
    materialCol = CLng(Val(CStr(ws.Cells(linha, COL_MATERIAL).Value)))
    precoCol = CLng(Val(CStr(ws.Cells(linha, COL_PRECO_FINAL).Value)))
    If TemMelhoriaMaterialEspecial(ws, linha) Then
        If materialCol <= 0 Or Len(Trim$(CStr(ws.Cells(linha, materialCol).Value))) = 0 Then
            ws.Cells(linha, COL_STATUS).Value = "Escolha o material especial"
            If precoCol > 0 Then ws.Cells(linha, precoCol).Interior.Color = RGB(255, 235, 156)
            Exit Sub
        End If
        material = Trim$(CStr(ws.Cells(linha, materialCol).Value))
        aplicacao = Trim$(CStr(ws.Cells(linha, COL_APLICACAO_MATERIAL).Value))
        linhaBaseMaterial = LinhaMaterial(material, aplicacao)
        If linhaBaseMaterial > 0 Then
            If Not MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_MATERIAIS).Cells(linhaBaseMaterial, 6).Value, "SIM") Then
                ws.Cells(linha, COL_STATUS).Value = "Custo do material nao cadastrado"
                If precoCol > 0 Then ws.Cells(linha, precoCol).Interior.Color = RGB(255, 235, 156)
                Exit Sub
            End If
        End If
    End If
    If precoCol > 0 Then ws.Cells(linha, precoCol).Interior.Color = RGB(226, 239, 218)
End Sub

Private Sub AtualizarComentarioMelhoria(ByVal celula As Range, ByVal nome As String)
    Dim linha As Long
    Dim resumo As String
    linha = LinhaMelhoriaPorNome(nome)
    celula.ClearComments
    If linha = 0 Then Exit Sub
    resumo = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_MELHORIAS).Cells(linha, 5).Value))
    If Len(resumo) > 0 Then celula.AddComment resumo
End Sub

Private Sub AtualizarComentarioMaterial(ByVal celula As Range, ByVal nome As String, ByVal aplicacao As String)
    Dim linha As Long
    Dim resumo As String
    linha = LinhaMaterial(nome, aplicacao)
    celula.ClearComments
    If linha = 0 Then Exit Sub
    resumo = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_MATERIAIS).Cells(linha, 7).Value))
    If Len(resumo) = 0 Then resumo = "Material especial."
    If Not MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_MATERIAIS).Cells(linha, 6).Value, "SIM") Then resumo = resumo & vbCrLf & "Custo nao cadastrado no arquivo JSON."
    celula.AddComment resumo
End Sub

Private Function LinhaItemPorId(ByVal itemId As String) As Long
    Dim resultado As Variant
    resultado = Application.match(itemId, ThisWorkbook.Worksheets(PLANILHA_ITENS).Columns(1), 0)
    If Not IsError(resultado) Then LinhaItemPorId = CLng(resultado)
End Function

Private Function LinhaMelhoriaPorNome(ByVal nome As String) As Long
    Dim resultado As Variant
    resultado = Application.match(nome, ThisWorkbook.Worksheets(PLANILHA_MELHORIAS).Columns(2), 0)
    If Not IsError(resultado) Then LinhaMelhoriaPorNome = CLng(resultado)
End Function

Private Function NomeMelhoriaPorId(ByVal melhoriaId As String) As String
    Dim resultado As Variant
    resultado = Application.match(melhoriaId, ThisWorkbook.Worksheets(PLANILHA_MELHORIAS).Columns(1), 0)
    If Not IsError(resultado) Then NomeMelhoriaPorId = CStr(ThisWorkbook.Worksheets(PLANILHA_MELHORIAS).Cells(CLng(resultado), 2).Value)
    If Len(NomeMelhoriaPorId) = 0 Then NomeMelhoriaPorId = melhoriaId
End Function

Private Function LinhaMaterial(ByVal nome As String, ByVal aplicacao As String) As Long
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_MATERIAIS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 3).Value, nome) And MesmoTexto(ws.Cells(r, 4).Value, aplicacao) Then
            LinhaMaterial = r
            Exit Function
        End If
    Next r
End Function

Private Function ListaContem(ByVal textoLista As String, ByVal valor As String) As Boolean
    Dim partes() As String
    Dim i As Long
    partes = Split(Replace(textoLista, ",", ";"), ";")
    For i = LBound(partes) To UBound(partes)
        If MesmoTexto(partes(i), valor) Then ListaContem = True: Exit Function
    Next i
End Function

Private Function MesmoTexto(ByVal esquerda As Variant, ByVal direita As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(esquerda)), Trim$(CStr(direita)), vbTextCompare) = 0)
End Function

Private Function NumeroLegivel(ByVal valor As Variant) As String
    If IsNumeric(valor) Then
        If Abs(CDbl(valor) - Fix(CDbl(valor))) < 0.000001 Then
            NumeroLegivel = CStr(CLng(valor))
        Else
            NumeroLegivel = CStr(CDbl(valor))
        End If
    Else
        NumeroLegivel = CStr(valor)
    End If
End Function

