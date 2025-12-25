@echo off
echo Iniciando envio para o GitHub...

:: Tenta inicializar o repositorio
git init

:: Adiciona todos os arquivos
git add .

:: Realiza o commit inicial
git commit -m "Upload inicial do projeto NutriPlan Pro"

:: Renomeia a branch para main
git branch -M main

:: Remove a origem caso ja exista (para evitar erros se rodar 2x)
git remote remove origin 2>NUL

:: Adiciona o repositorio remoto
git remote add origin https://github.com/moisesarriaga/nutriplan-pro

:: Envia para o GitHub
echo Enviando arquivos...
git push -u origin main

echo.
echo Concluido! Se houve algum erro acima, verifique se voce tem permissao no repositorio.
pause
