Attribute VB_Name = "modInventarioT20"
Option Explicit

Private Const PLANILHA_PRINCIPAL As String = "Principal"
Private Const PLANILHA_BASE As String = "Base_Inventario"
Private Const PLANILHA_CONTROLE As String = "Inventario_Controle"
Private Const PLANILHA_EFEITOS As String = "Efeitos_Ativos"

Public Function CodexInventarioT20Version() As String
    CodexInventarioT20Version = "T20 inventario layout atualizacao 2026-08-31"
End Function

Public Sub AtualizarInventario(Optional ByVal ExibirAvisos As Boolean = False)
    Dim ws As Worksheet
    If Not PlanilhaExiste(PLANILHA_PRINCIPAL) Or Not PlanilhaExiste(PLANILHA_BASE) Or Not PlanilhaExiste(PLANILHA_CONTROLE) Then Exit Sub
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    AtualizarQuantidadesEPesos ws
    AtualizarListasEquipamentos ws
    PreencherEquipamentosPadrao ws
    SincronizarItensVestidos ws, ExibirAvisos
    ValidarEmpunhaduras ws, Nothing, ExibirAvisos
    AtualizarFormulas ws
    modEstadoExcelT20.SolicitarRecalculo
End Sub

Public Sub ProcessarAlteracaoInventario(ByVal ws As Worksheet, ByVal alvo As Range)
    Dim celula As Range
    Set celula = alvo.Cells(1, 1)

    If CelulaNaMochila(celula) Then
        If EhCelulaItemMochila(celula) And Len(Trim$(CStr(celula.Value))) > 0 Then
            If Val(CStr(CelulaQuantidadePorItem(ws, celula).Value)) <= 0 Then CelulaQuantidadePorItem(ws, celula).Value = 1
        End If
        AtualizarInventario False
    ElseIf Not Intersect(celula, ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS)) Is Nothing Then
        ValidarEscolhaItemVestido ws, celula, True
        AtualizarFormulas ws
        modRegrasT20.AtualizarEfeitosAtivos
        modEstadoExcelT20.SolicitarRecalculo
    ElseIf Not Intersect(celula, ws.Range("A10:A14,G10:G14,A21:A22,D21:D22")) Is Nothing Then
        ValidarEmpunhaduras ws, celula, True
        If celula.Address(False, False) = "D21" Or celula.Address(False, False) = "A21" Then SincronizarArmaduraVestida ws, celula.Address(False, False) = "D21", True
        AtualizarFormulas ws
        modEstadoExcelT20.SolicitarRecalculo
    ElseIf Not Intersect(celula, ws.Range(modLayoutT20.CELULA_TIBARES_COBRE & ":" & modLayoutT20.CELULA_TIBARES_OURO)) Is Nothing Then
        If Val(CStr(celula.Value)) < 0 Then celula.Value = 0
        modEstadoExcelT20.SolicitarRecalculo
    End If
End Sub

Public Function TextoCritico(ByVal itemExibicao As String) As String
    Dim linha As Long
    Dim margem As Long
    Dim multiplicador As Long
    Dim limite As Long

    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha = 0 Then Exit Function
    margem = CLng(Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 10).Value)))
    multiplicador = ExtrairMultiplicador(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 11).Value))
    If multiplicador < 2 Then multiplicador = 2
    If margem >= 11 Then
        limite = margem
    Else
        limite = 20 - margem
    End If
    If limite < 2 Then limite = 2
    If limite = 20 Then
        TextoCritico = CStr(multiplicador) & "x"
    Else
        TextoCritico = CStr(limite)
        If multiplicador > 2 Then TextoCritico = TextoCritico & "/" & CStr(multiplicador) & "x"
    End If
End Function

Private Function ExtrairMultiplicador(ByVal valor As String) As Long
    valor = LCase$(Trim$(valor))
    valor = Replace(valor, "x", vbNullString)
    ExtrairMultiplicador = CLng(Val(valor))
End Function

Public Function TesteAtaque(ByVal itemExibicao As String) As Variant
    Dim linha As Long
    Dim valorBase As Variant

    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha = 0 Then Exit Function
    If MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 7).Value, "a_distancia") Then
        valorBase = modLayoutT20.ValorPericia("Pontaria")
    Else
        valorBase = modLayoutT20.ValorPericia("Luta")
    End If
    If Not IsNumeric(valorBase) Then
        TesteAtaque = valorBase
        Exit Function
    End If
    TesteAtaque = CDbl(valorBase) + SomaEfeito("bonus_ataque", vbNullString) + BonusAtaqueEmpunhadura(itemExibicao)
