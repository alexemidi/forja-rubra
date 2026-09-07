Option Explicit

Public Cancelado As Boolean

Public Sub Carregar(Optional ByVal valorForca As Long = 0, Optional ByVal valorDestreza As Long = 0, _
    Optional ByVal valorConstituicao As Long = 0, Optional ByVal valorInteligencia As Long = 0, _
    Optional ByVal valorSabedoria As Long = 0, Optional ByVal valorCarisma As Long = 0)
    Cancelado = True
    DefinirValor spnForca, txtForca, valorForca
    DefinirValor spnDestreza, txtDestreza, valorDestreza
    DefinirValor spnConstituicao, txtConstituicao, valorConstituicao
    DefinirValor spnInteligencia, txtInteligencia, valorInteligencia
    DefinirValor spnSabedoria, txtSabedoria, valorSabedoria
    DefinirValor spnCarisma, txtCarisma, valorCarisma
    AjustarLayout
    AtualizarResumo
End Sub

Public Function ValorAtributo(ByVal indice As Long) As Long
    Select Case indice
        Case 1: ValorAtributo = CLng(spnForca.Value)
        Case 2: ValorAtributo = CLng(spnDestreza.Value)
        Case 3: ValorAtributo = CLng(spnConstituicao.Value)
        Case 4: ValorAtributo = CLng(spnInteligencia.Value)
        Case 5: ValorAtributo = CLng(spnSabedoria.Value)
        Case 6: ValorAtributo = CLng(spnCarisma.Value)
    End Select
End Function

Private Sub UserForm_Initialize()
    Me.Caption = "Forja T20 - Atributos"
    ConfigurarSpin spnForca
    ConfigurarSpin spnDestreza
    ConfigurarSpin spnConstituicao
    ConfigurarSpin spnInteligencia
    ConfigurarSpin spnSabedoria
    ConfigurarSpin spnCarisma
End Sub

Private Sub ConfigurarSpin(ByVal controle As Object)
    controle.Min = -1
    controle.Max = 4
    controle.SmallChange = 1
End Sub

Private Sub DefinirValor(ByVal spin As Object, ByVal caixa As Object, ByVal valor As Long)
    spin.Value = valor
    caixa.Value = CStr(valor)
End Sub

Private Sub AjustarLayout()
    Dim nomes As Variant
    Dim rotulo As Object
    Dim caixa As Object
    Dim spin As Object
    Dim i As Long
    Dim topo As Single

    nomes = Array("Forca", "Destreza", "Constituicao", "Inteligencia", "Sabedoria", "Carisma")
    Me.Width = 390
    Me.Height = 330
    Me.StartUpPosition = 1
    lblTitulo.Left = 16
    lblTitulo.Top = 12
    lblTitulo.Width = 340
    lblTitulo.Height = 24
    lblTitulo.Caption = "Compra de atributos"

    For i = 0 To 5
        topo = 48 + (i * 31)
        Set rotulo = Me.Controls("lbl" & CStr(nomes(i)))
        Set caixa = Me.Controls("txt" & CStr(nomes(i)))
        Set spin = Me.Controls("spn" & CStr(nomes(i)))
        rotulo.Left = 24
        rotulo.Top = topo + 3
        rotulo.Width = 170
        rotulo.Height = 20
        rotulo.Caption = NomeCompleto(CStr(nomes(i)))
        caixa.Left = 205
        caixa.Top = topo
        caixa.Width = 48
        caixa.Height = 22
        caixa.Locked = True
        caixa.TextAlign = fmTextAlignCenter
        spin.Left = 258
        spin.Top = topo
        spin.Width = 54
        spin.Height = 22
    Next i

    lblPontos.Left = 24
    lblPontos.Top = 240
    lblPontos.Width = 285
    lblPontos.Height = 22
    lblPontos.Font.Bold = True
    cmdOK.Left = 198
    cmdOK.Top = 270
    cmdOK.Width = 72
    cmdOK.Height = 26
    cmdOK.Caption = "OK"
    cmdCancelar.Left = 278
    cmdCancelar.Top = 270
    cmdCancelar.Width = 80
    cmdCancelar.Height = 26
    cmdCancelar.Caption = "Cancelar"
End Sub

Private Function NomeCompleto(ByVal nome As String) As String
    Select Case nome
        Case "Forca": NomeCompleto = "For" & ChrW$(231) & "a"
        Case "Constituicao": NomeCompleto = "Constitui" & ChrW$(231) & ChrW$(227) & "o"
        Case "Inteligencia": NomeCompleto = "Intelig" & ChrW$(234) & "ncia"
        Case Else: NomeCompleto = nome
    End Select
End Function

Private Function Custo(ByVal valor As Long) As Long
    Select Case valor
        Case -1: Custo = -1
        Case 0: Custo = 0
        Case 1: Custo = 1
        Case 2: Custo = 2
        Case 3: Custo = 4
        Case 4: Custo = 7
    End Select
End Function

Private Function PontosUsados() As Long
    PontosUsados = Custo(spnForca.Value) + Custo(spnDestreza.Value) + _
        Custo(spnConstituicao.Value) + Custo(spnInteligencia.Value) + _
        Custo(spnSabedoria.Value) + Custo(spnCarisma.Value)
End Function

Private Sub AtualizarResumo()
    Dim usados As Long
    txtForca.Value = CStr(spnForca.Value)
    txtDestreza.Value = CStr(spnDestreza.Value)
    txtConstituicao.Value = CStr(spnConstituicao.Value)
    txtInteligencia.Value = CStr(spnInteligencia.Value)
    txtSabedoria.Value = CStr(spnSabedoria.Value)
    txtCarisma.Value = CStr(spnCarisma.Value)
    usados = PontosUsados()
    lblPontos.Caption = "Pontos usados: " & CStr(usados) & " de 10   |   Restantes: " & CStr(10 - usados)
    If usados > 10 Then
        lblPontos.ForeColor = RGB(190, 35, 35)
    Else
        lblPontos.ForeColor = RGB(35, 35, 35)
    End If
End Sub

Private Sub spnForca_Change(): AtualizarResumo: End Sub
Private Sub spnDestreza_Change(): AtualizarResumo: End Sub
Private Sub spnConstituicao_Change(): AtualizarResumo: End Sub
Private Sub spnInteligencia_Change(): AtualizarResumo: End Sub
Private Sub spnSabedoria_Change(): AtualizarResumo: End Sub
Private Sub spnCarisma_Change(): AtualizarResumo: End Sub

Private Sub cmdOK_Click()
    If PontosUsados() <> 10 Then
        MsgBox "Distribua exatamente 10 pontos antes de continuar.", vbExclamation, "Forja T20"
        Exit Sub
    End If
    Cancelado = False
    Me.Hide
End Sub

Private Sub cmdCancelar_Click()
    Cancelado = True
    Me.Hide
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    Cancelado = True
End Sub
