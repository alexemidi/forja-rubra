Attribute VB_Name = "modMagiasT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_BASE_MAGIAS As String = "Base_Magias"
Private Const PLANILHA_BASE_CONJURACAO As String = "Base_Conjuracao"
Private Const PLANILHA_BASE_MAGIAS_EXTRAS As String = "Base_Magias_Extras"
Private Const PLANILHA_CONTROLE As String = "Magias_Controle"
Private Const PLANILHA_CONHECIDAS As String = "Magias_Conhecidas"
Private Const PLANILHA_ESCOLHAS As String = "Escolhas_Ativas"
Private Const PLANILHA_EFEITOS_ATIVOS As String = "Efeitos_Ativos"

Public Function CodexMagiasVersion() As String
    CodexMagiasVersion = "T20 magias arcanista-reset-escolas 2026-08-27"
End Function

Public Sub AtualizarMagiasPersonagem(Optional ByVal ApenasResumo As Boolean = False)
    Dim wsP As Worksheet
    Dim linhaRegra As Long
    Dim classe As String
    Dim classeId As String
    Dim tipoMagia As String
    Dim atributo As String
    Dim ValorAtributo As Double
    Dim nivel As Long
    Dim bonusCd As Double
    Dim cdMagia As Double
    Dim circuloMaximo As Long
    Dim escolas As Collection
    Dim magiasConhecidas As Collection
    Dim magiasExtras As Collection
    Dim qtdEsperada As Long

    On Error GoTo TrataErro
    If Not PlanilhaExiste(PLANILHA_BASE_CONJURACAO) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_BASE_MAGIAS) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_CONTROLE) Then Exit Sub
    If Not PlanilhaExiste(PLANILHA_CONHECIDAS) Then Exit Sub

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    classe = Trim$(CStr(wsP.Range("F2").Value))
    nivel = CLng(Val(CStr(wsP.Range("F1").Value)))
    If nivel < 1 Then nivel = 1

    PrepararControle
    PrepararConhecidas

    linhaRegra = LinhaRegraConjuracao(classe)
    If linhaRegra = 0 Then
        Set magiasConhecidas = New Collection
        Set magiasExtras = MagiasExtrasAtivas(ApenasResumo)
        EscreverMagiasConhecidas classe, magiasConhecidas, magiasExtras
        If magiasExtras.Count > 0 Then
            atributo = AtributoChaveMagiaExtraAtiva()
            ValorAtributo = ValorAtributoCodigo(atributo)
            bonusCd = BonusCdAtivo()
            cdMagia = 10 + (nivel \ 2) + ValorAtributo + bonusCd
            EscreverControle classe, vbNullString, "Extra", atributo, ValorAtributo, bonusCd, cdMagia, 1, vbNullString, 0, 0, magiasExtras.Count, ResumoMagiasExtras(magiasExtras), "Magias vindas de raca, poder ou outra fonte fora da lista da classe."
        Else
            EscreverControle classe, vbNullString, vbNullString, vbNullString, 0, 0, 0, 0, vbNullString, 0, 0, 0, vbNullString, "Classe sem regra de magia cadastrada."
        End If
        Exit Sub
    End If

    classeId = TextoRegra(linhaRegra, 2)
    tipoMagia = TextoRegra(linhaRegra, 3)
    atributo = AtributoChaveMagiaClasse(classe)
    GarantirEscolhasClasseEspecial classeId, ApenasResumo
    ValorAtributo = ValorAtributoCodigo(atributo)
    bonusCd = BonusCdAtivo()
    cdMagia = 10 + (nivel \ 2) + ValorAtributo + bonusCd
    circuloMaximo = CirculoMaximoMagiaClasse(classe, nivel)
    Set escolas = EscolasPermitidasClasse(classeId, linhaRegra, ApenasResumo)
    qtdEsperada = QuantidadeMagiasEsperadas(classeId, linhaRegra, nivel, circuloMaximo)

    If ApenasResumo Then
        Set magiasConhecidas = MagiasPersistidas(classeId, linhaRegra, tipoMagia, circuloMaximo, escolas, qtdEsperada)
    Else
        Set magiasConhecidas = GarantirMagiasConhecidas(classeId, linhaRegra, tipoMagia, circuloMaximo, escolas, qtdEsperada)
    End If
    Set magiasExtras = MagiasExtrasAtivas(ApenasResumo)

    EscreverMagiasConhecidas classe, magiasConhecidas, magiasExtras
    EscreverControle classe, classeId, tipoMagia, atributo, ValorAtributo, bonusCd, cdMagia, circuloMaximo, TextoColecao(escolas, ", "), magiasConhecidas.Count, qtdEsperada, magiasExtras.Count, ResumoMagiasExtras(magiasExtras), TextoRegra(linhaRegra, 17)
    modEstadoExcelT20.SolicitarRecalculo
    Exit Sub

TrataErro:
    Debug.Print "AtualizarMagiasPersonagem: " & Err.Description
End Sub

Public Function AtributoChaveMagiaClasse(ByVal classe As String) As String
    Dim linhaRegra As Long
    Dim classeId As String
    Dim atributo As String
    Dim atributoPadrao As String
    Dim caminho As String
    Dim opcoes As Collection

    linhaRegra = LinhaRegraConjuracao(classe)
    If linhaRegra = 0 Then Exit Function

    classeId = TextoRegra(linhaRegra, 2)
    atributo = UCase$(Trim$(TextoRegra(linhaRegra, 4)))

    If StrComp(atributo, "CAMINHO_ARCANISTA", vbTextCompare) = 0 Or classeId = "arcanista" Then
        Set opcoes = NovaLista("Bruxo", "Feiticeiro", "Mago")
        caminho = GarantirEscolha("Classe_arcanista_Caminho", "Classe: Arcanista" & vbCrLf & "Escolha o Caminho do Arcanista.", opcoes, False)
        If MesmoTexto(caminho, "Feiticeiro") Then
            atributoPadrao = "CAR"
        Else
            atributoPadrao = "INT"
        End If
    Else
        atributoPadrao = atributo
    End If

    AtributoChaveMagiaClasse = AtributoChaveComOverride(classeId, atributoPadrao)
End Function

Public Sub ForcarEscolhaCaminhoArcanista()
    Dim classe As String
    Dim escolha As String
    Dim escolhaAnterior As String
    Dim preservarMagias As Boolean

    classe = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("F2").Value))
    If Not MesmoTexto(classe, "Arcanista") Then Exit Sub

    escolhaAnterior = ValorEscolha("Classe_arcanista_Caminho")
    escolha = EscolherOpcaoFormulario("Classe: Arcanista" & vbCrLf & "Escolha o Caminho do Arcanista.", NovaLista("Bruxo", "Feiticeiro", "Mago"), False)
    If Len(escolha) > 0 Then
        preservarMagias = ConfirmarManterOuTrocarMagiasArcanista(escolhaAnterior, escolha)
        ResetarEscolhasArcanista preservarMagias, True
        DefinirEscolha "Classe_arcanista_Caminho", escolha, "Caminho do Arcanista escolhido ao selecionar a classe."
    End If
End Sub

Private Function ConfirmarManterOuTrocarMagiasArcanista(ByVal caminhoAnterior As String, ByVal caminhoNovo As String) As Boolean
    Dim opcoes As Collection
    Dim escolha As String
    Dim titulo As String

    ConfirmarManterOuTrocarMagiasArcanista = True
    If Not ExisteEscolhaPrefixo("Classe_arcanista_Magia_") Then Exit Function

    Set opcoes = NovaLista("Manter magias atuais", "Escolher magias novamente")
    titulo = "Classe: Arcanista" & vbCrLf & "Ja existem magias de arcanista escolhidas."
    If Len(caminhoAnterior) > 0 Then titulo = titulo & vbCrLf & "Caminho anterior: " & caminhoAnterior
    If Len(caminhoNovo) > 0 Then titulo = titulo & vbCrLf & "Caminho atual: " & caminhoNovo
    titulo = titulo & vbCrLf & "O que deseja fazer com as magias?"

    escolha = EscolherOpcaoFormulario(titulo, opcoes, False)
    If MesmoTexto(escolha, "Escolher magias novamente") Then
        ConfirmarManterOuTrocarMagiasArcanista = False
    End If