End Function

Public Function TextoDano(ByVal itemExibicao As String) As String
    Dim linha As Long
    Dim dano As String
    Dim atributo As String
    Dim bonus As Double

    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha = 0 Then Exit Function
    dano = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 9).Value))
    atributo = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 23).Value))
    If Len(atributo) = 0 Then
        If MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 7).Value, "a_distancia") Then
            atributo = "DES"
        Else
            atributo = "FOR"
        End If
    End If
    bonus = modLayoutT20.ValorAtributo(atributo) + SomaEfeito("bonus_dano", vbNullString)
    TextoDano = dano
    If bonus > 0 Then TextoDano = TextoDano & "+" & FormatarNumero(bonus)
    If bonus < 0 Then TextoDano = TextoDano & FormatarNumero(bonus)
End Function

Public Function TipoDano(ByVal itemExibicao As String) As String
    Dim linha As Long
    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha > 0 Then TipoDano = CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 13).Value)
End Function

Public Function AlcanceArma(ByVal itemExibicao As String) As String
    Dim linha As Long
    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha > 0 Then AlcanceArma = CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 12).Value)
End Function

Public Function PesoItem(ByVal itemExibicao As String) As Double
    Dim linha As Long
    Application.Volatile
    linha = LinhaItem(itemExibicao)
    If linha > 0 Then PesoItem = Val(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 6).Value))
End Function

Public Function BonusAtaqueEmpunhadura(ByVal itemExibicao As String) As Double
    Application.Volatile
    If CondicaoEstiloUmaArma(itemExibicao) Then BonusAtaqueEmpunhadura = SomaEfeito("bonus_ataque_condicional", "Estilo de Uma Arma")
End Function

Public Function BonusDefesaEmpunhadura() As Double
    Dim ws As Worksheet
    Dim r As Long
    Application.Volatile
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = modLayoutT20.PRIMEIRA_LINHA_ATAQUE To modLayoutT20.ULTIMA_LINHA_ATAQUE
        If CondicaoEstiloUmaArma(CStr(ws.Cells(r, 1).Value)) Then
            BonusDefesaEmpunhadura = SomaEfeito("bonus_defesa_condicional", "Estilo de Uma Arma")
            Exit Function
        End If
    Next r
End Function

Public Function ArmaduraVestida() As Boolean
    Dim valor As Variant
    Application.Volatile
    valor = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("D21").Value
    ArmaduraVestida = (valor = True Or MesmoTexto(valor, "VERDADEIRO"))
End Function

Public Function EscudoEmpunhado() As Boolean
    Dim valor As String
    Application.Volatile
    valor = CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range("D22").Value)
    EscudoEmpunhado = MesmoTexto(valor, MaoEsquerda()) Or MesmoTexto(valor, MaoDireita())
End Function

Public Function PenalidadeArmaduraAtiva() As Double
    Dim ws As Worksheet
    Application.Volatile
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    If ArmaduraVestida() Then PenalidadeArmaduraAtiva = PenalidadeArmaduraAtiva + Abs(Val(CStr(ws.Range("C21").Value)))
    If EscudoEmpunhado() Then PenalidadeArmaduraAtiva = PenalidadeArmaduraAtiva + Abs(Val(CStr(ws.Range("C22").Value)))
End Function

Public Function LimiteItensVestidos() As Long
    LimiteItensVestidos = 4 + CLng(SomaEfeito("aumentar_limite_itens_vestidos", vbNullString)) _
        + CLng(SomaEfeito("bonus_limite_itens_vestidos", vbNullString))
    If LimiteItensVestidos < 0 Then LimiteItensVestidos = 0
End Function

Public Function QuantidadeItensVestidos() As Long
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    QuantidadeItensVestidos = Application.CountA(ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS))
End Function

