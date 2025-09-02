@echo off
setLocal EnableDelayedExpansion

rem Adjust path for Java version 21
call :verifyJava JAVA_VERSION
if errorlevel 1 goto :end

if not "%_DEBUG%" == "" (
    echo Using Java %JAVA_VERSION%
)

set _G_CLASSPATH=%_G_CLASSPATH%;%_G_ROOT_DIR%..\lib\*

:runGosu
"%_JAVACMD%" %_DEBUG% %GOSU_OPTS% -classpath "%_G_CLASSPATH%" gw.lang.Gosu %_CMD_LINE_ARGS%

goto end

:verifyJava
  call checkjava

  if ERRORLEVEL 21 (
    set %~1=21
	exit /b 0
  ) else (
    call :unsupported
  )
  exit /b

:unsupported
  call :fail "Java 21 is required but not found.  Make sure JAVA_HOME refers to the correct Java version."
  exit /b 1

:fail
  echo %~1
  exit /b 1

:end

endlocal