End Function

Private Sub ResetarEscolhasArcanista(ByVal preservarMagias As Boolean, ByVal incluirPoderes As Boolean)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim chave As String
    Dim apagar As Boolean

    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = ultimaLinha To 2 Step -1
        chave = Trim$(CStr(ws.Cells(r, 1).Value))
        apagar = False

        If StrComp(Left$(chave, Len("Classe_arcanista_")), "Classe_arcanista_", vbTextCompare) = 0 Then
            apagar = True
            If preservarMagias Then
                If StrComp(Left$(chave, Len("Classe_arcanista_Magia_")), "Classe_arcanista_Magia_", vbTextCompare) = 0 Then apagar = False
            End If
        ElseIf incluirPoderes And StrComp(Left$(chave, Len("ClassePoder|arcanista|")), "ClassePoder|arcanista|", vbTextCompare) = 0 Then
            apagar = True
        ElseIf incluirPoderes And StrComp(Left$(chave, Len("EfeitoInicial|Classe|Arcanista|")), "EfeitoInicial|Classe|Arcanista|", vbTextCompare) = 0 Then
            apagar = True
        End If

        If apagar Then ws.Rows(r).Delete
    Next r
End Sub

Public Sub AtualizarOverrideAtributoMagiaPorPainel()
    Dim wsP As Worksheet
    Dim classe As String
    Dim linhaRegra As Long
    Dim classeId As String
    Dim codigo As String

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    classe = Trim$(CStr(wsP.Range("F2").Value))
    linhaRegra = LinhaRegraConjuracao(classe)
    If linhaRegra = 0 Then Exit Sub

    classeId = TextoRegra(linhaRegra, 2)
    codigo = CodigoAtributoEntrada(CStr(wsP.Range("F45").Value))
    If Len(codigo) = 0 Then codigo = "AUTO"

    DefinirEscolha ChaveOverrideAtributoMagia(classeId), codigo, "Override opcional do atributo-chave de magia."
End Sub

Private Sub GarantirEscolhasClasseEspecial(ByVal classeId As String, ByVal ApenasResumo As Boolean)
    Dim caminho As String
    Dim linhagem As String
    Dim opcoes As Collection

    If classeId = "arcanista" Then
        caminho = ValorEscolha("Classe_arcanista_Caminho")
        If Len(caminho) = 0 And Not ApenasResumo Then
            caminho = GarantirEscolha("Classe_arcanista_Caminho", "Classe: Arcanista" & vbCrLf & "Escolha o Caminho do Arcanista.", NovaLista("Bruxo", "Feiticeiro", "Mago"), False)
        End If

        If MesmoTexto(caminho, "Feiticeiro") Then
            Set opcoes = NovaLista("Draconica", "Feerica", "Rubra", "Abencoada")
            linhagem = ValorEscolha("Classe_arcanista_Feiticeiro_Linhagem")
            If Len(linhagem) = 0 And Not ApenasResumo Then
                linhagem = GarantirEscolha("Classe_arcanista_Feiticeiro_Linhagem", "Classe: Arcanista" & vbCrLf & "Feiticeiro: escolha a linhagem.", opcoes, False)
            End If
            If MesmoTexto(linhagem, "Draconica") Then
                If Len(ValorEscolha("Classe_arcanista_Feiticeiro_Draconica_Elemento")) = 0 And Not ApenasResumo Then
                    GarantirEscolha "Classe_arcanista_Feiticeiro_Draconica_Elemento", "Classe: Arcanista" & vbCrLf & "Linhagem Draconica: escolha o tipo de dano.", NovaLista("Acido", "Eletricidade", "Fogo", "Frio"), False
                End If
            End If
        End If
    End If
End Sub

Public Function CirculoMaximoMagiaClasse(ByVal classe As String, ByVal nivel As Long) As Long
    Dim linhaRegra As Long
    Dim circulo As Long

    If nivel < 1 Then nivel = 1
    linhaRegra = LinhaRegraConjuracao(classe)
    If linhaRegra = 0 Then Exit Function

    circulo = 1
    If Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 13).Value)) > 0 Then
        If nivel >= CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 13).Value))) Then circulo = 2
    End If
    If Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 14).Value)) > 0 Then
        If nivel >= CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 14).Value))) Then circulo = 3
    End If
    If Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 15).Value)) > 0 Then
        If nivel >= CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 15).Value))) Then circulo = 4
    End If
    If Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 16).Value)) > 0 Then
        If nivel >= CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 16).Value))) Then circulo = 5
    End If

    CirculoMaximoMagiaClasse = circulo
End Function

Private Function GarantirMagiasConhecidas(ByVal classeId As String, ByVal linhaRegra As Long, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection, ByVal qtdEsperada As Long) As Collection
    Dim lista As Collection
    Dim fixas As Collection
    Dim usados As Collection
    Dim item As Variant
    Dim qtdEscolhas As Long
    Dim i As Long
    Dim escolha As String
    Dim chave As String

    Set lista = New Collection
    Set usados = New Collection
    Set fixas = ListaPorTexto(TextoRegra(linhaRegra, 9))

    For Each item In fixas
        If MagiaExiste(CStr(item)) Then
            AdicionarUnico lista, CStr(item)
            AdicionarUnico usados, CStr(item)
        End If
    Next item

    qtdEscolhas = qtdEsperada - lista.Count
    If qtdEscolhas < 0 Then qtdEscolhas = 0

    For i = 1 To qtdEscolhas
        chave = "Classe_" & classeId & "_Magia_" & CStr(i)
        escolha = ValorEscolha(chave)
        If Len(escolha) > 0 Then
            If Not MagiaPermitida(escolha, tipoMagia, circuloMaximo, escolas) Or Contem(usados, escolha) Then escolha = vbNullString
        End If
        If Len(escolha) = 0 Then
            escolha = EscolherMagiaFormulario(tipoMagia, circuloMaximo, escolas, usados, "Magia de classe (" & i & " de " & qtdEscolhas & ")")
            If Len(escolha) > 0 Then DefinirEscolha chave, escolha, "Automacao de magias."
        End If
        If Len(escolha) > 0 Then
            AdicionarUnico lista, escolha
            AdicionarUnico usados, escolha
        End If
    Next i

    Set GarantirMagiasConhecidas = lista
End Function

Private Function MagiasPersistidas(ByVal classeId As String, ByVal linhaRegra As Long, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection, ByVal qtdEsperada As Long) As Collection
    Dim lista As Collection
    Dim fixas As Collection
    Dim item As Variant
    Dim i As Long
    Dim qtdEscolhas As Long
    Dim escolha As String

    Set lista = New Collection
    Set fixas = ListaPorTexto(TextoRegra(linhaRegra, 9))
    For Each item In fixas
        If MagiaExiste(CStr(item)) Then AdicionarUnico lista, CStr(item)
    Next item

    qtdEscolhas = qtdEsperada - lista.Count
    If qtdEscolhas < 0 Then qtdEscolhas = 0

    For i = 1 To qtdEscolhas
        escolha = ValorEscolha("Classe_" & classeId & "_Magia_" & CStr(i))
        If Len(escolha) > 0 Then
            If MagiaPermitida(escolha, tipoMagia, circuloMaximo, escolas) Then AdicionarUnico lista, escolha
        End If
    Next i

    Set MagiasPersistidas = lista
