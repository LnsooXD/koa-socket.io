const Koa = require('koa')
const IO = require('../')
const http = require('http');


const app = new Koa()
const io = new IO({
    namespace: '/'
})

app.use(require('koa-static-server')({
    rootDir: 'public'
}));

let options = {
    /* socket.io options */
}

let server = http.createServer(app.callback());

io.start(server, options/*, port, host */)

io.on('join', function* () {
    console.log('join event fired', this.data)
    io.emit('msg', '[All]: ' + this.data + ' joind'); // use global io send borad cast
    this.socket.broadcast('msg', '[All]: Hello guys, I\'m ' + this.data + '.'); // use current socket send a broadcast
    this.socket.emit('msg', '[' + this.data + ']' + " Welcome to koa-socket.io !"); // just send to current user
})


let port = 3000;
let host = 'localhost';

server.on('error', function (error) {
    console.log(error);
})

server.listen(port, host, function () {
    console.log('server listen on: http://' + host + ':' + port);
});