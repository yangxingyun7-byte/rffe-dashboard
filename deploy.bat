@echo off
chcp 65001 >nul
echo ============================================
echo   RF Dashboard 一键部署脚本
echo ============================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装：
    echo   https://nodejs.org/zh-cn/download/
    echo   选择 LTS 版本安装即可
    pause
    exit /b 1
)

echo [1/5] 检查依赖...
if not exist "node_modules" (
    echo    安装中，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

echo [2/5] 构建项目...
call npx next build
if %errorlevel% neq 0 (
    echo [错误] 构建失败，请检查上方错误信息
    pause
    exit /b 1
)

echo [3/5] 部署到 GitHub Pages...

:: 检查 gh-pages
where gh-pages >nul 2>nul
if %errorlevel% neq 0 (
    echo    安装 gh-pages 工具...
    call npm install -g gh-pages
)

:: 获取仓库地址
set REPO_URL=
for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set REPO_URL=%%i

if "%REPO_URL%"=="" (
    echo.
    echo [提示] 未检测到 Git 远程仓库
    echo.
    echo 请按以下步骤操作：
    echo.
    echo   1. 去 https://gitee.com 注册账号
    echo   2. 新建仓库，名称填：rffe-dashboard
    echo   3. 然后运行以下命令：
    echo.
    echo      git init
    echo      git add .
    echo      git commit -m "RF Dashboard"
    echo      git remote add origin https://gitee.com/你的用户名/rffe-dashboard.git
    echo      git push -u origin master
    echo.
    echo   4. 在仓库页面 → 服务 → Gitee Pages → 启动
    echo   5. 访问：https://你的用户名.gitee.io/rffe-dashboard
    echo.
    pause
    exit /b 0
)

echo    推送中...
call gh-pages -d out
if %errorlevel% neq 0 (
    echo [错误] 部署失败
    pause
    exit /b 1
)

echo.
echo [4/5] 部署完成！
echo [5/5] 你的访问地址：
echo.
for /f "tokens=2 delims=/" %%a in ("%REPO_URL%") do (
    echo   https://%%a.gitee.io/rffe-dashboard
)
echo.
echo   注意：Gitee Pages 免费版需要手动更新：
echo   仓库页面 → 服务 → Gitee Pages → 点击"更新"
echo.
pause
