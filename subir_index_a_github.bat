@echo off
setlocal

title SUASA - Subir archivos a GitHub

cd /d "%~dp0"

set "REPO_URL=https://github.com/PanchoM2025/SUASA.git"
set "TEMP_REPO=%TEMP%\SUASA_GITHUB"

echo.
echo ==========================================
echo   SUASA - SUBIR ARCHIVOS A GITHUB
echo ==========================================
echo.

if not exist "index.html" (
    echo ERROR: No se encuentra index.html en esta carpeta.
    pause
    exit /b 1
)

echo Preparando repositorio...

if exist "%TEMP_REPO%\.git" (
    cd /d "%TEMP_REPO%"
    git reset --hard
    git checkout main
    git pull origin main
) else (
    if exist "%TEMP_REPO%" rmdir /s /q "%TEMP_REPO%"
    git clone "%REPO_URL%" "%TEMP_REPO%"
    if errorlevel 1 (
        echo.
        echo ERROR al clonar el repositorio.
        pause
        exit /b 1
    )
)

echo.
echo Copiando archivos...

for %%f in ("%~dp0*.*") do (
    copy /y "%%f" "%TEMP_REPO%\%%~nxf" >nul
    echo   + %%~nxf
)

cd /d "%TEMP_REPO%"

git add -A

git diff --cached --quiet
if %errorlevel%==0 (
    echo.
    echo No hay cambios nuevos para subir.
    pause
    exit /b 0
)

git commit -m "Actualizo archivos SUASA"

if errorlevel 1 (
    echo.
    echo ERROR al crear el commit.
    pause
    exit /b 1
)

git push origin main

if errorlevel 1 (
    echo.
    echo ERROR al subir a GitHub.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   ARCHIVOS SUBIDOS CORRECTAMENTE
echo ==========================================
echo.
echo GitHub:
echo https://github.com/PanchoM2025/SUASA
echo.
echo Render:
echo https://suasa.onrender.com
echo.
echo Render hara el deploy automaticamente.
echo.

pause
