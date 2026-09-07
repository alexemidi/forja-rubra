Option Explicit
' CODEX_T20_FORM

Public escolha As String
Public Cancelado As Boolean

Private Const MARGEM As Single = 14
Private Const TOPO_LABEL As Single = 12
Private Const ALTURA_LABEL As Single = 42
Private Const ESPACO As Single = 10
Private Const ALTURA_BOTAO As Single = 24
Private Const LARGURA_OK As Single = 72
Private Const LARGURA_CANCELAR As Single = 86
Private Const LARGURA_MINIMA As Single = 360
Private Const LARGURA_MAXIMA As Single = 540
Private Const ALTURA_MINIMA As Single = 245
Private Const ALTURA_LINHA_LISTA As Single = 14.5
Private Const LINHAS_MINIMAS As Long = 6
Private Const LINHAS_MAXIMAS As Long = 30

Public Sub Carregar(ByVal titulo As String, ByVal opcoes As Collection, Optional ByVal opcoesSaoAtributos As Boolean = False)
    Dim i As Long
    Dim valor As String
    Dim exibicao As String

    Cancelado = True
    escolha = vbNullString

    lblTitulo.Caption = titulo
    lstOpcoes.Clear
    lstOpcoes.ColumnCount = 2
    lstOpcoes.BoundColumn = 2
    lstOpcoes.ColumnWidths = "220 pt;0 pt"
    lstOpcoes.IntegralHeight = False

    For i = 1 To opcoes.Count
        valor = CStr(opcoes(i))
        If opcoesSaoAtributos Then
            exibicao = modAutomacaoT20.NomeCompletoAtributo(valor)
        Else
            exibicao = valor
        End If

        lstOpcoes.AddItem exibicao
        lstOpcoes.List(lstOpcoes.ListCount - 1, 1) = valor
    Next i

    If lstOpcoes.ListCount > 0 Then lstOpcoes.ListIndex = 0
    AjustarLayout
End Sub

Private Sub AjustarLayout()
    Dim largura As Single
    Dim larguraInterna As Single
    Dim larguraConteudo As Single
    Dim linhasVisiveis As Long
    Dim maximoLinhasTela As Long
    Dim alturaLista As Single
    Dim topoLista As Single
    Dim topoBotoes As Single
    Dim bordaVertical As Single
    Dim larguraBotoes As Single
    Dim alturaDisponivel As Single

    largura = LarguraNecessaria()
    Me.Width = largura

    larguraInterna = Me.InsideWidth
    If larguraInterna <= 0 Then larguraInterna = largura - 18
    larguraConteudo = larguraInterna - (MARGEM * 2)
    If larguraConteudo < 240 Then larguraConteudo = 240

    alturaDisponivel = Application.Height - 175
    maximoLinhasTela = CLng(Fix(alturaDisponivel / ALTURA_LINHA_LISTA))
    If maximoLinhasTela < LINHAS_MINIMAS Then maximoLinhasTela = LINHAS_MINIMAS
    If maximoLinhasTela > LINHAS_MAXIMAS Then maximoLinhasTela = LINHAS_MAXIMAS

    linhasVisiveis = lstOpcoes.ListCount
    If linhasVisiveis < LINHAS_MINIMAS Then linhasVisiveis = LINHAS_MINIMAS
    If linhasVisiveis > maximoLinhasTela Then linhasVisiveis = maximoLinhasTela
    alturaLista = (linhasVisiveis * ALTURA_LINHA_LISTA) + 16

    lblTitulo.Left = MARGEM
    lblTitulo.Top = TOPO_LABEL
    lblTitulo.Width = larguraConteudo
    lblTitulo.Height = ALTURA_LABEL
    lblTitulo.WordWrap = True

    topoLista = lblTitulo.Top + lblTitulo.Height + 8
    lstOpcoes.Left = MARGEM
    lstOpcoes.Top = topoLista
    lstOpcoes.Width = larguraConteudo
    lstOpcoes.Height = alturaLista
    lstOpcoes.ColumnWidths = CStr(larguraConteudo - 24) & " pt;0 pt"

    cmdOK.Width = LARGURA_OK
    cmdOK.Height = ALTURA_BOTAO
    cmdCancelar.Width = LARGURA_CANCELAR
    cmdCancelar.Height = ALTURA_BOTAO

    topoBotoes = lstOpcoes.Top + lstOpcoes.Height + ESPACO
    larguraBotoes = cmdOK.Width + ESPACO + cmdCancelar.Width
    cmdOK.Left = larguraInterna - MARGEM - larguraBotoes
    If cmdOK.Left < MARGEM Then cmdOK.Left = MARGEM
    cmdCancelar.Left = cmdOK.Left + cmdOK.Width + ESPACO
    cmdOK.Top = topoBotoes
    cmdCancelar.Top = topoBotoes

    bordaVertical = Me.Height - Me.InsideHeight
    If bordaVertical < 30 Then bordaVertical = 34

    Me.Height = topoBotoes + ALTURA_BOTAO + MARGEM + bordaVertical
    If Me.Height < ALTURA_MINIMA Then Me.Height = ALTURA_MINIMA
    Me.StartUpPosition = 1
End Sub

Private Function LarguraNecessaria() As Single
    Dim maiorTexto As Long
    Dim i As Long
    Dim largura As Single

    maiorTexto = Len(lblTitulo.Caption)
    For i = 0 To lstOpcoes.ListCount - 1
        If Len(CStr(lstOpcoes.List(i, 0))) > maiorTexto Then maiorTexto = Len(CStr(lstOpcoes.List(i, 0)))
    Next i

    largura = 175 + (maiorTexto * 5)
    If largura < LARGURA_MINIMA Then largura = LARGURA_MINIMA
    If largura > LARGURA_MAXIMA Then largura = LARGURA_MAXIMA

    LarguraNecessaria = largura
End Function

Private Sub cmdOK_Click()
    If lstOpcoes.ListIndex < 0 Then
        MsgBox "Selecione uma opcao.", vbExclamation, "Forja T20"
        Exit Sub
    End If

    escolha = CStr(lstOpcoes.List(lstOpcoes.ListIndex, 1))
    Cancelado = False
    Me.Hide
End Sub

Private Sub cmdCancelar_Click()
    Cancelado = True
    escolha = vbNullString
    Me.Hide
End Sub

Private Sub lstOpcoes_DblClick(ByVal Cancel As MSForms.ReturnBoolean)
    cmdOK_Click
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If Len(escolha) = 0 Then Cancelado = True
End Sub
