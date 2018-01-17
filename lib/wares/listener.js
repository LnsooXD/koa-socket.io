"use strict";

/*!
 * koa-socket.io - lib/index.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const compose = require('koa-compose');
const util = require('../util');

module.exports = class ListenerCollection {

    constructor(listeners, listenersComposed) {
        /**
         * All of the listeners currently added to the IO instance
         * event:callback
         * @type listeners <Map>
         */
        util.readOnlyProp(this, 'listeners', listeners ? listeners : new Map());
        util.readOnlyProp(this, 'listenersComposed', listenersComposed ? listenersComposed : new Map());
    }

    hasEvent(event) {
        return this.listeners.has(event);
    }

    add(event, handler) {
        let isNew = false;
        let listeners = this.get(event);
        if (!listeners) {
            listeners = [handler];
            isNew = true;
        } else {
            listeners.push(handler);
        }
        this.set(event, listeners);
        return isNew;
    }

    remove(event, handler) {
        if (!event) {
            this.clear();
            return;
        }

        if (!handler) {
            this.delete(event);
            return this
        }

        let listeners = this.get(event);
        let i = listeners.length - 1;
        while (i) {
            if (listeners[i] === handler) {
                break
            }
            i--;
        }

        listeners = listeners.splice(i, 1);
        if (listeners.length <= 0) {
            this.delete(event);
        } else {
            this.set(event, listeners);
        }
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

    clone() {
        const listeners = new Map();
        const listenersComposed = new Map();

        this.listeners.forEach((value, key) => {
            listeners.set(key, value);
        });

        this.listenersComposed.forEach((value, key) => {
            listenersComposed.set(key, value);
        });

        return new ListenerCollection(listeners, listenersComposed);
    }

    get composed() {
        return this.listenersComposed;
    }

    get events() {
        return [...this.listeners.keys()];
    }

};