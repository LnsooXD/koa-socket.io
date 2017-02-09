"use strict";

/*!
 * koa-socket.io - lib/connection.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

const util = require('./util');
const compose = require('koa-compose');
const co = require('co');

module.exports = class Connection {

    constructor(socket, listeners, middleware, postware) {
        util.readOnlyProp(this, 'socket', socket);
        this.update(listeners, middleware, postware);
    }

    /**
     * Registers the new list of listeners and middleware composition
     * @param listeners <Map> map of events and callbacks
     * @param middleware <Function> the composed middleware
     * @param postware <Function> the composed postware
     */
    update(listeners, middleware, postware) {
        this.socket.removeAllListeners();
        listeners.forEach((listener, event) => {
            if (event === 'connection') {
                return true;
            }
            let handler = assembleHandlers([middleware, listener, postware]);
            if (handler) {
                this.on(event, handler);
            }
        });
    }

    /**
     * Adds a specific event and callback to this socket
     * @param event <String>
     * @param handler <Function>
     */
    on(event, handler) {
        this.socket.on(event, (data, cb) => {
            let ctx = {
                event: event,
                data: data,
                socket: this,
                acknowledge: cb
            };

            handler.call(ctx).then(()=> {
            }).catch(function (err) {
                console.log(err);
            });
        })
    }


    /**
     * Getter for the socket id
     * @type id <String>
     */
    get id() {
        return this.socket.id
    }


    /**
     * Helper through to the socket
     * @param event <String>
     * @param packet <?>
     */
    emit(event, packet) {
        this.socket.emit(event, packet)
    }

    /**
     * Helper through to broadcasting
     * @param event <String>
     * @param packet <?>
     */
    broadcast(event, packet) {
        this.socket.broadcast.emit(event, packet)
    }

    /**
     * Disconnect helper
     */
    disconnect() {
        this.socket.disconnect()
    }

};

function assembleHandlers(origins) {
    let handlers = [];
    origins.forEach((handler)=> {
        if (handler) {
            handlers.push(handler);
        }
    });
    if (handlers.length <= 0) {
        return null;
    } else {
        return co.wrap(compose(handlers));
    }
}