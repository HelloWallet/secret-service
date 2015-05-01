#!/bin/bash
#
#       /etc/rc.d/init.d/rmui
#
# chkconfig: 345 70 30

# Source function library.
. /etc/init.d/functions

RETVAL=0
prog="nodejs"
LOCKFILE=/var/lock/subsys/$prog
APP_PATH=${appDir}
NODE_PREFIX=`npm get prefix`
SS_EXEC=$NODE_PREFIX/bin/secret-service

start() {
    echo -n "Starting $prog: "
    cd $APP_PATH 
    export NODE_ENV=production
    daemon --user="nodejs" $SS_EXEC launch start
    touch /var/lock/subsys/$prog
    RETVAL=$?
    [ $RETVAL -eq 0 ] && touch $LOCKFILE
    echo
    return $RETVAL
}

stop() {
    echo -n "Shutting down nodejs: "
    cd $APP_PATH
    daemon --user="nodejs" $SS_EXEC launch stop
    RETVAL=$?
    [ $RETVAL -eq 0 ] && rm -f $LOCKFILE
    echo
    return $RETVAL
}

restart() {
    echo -n "Shutting down nodejs: "
    cd $APP_PATH
    daemon --user="nodejs" $SS_EXEC launch redeploy
    RETVAL=$?
    [ $RETVAL -eq 0 ] && rm -f $LOCKFILE
    echo
    return $RETVAL
}

status() {
    cd $APP_PATH
    $SS_EXEC launch status
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage: $prog {start|stop|status|restart]"
        exit 1
        ;;
esac
exit $?
