"use strict";

/*!
 * koa-socket.io - lib/namespace.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const util = require('./util');
const is = require('is-type-of');
const Connection = require('./connection');
const Listeners = require('./wares/listener');
const Middlewares = require('./wares/middleware');
const debug = require('debug')('koa-socket.io:namespace');
const assert = require('assert');

module.exports = class Namespace {

    constructor(namespace, server) {
        util.readOnlyProp(this, "server", server);
        util.readOnlyProp(this, "id", namespace);

        /**
         * List of middlewares, these are composed into an execution chain and
         * evaluated with each event
         * @type middleware <Array:Function>
         **/
        util.readOnlyProp(this, "middlewares", new Middlewares());
        util.readOnlyProp(this, "listeners", new Listeners());

        /**
         * All active connections
         * id:Socket
         * @type connections <Map>
         **/
        util.readOnlyProp(this, "connections", new Map());

        this.socket = null;

        this.onConnection = this.onConnection.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.handleUse = this.handleUse.bind(this);
        this.onError = this.onError.bind(this);
    }

    start() {
        debug('namespace start: %s', this.id);
        if (this.server.socket) {
            this.socket = this.server.socket.of(this.id, this.onConnection);
            this.socket.use(this.handleUse.bind(this));
            this.listeners.events.forEach((event) => {
                this.handleOn(event);
            });
        }
    }

    handleUse(packet, next) {
        debug('handle use: %s', packet.id);
        const conn = this.connections.get(packet.id);
        if (!conn) {
            const instance = new Connection(this, null, packet);
            this.connections.set(instance.id, instance);
        }
        const composed = this.middlewares.composed;
        if (conn && composed) {
            const context = conn.context;
            context.packet = packet;
            return composed(context).then((result) => {
                return next(result);
            }).catch((err) => {
                debug(err);
                return next(err);
            });
        } else {
            return next();
        }
    }

    onConnection(sock) {
        const ghost = this.connections.get(sock.id);
        const instance = new Connection(this, sock);
        this.connections.set(instance.id, instance);

        sock.on('disconnect', () => {
            this.onDisconnect(instance)
        });

        const composed = this.middlewares.composed;
        if (composed && ghost && ghost.packet) {
            const context = instance.context;
            context.packet = ghost.packet;
            context.event = 'connect';
            composed(context).then(util.emptyFunc).catch(this.onError);
        }
    }

    onDisconnect(connection) {
        this.connections.delete(connection.id)
    }

    /**
     * Pushes a middleware on to the stack
     * @param fn <Function> the middleware function to execute
     */
    use(fn) {
        this.middlewares.add(fn);
        return this;
    }

    /**
     * Adds a new listeners to the stack
     * @param event <String> the event id
     * @param handler <Function> the callback to execute
     * @return this
     */
    on(event, handler) {
        debug('register event: %s', event);
        let listeners = this.listeners.get(event);

        if (!listeners) {
            listeners = [handler];
            // already started
            if (this.socket) {
                this.handleOn(event);
            }
        } else {
            listeners.push(handler);
        }
        this.listeners.set(event, listeners);
        return this
    }

    handleOn(event) {
        this.socket.on(event, (socket, ...args) => {
            const composed = this.listeners.getComposed(event);
            if (composed) {
                const conn = this.connections.get(socket.id);
                if (conn) {
                    const context = conn.context;
                    context.event = event;
                    context.packet = null;
                    composed(context, ...args).then(util.emptyFunc).catch(this.onError);
                } else {
                    composed(this, ...args).then(util.emptyFunc).catch(this.onError);
                }

            }
        });
    }

    handleOff(event) {
        this.socket.removeAllListeners(event);
    }

    /**
     * Removes a listener from the event
     * @param event <String> if omitted will remove all listeners
     * @param handler <Function> if omitted will remove all from the event
     * @return this
     */
    off(event, handler) {
        if (!event) {
            this.listeners.clear();
            if (this.socket) {
                this.listeners.events.forEach((event) => {
                    this.handleOff(event);
                });
            }
            return this
        }

        if (!handler) {
            this.listeners.delete(event);
            if (this.socket) {
                this.handleOff(event);
            }
            return this
        }

        let listeners = this.listeners.get(event);
        let i = listeners.length - 1;
        while (i) {
            if (listeners[i] === handler) {
                break
            }
            i--;
        }
        listeners = listeners.splice(i, 1);
        if (listeners.length <= 0) {
            this.listeners.delete(event);
            if (this.socket) {
                this.handleOff(event);
            }
            return this
        } else {
            this.listeners.set(event, listeners);
        }

        return this
    }

    emit(...args) {
        if (is.nullOrUndefined(this.socket)) {
            //TODO: ingore or throw a exception?
            return;
        }
        this.socket.emit(...args);
    }

    /**
     * Default error handler.
     *
     * @param {Error} err
     * @api private
     **/
    onError(err) {
        assert(err instanceof Error, `non-error thrown: ${err}`);
        if (404 == err.status || err.expose) {
            return;
        }
        debug(err.stack || err.toString());
    }

};