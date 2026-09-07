Option Explicit

Public escolha As String
Public Cancelado As Boolean
Public VoltarSolicitado As Boolean
Public VerMagiasSolicitado As Boolean
Private origemDetalhes As String
Private detalhesCatalogo As Collection
Private Const SEP As String = "|#|"
Private Const MARGEM As Single = 12
Private Const ESPACO As Single = 10
Private Const TOPO_LISTA As Single = 58
Private Const ALTURA_BOTAO As Single = 27

Public Sub Carregar(ByVal titulo As String, ByVal opcoes As Collection, Optional ByVal fonteDetalhes As String = "MAGIA")
    Dim i As Long
    Dim partes() As String

    Cancelado = True
    VoltarSolicitado = False
    VerMagiasSolicitado = False
    escolha = vbNullString
    Set detalhesCatalogo = New Collection
    origemDetalhes = UCase$(Trim$(fonteDetalhes))
    cmdOK.Caption = "OK"
    lstMagias.Visible = True
    txtDetalhes.Visible = True
    If origemDetalhes = "PODER_CATALOGO" Then
        Me.Caption = "Forja T20 - Poderes"
        cmdCancelar.Caption = "Voltar"
    ElseIf origemDetalhes = "MAGIA_CATALOGO" Then
        Me.Caption = "Forja T20 - Magias"
        cmdCancelar.Caption = "Cancelar"
    ElseIf origemDetalhes = "CATALOGO_TEXTO" Then
        Me.Caption = "Forja T20 - Criacao de Personagem"
        cmdCancelar.Caption = "Cancelar"
    ElseIf origemDetalhes = "PODER_CLASSE" Then
        Me.Caption = "Forja T20 - Poderes de Classe"
        cmdCancelar.Caption = "Cancelar"
    ElseIf origemDetalhes = "ESCOLA_MAGO" Then
        Me.Caption = "Forja T20 - Escolas do Mago"
        cmdCancelar.Caption = "Cancelar"
    Else
        Me.Caption = "Forja T20 - Magias"
        cmdCancelar.Caption = "Cancelar"
    End If
    lblTitulo.Caption = titulo
    cmdVerMagias.Visible = (origemDetalhes = "ESCOLA_MAGO")
    lstMagias.Clear

    For i = 1 To opcoes.Count
        If FonteEstruturada() Then
            partes = Split(CStr(opcoes(i)), SEP)
            lstMagias.ColumnCount = 3
            lstMagias.BoundColumn = 2
            lstMagias.AddItem partes(0)
            If UBound(partes) >= 1 Then lstMagias.List(lstMagias.ListCount - 1, 1) = partes(1)
            If UBound(partes) >= 2 Then lstMagias.List(lstMagias.ListCount - 1, 2) = partes(2)
            If UBound(partes) >= 3 Then
                detalhesCatalogo.Add partes(3)
            Else
                detalhesCatalogo.Add vbNullString
            End If
        Else
            lstMagias.ColumnCount = 1
            lstMagias.AddItem CStr(opcoes(i))
            detalhesCatalogo.Add vbNullString
        End If
    Next i

    AjustarLayout
    If lstMagias.ListCount > 0 Then lstMagias.ListIndex = PrimeiroIndiceSelecionavel()
    AtualizarDetalhes
End Sub

Public Sub CarregarAvisoRequisitos(ByVal titulo As String, ByVal detalhes As String)
    Cancelado = True
    VoltarSolicitado = False
    VerMagiasSolicitado = False
    escolha = vbNullString
    origemDetalhes = "AVISO_REQUISITOS"
    Me.Caption = "Forja T20 - Requisitos de poderes"
    lblTitulo.Caption = titulo
    cmdOK.Caption = "Continuar"
    cmdCancelar.Caption = "Voltar"
    cmdVerMagias.Visible = False
    lstMagias.Clear
    lstMagias.Visible = False
    txtDetalhes.Visible = True
    txtDetalhes.Value = detalhes
    AjustarLayout
End Sub

Public Sub CarregarAvisoAtributos(ByVal titulo As String, ByVal detalhes As String)
    CarregarAvisoRequisitos titulo, detalhes
End Sub

Private Sub UserForm_Initialize()
    lstMagias.IntegralHeight = False
    lblTitulo.WordWrap = True
    txtDetalhes.MultiLine = True
    txtDetalhes.WordWrap = True
    txtDetalhes.ScrollBars = fmScrollBarsVertical
    txtDetalhes.Locked = True
    txtDetalhes.EnterKeyBehavior = True
