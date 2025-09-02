#!/bin/sh

JVM="java"
SDIR="`dirname \"$0\"`"

LIBDIR=$SDIR/../gwlib
SOLR_LIBDIR=$SDIR/../server/solr-webapp/webapp/WEB-INF/lib

_osver=`uname`a
if [ "X""${_osver:0:6}" == "X""CYGWIN" ]; then
  _DL=\;
else
  _DL=:
fi

PATH=$JAVA_HOME/bin:$PATH $JVM -cp "$LIBDIR/*$_DL$SOLR_LIBDIR/*" com.guidewire.solr.util.CreateUser $*