const Koa = require('koa')
const IO = require('../')
const http = require('http');
const debug = require('debug')('koa-socket.io:example');
const compose = require('koa-compose');

const app = new Koa()
const io = new IO({
    namespace: '/'
})

app.use(require('koa-static')('./public'));

let options = {
    /* socket.io options */
}

let server = http.createServer(app.callback());

io.start(server, options/*, port, host */)

// async style event handler
io.on('join', async (ctx) => {
    debug('join event fired', ctx.data)
    io.emit('msg', '[All]: ' + ctx.data + ' joind'); // use global io send borad cast
    ctx.socket.broadcast('msg', '[All]: Hello guys, I\'m ' + ctx.data + '.'); // use current socket send a broadcast
    ctx.socket.emit('msg', '[' + ctx.data + ']' + " Welcome to koa-socket.io !"); // just send to current user
})

// The chatroom code below is modify from: https://github.com/socketio/socket.io/tree/master/examples/chat
// Chatroom
let numUsers = 0;

// middleware
io.use(async (ctx, next) => {
    debug('middleware invoke: %s, %s', ctx.event, ctx.id);
    await next();
});

// common function event handler
io.on('connect', async (ctx, next) => {

    debug('someone connect: %s', ctx.id);

    const socket = ctx.socket;
    let addedUser = false;

    // when the client emits 'add user', this listens and executes
    socket.on('add user', async (ctx) => {
        if (addedUser) {
            return;
        }

        // we store the username in the socket session for this client
        ctx.username = ctx.data;

        debug('user joined: %s', ctx.username);

        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast('user joined', {
            username: ctx.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', async (ctx) => {
        debug('new message: %s', ctx.data);
        // we tell the client to execute 'new message'
        socket.broadcast('new message', {
            username: ctx.username,
            message: ctx.data
        });
    });


    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', async (ctx) => {
        debug('typing: %s', ctx.username);
        socket.broadcast('typing', {
            username: ctx.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', async (ctx) => {
        debug('stop typing: %s', ctx.username);
        socket.broadcast('stop typing', {
            username: ctx.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', async (ctx) => {
        if (addedUser) {
            debug('user left: %s', ctx.username);
            --numUsers;

            // echo globally that this client has left
            socket.broadcast('user left', {
                username: ctx.username,
                numUsers: numUsers
            });
        }
    });
});

let port = 3000;
let host = 'localhost';

server.on('error', function (error) {
    debug(error);
})

server.listen(port, host, function () {
    debug('server listen on: http://' + host + ':' + port);
});