Private Sub SincronizarItensVestidos(ByVal ws As Worksheet, ByVal ExibirAvisos As Boolean)
    Dim r As Long
    Dim item As String
    Dim vistos As Object

    ConfigurarListaItensVestidos ws
    Set vistos = CreateObject("Scripting.Dictionary")
    For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
        item = Trim$(CStr(ws.Cells(r, 4).Value))
        If Len(item) > 0 Then
            If Not ItemDisponivelParaVestir(item) Or vistos.Exists(LCase$(item)) Then
                ws.Cells(r, 4).ClearContents
                LimparComentario ws.Cells(r, 4)
            Else
                vistos.Add LCase$(item), True
                AtualizarComentarioItemVestido ws.Cells(r, 4), item
            End If
        End If
    Next r

    InicializarItensVestidos ws
    ws.Range("D21").Value = ItemEstaVestido(CStr(ws.Range("A21").Value))
    AtualizarComentarioLimite ws
End Sub

Private Function EhItemVestivel(ByVal itemExibicao As String) As Boolean
    Dim linha As Long
    Dim categoria As String

    linha = LinhaItem(itemExibicao)
    If linha = 0 Then Exit Function
    categoria = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 5).Value))
    EhItemVestivel = MesmoTexto(itemExibicao, "Mochila") Or MesmoTexto(categoria, "vestuario") Or _
        Len(Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 17).Value))) > 0
End Function

Private Sub AtualizarComentarioItemVestido(ByVal celula As Range, ByVal itemExibicao As String)
    Dim texto As String
    texto = "Item vestido." & vbCrLf & "Conta no limite normal de quatro itens vestidos."
    LimparComentario celula
    On Error Resume Next
    celula.AddComment texto
    On Error GoTo 0
End Sub

Private Sub AtualizarComentarioLimite(ByVal ws As Worksheet)
    LimparComentario ws.Range("D21")
    On Error Resume Next
    ws.Range("D21").AddComment "Armadura vestida conta neste limite." & vbCrLf & "Itens vestidos: " & CStr(QuantidadeItensVestidos()) & " de 4."
    On Error GoTo 0
End Sub

Private Sub ConfigurarListaItensVestidos(ByVal ws As Worksheet)
    Dim controle As Worksheet
    Dim ultima As Long

    Set controle = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)
    ultima = controle.Cells(controle.Rows.Count, 4).End(xlUp).Row
    On Error Resume Next
    ThisWorkbook.Names("Lista_Itens_Vestidos_T20").Delete
    If ultima >= 2 Then
        ThisWorkbook.Names.Add Name:="Lista_Itens_Vestidos_T20", RefersTo:="='" & PLANILHA_CONTROLE & "'!$D$2:$D$" & CStr(ultima)
    Else
        ThisWorkbook.Names.Add Name:="Lista_Itens_Vestidos_T20", RefersTo:="='" & PLANILHA_CONTROLE & "'!$D$1:$D$1"
    End If
    ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS).Validation.Delete
    ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS).Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:="=Lista_Itens_Vestidos_T20"
    ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS).Validation.IgnoreBlank = True
    ws.Range(modLayoutT20.RANGE_ITENS_VESTIDOS).Validation.InCellDropdown = True
    On Error GoTo 0
End Sub

Private Function ItemDisponivelParaVestir(ByVal item As String) As Boolean
    Dim resultado As Variant
    resultado = Application.Match(item, ThisWorkbook.Worksheets(PLANILHA_CONTROLE).Columns(4), 0)
    ItemDisponivelParaVestir = Not IsError(resultado)
End Function

Private Function ItemEstaVestido(ByVal item As String) As Boolean
    Dim resultado As Variant
    If Len(Trim$(item)) = 0 Then Exit Function
    resultado = Application.Match(item, ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Range(modLayoutT20.RANGE_ITENS_VESTIDOS), 0)
    ItemEstaVestido = Not IsError(resultado)
End Function

Private Sub InicializarItensVestidos(ByVal ws As Worksheet)
    Dim controle As Worksheet
    Dim ultima As Long
    Dim r As Long
    Dim item As String

    If MesmoTexto(ValorEstadoInventario("Inventario|VestidosInicializados"), "SIM") Then Exit Sub
    Set controle = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)
    ultima = controle.Cells(controle.Rows.Count, 4).End(xlUp).Row
    If ultima < 2 Then Exit Sub
    For r = 2 To ultima
        item = Trim$(CStr(controle.Cells(r, 4).Value))
        If Len(item) > 0 Then AdicionarItemVestido ws, item
        If QuantidadeItensVestidos() >= 4 Then Exit For
    Next r
    DefinirEstadoInventario "Inventario|VestidosInicializados", "SIM", "Lista inicial de itens vestidos criada."
End Sub