End Sub

Private Sub AjustarLayout()
    Dim larguraUtil As Single
    Dim alturaUtil As Single
    Dim larguraForm As Single
    Dim alturaForm As Single
    Dim larguraInterna As Single
    Dim alturaInterna As Single
    Dim larguraLista As Single
    Dim topoBotoes As Single

    On Error Resume Next
    larguraUtil = Application.UsableWidth
    alturaUtil = Application.UsableHeight
    On Error GoTo 0
    If larguraUtil <= 0 Then larguraUtil = 1024
    If alturaUtil <= 0 Then alturaUtil = 768

    If origemDetalhes = "AVISO_REQUISITOS" Then
        larguraForm = Minimo(540, larguraUtil * 0.58)
        larguraForm = Maximo(470, larguraForm)
        alturaForm = Minimo(330, alturaUtil * 0.48)
        alturaForm = Maximo(285, alturaForm)
    Else
        larguraForm = Minimo(940, larguraUtil * 0.9)
        larguraForm = Maximo(700, larguraForm)
        alturaForm = Minimo(620, alturaUtil * 0.82)
        alturaForm = Maximo(420, alturaForm)
    End If

    Me.Width = larguraForm
    Me.Height = alturaForm
    Me.StartUpPosition = 1

    larguraInterna = Me.InsideWidth
    alturaInterna = Me.InsideHeight
    larguraLista = (larguraInterna - (2 * MARGEM) - ESPACO) * 0.36
    larguraLista = Maximo(230, Minimo(350, larguraLista))

    lblTitulo.Left = MARGEM
    lblTitulo.Top = 10
    lblTitulo.Width = larguraInterna - (2 * MARGEM)
    If origemDetalhes = "AVISO_REQUISITOS" Then
        lblTitulo.Height = 54
    Else
        lblTitulo.Height = 38
    End If

    cmdCancelar.Width = 80
    cmdCancelar.Height = ALTURA_BOTAO
    cmdOK.Width = 72
    cmdOK.Height = ALTURA_BOTAO
    cmdVerMagias.Width = 90
    cmdVerMagias.Height = ALTURA_BOTAO
    topoBotoes = alturaInterna - MARGEM - ALTURA_BOTAO
    cmdCancelar.Left = larguraInterna - MARGEM - cmdCancelar.Width
    cmdCancelar.Top = topoBotoes
    cmdOK.Left = cmdCancelar.Left - ESPACO - cmdOK.Width
    cmdOK.Top = topoBotoes
    cmdVerMagias.Left = cmdOK.Left - ESPACO - cmdVerMagias.Width
    cmdVerMagias.Top = topoBotoes

    If origemDetalhes = "AVISO_REQUISITOS" Then
        txtDetalhes.Left = MARGEM
        txtDetalhes.Top = lblTitulo.Top + lblTitulo.Height + 8
        txtDetalhes.Width = larguraInterna - (2 * MARGEM)
        txtDetalhes.Height = Maximo(140, topoBotoes - ESPACO - txtDetalhes.Top)
    Else
        lstMagias.Left = MARGEM
        lstMagias.Top = TOPO_LISTA
        lstMagias.Width = larguraLista
        lstMagias.Height = Maximo(220, topoBotoes - ESPACO - TOPO_LISTA)

        txtDetalhes.Left = lstMagias.Left + lstMagias.Width + ESPACO
        txtDetalhes.Top = TOPO_LISTA
        txtDetalhes.Width = larguraInterna - MARGEM - txtDetalhes.Left
        txtDetalhes.Height = lstMagias.Height
    End If

    AtualizarLarguraColunas
End Sub

Private Sub AtualizarLarguraColunas()
    If FonteEstruturada() Then
        lstMagias.ColumnWidths = CStr(Fix(lstMagias.Width - 18)) & " pt;0 pt;0 pt"
    Else
        lstMagias.ColumnWidths = CStr(Fix(lstMagias.Width - 18)) & " pt"
    End If
End Sub

Private Function Minimo(ByVal a As Single, ByVal b As Single) As Single
    If a < b Then Minimo = a Else Minimo = b
End Function

Private Function Maximo(ByVal a As Single, ByVal b As Single) As Single
    If a > b Then Maximo = a Else Maximo = b
End Function

Private Function PrimeiroIndiceSelecionavel() As Long
    Dim i As Long
    PrimeiroIndiceSelecionavel = 0
    If Not FonteEstruturada() Then Exit Function
    For i = 0 To lstMagias.ListCount - 1
        If CStr(lstMagias.List(i, 2)) = "SIM" Then
            PrimeiroIndiceSelecionavel = i
            Exit Function
        End If
    Next i
