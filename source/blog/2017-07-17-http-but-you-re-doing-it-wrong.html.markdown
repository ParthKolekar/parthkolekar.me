---
title: HTTP, but you're doing it wrong
date: 2017-07-17 02:04 UTC
tags:
  - ctf
  - web 
---

Find the flag.

Solution
--------

The source of the problem is as shown. 

~~~ js
#!/usr/bin/env node
var parser = require('http-string-parser');

var net = require('net');

var server_tcp = net.createServer();

server_tcp.on('connection', function(socket) {
    socket.on('data', function(data) {
        socket.end('HTTP/1.0 301 Moved Permanently\r\nServer: multi-transport-server\r\nConnection: close\r\n\r\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>wrong transport</title></head><body><h1>wrong transport</h1></body></html>');
    });
});

server_tcp.listen(3679, '0.0.0.0');

var dgram = require('dgram');
var server_udp = dgram.createSocket('udp4');

server_udp.on('message', function (message, remote) {
    request = parser.parseRequest(message.toString());
    if (request.method != 'PUT') {
        response = new Buffer('HTTP/1.0 405 Method Not Allowed\r\nServer: multi-transport-server\r\nConnection: close\r\n\r\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>405 Method Not Allowed</title></head><body><h1>405 Method Not Allowed</h1></body></html>');
    } else if (request.headers['i-want-flag'] == undefined) {
        response = new Buffer('HTTP/1.0 200 OK\r\nServer: multi-transport-server\r\nConnection: close\r\n\r\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Header i-want-flag missing</title></head><body><h1>Header i-want-flag missing</h1></body></html>');
    } else if (request.headers['i-want-flag'] != 'false') {
        response = new Buffer('HTTP/1.0 200 OK\r\nServer: multi-transport-server\r\nX-Dumbledore: Only a person who wanted to find the flag - find it, but not use it - would be able to get it\r\nConnection: close\r\n\r\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Header i-want-flag wrong</title></head><body><h1>Header i-want-flag wrong</h1></body></html>');
    } else {
        response = new Buffer('flag: a real testament to a work of art is the number of copies that it has inspired');
    }
    server_udp.send(response, 0, response.length, remote.port, remote.address);
});

server_udp.bind(3679, '0.0.0.0');
~~~

We start the web problem as usual. By sending it a request and seeing what it does. 

    $ curl -v http://yuno.parthkolekar.me:3679
    ...
    * HTTP 1.0, assume close after body
    < HTTP/1.0 301 Moved Permanently
    < Server: multi-transport-server
    < Connection: close
    ...
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>wrong transport</title></head><body><h1>wrong transport</h1></body></html>

We get an awkward response. We get a HTTP 301. But it is without any `Location`
header. Interestingly, the HTTP replies say wrong transport.

This seems like we would need to to use a different transport. It can mean a
different transport layer. Let us try a UDP connection. 

    $ nc -u yuno.parthkolekar.me 3679
    GET /
    HTTP/1.0 405 Method Not Allowed
    Server: multi-transport-server
    Connection: close

    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>405 Method Not Allowed</title></head><body><h1>405 Method Not Allowed</h1></body></html>

Whoa!. So our hunch was right. It is a UDP server running HTTP protocol. A 
little more experimentation leads us to the fact that the server accepts a
HTTP PUT request. It does not seem to require any sort of data. It accepts any
sort of PUT requests. 

    $ nc -u yuno.parthkolekar.me 3679
    PUT /
    HTTP/1.0 200 OK
    Server: multi-transport-server
    Connection: close

    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Header i-want-flag missing</title></head><body><h1>Header i-want-flag missing</h1></body></html>

This seems to want a header i-want-flag. So let us give it that. 

    $ echo "PUT /\ni-want-flag: true" | nc -u yuno.parthkolekar.me 3679
    HTTP/1.0 200 OK
    Server: multi-transport-server
    X-Dumbledore: Only a person who wanted to find the flag - find it, but not use it - would be able to get it
    Connection: close

    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Header i-want-flag wrong</title></head><body><h1>Header i-want-flag wrong</h1></body></html>

This is a fun activity to do now. A little guessing is involved to find out
what Dumbledore wants us to do. But we figure it out soon enough.

    $ echo "PUT /\ni-want-flag: false" | nc -u yuno.parthkolekar.me 3679
    flag: a real testament to a work of art is the number of copies that it has inspired

This is a reference to the fact that this same question was given as a felicity
challenge as well, and the fact that I am getting lazy enough to reuse and 
arrogent enough to flaunt that fact instead of hiding it. 

Flag
----

a real testament to a work of art is the number of copies that it has inspired

