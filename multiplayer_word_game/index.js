var express = require('express');
var path = require('path');
var agx = require('./agxgame');
var app = express();
var server = require('http').createServer(app).listen(8080);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
    console.log('client connected');
    agx.initGame(io, socket);
});


