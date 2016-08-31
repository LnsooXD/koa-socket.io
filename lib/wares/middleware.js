"use strict";

/*!
 * koa-socket.io - lib/wares/middleware.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

const compose = require('koa-compose');

module.exports = class MiddlewareCollection {

    constructor(socket, listeners, composed) {
        /**
         * Composed middleware stack
         * @type composed <Function>
         */
        this.middlewaresComposed = null;
        this.middlewares = [];

    }

    add(middleware) {
        this.middlewares.push(middleware);
        this.middlewaresComposed = compose(this.middlewares);
    }

    get composed() {
        return this.middlewaresComposed;
    }
};