Attribute VB_Name = "modLayoutT20"
Option Explicit

Public Const PLANILHA_PRINCIPAL As String = "Principal"

Public Const CELULA_NIVEL As String = "F1"
Public Const CELULA_RACA As String = "B2"
Public Const CELULA_ORIGEM As String = "D2"
Public Const CELULA_CLASSE As String = "F2"
Public Const CELULA_DIVINDADE As String = "G2"
Public Const RANGE_ATRIBUTOS_BASE As String = "A4:F4"
Public Const RANGE_BONUS_RACIAL As String = "A5:F5"
Public Const RANGE_ATRIBUTOS_TOTAL As String = "A6:F6"

Public Const CELULA_IDADE As String = "F42"
Public Const CELULA_COMPLICACAO As String = "I42"
Public Const RANGE_HABILIDADES_RACA As String = "F43:G47"
Public Const PRIMEIRA_LINHA_HABILIDADE_RACA As Long = 43
Public Const ULTIMA_LINHA_HABILIDADE_RACA As Long = 47
Public Const CELULA_TIPO_BENEFICIO_ORIGEM_1 As String = "I43"
Public Const CELULA_BENEFICIO_ORIGEM_1 As String = "J43"
Public Const CELULA_TIPO_BENEFICIO_ORIGEM_2 As String = "I44"
Public Const CELULA_BENEFICIO_ORIGEM_2 As String = "J44"
Public Const CELULA_PODER_DIVINDADE As String = "I45"
Public Const CELULA_ATRIBUTO_MAGIA As String = "F49"
Public Const PRIMEIRA_LINHA_MAGIA As Long = 52
Public Const ULTIMA_LINHA_MAGIA As Long = 61

Public Const PRIMEIRA_LINHA_PERICIA As Long = 4
Public Const PRIMEIRA_LINHA_TREINO As Long = 2
Public Const COL_PERICIA_NOME As Long = 9
Public Const COL_PERICIA_ATRIBUTO As Long = 10
Public Const COL_PERICIA_TOTAL As Long = 11
Public Const COL_PERICIA_TREINO As Long = 12
Public Const COL_PERICIA_BONUS As Long = 13
Public Const COL_PERICIA_OBS As Long = 14

Public Const PRIMEIRA_LINHA_PROGRESSAO As Long = 42
Public Const PRIMEIRA_LINHA_MOCHILA As Long = 25
Public Const ULTIMA_LINHA_MOCHILA As Long = 36
Public Const LINHAS_MOCHILA_POR_COLUNA As Long = 12
Public Const ULTIMA_LINHA_MOCHILA_DIREITA As Long = 33
Public Const TOTAL_SLOTS_MOCHILA As Long = 21
Public Const RANGE_ITENS_VESTIDOS As String = "D34:D37"
Public Const PRIMEIRA_LINHA_ITEM_VESTIDO As Long = 34
Public Const ULTIMA_LINHA_ITEM_VESTIDO As Long = 37
Public Const CELULA_TIBARES_COBRE As String = "B37"
Public Const CELULA_TIBARES As String = "B38"
Public Const CELULA_TIBARES_OURO As String = "B39"
Public Const CELULA_DINHEIRO_TOTAL As String = "B40"
Public Const CELULA_LIMITE_CARGA As String = "F38"
Public Const CELULA_CARGA_USADA As String = "F39"
Public Const CELULA_CARGA_MAXIMA As String = "F40"
Public Const PRIMEIRA_LINHA_ATAQUE As Long = 10
Public Const ULTIMA_LINHA_ATAQUE As Long = 14

Public Function UltimaLinhaPericia() As Long
    Dim ws As Worksheet
    Dim linha As Long
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    UltimaLinhaPericia = PRIMEIRA_LINHA_PERICIA
    For linha = PRIMEIRA_LINHA_PERICIA To ws.Rows.Count
        If Len(Trim$(CStr(ws.Cells(linha, COL_PERICIA_NOME).Value))) = 0 Then Exit For
        UltimaLinhaPericia = linha
    Next linha
