var osc = require("osc");
var path = require('path');
var WebSocket = require("ws");
var http = require('http');
var fs = require('fs');
var mimeTypes = {
    '.js': 'text/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
};

var getIPAddresses = function () {
    var os = require("os"),
    interfaces = os.networkInterfaces(),
    ipAddresses = [];

    for (var deviceName in interfaces){
        var addresses = interfaces[deviceName];

        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];

            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};

var udp = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 9000
});

udp.on("ready", function () {
    var ipAddresses = getIPAddresses();
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udp.options.localPort);
    });
});

udp.open();

var wss = new WebSocket.Server({
    port: 8081
});

wss.on("connection", function (socket) {
    console.log("A Web Socket connection has been established!");
    var socketPort = new osc.WebSocketPort({
        socket: socket
    });

    var relay = new osc.Relay(udp, socketPort, {
        raw: true
    });
});


http.createServer(function (request, response) {
    var decodedURI = decodeURI(request.url);
    if(decodedURI == '/'){
        f = 'web/index.html';
    }else{
        f = 'web' + decodedURI;
    }
    fs.exists(f, function (exists) {
        if (exists) {
            fs.readFile(f, function(err, data) {
                if (err) {
                    response.writeHead(500);
                    response.end('Server Error!');
                    return;
                }
                //console.log(decodeURI(request.url) +' '+f +'  '+ path.extname(f)  );
                var headers = {'content-Type' : mimeTypes[path.extname(f)]};
                response.writeHead(200, headers);
                response.end(data);
            });
        }else{
            response.writeHead(404);
            response.end('Nod found.');
        }
    });
}).listen(8080, "127.0.0.1");
