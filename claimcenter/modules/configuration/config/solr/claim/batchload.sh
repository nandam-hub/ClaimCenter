#!/bin/sh -e

APP_PREFIX=cc
DOC_TYPE=claim
BASE_DIR=/opt/gwsolr
GWSOLR_HOME=$BASE_DIR/$APP_PREFIX
GWENV=

JAVA_OPTS=
LIBDIR=$GWSOLR_HOME/gwlib
SERVLETJAR=$GWSOLR_HOME/server/lib/ext/jetty-servlet-api-4.0.6.jar
TRANSFORMERLIBDIR=$LIBDIR
CONFIGFILE=$GWSOLR_HOME/solr/${DOC_TYPE}_active/conf/batchload-config.xml

#DEBUG="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"

_osver=`uname`a
if [ "X""${_osver:0:6}" == "X""CYGWIN" ]; then
  _isCygwin=1
  _CYGDRIVE=/cygdrive/c
  _DL=\\\;
else
  _isCygwin=0
  _CYGDRIVE=
  _DL=:
fi

buildpath() {
	local _pvar=
	for a in `find $_CYGDRIVE$1 -maxdepth 1 -type f -name \*.jar`; do
	    if [ $_isCygwin -eq 1 ]; then
			a=`echo $a | sed -e 's|/cygdrive/.||' -e 's|\/|\\\\|g'`
		fi
		if [ "X"$_pvar == "X" ]; then
			_pvar=$a
		else
			_pvar=$_pvar$_DL$a
		fi
	done
	echo $_pvar
}

source ./checkjava.sh

# Java 21 is required
JAVA_VERSION=$(verify_and_get_java_version)

JARS=$(buildpath $LIBDIR)

# If you define transformer classes, archive them in a jar and place the jar and any required
# dependent jars in the directory pointed to by the TRANSFORMERLIBDIR environment variable.

# Add the jars only if TRANSFORMERLIBDIR refers to a different directory than LIBDIR
if [ ! "X"$TRANSFORMERLIBDIR == "X"$LIBDIR ]; then
	TRANSFORMERJARS=$(buildpath $TRANSFORMERLIBDIR)
else
	TRANSFORMERJARS=
fi

if [ ! "X"$GWENV == "X" ]; then
	JAVA_OPTS="$JAVA_OPTS -Dgw.$APP_PREFIX.env=$GWENV"
fi

"$JAVA_HOME/bin/java" $DEBUG $JAVA_OPTS -cp $JARS$_DL$SERVLETJAR$_DL$TRANSFORMERJARS \
  com.guidewire.solr.batchload.SolrBatchLoader $CONFIGFILE 2>&1 | tee ./solr-batchload.err