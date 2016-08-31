# koa-socket.io

> Sugar for connecting socket.io to a koa instance

koa-socket.io now requires **node v4.0.0** or higher although koa-socket simply attaches to the server instance so will be compatible with a koa v1 powered app.


## Installation

```sh
npm i -S koa-socket
```

## Example

```js
const Koa = require( 'koa' )
const IO = require( 'koa-socket.io' )
const http = require('http');


const app = new Koa()
const io = new IO({
  namespace: '/'
})
  
app.use( ... )

let options = {
  /* socket.io options */
}

var server = http.createServer(app.callback());

io.start( server, options/*, port, host */ )

io.on( 'join', function *() {
  console.log( 'join event fired', this.data )
})

server.listen( process.env.PORT || 3000 )
```

## Features

* Attach socket.io to existing koa projects
* Attach koa-style middleware to socket.io events

## Middleware and event handlers

Middleware can be added in much the same way as it can be added to any regular koa instance.

```js
io.use(function* (next){
  let start = new Date()
  yield next;
  console.log( `response time: ${ new Date() - start }ms` )
})
```


## Passed Context

```
this =  {
  event: listener.event,
  data: data,
  socket: Socket,
  acknowledge: cb
}
```
```js
io.use( function* (next ) {
  this.process = process.pid
  yield next;
})

io.use( function *(next ) => {
  // ctx is passed along so ctx.process is now available
  console.log( this.process )
})

io.on( 'event', function*(next) => {
  // ctx is passed all the way through to the end point
  console.log( this.process )
})
```


## Namespaces

Namespaces can be defined simply by instantiating a new instance of `koaSocket` and passing the namespace id in the constructor. All other functionality works the same, it’ll just be constrained to the single namespace.

```js
const app = new Koa()
const chat = new IO({
  namespace: 'chat'
})

chat.start( app.server )

chat.on( 'message', function*(next) {
  console.log( this.data )
  chat.broadcast( 'response', ... )
})
```

Namespaces also attach themselves to the `app` instance, throwing an error if the property name already exists.

```js
const app = new Koa()
const chat = new IO({
  namespace: 'chat'
})

chat.start( app.server )

chat.use( ... )
chat.on( ... )
chat.broadcast( ... )
```

## API

### .start( `http/https server`, `socket.io options`, `port`, `host` )

Attaches to a http/https server

```js
io.start( server )
server.listen( process.env.PORT )
```

### .use( `Function callback` )

Applies middleware to the stack.

Middleware are executed each time an event is reacted to and before the callback is triggered for an event.

Middleware must be generator

Middleware functions are called with `this` and `next` like koa 1.x.


```js
io.use( function* (next ) {
  console.log( 'Upstream' )
  yield next;
  console.log( 'Downstream' )
})
```

### .on( `String event`, `Generator Function callback` )

```js
io.on( 'join', function *( next) => {
  console.log( this.data )
  console.log( this.event)
})
```

### .off( `String event`, `Generator Function callback` )

Removes a callback from an event.

If the `event` is omitted then it will remove all listeners from the instance.

If the `callback` is omitted then all callbacks for the supplied event will be removed.

```js
io.off( 'join', onJoin )
io.off( 'join' )
io.off()
```

### .broadcast( `String event`, `data` )

Sends a message to all connections.

##Authors

- [LnsooXD](https://github.com/LnsooXD)

## License

- [MIT](http://spdx.org/licenses/MIT)