Private Sub ValidarEscolhaItemVestido(ByVal ws As Worksheet, ByVal celula As Range, ByVal ExibirAvisos As Boolean)
    Dim item As String
    Dim r As Long

    item = Trim$(CStr(celula.Value))
    If Len(item) > 0 Then
        If Not ItemDisponivelParaVestir(item) Then
            celula.ClearContents
            If ExibirAvisos Then MsgBox "Esse item nao esta na mochila ou nao pode ser vestido.", vbExclamation, "Forja T20"
            Exit Sub
        End If
        For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
            If r <> celula.Row And MesmoTexto(ws.Cells(r, 4).Value, item) Then
                celula.ClearContents
                If ExibirAvisos Then MsgBox "Esse item ja esta na lista de itens vestidos.", vbExclamation, "Forja T20"
                Exit Sub
            End If
        Next r
        If EhArmadura(item) Then
            RemoverOutrasArmadurasVestidas ws, celula.Row
            ws.Range("A21").Value = item
            ws.Range("D21").Value = True
        End If
        AtualizarComentarioItemVestido celula, item
    Else
        LimparComentario celula
    End If

    If Not ItemEstaVestido(CStr(ws.Range("A21").Value)) Then ws.Range("D21").Value = False
    AtualizarComentarioLimite ws
End Sub

Private Sub SincronizarArmaduraVestida(ByVal ws As Worksheet, ByVal alterouUso As Boolean, ByVal ExibirAvisos As Boolean)
    Dim armadura As String

    armadura = Trim$(CStr(ws.Range("A21").Value))
    RemoverArmadurasVestidasExceto ws, IIf(ArmaduraVestida(), armadura, vbNullString)
    If alterouUso And ArmaduraVestida() And Len(armadura) > 0 Then
        If Not AdicionarItemVestido(ws, armadura) Then
            ws.Range("D21").Value = False
            If ExibirAvisos Then MsgBox "Os quatro espacos de itens vestidos ja estao ocupados.", vbExclamation, "Forja T20"
        End If
    ElseIf Not ArmaduraVestida() Then
        RemoverItemVestido ws, armadura
    End If
    AtualizarComentarioLimite ws
End Sub

Private Function AdicionarItemVestido(ByVal ws As Worksheet, ByVal item As String) As Boolean
    Dim r As Long
    If Len(Trim$(item)) = 0 Or Not ItemDisponivelParaVestir(item) Then Exit Function
    If ItemEstaVestido(item) Then
        AdicionarItemVestido = True
        Exit Function
    End If
    For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
        If Len(Trim$(CStr(ws.Cells(r, 4).Value))) = 0 Then
            ws.Cells(r, 4).Value = item
            AtualizarComentarioItemVestido ws.Cells(r, 4), item
            If EhArmadura(item) Then
                ws.Range("A21").Value = item
                ws.Range("D21").Value = True
            End If
            AdicionarItemVestido = True
            Exit Function
        End If
    Next r
End Function

Private Sub RemoverItemVestido(ByVal ws As Worksheet, ByVal item As String)
    Dim r As Long
    If Len(Trim$(item)) = 0 Then Exit Sub
    For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
        If MesmoTexto(ws.Cells(r, 4).Value, item) Then
            ws.Cells(r, 4).ClearContents
            LimparComentario ws.Cells(r, 4)
        End If
    Next r
End Sub

Private Sub RemoverOutrasArmadurasVestidas(ByVal ws As Worksheet, ByVal linhaPreservada As Long)
    Dim r As Long
    For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
        If r <> linhaPreservada And EhArmadura(CStr(ws.Cells(r, 4).Value)) Then
            ws.Cells(r, 4).ClearContents
            LimparComentario ws.Cells(r, 4)
        End If
    Next r
End Sub

Private Sub RemoverArmadurasVestidasExceto(ByVal ws As Worksheet, ByVal armaduraPreservada As String)
    Dim r As Long
    Dim item As String
    For r = modLayoutT20.PRIMEIRA_LINHA_ITEM_VESTIDO To modLayoutT20.ULTIMA_LINHA_ITEM_VESTIDO
        item = Trim$(CStr(ws.Cells(r, 4).Value))
        If EhArmadura(item) And Not MesmoTexto(item, armaduraPreservada) Then
            ws.Cells(r, 4).ClearContents
            LimparComentario ws.Cells(r, 4)
        End If
    Next r
