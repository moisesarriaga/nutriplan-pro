@echo off
echo Salvando alteracoes e enviando para o GitHub...

:: Adiciona os arquivos modificados
git add .

:: Realiza o commit
git commit -m "feat: Implement payment validation flow"

:: Envia para o GitHub
git push origin main

echo.
echo Envio concluido!
pause