End Function

Private Function EscolasPermitidasClasse(ByVal classeId As String, ByVal linhaRegra As Long, ByVal ApenasResumo As Boolean) As Collection
    Dim modo As String
    Dim escolas As Collection
    Dim fixas As Collection
    Dim bloqueadas As Collection
    Dim item As Variant
    Dim qtd As Long
    Dim i As Long
    Dim escolha As String
    Dim disponiveis As Collection
    Dim tipoMagia As String
    Dim circuloMaximo As Long

    modo = LCase$(Trim$(TextoRegra(linhaRegra, 5)))
    Set escolas = New Collection

    If classeId = "arcanista" And MesmoTexto(ValorEscolha("Classe_arcanista_Caminho"), "Mago") Then
        tipoMagia = TextoRegra(linhaRegra, 3)
        circuloMaximo = CirculoMaximoMagiaClasse(TextoRegra(linhaRegra, 1), CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("F1").Value))))
        For i = 1 To 3
            escolha = ValorEscolha("Classe_arcanista_Mago_Escola_" & CStr(i))
            If Len(escolha) > 0 Then
                If Contem(escolas, escolha) Then escolha = vbNullString
            End If
            If Len(escolha) = 0 And Not ApenasResumo Then
                Set disponiveis = RemoverUsadas(TodasEscolas(), escolas)
                escolha = EscolherEscolaMago(disponiveis, tipoMagia, circuloMaximo, "Classe: Arcanista" & vbCrLf & "Mago: escolha a escola de magia (" & i & " de 3).")
                If Len(escolha) > 0 Then DefinirEscolha "Classe_arcanista_Mago_Escola_" & CStr(i), escolha, "Escola do Mago."
            End If
            If Len(escolha) > 0 Then AdicionarUnico escolas, escolha
        Next i
        Set EscolasPermitidasClasse = escolas
        Exit Function
    End If

    If modo = "todas" Then
        Set escolas = TodasEscolas()
    Else
        Set fixas = ListaPorTexto(TextoRegra(linhaRegra, 6))
        For Each item In fixas
            AdicionarUnico escolas, CStr(item)
        Next item
    End If

    If modo = "escolher" Then
        qtd = CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 7).Value)))
        For i = 1 To qtd
            escolha = ValorEscolha("Classe_" & classeId & "_Escola_" & CStr(i))
            If Len(escolha) > 0 Then
                If Contem(escolas, escolha) Then escolha = vbNullString
            End If
            If Len(escolha) = 0 And Not ApenasResumo Then
                Set disponiveis = RemoverUsadas(TodasEscolas(), escolas)
                escolha = GarantirEscolha("Classe_" & classeId & "_Escola_" & CStr(i), "Classe: " & TextoRegra(linhaRegra, 1) & vbCrLf & "Escolha a escola de magia (" & i & " de " & qtd & ").", disponiveis, False)
            End If
            If Len(escolha) > 0 Then AdicionarUnico escolas, escolha
        Next i
    ElseIf modo = "mistico" Then
        AplicarEscolasMistico escolas, ApenasResumo
    End If

    Set bloqueadas = ListaPorTexto(TextoRegra(linhaRegra, 8))
    For Each item In bloqueadas
        RemoverItem escolas, CStr(item)
    Next item

    Set EscolasPermitidasClasse = escolas
End Function

Private Function EscolherEscolaMago(ByVal escolasDisponiveis As Collection, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal titulo As String) As String
    Dim formulario As Object
    Dim magia As String
    Dim escola As String
    Dim usadas As Collection

    If escolasDisponiveis Is Nothing Then Exit Function
    If escolasDisponiveis.Count = 0 Then Exit Function

    Do
        Set formulario = VBA.UserForms.Add("UserFormMagia")
        formulario.Carregar titulo, escolasDisponiveis, "ESCOLA_MAGO"
        formulario.Show vbModal

        If formulario.VerMagiasSolicitado Then
            Unload formulario
            Set formulario = Nothing
            Set usadas = New Collection
            magia = EscolherMagiaFormulario(tipoMagia, circuloMaximo, escolasDisponiveis, usadas, "Magias disponiveis ate o " & CStr(circuloMaximo) & " circulo" & vbCrLf & "Escolha uma magia para selecionar automaticamente a escola dela.")
            If Len(magia) > 0 Then
                escola = EscolaDaMagia(magia)
                If Len(escola) > 0 Then
                    EscolherEscolaMago = escola
                    Exit Function
                End If
            End If
        Else
            If Not formulario.Cancelado Then EscolherEscolaMago = formulario.escolha
            Unload formulario
            Set formulario = Nothing
            If Len(EscolherEscolaMago) > 0 Then Exit Function
        End If

        MsgBox "O Mago precisa ter tres escolas distintas. Escolha esta escola para continuar.", vbExclamation, "Forja T20"
    Loop
End Function

Private Function EscolaDaMagia(ByVal nome As String) As String
    Dim ws As Worksheet
    Dim linha As Variant

    If Len(Trim$(nome)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    linha = Application.Match(nome, ws.Columns(2), 0)
    If Not IsError(linha) Then EscolaDaMagia = Trim$(CStr(ws.Cells(CLng(linha), 5).Value))
End Function

Private Sub AplicarEscolasMistico(ByVal escolas As Collection, ByVal ApenasResumo As Boolean)
    Dim afinidade As String
    Dim escolaAfinidade As String
    Dim terceira As String
    Dim disponiveis As Collection

    AdicionarUnico escolas, EscolaEvocacao()

    afinidade = ValorEscolha("Classe_mistico_Afinidade")
    If Len(afinidade) = 0 And Not ApenasResumo Then
        afinidade = GarantirEscolha("Classe_mistico_Afinidade", "Classe: Mistico" & vbCrLf & "Escolha a Afinidade Elemental.", AfinidadesMistico(), False)
    End If
    escolaAfinidade = EscolaAfinidadeMistico(afinidade)
    If Len(escolaAfinidade) > 0 Then AdicionarUnico escolas, escolaAfinidade

    terceira = ValorEscolha("Classe_mistico_Escola_3")
    If Len(terceira) > 0 Then
        If Contem(escolas, terceira) Then terceira = vbNullString
    End If
    If Len(terceira) = 0 And Not ApenasResumo Then
        Set disponiveis = RemoverUsadas(TodasEscolas(), escolas)
        terceira = GarantirEscolha("Classe_mistico_Escola_3", "Classe: Mistico" & vbCrLf & "Escolha a terceira escola de magia.", disponiveis, False)
    End If
    If Len(terceira) > 0 Then AdicionarUnico escolas, terceira
End Sub

Private Function QuantidadeMagiasEsperadas(ByVal classeId As String, ByVal linhaRegra As Long, ByVal nivel As Long, ByVal circuloMaximo As Long) As Long
    Dim iniciais As Long
    Dim fixas As Long
    Dim aprendidas As Long
    Dim modo As String
    Dim caminho As String

    iniciais = CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linhaRegra, 10).Value)))
    fixas = ListaPorTexto(TextoRegra(linhaRegra, 9)).Count
    modo = LCase$(Trim$(TextoRegra(linhaRegra, 11)))

    If classeId = "arcanista" Then
        caminho = ValorEscolha("Classe_arcanista_Caminho")
        If MesmoTexto(caminho, "Mago") Then iniciais = iniciais + 1
        If MesmoTexto(caminho, "Feiticeiro") Then modo = "nivel_impar_desde_3"
    End If

    Select Case modo
        Case "todo_nivel"
            aprendidas = Application.Max(nivel - 1, 0)
        Case "nivel_par"
            aprendidas = nivel \ 2
        Case "nivel_impar_desde_3"
            If nivel >= 3 Then aprendidas = (nivel - 1) \ 2
        Case Else
            aprendidas = 0
    End Select

    QuantidadeMagiasEsperadas = fixas + iniciais + aprendidas

    If classeId = "arcanista" Then
        If MesmoTexto(ValorEscolha("Classe_arcanista_Caminho"), "Mago") Then
            QuantidadeMagiasEsperadas = QuantidadeMagiasEsperadas + Application.Max(circuloMaximo - 1, 0)
        End If
    End If
