'use strict';

/*!
 * koa-socket.io - lib/namespace.js
 * Copyright(c) 2017 LnsooXD
 * MIT Licensed
 */

const util = require('./util');
const is = require('is-type-of');
const Connection = require('./connection');
const Listeners = require('./wares/listener');
const Middlewares = require('./wares/middleware');
const debug = require('debug')('koa-socket.io:namespace');
const assert = require('assert');

module.exports = class Namespace {
  constructor(namespace, server) {
    util.readOnlyProp(this, 'server', server);
    util.readOnlyProp(this, 'id', namespace);

    /**
     * List of middlewares, these are composed into an execution chain and
     * evaluated with each event
     * @type middleware <Array:Function>
     **/
    util.readOnlyProp(this, 'middlewares', new Middlewares());
    util.readOnlyProp(this, 'listeners', new Listeners());

    /**
     * All active connections
     * id:Socket
     * @type connections <Map>
     **/
    util.readOnlyProp(this, 'connections', new Map());

    this.socket = null;

    this.onConnection = this.onConnection.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
  }

  start() {
    debug('namespace start: %s', this.id);
    if (this.server.socket) {
      this.socket = this.server.socket.of(this.id, this.onConnection);
      this.listeners.events.forEach((event) => {
        this.handleOn(event);
      });
    }
  }

  onConnection(sock) {
    const instance = new Connection(this, sock);
    this.connections.set(instance.id, instance);
    sock.on('disconnect', () => {this.onDisconnect(instance)});
    instance.connect();
  }

  onDisconnect(connection) {
    this.connections.delete(connection.id)
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
    this.listeners.add(event, handler);
    util.invokeAllInMap(this.connections, 'on', event, handler);
    return this
  }

  /**
   * Removes a listener from the event
   * @param event <String> if omitted will remove all listeners
   * @param handler <Function> if omitted will remove all from the event
   * @return this
   */
  off(event, handler) {
    this.listeners.remove(event, handler);
    util.invokeAllInMap(this.connections, 'off', event, handler);
    return this
  }

  emit(...args) {
    if (is.nullOrUndefined(this.socket)) {
      // TODO: ingore or throw a exception?
      return;
    }
    this.socket.emit(...args);
  }
};