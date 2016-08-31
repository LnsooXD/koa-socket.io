"use strict";

/*!
 * koa-socket.io - lib/util.js
 * Copyright(c) 2016 LnsooXD
 * MIT Licensed
 */

module.exports = {
    readOnlyProp: function(obj, key, value) {
        Object.defineProperty(obj, key, {
            value: value,
            writable: false
        });
    }
};