End Function

Public Function LinhaTreinoPorLinhaPericia(ByVal linhaPrincipal As Long) As Long
    LinhaTreinoPorLinhaPericia = PRIMEIRA_LINHA_TREINO + (linhaPrincipal - PRIMEIRA_LINHA_PERICIA)
End Function

Public Function LinhaPericiaPorNome(ByVal nome As String) As Long
    Dim ws As Worksheet
    Dim r As Long
    Dim procurado As String

    procurado = NomeBasePericia(nome)
    Set ws = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL)
    For r = PRIMEIRA_LINHA_PERICIA To UltimaLinhaPericia()
        If StrComp(NomeBasePericia(CStr(ws.Cells(r, COL_PERICIA_NOME).Value)), procurado, vbTextCompare) = 0 Then
            LinhaPericiaPorNome = r
            Exit Function
        End If
    Next r
End Function

Public Function ValorPericia(ByVal nome As String) As Variant
    Dim linha As Long
    linha = LinhaPericiaPorNome(nome)
    If linha > 0 Then ValorPericia = ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Cells(linha, COL_PERICIA_TOTAL).Value
End Function

Public Function NomeBasePericia(ByVal nome As String) As String
    Dim pos As Long
    nome = Trim$(nome)
    If StrComp(Left$(nome, 6), "Of" & ChrW$(237) & "cio", vbTextCompare) = 0 Then
        NomeBasePericia = "Of" & ChrW$(237) & "cio"
        Exit Function
    End If
    pos = InStr(1, nome, " (", vbTextCompare)
    If pos > 0 Then nome = Left$(nome, pos - 1)
    NomeBasePericia = nome
End Function

Public Function CodigoAtributo(ByVal valor As String) As String
    valor = UCase$(Trim$(valor))
    Select Case valor
        Case "FOR", "FORCA", "FOR" & ChrW$(199) & "A": CodigoAtributo = "FOR"
        Case "DES", "DESTREZA": CodigoAtributo = "DES"
        Case "CON", "CONSTITUICAO", "CONSTITUI" & ChrW$(199) & "AO": CodigoAtributo = "CON"
        Case "INT", "INTELIGENCIA", "INTELIG" & ChrW$(202) & "NCIA": CodigoAtributo = "INT"
        Case "SAB", "SABEDORIA": CodigoAtributo = "SAB"
        Case "CAR", "CARISMA": CodigoAtributo = "CAR"
    End Select
End Function

Public Function NomeAtributo(ByVal codigo As String) As String
    Select Case CodigoAtributo(codigo)
        Case "FOR": NomeAtributo = "For" & ChrW$(231) & "a"
        Case "DES": NomeAtributo = "Destreza"
        Case "CON": NomeAtributo = "Constitui" & ChrW$(231) & ChrW$(227) & "o"
        Case "INT": NomeAtributo = "Intelig" & ChrW$(234) & "ncia"
        Case "SAB": NomeAtributo = "Sabedoria"
        Case "CAR": NomeAtributo = "Carisma"
    End Select
End Function

Public Function ValorAtributo(ByVal codigo As String) As Double
    Dim pos As Long
    pos = PosicaoAtributo(codigo)
    If pos > 0 Then ValorAtributo = Val(CStr(ThisWorkbook.Worksheets(PLANILHA_PRINCIPAL).Cells(6, pos).Value))
End Function

Public Function PosicaoAtributo(ByVal codigo As String) As Long
    Select Case CodigoAtributo(codigo)
        Case "FOR": PosicaoAtributo = 1
        Case "DES": PosicaoAtributo = 2
        Case "CON": PosicaoAtributo = 3
        Case "INT": PosicaoAtributo = 4
        Case "SAB": PosicaoAtributo = 5
        Case "CAR": PosicaoAtributo = 6
    End Select
End Function
