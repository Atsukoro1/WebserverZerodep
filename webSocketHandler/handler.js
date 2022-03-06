const crypto = require("crypto");

const webSocketHandler = function(req, socket) {
    if(req.headers["upgrade"] !== 'websocket') return;

    // Check if request / client meets requirements
    // to estabilish websocket connection, if not, close it.
    if(parseFloat(req.httpVersion) <= 1 || req.method != 'GET') {
        return socket.end("HTTP/1.1 404 Bad Request\r\n\r\n");
    };

    // Create Accept key hash in order to accept communication with client
    function createAcceptKey() {
        const shasum = crypto.createHash('sha1');
        shasum.update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        return shasum.digest().toString("base64");
    }

    // Construct response and return it back to client
    const response = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${createAcceptKey()}\r\n\r\n`
    socket.write(response);

    // Receive all data from client
    socket.on("data", data => {
        console.log(data.toString("utf-8"));
    });
}

module.exports = { webSocketHandler };