End Function

Private Function EscolherMagiaFormulario(ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection, ByVal usadas As Collection, ByVal titulo As String) As String
    Dim opcoes As Collection

    Set opcoes = OpcoesMagias(tipoMagia, circuloMaximo, escolas, usadas)
    If opcoes.Count = 0 Then Exit Function
    EscolherMagiaFormulario = EscolherMagiaPorFormulario(titulo, opcoes)
End Function

Private Function EscolherMagiaPorFormulario(ByVal titulo As String, ByVal opcoes As Collection) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function

    On Error GoTo UsaFormularioPadrao
    Set formulario = VBA.UserForms.Add("UserFormMagia")
    formulario.Carregar titulo, opcoes
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherMagiaPorFormulario = formulario.escolha
    Unload formulario
    Exit Function

UsaFormularioPadrao:
    On Error GoTo 0
    EscolherMagiaPorFormulario = EscolherOpcaoFormulario(titulo, opcoes)
End Function

Private Function OpcoesMagias(ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection, ByVal usadas As Collection) As Collection
    Dim ws As Worksheet
    Dim lista As Collection
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nome As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    Set lista = New Collection
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        nome = Trim$(CStr(ws.Cells(r, 2).Value))
        If Len(nome) > 0 Then
            If Not Contem(usadas, nome) Then
                If LinhaMagiaPermitida(ws, r, tipoMagia, circuloMaximo, escolas) Then AdicionarUnico lista, nome
            End If
        End If
    Next r

    Set OpcoesMagias = lista
End Function

Private Function MagiaPermitida(ByVal nome As String, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection) As Boolean
    Dim ws As Worksheet
    Dim linha As Variant
    If Len(nome) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    linha = Application.Match(nome, ws.Columns(2), 0)
    If IsError(linha) Then Exit Function
    MagiaPermitida = LinhaMagiaPermitida(ws, CLng(linha), tipoMagia, circuloMaximo, escolas)
End Function

Private Function LinhaMagiaPermitida(ByVal ws As Worksheet, ByVal linha As Long, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal escolas As Collection) As Boolean
    Dim tipo As String
    Dim circulo As Long
    Dim escola As String

    tipo = Trim$(CStr(ws.Cells(linha, 3).Value))
    circulo = CLng(Val(CStr(ws.Cells(linha, 4).Value)))
    escola = Trim$(CStr(ws.Cells(linha, 5).Value))

    If Not (MesmoTexto(tipo, tipoMagia) Or MesmoTexto(tipo, "Universal")) Then Exit Function
    If circuloMaximo > 0 And circulo > circuloMaximo Then Exit Function
    If escolas.Count > 0 Then
        If Not Contem(escolas, escola) Then Exit Function
    End If

    LinhaMagiaPermitida = True
End Function

Public Function DetalheMagia(ByVal nome As String) As String
    Dim ws As Worksheet
    Dim linha As Variant
    Dim texto As String

    If Len(Trim$(nome)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    linha = Application.Match(nome, ws.Columns(2), 0)
    If IsError(linha) Then Exit Function

    texto = CStr(ws.Cells(CLng(linha), 2).Value) & vbCrLf
    texto = texto & String$(42, "-") & vbCrLf
    AdicionarLinhaDetalhe texto, "Tipo", ws.Cells(CLng(linha), 3).Value
    AdicionarLinhaDetalhe texto, "Circulo", ws.Cells(CLng(linha), 4).Value
    AdicionarLinhaDetalhe texto, "Escola", ws.Cells(CLng(linha), 5).Value
    AdicionarLinhaDetalhe texto, "Execucao", ws.Cells(CLng(linha), 6).Value
    AdicionarLinhaDetalhe texto, "Alcance", ws.Cells(CLng(linha), 7).Value
    AdicionarLinhaDetalhe texto, "Alvo", ws.Cells(CLng(linha), 8).Value
    AdicionarLinhaDetalhe texto, "Area", ws.Cells(CLng(linha), 9).Value
    AdicionarLinhaDetalhe texto, "Efeito", ws.Cells(CLng(linha), 10).Value
    AdicionarLinhaDetalhe texto, "Duracao", ws.Cells(CLng(linha), 11).Value
    AdicionarLinhaDetalhe texto, "Resistencia", ws.Cells(CLng(linha), 12).Value

    If Len(Trim$(CStr(ws.Cells(CLng(linha), 14).Value))) > 0 Then
        texto = texto & vbCrLf & "Descricao" & vbCrLf & CStr(ws.Cells(CLng(linha), 14).Value) & vbCrLf
    End If
    If Len(Trim$(CStr(ws.Cells(CLng(linha), 15).Value))) > 0 Then
        texto = texto & vbCrLf & "Aprimoramentos" & vbCrLf & CStr(ws.Cells(CLng(linha), 15).Value)
    End If

    DetalheMagia = texto
End Function

Private Sub AdicionarLinhaDetalhe(ByRef texto As String, ByVal rotulo As String, ByVal valor As Variant)
    Dim conteudo As String
    conteudo = Trim$(CStr(valor))
    If Len(conteudo) > 0 Then texto = texto & rotulo & ": " & conteudo & vbCrLf
End Sub

Private Function MagiasExtrasAtivas(ByVal ApenasResumo As Boolean) As Collection
    Dim ws As Worksheet
    Dim wsP As Worksheet
    Dim lista As Collection
    Dim ultimaLinha As Long
    Dim r As Long
    Dim quantidade As Long
    Dim i As Long
    Dim chave As String
    Dim escolha As String
    Dim origemTipo As String
    Dim origemNome As String
    Dim fonteNome As String
    Dim tipoMagia As String
    Dim circuloMaximo As Long
    Dim opcoesFixas As Collection

    Set lista = New Collection
    If Not PlanilhaExiste(PLANILHA_BASE_MAGIAS_EXTRAS) Then
        Set MagiasExtrasAtivas = lista
        Exit Function
    End If

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS_EXTRAS)
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        origemTipo = Trim$(CStr(ws.Cells(r, 1).Value))
        origemNome = Trim$(CStr(ws.Cells(r, 2).Value))
        If RegraExtraAtiva(origemTipo, origemNome, CStr(wsP.Range("F2").Value), CStr(wsP.Range("B2").Value), ws.Cells(r, 12).Value) Then
            fonteNome = Trim$(CStr(ws.Cells(r, 4).Value))
            quantidade = CLng(Val(CStr(ws.Cells(r, 6).Value)))
            tipoMagia = Trim$(CStr(ws.Cells(r, 7).Value))
            circuloMaximo = CLng(Val(CStr(ws.Cells(r, 8).Value)))
            Set opcoesFixas = ListaPorTexto(CStr(ws.Cells(r, 11).Value))

            For i = 1 To quantidade
                chave = Trim$(CStr(ws.Cells(r, 5).Value)) & CStr(i)
                escolha = ValorEscolha(chave)
                If Len(escolha) > 0 Then
                    If Not MagiaExtraPermitida(escolha, tipoMagia, circuloMaximo, opcoesFixas) Then escolha = vbNullString
                End If
                If Len(escolha) = 0 And Not ApenasResumo Then
                    escolha = EscolherMagiaExtraFormulario(tipoMagia, circuloMaximo, opcoesFixas, fonteNome & " (" & i & " de " & quantidade & ")")
                    If Len(escolha) > 0 Then DefinirEscolha chave, escolha, "Magia extra fora do limite de escolas da classe."
                End If
                If Len(escolha) > 0 Then lista.Add origemTipo & vbTab & fonteNome & vbTab & escolha
            Next i
        End If
    Next r

    Set MagiasExtrasAtivas = lista