End Sub

Private Function EhArmadura(ByVal item As String) As Boolean
    Dim linha As Long
    linha = LinhaItem(item)
    If linha > 0 Then EhArmadura = Len(Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 17).Value))) > 0
End Function

Private Function ValorEstadoInventario(ByVal chave As String) As String
    Dim ws As Worksheet
    Dim resultado As Variant
    Set ws = ThisWorkbook.Worksheets("Escolhas_Ativas")
    resultado = Application.Match(chave, ws.Columns(1), 0)
    If Not IsError(resultado) Then ValorEstadoInventario = Trim$(CStr(ws.Cells(CLng(resultado), 2).Value))
End Function

Private Sub DefinirEstadoInventario(ByVal chave As String, ByVal valor As String, ByVal observacao As String)
    Dim ws As Worksheet
    Dim resultado As Variant
    Dim linha As Long
    Set ws = ThisWorkbook.Worksheets("Escolhas_Ativas")
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

Private Sub LimparComentario(ByVal celula As Range)
    On Error Resume Next
    celula.ClearComments
    On Error GoTo 0
End Sub

Private Sub AtualizarQuantidadesEPesos(ByVal ws As Worksheet)
    Dim i As Long
    Dim item As Range
    Dim qtd As Range
    Dim peso As Range

    For i = 1 To modLayoutT20.TOTAL_SLOTS_MOCHILA
        Set item = CelulaItemMochila(ws, i)
        Set qtd = CelulaQuantidadeMochila(ws, i)
        Set peso = CelulaPesoMochila(ws, i)
        If Len(Trim$(CStr(item.Value))) = 0 Then
            qtd.ClearContents
            peso.ClearContents
        Else
            If Val(CStr(qtd.Value)) <= 0 Then qtd.Value = 1
            peso.Formula = "=IF(" & item.Address(False, False) & "="""",""""," & qtd.Address(False, False) & "*modInventarioT20.PesoItem(" & item.Address(False, False) & "))"
        End If
    Next i
End Sub

Private Sub AtualizarListasEquipamentos(ByVal ws As Worksheet)
    Dim controle As Worksheet
    Dim i As Long
    Dim item As String
    Dim linha As Long
    Dim tipo As String

    Set controle = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)
    controle.Range("A2:D200").ClearContents
    controle.Range("D1").Value = "ItensVestidos"
    For i = 1 To modLayoutT20.TOTAL_SLOTS_MOCHILA
        item = Trim$(CStr(CelulaItemMochila(ws, i).Value))
        If Len(item) > 0 Then
            linha = LinhaItem(item)
            If linha > 0 Then
                tipo = Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 7).Value))
                If Len(tipo) > 0 Then AdicionarListaControle controle, 1, item
                If Len(Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 17).Value))) > 0 Then AdicionarListaControle controle, 2, item
                If Len(Trim$(CStr(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linha, 20).Value))) > 0 Then AdicionarListaControle controle, 3, item
                If EhItemVestivel(item) Then AdicionarListaControle controle, 4, item
            End If
        End If
    Next i
End Sub

Private Sub AdicionarListaControle(ByVal ws As Worksheet, ByVal coluna As Long, ByVal valor As String)
    Dim ultima As Long
    Dim resultado As Variant
    resultado = Application.Match(valor, ws.Columns(coluna), 0)
    If Not IsError(resultado) Then Exit Sub
    ultima = ws.Cells(ws.Rows.Count, coluna).End(xlUp).Row + 1
    If ultima < 2 Then ultima = 2
    ws.Cells(ultima, coluna).Value = valor
End Sub

