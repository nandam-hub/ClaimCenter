@echo off

setlocal enableDelayedExpansion

set SDIR=%~dp0
if "%SDIR:~-1%"=="\" set SDIR=%SDIR:~0,-1%

set LIBDIR=%SDIR%\..\gwlib
set SOLR_LIBDIR=%SDIR%\..\server\solr-webapp\webapp\WEB-INF\lib

call :buildpath %LIBDIR% "" JARS
call :buildpath %SOLR_LIBDIR% solr-core SOLRJARS

java -cp %JARS%;%SOLRJARS% com.guidewire.solr.util.CreateUser %*
exit /b

:buildpath
set _PVAR=
(for /f "delims=" %%a in ('dir /b /a-d %~1\%~2*.jar') do (
  if "X"!_PVAR! == "X" (
    set _PVAR="%~1\%%a"
  ) else (
    set _PVAR=!_PVAR!;"%~1\%%a"
  )
))
set %~3=!_PVAR!
exit /b