End Function

Private Sub AtualizarDetalhes()
    If origemDetalhes = "AVISO_REQUISITOS" Then
        Exit Sub
    ElseIf lstMagias.ListIndex < 0 Then
        txtDetalhes.Text = vbNullString
    ElseIf origemDetalhes = "PODER_CATALOGO" Then
        If CStr(lstMagias.List(lstMagias.ListIndex, 2)) = "CAB" Then
            txtDetalhes.Text = vbNullString
        Else
            txtDetalhes.Text = modPoderesT20.DetalhePoderCatalogoPorId(CStr(lstMagias.List(lstMagias.ListIndex, 1)))
        End If
    ElseIf origemDetalhes = "MAGIA_CATALOGO" Then
        If CStr(lstMagias.List(lstMagias.ListIndex, 2)) = "CAB" Then
            txtDetalhes.Text = vbNullString
        Else
            txtDetalhes.Text = modMagiasT20.DetalheMagia(CStr(lstMagias.List(lstMagias.ListIndex, 1)))
        End If
    ElseIf origemDetalhes = "CATALOGO_TEXTO" Then
        If CStr(lstMagias.List(lstMagias.ListIndex, 2)) = "CAB" Then
            txtDetalhes.Text = vbNullString
        Else
            txtDetalhes.Text = DetalheCatalogoSelecionado()
        End If
    ElseIf origemDetalhes = "PODER_CLASSE" Then
        txtDetalhes.Text = modPoderesClasseT20.DetalhePoderClasse(CStr(lstMagias.List(lstMagias.ListIndex)))
    ElseIf origemDetalhes = "ESCOLA_MAGO" Then
        txtDetalhes.Text = vbNullString
    Else
        txtDetalhes.Text = modMagiasT20.DetalheMagia(CStr(lstMagias.List(lstMagias.ListIndex)))
    End If
End Sub

Private Function DetalheCatalogoSelecionado() As String
    Dim indice As Long
    If detalhesCatalogo Is Nothing Then Exit Function
    indice = lstMagias.ListIndex + 1
    If indice < 1 Or indice > detalhesCatalogo.Count Then Exit Function
    DetalheCatalogoSelecionado = CStr(detalhesCatalogo(indice))
End Function

Private Sub cmdVerMagias_Click()
    VerMagiasSolicitado = True
    Cancelado = True
    escolha = vbNullString
    Me.Hide
End Sub

Private Sub lstMagias_Change()
    AtualizarDetalhes
End Sub

Private Sub lstMagias_DblClick(ByVal Cancel As MSForms.ReturnBoolean)
    cmdOK_Click
End Sub

Private Sub cmdOK_Click()
    If origemDetalhes = "AVISO_REQUISITOS" Then
        escolha = "CONTINUAR"
        Cancelado = False
        Me.Hide
        Exit Sub
    End If

    If lstMagias.ListIndex < 0 Then
        MsgBox "Selecione uma opcao.", vbExclamation, "Forja T20"
        Exit Sub
    End If

    If FonteEstruturada() Then
        If CStr(lstMagias.List(lstMagias.ListIndex, 2)) = "CAB" Then
            MsgBox "Selecione uma opcao valida.", vbExclamation, "Forja T20"
            Exit Sub
        End If
        If CStr(lstMagias.List(lstMagias.ListIndex, 2)) <> "SIM" Then
            MsgBox "Esta opcao ainda nao cumpre os pre-requisitos.", vbExclamation, "Forja T20"
            Exit Sub
        End If
        escolha = CStr(lstMagias.List(lstMagias.ListIndex, 1))
    Else
        escolha = CStr(lstMagias.List(lstMagias.ListIndex))
    End If
    Cancelado = False
    Me.Hide
End Sub

Private Function FonteEstruturada() As Boolean
    FonteEstruturada = (origemDetalhes = "PODER_CATALOGO" Or _
        origemDetalhes = "MAGIA_CATALOGO" Or _
        origemDetalhes = "CATALOGO_TEXTO")
End Function

Private Sub cmdCancelar_Click()
    If origemDetalhes = "PODER_CATALOGO" Or origemDetalhes = "AVISO_REQUISITOS" Then VoltarSolicitado = True
    Cancelado = True
    escolha = vbNullString
    Me.Hide
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If Len(escolha) = 0 Then Cancelado = True
End Sub
