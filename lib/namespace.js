"use strict";

/*!
 * koa-socket.io - lib/namespace.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

const util = require('./util');
const is = require('is-type-of');
const Connection = require('./connection');
const Listeners = require('./wares/listener');
const Middlewares = require('./wares/middleware');
const co = require('co');

module.exports = class Namespace {

    constructor(namespace, socket) {
        util.readOnlyProp(this, "id", namespace);

        this.socket = null;

        this.attach(socket);

        /**
         * List of middlewares, these are composed into an execution chain and
         * evaluated with each event
         * @type middleware <Array:Function>
         */
        this.middlewares = new Middlewares();
        this.postwares = new Middlewares();

        this.listeners = new Listeners();

        /**
         * All active connections
         * id:Socket
         * @type connections <Map>
         */
        this.connections = new Map();

        this.onConnection = this.onConnection.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
    }

    attach(socket) {
        if (socket) {
            this.socket = is.nullOrUndefined(this.id) ? socket : socket.of(this.id);
            this.socket.on('connection', this.onConnection);
        }
    }

    onConnection(sock) {
        let instance = new Connection(sock, this.listeners.composed, this.middlewares.composed, this.postwares.composed);
        this.connections.set(sock.id, instance);
        sock.on('disconnect', () => {
            this.onDisconnect(sock)
        });

        let handlers = this.listeners.getComposed('connection');
        if (handlers) {
            let ctx = {
                event: 'connection',
                data: instance.id,
                socket: instance.socket
            };
            co.wrap(handlers).call(ctx).then(()=> {
            }).catch(function (err) {
                console.log(err);
            });
        }
    }

    onDisconnect(sock) {
        this.connections.delete(sock.id)
    }

    /**
     * Pushes a middleware on to the stack
     * @param fn <Function> the middleware function to execute
     */
    use(fn) {
        this.middlewares.add(fn);
        this.updateConnections();
        return this
    }

    /**
     * Pushes a postware on to the stack
     * @param fn <Function> the middleware function to execute
     */
    post(fn) {
        this.postwares.add(fn);
        this.updateConnections();
        return this
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
            this.updateConnections();
        } else {
            listeners.push(handler);
        }

        this.listeners.set(event, listeners);
        this.updateConnections();
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
            this.updateConnections();
            return this
        }

        if (!handler) {
            this.listeners.delete(event);
            this.updateConnections();
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
        this.listeners.set(event, listeners.splice(i, 1));
        this.updateConnections();
        return this
    }

    /**
     * Updates all existing connections with current listeners and middleware
     * @private
     */
    updateConnections() {
        this.connections.forEach((conn)=>{
            conn.update(this.listeners.composed, this.middlewares.composed, this.postwares.composed);
        });
    }
};