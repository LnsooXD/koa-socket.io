"use strict";

/*!
 * koa-socket.io - lib/index.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const compose = require('koa-compose');
const util = require('../util');

module.exports = class ListenerCollection {

    constructor() {
        /**
         * All of the listeners currently added to the IO instance
         * event:callback
         * @type listeners <Map>
         */
        util.readOnlyProp(this, 'listeners', new Map());
        util.readOnlyProp(this, 'listenersComposed', new Map());
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
        this.listeners.clear();
        this.listenersComposed.clear();
    }

    delete(event) {
        this.listeners.delete(event);
        this.listenersComposed.delete(event);
    }

    get composed() {
        return this.listenersComposed;
    }

    get events() {
        return [...this.listeners.keys()];
    }

};