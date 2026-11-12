"""A.R.K.O · NASA Space Apps 2026
EN: one-time login to NASA Earthdata; saves the credential only on this computer (_netrc).
PT: login unico no NASA Earthdata; a credencial fica salva so neste computador (_netrc).
"""
import earthaccess

print("=" * 60)
print(" A.R.K.O - login no NASA Earthdata")
print(" Digite o usuario e a senha da sua conta Earthdata.")
print(" (a senha nao aparece enquanto voce digita, e normal)")
print("=" * 60)
auth = earthaccess.login(strategy="interactive", persist=True)
if auth.authenticated:
    print("\nLogin OK! Credencial salva so neste computador.")
    print("Pode fechar esta janela e voltar para o Claude.")
else:
    print("\nNao deu certo. Feche a janela e me avise no chat.")
input("\nPressione Enter para fechar...")