End Function

Private Function RegraExtraAtiva(ByVal origemTipo As String, ByVal origemNome As String, ByVal classe As String, ByVal raca As String, ByVal ativoAuto As Variant) As Boolean
    If Not ValorVerdadeiroLocal(ativoAuto) Then Exit Function
    If MesmoTexto(origemTipo, "Raca") Then
        RegraExtraAtiva = MesmoTexto(origemNome, raca)
    ElseIf MesmoTexto(origemTipo, "Classe") Then
        RegraExtraAtiva = MesmoTexto(origemNome, classe)
    ElseIf MesmoTexto(origemTipo, "Poder") Then
        RegraExtraAtiva = True
    End If
End Function

Private Function AtributoChaveMagiaExtraAtiva() As String
    Dim ws As Worksheet
    Dim wsP As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long

    If Not PlanilhaExiste(PLANILHA_BASE_MAGIAS_EXTRAS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS_EXTRAS)
    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        If RegraExtraAtiva(CStr(ws.Cells(r, 1).Value), CStr(ws.Cells(r, 2).Value), CStr(wsP.Range("F2").Value), CStr(wsP.Range("B2").Value), ws.Cells(r, 12).Value) Then
            AtributoChaveMagiaExtraAtiva = UCase$(Trim$(CStr(ws.Cells(r, 9).Value)))
            Exit Function
        End If
    Next r
End Function

Private Function EscolherMagiaExtraFormulario(ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal opcoesFixas As Collection, ByVal titulo As String) As String
    Dim opcoes As Collection
    Set opcoes = OpcoesMagiasExtras(tipoMagia, circuloMaximo, opcoesFixas)
    If opcoes.Count = 0 Then Exit Function
    EscolherMagiaExtraFormulario = EscolherMagiaPorFormulario(titulo, opcoes)
End Function

Private Function OpcoesMagiasExtras(ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal opcoesFixas As Collection) As Collection
    Dim ws As Worksheet
    Dim lista As Collection
    Dim ultimaLinha As Long
    Dim r As Long
    Dim nome As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    Set lista = New Collection

    If Not opcoesFixas Is Nothing Then
        If opcoesFixas.Count > 0 Then
            For r = 1 To opcoesFixas.Count
                nome = CStr(opcoesFixas(r))
                If MagiaExtraPermitida(nome, tipoMagia, circuloMaximo, opcoesFixas) Then AdicionarUnico lista, nome
            Next r
            Set OpcoesMagiasExtras = lista
            Exit Function
        End If
    End If

    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        nome = Trim$(CStr(ws.Cells(r, 2).Value))
        If Len(nome) > 0 Then
            If MagiaExtraPermitida(nome, tipoMagia, circuloMaximo, opcoesFixas) Then AdicionarUnico lista, nome
        End If
    Next r

    Set OpcoesMagiasExtras = lista
End Function

Private Function MagiaExtraPermitida(ByVal nome As String, ByVal tipoMagia As String, ByVal circuloMaximo As Long, ByVal opcoesFixas As Collection) As Boolean
    Dim ws As Worksheet
    Dim linha As Variant
    Dim tipo As String
    Dim circulo As Long

    If Len(nome) = 0 Then Exit Function
    If Not opcoesFixas Is Nothing Then
        If opcoesFixas.Count > 0 Then
            If Not Contem(opcoesFixas, nome) Then Exit Function
        End If
    End If

    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    linha = Application.Match(nome, ws.Columns(2), 0)
    If IsError(linha) Then Exit Function

    tipo = Trim$(CStr(ws.Cells(CLng(linha), 3).Value))
    circulo = CLng(Val(CStr(ws.Cells(CLng(linha), 4).Value)))

    If Not (MesmoTexto(tipoMagia, "Qualquer") Or MesmoTexto(tipo, tipoMagia) Or MesmoTexto(tipo, "Universal")) Then Exit Function
    If circuloMaximo > 0 And circulo > circuloMaximo Then Exit Function
    MagiaExtraPermitida = True
End Function

Private Function ResumoMagiasExtras(ByVal magiasExtras As Collection) As String
    Dim partes As Collection
    Dim item As Variant
    Dim campos As Variant

    Set partes = New Collection
    For Each item In magiasExtras
        campos = Split(CStr(item), vbTab)
        If UBound(campos) >= 2 Then AdicionarUnico partes, CStr(campos(1)) & ": " & CStr(campos(2))
    Next item
    ResumoMagiasExtras = TextoColecao(partes, " | ")
End Function

Private Sub EscreverMagiasConhecidas(ByVal classe As String, ByVal magias As Collection, ByVal magiasExtras As Collection)
    Dim wsM As Worksheet
    Dim wsB As Worksheet
    Dim proxima As Long
    Dim item As Variant
    Dim partes As Variant

    Set wsM = ThisWorkbook.Worksheets(PLANILHA_CONHECIDAS)
    Set wsB = ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS)
    PrepararConhecidas
    proxima = 2

    For Each item In magias
        AdicionarMagiaConhecida wsM, wsB, proxima, "Classe", classe, CStr(item)
    Next item

    For Each item In magiasExtras
        partes = Split(CStr(item), vbTab)
        If UBound(partes) >= 2 Then
            AdicionarMagiaConhecida wsM, wsB, proxima, CStr(partes(0)), CStr(partes(1)), CStr(partes(2))
        End If
    Next item
End Sub

Private Sub AdicionarMagiaConhecida(ByVal wsM As Worksheet, ByVal wsB As Worksheet, ByRef proxima As Long, ByVal fonteTipo As String, ByVal fonteNome As String, ByVal magia As String)
    Dim linha As Variant

    linha = Application.Match(magia, wsB.Columns(2), 0)
    If IsError(linha) Then Exit Sub

    wsM.Cells(proxima, 1).Value = fonteTipo
    wsM.Cells(proxima, 2).Value = fonteNome
    wsM.Cells(proxima, 3).Value = magia
    wsM.Cells(proxima, 4).Value = wsB.Cells(CLng(linha), 3).Value
    wsM.Cells(proxima, 5).Value = wsB.Cells(CLng(linha), 4).Value
    wsM.Cells(proxima, 6).Value = wsB.Cells(CLng(linha), 5).Value
    wsM.Cells(proxima, 7).Value = wsB.Cells(CLng(linha), 6).Value
    wsM.Cells(proxima, 8).Value = wsB.Cells(CLng(linha), 7).Value
    wsM.Cells(proxima, 9).Value = AlvoAreaEfeito(wsB, CLng(linha))
    wsM.Cells(proxima, 10).Value = wsB.Cells(CLng(linha), 11).Value
    wsM.Cells(proxima, 11).Value = wsB.Cells(CLng(linha), 12).Value
    proxima = proxima + 1
End Sub

Private Function AlvoAreaEfeito(ByVal ws As Worksheet, ByVal linha As Long) As String
    Dim partes As Collection
    Set partes = New Collection
    AdicionarUnico partes, Trim$(CStr(ws.Cells(linha, 8).Value))
    AdicionarUnico partes, Trim$(CStr(ws.Cells(linha, 9).Value))
    AdicionarUnico partes, Trim$(CStr(ws.Cells(linha, 10).Value))
    AlvoAreaEfeito = TextoColecao(partes, " / ")
End Function

