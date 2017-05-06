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

    constructor(namespace, socket, packet) {
        debug('create new connection: %s', packet ? packet.id : socket.id);
        util.readOnlyProp(this, 'id', packet ? packet.id : socket.id);
        util.readOnlyProp(this, 'namespace', namespace);
        util.readOnlyProp(this, 'packet', packet);

        // a ghost connection
        if (!socket) {
            return this;
        }

        util.readOnlyProp(this, 'socket', socket);
        util.readOnlyProp(this, 'context', this.createContext());

        /**
         * List of middlewares, these are composed into an execution chain and
         * evaluated with each event
         * @type middleware <Array:Function>
         **/
        util.readOnlyProp(this, "middlewares", new Middlewares());
        util.readOnlyProp(this, "listeners", new Listeners());

        this.socket.use(this.handleUse.bind(this));
    }

    handleUse(packet, next) {
        const context = this.context;
        context.packet = packet;
        const composed = this.middlewares.composed;
        if (!composed) {
            return next();
        }
        return composed(context).then((result) => {
            return next(result);
        }).catch((err) => {
            debug(err);
            return next(err);
        });
    }

    createContext() {
        const context = {};
        util.readOnlyProp(context, 'id', this.id);
        util.readOnlyProp(context, 'path', this.namespace.id);
        util.readOnlyProp(context, 'ns', this.namespace);
        util.readOnlyProp(context, 'socket', this);
        return context;
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
        let listeners = this.listeners.get(event);
        if (!listeners) {
            listeners = [handler];
            this.handleOn(event);
        } else {
            listeners.push(handler);
        }
        this.listeners.set(event, listeners);
        return this
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
            this.listeners.events.forEach((event) => {
                this.handleOff(event);
            });
            return this
        }

        if (!handler) {
            this.listeners.delete(event);
            this.handleOff(event);
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
            this.handleOff(event);
            return this
        } else {
            this.listeners.set(event, listeners);
        }

        return this
    }

    handleOn(event) {
        debug("handle on: %s", event);
        this.socket.on(event, (data, callback) => {
            const composed = this.listeners.getComposed(event);
            if (composed) {
                const context = this.context;
                context.event = event;
                context.packet = null;
                context.data = data;
                context.callback = callback;
                composed(context).then(util.emptyFunc).catch(this.onError);
            }
        });
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