Private Sub PreencherEquipamentosPadrao(ByVal ws As Worksheet)
    Dim controle As Worksheet
    Dim r As Long
    Set controle = ThisWorkbook.Worksheets(PLANILHA_CONTROLE)

    For r = 10 To 14
        If Len(Trim$(CStr(ws.Cells(r, 1).Value))) > 0 Then
            If Not ItemNaListaControle(controle, 1, CStr(ws.Cells(r, 1).Value)) Then
                ws.Cells(r, 1).ClearContents
                ws.Cells(r, 7).ClearContents
            End If
        End If
        If Len(Trim$(CStr(ws.Cells(r, 1).Value))) = 0 And Len(Trim$(CStr(controle.Cells(r - 8, 1).Value))) > 0 Then ws.Cells(r, 1).Value = controle.Cells(r - 8, 1).Value
    Next r
    If Len(Trim$(CStr(ws.Range("A21").Value))) > 0 And Not ItemNaListaControle(controle, 2, CStr(ws.Range("A21").Value)) Then
        ws.Range("A21").ClearContents
        ws.Range("D21").Value = False
    End If
    If Len(Trim$(CStr(ws.Range("A22").Value))) > 0 And Not ItemNaListaControle(controle, 3, CStr(ws.Range("A22").Value)) Then
        ws.Range("A22").ClearContents
        ws.Range("D22").Value = "Guardado"
    End If
    If Len(Trim$(CStr(ws.Range("A21").Value))) = 0 Then ws.Range("A21").Value = controle.Range("B2").Value
    If Len(Trim$(CStr(ws.Range("A22").Value))) = 0 Then ws.Range("A22").Value = controle.Range("C2").Value
End Sub

Private Function ItemNaListaControle(ByVal ws As Worksheet, ByVal coluna As Long, ByVal item As String) As Boolean
    Dim resultado As Variant
    resultado = Application.Match(item, ws.Columns(coluna), 0)
    ItemNaListaControle = Not IsError(resultado)
End Function

Private Sub ValidarEmpunhaduras(ByVal ws As Worksheet, ByVal alvo As Range, ByVal ExibirAvisos As Boolean)
    Dim r As Long
    Dim uso As String
    Dim mudou As Boolean

    If Not alvo Is Nothing Then
        If Not Intersect(alvo, ws.Range("G10:G14")) Is Nothing Then
            uso = Trim$(CStr(alvo.Value))
            If MesmoTexto(uso, DuasMaos()) Then
                For r = 10 To 14
                    If r <> alvo.Row And Len(Trim$(CStr(ws.Cells(r, 1).Value))) > 0 Then ws.Cells(r, 7).Value = "Guardada"
                Next r
                ws.Range("D22").Value = "Guardado"
                mudou = True
            ElseIf MesmoTexto(uso, MaoEsquerda()) Or MesmoTexto(uso, MaoDireita()) Then
                LiberarMao ws, uso, alvo.Row
                mudou = True
            End If
        ElseIf Not Intersect(alvo, ws.Range("D22")) Is Nothing Then
            uso = Trim$(CStr(alvo.Value))
            If MesmoTexto(uso, MaoEsquerda()) Or MesmoTexto(uso, MaoDireita()) Then
                LiberarMao ws, uso, 0
                For r = 10 To 14
                    If MesmoTexto(ws.Cells(r, 7).Value, DuasMaos()) Then ws.Cells(r, 7).Value = "Guardada"
                Next r
                mudou = True
            End If
        End If
    End If

    For r = 10 To 14
        If Len(Trim$(CStr(ws.Cells(r, 1).Value))) = 0 Then
            ws.Cells(r, 7).ClearContents
        ElseIf Len(Trim$(CStr(ws.Cells(r, 7).Value))) = 0 Then
            ws.Cells(r, 7).Value = "Guardada"
        End If
    Next r
    If Len(Trim$(CStr(ws.Range("A21").Value))) = 0 Then ws.Range("D21").Value = False
    If Len(Trim$(CStr(ws.Range("A22").Value))) = 0 Then ws.Range("D22").Value = "Guardado"
    If mudou And ExibirAvisos Then MsgBox "A empunhadura foi ajustada para evitar dois itens na mesma mao.", vbInformation, "Forja T20"
End Sub

Private Sub LiberarMao(ByVal ws As Worksheet, ByVal mao As String, ByVal linhaPreservada As Long)
    Dim r As Long
    For r = 10 To 14
        If r <> linhaPreservada Then
            If MesmoTexto(ws.Cells(r, 7).Value, mao) Or MesmoTexto(ws.Cells(r, 7).Value, DuasMaos()) Then ws.Cells(r, 7).Value = "Guardada"
        End If
    Next r
    If linhaPreservada > 0 And MesmoTexto(ws.Range("D22").Value, mao) Then ws.Range("D22").Value = "Guardado"
End Sub