Private Sub EscreverControle(ByVal classe As String, ByVal classeId As String, ByVal tipoMagia As String, ByVal atributo As String, ByVal ValorAtributo As Double, ByVal bonusCd As Double, ByVal cdMagia As Double, ByVal circuloMaximo As Long, ByVal escolas As String, ByVal qtdMagias As Long, ByVal qtdEsperada As Long, ByVal qtdExtras As Long, ByVal resumoExtras As String, ByVal observacao As String)
    Dim ws As Worksheet
    Dim atributoPadrao As String
    Dim overrideAtributo As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)
    PrepararControle
    atributoPadrao = AtributoPadraoMagiaClasse(classe, classeId)
    overrideAtributo = OverrideAtributoMagia(classeId)
    ws.Cells(2, 1).Value = classe
    ws.Cells(2, 2).Value = classeId
    ws.Cells(2, 3).Value = IIf(Len(tipoMagia) > 0, "SIM", "NAO")
    ws.Cells(2, 4).Value = tipoMagia
    ws.Cells(2, 5).Value = atributo
    ws.Cells(2, 6).Value = ValorAtributo
    ws.Cells(2, 7).Value = bonusCd
    ws.Cells(2, 8).Value = cdMagia
    ws.Cells(2, 9).Value = circuloMaximo
    ws.Cells(2, 10).Value = escolas
    ws.Cells(2, 11).Value = qtdMagias
    ws.Cells(2, 12).Value = qtdEsperada
    ws.Cells(2, 13).Value = ValorEscolha("EfeitoInicial|Classe|" & classe & "|" & FontePMClasse(classeId) & "|bonus_pm|" & LCase$(atributo))
    ws.Cells(2, 14).Value = observacao
    ws.Cells(2, 15).Value = ResumoEscolhaPrincipal(classeId)
    ws.Cells(2, 16).Value = ResumoEscolhaDetalhe(classeId)
    ws.Cells(2, 17).Value = ResumoEscolhaExtra(classeId)
    ws.Cells(2, 18).Value = qtdExtras
    ws.Cells(2, 19).Value = resumoExtras
    ws.Cells(2, 20).Value = atributoPadrao
    ws.Cells(2, 21).Value = overrideAtributo
    ws.Cells(2, 22).Value = NomeAtributoPorCodigo(overrideAtributo)
    ws.Cells(2, 23).Value = ValorEscolha("Classe_arcanista_Caminho")
    ws.Cells(2, 24).Value = NomeAtributoPorCodigo(atributo)
    ws.Cells(2, 25).Value = NomeAtributoPorCodigo(atributoPadrao)
    AtualizarPainelMagiasPrincipal classeId, Len(tipoMagia) > 0 Or qtdExtras > 0
End Sub

Private Function AtributoChaveComOverride(ByVal classeId As String, ByVal atributoPadrao As String) As String
    Dim overrideAtributo As String

    atributoPadrao = UCase$(Trim$(atributoPadrao))
    overrideAtributo = OverrideAtributoMagia(classeId)
    If Len(overrideAtributo) > 0 And overrideAtributo <> "AUTO" Then
        AtributoChaveComOverride = overrideAtributo
    Else
        AtributoChaveComOverride = atributoPadrao
    End If
End Function

Private Function AtributoPadraoMagiaClasse(ByVal classe As String, ByVal classeId As String) As String
    Dim linhaRegra As Long
    Dim atributo As String
    Dim caminho As String

    linhaRegra = LinhaRegraConjuracao(classe)
    If linhaRegra = 0 Then Exit Function

    atributo = UCase$(Trim$(TextoRegra(linhaRegra, 4)))
    If StrComp(atributo, "CAMINHO_ARCANISTA", vbTextCompare) = 0 Or classeId = "arcanista" Then
        caminho = ValorEscolha("Classe_arcanista_Caminho")
        If MesmoTexto(caminho, "Feiticeiro") Then
            AtributoPadraoMagiaClasse = "CAR"
        Else
            AtributoPadraoMagiaClasse = "INT"
        End If
    Else
        AtributoPadraoMagiaClasse = atributo
    End If
End Function

Private Function OverrideAtributoMagia(ByVal classeId As String) As String
    Dim valor As String

    If Len(Trim$(classeId)) = 0 Then
        OverrideAtributoMagia = "AUTO"
        Exit Function
    End If

    valor = CodigoAtributoEntrada(ValorEscolha(ChaveOverrideAtributoMagia(classeId)))
    If Len(valor) = 0 Then valor = "AUTO"
    OverrideAtributoMagia = valor
End Function

Private Function ChaveOverrideAtributoMagia(ByVal classeId As String) As String
    ChaveOverrideAtributoMagia = "Classe_" & classeId & "_AtributoMagia_Override"
End Function

Private Sub AtualizarPainelMagiasPrincipal(ByVal classeId As String, ByVal temMagia As Boolean)
    Dim wsP As Worksheet
    Dim codigoExibicao As String

    Set wsP = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)

    If temMagia And Len(classeId) > 0 Then
        codigoExibicao = OverrideAtributoMagia(classeId)
        If MesmoTexto(codigoExibicao, "AUTO") Then codigoExibicao = AtributoPadraoMagiaClasse(CStr(wsP.Range("F2").Value), classeId)
        wsP.Range("F45").Value = NomeAtributoPorCodigo(codigoExibicao)
    Else
        wsP.Range("F45").ClearContents
    End If

    ConfigurarValidacaoPainelMagias wsP
End Sub

Private Sub ConfigurarValidacaoPainelMagias(ByVal wsP As Worksheet)
    Dim SEP As String

    SEP = Application.International(xlListSeparator)
    On Error Resume Next
    wsP.Range("F45").Validation.Delete
    On Error GoTo 0

    On Error Resume Next
    wsP.Range("F45").Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:=NomeAutomatico() & SEP & NomeForca() & SEP & NomeDestreza() & SEP & NomeConstituicao() & SEP & NomeInteligencia() & SEP & NomeSabedoria() & SEP & NomeCarisma()
    On Error GoTo 0
End Sub

Private Function CodigoAtributoEntrada(ByVal valor As String) As String
    Select Case TextoComparacao(valor)
        Case "", "auto", "automatico"
            CodigoAtributoEntrada = "AUTO"
        Case "for", "forca"
            CodigoAtributoEntrada = "FOR"
        Case "des", "destreza"
            CodigoAtributoEntrada = "DES"
        Case "con", "constituicao"
            CodigoAtributoEntrada = "CON"
        Case "int", "inteligencia"
            CodigoAtributoEntrada = "INT"
        Case "sab", "sabedoria"
            CodigoAtributoEntrada = "SAB"
        Case "car", "carisma"
            CodigoAtributoEntrada = "CAR"
    End Select
End Function

