"use strict";

/*!
 * koa-socket.io - lib/wares/middleware.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const is = require('is-type-of');
const not = require('not-type-of');
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

    add(fn) {
        if (not.function(fn)) throw new TypeError('middleware must be a function!');
        if (is.generatorFunction(fn)) {
            deprecate('Support for generators will be removed in koa v3. ' +
                'See the documentation for examples of how to convert old middleware ' +
                'https://github.com/koajs/koa/blob/master/docs/migration.md');
            fn = convert(fn);
        }
        this.middlewares.push(fn);
        this.middlewaresComposed = compose(this.middlewares);
    }

    get composed() {
        return this.middlewaresComposed;
    }
};