Private Sub AtualizarFormulas(ByVal ws As Worksheet)
    Dim r As Long
    Dim ultimaBase As Long
    ultimaBase = ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(ThisWorkbook.Worksheets(PLANILHA_BASE).Rows.Count, 1).End(xlUp).Row

    For r = 10 To 14
        ws.Cells(r, 2).Formula = "=IF(A" & r & "="""","""",modInventarioT20.TesteAtaque(A" & r & "))"
        ws.Cells(r, 3).Formula = "=IF(A" & r & "="""","""",modInventarioT20.TextoDano(A" & r & "))"
        ws.Cells(r, 4).Formula = "=IF(A" & r & "="""","""",modInventarioT20.TextoCritico(A" & r & "))"
        ws.Cells(r, 5).Formula = "=IF(A" & r & "="""","""",modInventarioT20.TipoDano(A" & r & "))"
        ws.Cells(r, 6).Formula = "=IF(A" & r & "="""","""",modInventarioT20.AlcanceArma(A" & r & "))"
    Next r

    ws.Range("B21").Formula = "=IF(A21="""","""",IFERROR(VLOOKUP(A21,Base_Inventario!$A$2:$W$" & ultimaBase & ",18,FALSE),0))"
    ws.Range("C21").Formula = "=IF(A21="""","""",ABS(IFERROR(VLOOKUP(A21,Base_Inventario!$A$2:$W$" & ultimaBase & ",19,FALSE),0)))"
    ws.Range("B22").Formula = "=IF(A22="""","""",IFERROR(VLOOKUP(A22,Base_Inventario!$A$2:$W$" & ultimaBase & ",21,FALSE),0))"
    ws.Range("C22").Formula = "=IF(A22="""","""",ABS(IFERROR(VLOOKUP(A22,Base_Inventario!$A$2:$W$" & ultimaBase & ",22,FALSE),0)))"
    ws.Range("B18").Formula = "=IFERROR(INDEX($A$6:$F$6,1,MATCH(B17,{""FOR"";""DES"";""CON"";""INT"";""SAB"";""CAR""},0)),0)"
    ws.Range("C17").Formula = "=IFERROR(SUMIFS(Efeitos_Ativos!$H:$H,Efeitos_Ativos!$D:$D,""bonus_defesa""),0)"
    ws.Range("A17").Formula = "=10+B18+IF(modInventarioT20.ArmaduraVestida(),B21,0)+IF(modInventarioT20.EscudoEmpunhado(),B22,0)+C17+modInventarioT20.BonusDefesaEmpunhadura()"
    ws.Range(modLayoutT20.CELULA_LIMITE_CARGA).Formula = "=10+IF(A6>=0,2*A6,A6)"
    ws.Range(modLayoutT20.CELULA_CARGA_USADA).Formula = "=SUM(C" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":C" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA) & ",F" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":F" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA_DIREITA) & ")"
    ws.Range(modLayoutT20.CELULA_CARGA_MAXIMA).Formula = "=" & modLayoutT20.CELULA_LIMITE_CARGA & "*2"
    ws.Range(modLayoutT20.CELULA_DINHEIRO_TOTAL).Formula = "=IFERROR(" & modLayoutT20.CELULA_TIBARES & "+" & modLayoutT20.CELULA_TIBARES_COBRE & "/10+" & modLayoutT20.CELULA_TIBARES_OURO & "*10,0)"
End Sub

Private Function CondicaoEstiloUmaArma(ByVal itemExibicao As String) As Boolean
    Dim ws As Worksheet
    Dim linhaItemBase As Long
    Dim r As Long
    Dim linhaAtaque As Long
    Dim uso As String

    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    linhaAtaque = LinhaAtaqueItem(ws, itemExibicao)
    If linhaAtaque = 0 Then Exit Function
    uso = Trim$(CStr(ws.Cells(linhaAtaque, 7).Value))
    If Not (MesmoTexto(uso, MaoEsquerda()) Or MesmoTexto(uso, MaoDireita())) Then Exit Function
    If EscudoEmpunhado() Then Exit Function

    For r = 10 To 14
        If r <> linhaAtaque Then
            If MesmoTexto(ws.Cells(r, 7).Value, MaoEsquerda()) Or MesmoTexto(ws.Cells(r, 7).Value, MaoDireita()) Or MesmoTexto(ws.Cells(r, 7).Value, DuasMaos()) Then Exit Function
        End If
    Next r

    linhaItemBase = LinhaItem(itemExibicao)
    If linhaItemBase = 0 Then Exit Function
    If Not MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linhaItemBase, 14).Value, "SIM") Then Exit Function
    CondicaoEstiloUmaArma = MesmoTexto(ThisWorkbook.Worksheets(PLANILHA_BASE).Cells(linhaItemBase, 8).Value, "uma_mao")