Private Function BonusCdAtivo() As Double
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim tipo As String

    If Not PlanilhaExiste(PLANILHA_EFEITOS_ATIVOS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_EFEITOS_ATIVOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        tipo = LCase$(Trim$(CStr(ws.Cells(r, 4).Value)))
        Select Case tipo
            Case "bonus_cd", "bonus_cd_magia", "bonus_cd_magias"
                BonusCdAtivo = BonusCdAtivo + Val(CStr(ws.Cells(r, 8).Value))
        End Select
    Next r
End Function

Private Function NomeAtributoPorCodigo(ByVal codigo As String) As String
    Select Case UCase$(Trim$(codigo))
        Case "FOR": NomeAtributoPorCodigo = NomeForca()
        Case "DES": NomeAtributoPorCodigo = NomeDestreza()
        Case "CON": NomeAtributoPorCodigo = NomeConstituicao()
        Case "INT": NomeAtributoPorCodigo = NomeInteligencia()
        Case "SAB": NomeAtributoPorCodigo = NomeSabedoria()
        Case "CAR": NomeAtributoPorCodigo = NomeCarisma()
        Case Else: NomeAtributoPorCodigo = NomeAutomatico()
    End Select
End Function

Private Function NomeAutomatico() As String
    NomeAutomatico = "Autom" & ChrW$(225) & "tico"
End Function

Private Function NomeForca() As String
    NomeForca = "For" & ChrW$(231) & "a"
End Function

Private Function NomeDestreza() As String
    NomeDestreza = "Destreza"
End Function

Private Function NomeConstituicao() As String
    NomeConstituicao = "Constitui" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function NomeInteligencia() As String
    NomeInteligencia = "Intelig" & ChrW$(234) & "ncia"
End Function

Private Function NomeSabedoria() As String
    NomeSabedoria = "Sabedoria"
End Function

Private Function NomeCarisma() As String
    NomeCarisma = "Carisma"
End Function

Private Function FontePMClasse(ByVal classeId As String) As String
    If classeId = "ventanista" Then
        FontePMClasse = "ventanista_charme"
    ElseIf Len(classeId) > 0 Then
        FontePMClasse = classeId & "_magias"
    End If
End Function

Private Function ResumoEscolhaPrincipal(ByVal classeId As String) As String
    Dim caminho As String
    Dim afinidade As String

    If classeId = "arcanista" Then
        caminho = ValorEscolha("Classe_arcanista_Caminho")
        If Len(caminho) > 0 Then ResumoEscolhaPrincipal = "Caminho: " & caminho
    ElseIf classeId = "mistico" Then
        afinidade = ValorEscolha("Classe_mistico_Afinidade")
        If Len(afinidade) > 0 Then ResumoEscolhaPrincipal = "Afinidade: " & afinidade
    End If
End Function

Private Function ResumoEscolhaDetalhe(ByVal classeId As String) As String
    Dim caminho As String
    Dim linhagem As String
    Dim escolas As Collection
    Dim i As Long
    Dim escolha As String

    If classeId = "arcanista" Then
        caminho = ValorEscolha("Classe_arcanista_Caminho")
        If MesmoTexto(caminho, "Feiticeiro") Then
            linhagem = ValorEscolha("Classe_arcanista_Feiticeiro_Linhagem")
            If Len(linhagem) > 0 Then ResumoEscolhaDetalhe = "Linhagem: " & linhagem
        ElseIf MesmoTexto(caminho, "Mago") Then
            Set escolas = New Collection
            For i = 1 To 3
                escolha = ValorEscolha("Classe_arcanista_Mago_Escola_" & CStr(i))
                If Len(escolha) > 0 Then AdicionarUnico escolas, escolha
            Next i
            If escolas.Count > 0 Then ResumoEscolhaDetalhe = "Escolas do Mago: " & TextoColecao(escolas, ", ")
        End If
    ElseIf classeId = "mistico" Then
        escolha = ValorEscolha("Classe_mistico_Escola_3")
        If Len(escolha) > 0 Then ResumoEscolhaDetalhe = "Terceira escola: " & escolha
    End If
End Function

Private Function ResumoEscolhaExtra(ByVal classeId As String) As String
    Dim linhagem As String
    Dim elemento As String

    If classeId = "arcanista" Then
        linhagem = ValorEscolha("Classe_arcanista_Feiticeiro_Linhagem")
        If MesmoTexto(linhagem, "Draconica") Then
            elemento = ValorEscolha("Classe_arcanista_Feiticeiro_Draconica_Elemento")
            If Len(elemento) > 0 Then ResumoEscolhaExtra = "Elemento: " & elemento
        End If
    ElseIf classeId = "mistico" Then
        elemento = ValorEscolha("Classe_mistico_Afinidade")
        If Len(elemento) > 0 Then ResumoEscolhaExtra = "RD elemental: 5 por circulo"
    End If
End Function

Private Sub PrepararControle()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)
    ws.Range("A1:Y1").Value = Array("Classe", "ClasseId", "TemMagias", "TipoMagia", "AtributoChave", "ValorAtributo", "BonusCD", "CD", "CirculoMaximo", "EscolasPermitidas", "QtdMagiasConhecidas", "QtdMagiasEsperadas", "PMInicialTravado", "Observacao", "EscolhaPrincipal", "EscolhaDetalhe", "EscolhaExtra", "QtdMagiasExtras", "MagiasExtras", "AtributoPadrao", "OverrideAtributo", "OverrideExibicao", "CaminhoArcanista", "AtributoChaveExibicao", "AtributoPadraoExibicao")
    If ws.Cells(ws.Rows.Count, 1).End(xlUp).Row > 1 Then ws.Range("A2:Y" & ws.Cells(ws.Rows.Count, 1).End(xlUp).Row).ClearContents
End Sub

Private Sub PrepararConhecidas()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_CONHECIDAS)
    ws.Range("A1:K1").Value = Array("FonteTipo", "FonteNome", "Magia", "Tipo", "Circulo", "Escola", "Execucao", "Alcance", "AlvoAreaEfeito", "Duracao", "Resistencia")
    If ws.Cells(ws.Rows.Count, 1).End(xlUp).Row > 1 Then ws.Range("A2:K" & ws.Cells(ws.Rows.Count, 1).End(xlUp).Row).ClearContents
End Sub

Private Function LinhaRegraConjuracao(ByVal classe As String) As Long
    Dim ws As Worksheet
    Dim resultado As Variant
    If Len(Trim$(classe)) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO)
    resultado = Application.Match(classe, ws.Columns(1), 0)
    If Not IsError(resultado) Then LinhaRegraConjuracao = CLng(resultado)
End Function

Private Function TextoRegra(ByVal linha As Long, ByVal coluna As Long) As String
    If linha <= 0 Then Exit Function
    TextoRegra = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE_CONJURACAO).Cells(linha, coluna).Value))
End Function

Private Function MagiaExiste(ByVal nome As String) As Boolean
    Dim resultado As Variant
    If Len(nome) = 0 Then Exit Function
    resultado = Application.Match(nome, ThisWorkbook.Worksheets(PLANILHA_BASE_MAGIAS).Columns(2), 0)
    MagiaExiste = Not IsError(resultado)
End Function

