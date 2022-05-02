"use strict";

/*!
 * koa-socket.io - lib/index.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const IO = require('socket.io');
const is = require('is-type-of');
const not = require('not-type-of');
const util = require('./util');
const debug = require('debug')('koa-socket.io:index');
const Namespace = require('./namespace');

module.exports = class SocketServer {

    /**
     * @constructs
     * @param opts <Object> options
     */
    constructor(opts) {

        this.isStarted = false;
        this.namespaces = new Map();

        opts = opts || {};

        this.opts = Object.assign({
            defaultServerType: 'http',
            namespace: null
        }, opts);

        this.server = null;
        this.socket = null;
    }

    start(server, options/*, arguments*/) {
        if (is.nullOrUndefined(server)) {
            server = require(this.opts.defaultServerType).createServer();
            server.listen(arguments);
        }

        this.server = server;

        this.socket = IO(server, options);
        this.namespace(this.opts.namespace);

        util.invokeAllInMap(this.namespaces, 'start');

        this.isStarted = true;
    }

    namespace(ns) {
        ns = not.nullOrUndefined(ns) ? ns : '/';
        if (String(ns)[0] !== '/') {
            ns = '/' + ns
        }

        let namespace = this.namespaces.get(ns);
        if (!namespace) {
            debug('initializing namespace: %s', ns);
            namespace = new Namespace(ns, this);
            this.namespaces.set(ns, namespace);
            if (this.isStarted) {
                namespace.attach(this.socket);
            }
        }
        return namespace;
    }

    use(fn, namespace) {
        if (is.nullOrUndefined(namespace)) {
            util.invokeAllInMap(this.namespaces, 'use', fn);
        } else {
            this.namespace(namespace).use(fn);
        }
    }

    on(event, handler, namespace) {
        if (is.nullOrUndefined(namespace)) {
            util.invokeAllInMap(this.namespaces, 'on', event, handler);
        } else {
            this.namespace(namespace).on(event, handler);
        }
    }

    off(event, handler, namespace) {
        if (is.nullOrUndefined(namespace)) {
            util.invokeAllInMap(this.namespaces, 'off', event, handler);
        } else {
            this.namespace(namespace).off(event, handler);
        }
    }

    emit(/*...*/) {
        if (is.nullOrUndefined(this.socket)) {
            //TODO: ingore or throw a exception?
            return;
        }
        this.socket.emit.apply(this.socket, arguments);
    }
};