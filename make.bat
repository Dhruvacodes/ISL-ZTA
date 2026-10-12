@echo off
set PYTHON=python
if exist ".venv\Scripts\python.exe" set PYTHON=.venv\Scripts\python.exe

if "%1"=="install" (
    %PYTHON% -m pip install -e .
) else if "%1"=="test" (
    %PYTHON% -m pytest -v tests/
) else if "%1"=="train" (
    %PYTHON% -m ztarb.train --profile quick %2 %3 %4
) else if "%1"=="eval" (
    %PYTHON% -m ztarb.evaluate --profile quick %2 %3 %4
) else if "%1"=="web" (
    call npm --prefix web run build
) else if "%1"=="demo" (
    %PYTHON% -m ztarb.service.app %2 %3 %4
) else if "%1"=="demo-fresh" (
    call %0 eval
    call %0 web
    call %0 demo
) else if "%1"=="all" (
    call %0 install
    call %0 test
    call %0 train
    call %0 eval
    call %0 web
    call %0 demo
) else (
    echo Usage: make.bat [install^|test^|train^|eval^|web^|demo^|demo-fresh^|all]
)