End Function

Private Function LinhaAtaqueItem(ByVal ws As Worksheet, ByVal item As String) As Long
    Dim r As Long
    For r = 10 To 14
        If MesmoTexto(ws.Cells(r, 1).Value, item) Then
            LinhaAtaqueItem = r
            Exit Function
        End If
    Next r
End Function

Private Function CelulaNaMochila(ByVal celula As Range) As Boolean
    CelulaNaMochila = Not Intersect(celula, celula.Worksheet.Range("A" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":B" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA) & ",D" & CStr(modLayoutT20.PRIMEIRA_LINHA_MOCHILA) & ":E" & CStr(modLayoutT20.ULTIMA_LINHA_MOCHILA_DIREITA))) Is Nothing
End Function

Private Function EhCelulaItemMochila(ByVal celula As Range) As Boolean
    EhCelulaItemMochila = (celula.Column = 1 Or celula.Column = 4)
End Function

Private Function CelulaQuantidadePorItem(ByVal ws As Worksheet, ByVal celulaItem As Range) As Range
    Set CelulaQuantidadePorItem = ws.Cells(celulaItem.Row, celulaItem.Column + 1)
End Function

Private Function CelulaItemMochila(ByVal ws As Worksheet, ByVal indice As Long) As Range
    If indice <= modLayoutT20.LINHAS_MOCHILA_POR_COLUNA Then
        Set CelulaItemMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - 1, 1)
    Else
        Set CelulaItemMochila = ws.Cells(modLayoutT20.PRIMEIRA_LINHA_MOCHILA + indice - modLayoutT20.LINHAS_MOCHILA_POR_COLUNA - 1, 4)
    End If
End Function

Private Function CelulaQuantidadeMochila(ByVal ws As Worksheet, ByVal indice As Long) As Range
    Set CelulaQuantidadeMochila = CelulaItemMochila(ws, indice).Offset(0, 1)
End Function

Private Function CelulaPesoMochila(ByVal ws As Worksheet, ByVal indice As Long) As Range
    Set CelulaPesoMochila = CelulaItemMochila(ws, indice).Offset(0, 2)
End Function

Private Function LinhaItem(ByVal itemExibicao As String) As Long
    Dim resultado As Variant
    If Len(Trim$(itemExibicao)) = 0 Then Exit Function
    resultado = Application.Match(itemExibicao, ThisWorkbook.Worksheets(PLANILHA_BASE).Columns(1), 0)
    If Not IsError(resultado) Then LinhaItem = CLng(resultado)
End Function

Private Function SomaEfeito(ByVal tipo As String, ByVal fonte As String) As Double
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim r As Long
    If Not PlanilhaExiste(PLANILHA_EFEITOS) Then Exit Function
    Set ws = ThisWorkbook.Worksheets(PLANILHA_EFEITOS)
    ultimaLinha = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To ultimaLinha
        If MesmoTexto(ws.Cells(r, 4).Value, tipo) Then
            If Len(fonte) = 0 Or MesmoTexto(ws.Cells(r, 2).Value, fonte) Or MesmoTexto(ws.Cells(r, 3).Value, fonte) Then SomaEfeito = SomaEfeito + Val(CStr(ws.Cells(r, 8).Value))
        End If
    Next r
End Function

Private Function FormatarNumero(ByVal valor As Double) As String
    If valor = Fix(valor) Then
        FormatarNumero = CStr(CLng(valor))
    Else
        FormatarNumero = CStr(valor)
    End If
End Function

Private Function MaoEsquerda() As String
    MaoEsquerda = "M" & ChrW$(227) & "o esquerda"
End Function

Private Function MaoDireita() As String
    MaoDireita = "M" & ChrW$(227) & "o direita"
End Function

Private Function DuasMaos() As String
    DuasMaos = "Duas m" & ChrW$(227) & "os"
End Function

Private Function MesmoTexto(ByVal a As Variant, ByVal b As Variant) As Boolean
    MesmoTexto = (StrComp(Trim$(CStr(a)), Trim$(CStr(b)), vbTextCompare) = 0)
End Function

Private Function PlanilhaExiste(ByVal nome As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(nome)
    PlanilhaExiste = Not ws Is Nothing
    On Error GoTo 0
End Function
