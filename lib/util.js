"use strict";

/*!
 * koa-socket.io - lib/util.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const is = require('is-type-of');
const compose = require('koa-compose');

module.exports = {
    readOnlyProp: (obj, key, value) => {
        Object.defineProperty(obj, key, {
            value: value,
            writable: false
        });
    },
    assembleHandlers: (origins) => {
        const handlers = [];
        origins.forEach((handler) => {
            if (handler) {
                handlers.push(handler);
            }
        });
        if (handlers.length <= 0) {
            return null;
        } else {
            return compose(handlers);
        }
    },
    invokeAllInMap: (map, name, ...args) => {
        map.forEach((item) => {
            item[name].call(item, ...args);
        });
    },
    emptyFunc: () => {
    }
};