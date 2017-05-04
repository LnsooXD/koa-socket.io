"use strict";

/*!
 * koa-socket.io - lib/index.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

const IO = require('socket.io');
const is = require('is-type-of');
const not = require('not-type-of');
const Namespace = require('./namespace');

module.exports = class SocketServer {

    /**
     * @constructs
     * @param opts <Object> options
     */
    constructor(opts) {

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

        this.namespaces.forEach((ns) => {
            ns.attach(this.socket);
        });

        this.namespace(this.opts.namespace);
    }

    namespace(ns) {
        ns = not.nullOrUndefined(ns) ? ns : '/';
        let namespace = this.namespaces.get(ns);
        if (!namespace) {
            namespace = new Namespace(ns, this.socket);
            this.namespaces.set(ns, namespace);
        }
        return namespace;
    }

    use(fn, namespace) {
        this.namespace(namespace).use(fn);
    }

    post(fn, namespace) {
        this.namespace(namespace).post(fn);
    }

    on(event, handler, namespace) {
        this.namespace(namespace).on(event, handler);
    }

    off(event, handler, namespace) {
        this.namespace(namespace).off(event, handler);
    }

    emit(/*...*/) {
        if (is.nullOrUndefined(this.socket)) {
            //TODO: ingore or throw a exception?
            return;
        }
        this.socket.emit.apply(this.socket, arguments);
    }
};