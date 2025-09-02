@echo off

rem Determine the major version referred to by %JAVA_HOME% and return
rem that version as the errorlevel of this script

setlocal enableExtensions enableDelayedExpansion

call :gettempfile solrbatch SCRATCH

rem get java version into env var
( "%JAVA_HOME%\bin\java" -version 2>&1 | findstr version ) > %SCRATCH%
set COMMAND=type %SCRATCH%
for /f "delims=" %%a in ('type %SCRATCH%') do (
  set RAW_JAVA_VERSION=%%a
  del %SCRATCH%
  goto :next
)

:next
rem extract version token and remove quotes if present
for /f "usebackq tokens=3 delims= " %%a in ('%RAW_JAVA_VERSION%') do (
  set JVERSION=%%a
  set FIRST_CHAR=!JVERSION:~0,1!
  if X^!FIRST_CHAR! == X^" (
    set JVERSION=!JVERSION:~1!
  )
  set LAST_CHAR=!JVERSION:~-1!
  if X^!LAST_CHAR! == X^" (
    set JVERSION=!JVERSION:~0,-1!
  )
)

rem extract major version token
for /f "usebackq tokens=1,2 delims=._" %%a in ('%JVERSION%') do (
  if not %%a == 1 (
    set MAJOR_VERSION=%%a
  ) else (
    set MAJOR_VERSION=%%b
  )
)

exit /b %MAJOR_VERSION%

rem compute unique tempfile name with specified prefix
:gettempfile
  set /a AA = 0
:gettempfileloop
  set TEMP_FILE="%tmp%\%~1%RANDOM%%AA%.tmp"
  set /a AA=%AA%+1
  if exist %TEMP_FILE% goto :gettempfileloop
  set %~2=!TEMP_FILE!
  exit /b 0
