"use strict";

/*!
 * koa-socket.io - lib/connection.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const util = require('./util');
const debug = require('debug')('koa-socket.io:connection');
const assert = require('assert');
const Listeners = require('./wares/listener');
const Middlewares = require('./wares/middleware');

module.exports = class Connection {

    constructor(namespace, socket) {
        debug('create new connection: %s', socket.id);
        util.readOnlyProp(this, 'id', socket.id);
        util.readOnlyProp(this, 'namespace', namespace);
        util.readOnlyProp(this, 'socket', socket);
        util.readOnlyProp(this, 'context', this.createContext());

        /**
         * List of middlewares, these are composed into an execution chain and
         * evaluated with each event
         * @type middleware <Array:Function>
         **/
        util.readOnlyProp(this, "middlewares", new Middlewares());
        util.readOnlyProp(this, "listeners", namespace.listeners.clone())
        this.listeners.events.forEach((event) => {
            this.handleOn(event);
        });
        socket.use((packet, next) => {
            this.context.packet = packet;
            next();
        });
    }

    createContext() {
        const $this = this;
        const context = {
            packet: null,
            get id() {
                return $this.id
            },
            get path() {
                return $this.namespace.id
            },
            get ns() {
                this.namespace
            },
            get socket() {
                return $this
            }
        };
        return context;
    }

    connect() {
        this.notifyOn('connect');
        this.notifyOn('connection');
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
        if (this.listeners.add(event, handler)) {
            this.handleOn(event);
        }
        return this
    }

    /**
     * Removes a listener from the event
     * @param event <String> if omitted will remove all listeners
     * @param handler <Function> if omitted will remove all from the event
     * @return this
     */
    off(event, handler) {
        this.listeners.remove(event, handler);
        if (this.listeners.hasEvent(event)) {
            this.handleOff(event);
        }
        return this
    }

    handleOn(event) {
        debug("handle on: %s", event);
        this.socket.on(event, (data, callback) => {
            this.notifyOn(event, data, callback);
        });
    }

    notifyOn(event, data, callback) {
        const listeners = this.listeners.getComposed(event);
        if (!listeners) {
            this.handleOff(event);
            return;
        }
        const composed = util.assembleHandlers([
            this.namespace.middlewares.composed,
            this.middlewares.composed,
            listeners
        ]);

        if (composed) {
            const context = this.context;
            context.event = event;
            context.data = data;
            context.callback = callback;
            composed(context).then(util.emptyFunc).catch(this.onError);
        }
    }

    handleOff(event) {
        debug("handle off: %s", event);
        this.socket.removeAllListeners(event);
    }

    /**
     * Helper through to the socket
     * @param event <String>
     * @param packet <?>
     */
    emit(...args) {
        this.socket.emit(...args)
    }

    get request() {
        return this.socket.request;
    }

    get handshake() {
        return this.socket.handshake;
    }

    /**
     * Helper through to broadcasting
     * @param event <String>
     * @param packet <?>
     */
    broadcast(...args) {
        this.namespace.emit(...args)
    }

    /**
     * Disconnect helper
     */
    disconnect() {
        this.socket.disconnect()
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