Attribute VB_Name = "modPoderesClasseT20"
Option Explicit
Public Function CodexPoderesClasseVersion() As String
    CodexPoderesClasseVersion = modPoderesT20.CodexPoderesT20Version()
End Function
Public Sub AtualizarPoderesClasse(Optional ByVal ApenasResumo As Boolean = False)
    modPoderesT20.AtualizarPoderesClasse ApenasResumo
End Sub
Public Sub CodexAtualizarPoderesResumo()
    On Error GoTo TrataErro
    modPoderesT20.AtualizarPoderesClasse True
    Exit Sub
TrataErro:
    MsgBox "Erro ao atualizar poderes: " & Err.Number & " - " & Err.Description, vbExclamation, "Forja T20"
End Sub
Public Function DetalhePoderClasse(ByVal nome As String) As String
    DetalhePoderClasse = modPoderesT20.DetalhePoderCatalogoPorNome(nome)
End Function
