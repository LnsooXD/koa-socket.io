"use strict";

/*!
 * koa-socket.io - lib/index.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

const compose = require('koa-compose');
const co = require('co');

module.exports = class ListenerCollection {

    constructor(socket, listeners, composed) {
        /**
         * All of the listeners currently added to the IO instance
         * event:callback
         * @type listeners <Map>
         */
        this.listeners = new Map();
        this.listenersComposed = new Map();
    }

    set(event, listeners) {
        this.listeners.set(event, listeners);
        this.listenersComposed.set(event, compose(listeners));
    }

    get(event) {
        return this.listeners.get(event);
    }

    getComposed(event) {
        return this.listenersComposed.get(event);
    }

    clear() {
        this.listeners = new Map();
        this.listenersComposed = new Map();
    }

    delete(event) {
        this.listeners.delete(event);
        this.listenersComposed.delete(event);
    }

    get composed() {
        return this.listenersComposed;
    }

};