Private Function ValorAtributoCodigo(ByVal atributo As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    Select Case UCase$(Trim$(atributo))
        Case "FOR": ValorAtributoCodigo = Val(CStr(ws.Range("A6").Value))
        Case "DES": ValorAtributoCodigo = Val(CStr(ws.Range("B6").Value))
        Case "CON": ValorAtributoCodigo = Val(CStr(ws.Range("C6").Value))
        Case "INT": ValorAtributoCodigo = Val(CStr(ws.Range("D6").Value))
        Case "SAB": ValorAtributoCodigo = Val(CStr(ws.Range("E6").Value))
        Case "CAR": ValorAtributoCodigo = Val(CStr(ws.Range("F6").Value))
    End Select
End Function

Private Function GarantirEscolha(ByVal chave As String, ByVal titulo As String, ByVal opcoes As Collection, Optional ByVal opcoesSaoAtributos As Boolean = False) As String
    Dim escolha As String
    escolha = ValorEscolha(chave)
    If Len(escolha) = 0 Or Not Contem(opcoes, escolha) Then
        escolha = EscolherOpcaoFormulario(titulo, opcoes, opcoesSaoAtributos)
        If Len(escolha) > 0 Then DefinirEscolha chave, escolha, "Automacao de magias."
    End If
    GarantirEscolha = escolha
End Function

Private Function EscolherOpcaoFormulario(ByVal titulo As String, ByVal opcoes As Collection, Optional ByVal opcoesSaoAtributos As Boolean = False) As String
    Dim formulario As Object
    If opcoes Is Nothing Then Exit Function
    If opcoes.Count = 0 Then Exit Function

    Set formulario = VBA.UserForms.Add("UserForm1")
    formulario.Carregar titulo, opcoes, opcoesSaoAtributos
    formulario.Show vbModal
    If Not formulario.Cancelado Then EscolherOpcaoFormulario = formulario.escolha
    Unload formulario
End Function

Private Function ValorEscolha(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    chave = Trim$(chave)
    If Len(chave) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEscolha = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEscolha(ByVal chave As String, ByVal valor As String, Optional ByVal observacao As String = "")
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long

    chave = Trim$(chave)
    If Len(chave) = 0 Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If IsError(resultado) Then
        linha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
        ws.Cells(linha, 1).Value = chave
    Else
        linha = CLng(resultado)
    End If
    ws.Cells(linha, 2).Value = valor
    If Len(observacao) > 0 Then ws.Cells(linha, 3).Value = observacao
End Sub

Private Function ExisteEscolhaPrefixo(ByVal prefixo As String) As Boolean
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim chave As String

    prefixo = Trim$(prefixo)
    If Len(prefixo) = 0 Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = 2 To ultimaLinha
        chave = Trim$(CStr(ws.Cells(r, 1).Value))
        If StrComp(Left$(chave, Len(prefixo)), prefixo, vbTextCompare) = 0 Then
            ExisteEscolhaPrefixo = True
            Exit Function
        End If
    Next r
End Function

Private Sub ExcluirEscolhasPrefixo(ByVal prefixo As String)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    Dim chave As String

    prefixo = Trim$(prefixo)
    If Len(prefixo) = 0 Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_ESCOLHAS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    For r = ultimaLinha To 2 Step -1
        chave = Trim$(CStr(ws.Cells(r, 1).Value))
        If StrComp(Left$(chave, Len(prefixo)), prefixo, vbTextCompare) = 0 Then
            ws.Rows(r).Delete
        End If
    Next r
End Sub

Private Function TodasEscolas() As Collection
    Set TodasEscolas = NovaLista(EscolaAbjuracao(), EscolaAdivinhacao(), EscolaConvocacao(), EscolaEncantamento(), EscolaEvocacao(), EscolaIlusao(), EscolaNecromancia(), EscolaTransmutacao())
End Function

Private Function AfinidadesMistico() As Collection
    Set AfinidadesMistico = NovaLista(NomeAgua(), "Ar", "Fogo", "Luz", "Terra", "Trevas")
End Function

Private Function EscolaAfinidadeMistico(ByVal afinidade As String) As String
    Select Case TextoComparacao(afinidade)
        Case "agua": EscolaAfinidadeMistico = EscolaEncantamento()
        Case "ar": EscolaAfinidadeMistico = EscolaIlusao()
        Case "fogo": EscolaAfinidadeMistico = EscolaTransmutacao()
        Case "luz": EscolaAfinidadeMistico = EscolaAbjuracao()
        Case "terra": EscolaAfinidadeMistico = EscolaConvocacao()
        Case "trevas": EscolaAfinidadeMistico = EscolaNecromancia()
    End Select
End Function

Private Function EscolaAbjuracao() As String
    EscolaAbjuracao = "Abjura" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function EscolaAdivinhacao() As String
    EscolaAdivinhacao = "Adivinha" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function EscolaConvocacao() As String
    EscolaConvocacao = "Convoca" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function EscolaEncantamento() As String
    EscolaEncantamento = "Encantamento"
End Function

Private Function EscolaEvocacao() As String
    EscolaEvocacao = "Evoca" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function EscolaIlusao() As String
    EscolaIlusao = "Ilus" & ChrW$(227) & "o"
End Function

Private Function EscolaNecromancia() As String
    EscolaNecromancia = "Necromancia"
End Function

Private Function EscolaTransmutacao() As String
    EscolaTransmutacao = "Transmuta" & ChrW$(231) & ChrW$(227) & "o"
End Function

Private Function NomeAgua() As String
    NomeAgua = ChrW$(193) & "gua"
End Function

Private Function NovaLista(ParamArray itens() As Variant) As Collection
    Dim lista As Collection
    Dim i As Long
    Set lista = New Collection
    For i = LBound(itens) To UBound(itens)
        AdicionarUnico lista, CStr(itens(i))
    Next i
    Set NovaLista = lista
End Function

Private Function ListaPorTexto(ByVal texto As String) As Collection
    Dim lista As Collection
    Dim partes As Variant
    Dim parte As Variant
    Dim valor As String

    Set lista = New Collection
    texto = Replace(texto, ",", ";")
    partes = Split(texto, ";")
    For Each parte In partes
        valor = Trim$(CStr(parte))
        If Len(valor) > 0 Then AdicionarUnico lista, valor
    Next parte
    Set ListaPorTexto = lista
End Function

Private Function RemoverUsadas(ByVal base As Collection, ByVal usadas As Collection) As Collection
    Dim lista As Collection
    Dim item As Variant
    Set lista = New Collection
    For Each item In base
        If Not Contem(usadas, CStr(item)) Then AdicionarUnico lista, CStr(item)
    Next item
    Set RemoverUsadas = lista
End Function

Private Sub RemoverItem(ByVal lista As Collection, ByVal valor As String)
    Dim i As Long
    For i = lista.Count To 1 Step -1
        If MesmoTexto(CStr(lista(i)), valor) Then lista.Remove i
    Next i
End Sub

Private Sub AdicionarUnico(ByVal lista As Collection, ByVal valor As String)
    valor = Trim$(valor)
    If Len(valor) = 0 Then Exit Sub
    If Not Contem(lista, valor) Then lista.Add valor
End Sub

Private Function Contem(ByVal lista As Collection, ByVal valor As String) As Boolean
    Dim item As Variant
    If lista Is Nothing Then Exit Function
    For Each item In lista
        If MesmoTexto(CStr(item), valor) Then
            Contem = True
            Exit Function
        End If
    Next item
End Function

Private Function TextoColecao(ByVal lista As Collection, ByVal separador As String) As String
    Dim partes() As String
    Dim i As Long
    If lista Is Nothing Then Exit Function
    If lista.Count = 0 Then Exit Function
    ReDim partes(1 To lista.Count)
    For i = 1 To lista.Count
        partes(i) = CStr(lista(i))
    Next i
    TextoColecao = Join(partes, separador)
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function

Private Function ValorVerdadeiroLocal(ByVal valor As Variant) As Boolean
    If VarType(valor) = vbBoolean Then
        ValorVerdadeiroLocal = CBool(valor)
    Else
        Select Case UCase$(Trim$(CStr(valor)))
            Case "TRUE", "VERDADEIRO", "SIM", "1"
                ValorVerdadeiroLocal = True
        End Select
    End If
End Function

Private Function TextoComparacao(ByVal texto As String) As String
    texto = LCase$(Trim$(texto))
    texto = Replace(texto, ChrW$(193), "a")
    texto = Replace(texto, ChrW$(225), "a")
    texto = Replace(texto, ChrW$(195), "a")
    texto = Replace(texto, ChrW$(227), "a")
    texto = Replace(texto, ChrW$(201), "e")
    texto = Replace(texto, ChrW$(233), "e")
    texto = Replace(texto, ChrW$(205), "i")
    texto = Replace(texto, ChrW$(237), "i")
    texto = Replace(texto, ChrW$(211), "o")
    texto = Replace(texto, ChrW$(243), "o")
    texto = Replace(texto, ChrW$(213), "o")
    texto = Replace(texto, ChrW$(245), "o")
    texto = Replace(texto, ChrW$(218), "u")
    texto = Replace(texto, ChrW$(250), "u")
    texto = Replace(texto, ChrW$(199), "c")
    texto = Replace(texto, ChrW$(231), "c")
    TextoComparacao = texto
End Function

Private Function PlanilhaExiste(ByVal nome As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    PlanilhaExiste = Not ws Is Nothing
    On Error GoTo 0
End Function
