const crypto = require("crypto");

// We'll cache all connected clients here to prevent DDOS
const connectedClients = new Map();

function decodeContent(str) {
    const contentLength = str[1] - 0x80;
    const key = new Buffer.alloc(str[2] + str[3] + str[4] + str[5]);
    
    if(contentLength <= 125) {
        let final = [];
        for (let i = 0; i < contentLength; i++) {
            final.push(str[6 + i] ^ key[i % 4]);
        };
    
        return new Buffer(final).toString("utf-8");
    }
}

const webSocketHandler = function(req, socket) {
    // Get client's ip address in order to identify it
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Check if client is already connected
    // if(connectedClients.get(ip)) return socket.end("HTTP/1.1 429 Too Many Requests\r\n\r\n");

    // Check for correct headers
    // Client must specify Upgrade and Subprotocol header
    if(req.headers["upgrade"] !== 'websocket' || !req.headers['sec-websocket-protocol']) return socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");

    // Check if request / client meets requirements
    // to estabilish websocket connection, if not, close it.
    if(parseFloat(req.httpVersion) <= 1 || req.method != 'GET') {
        return socket.end("HTTP/1.1 404 Bad Request\r\n\r\n");
    };

    // Create Accept key hash in order to accpet the handshake
    function createAcceptKey() {
        const shasum = crypto.createHash('sha1');
        shasum.update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        return shasum.digest().toString("base64");
    }

    if(!req.headers['sec-websocket-protocol'] || !req.headers['sec-websocket-protocol'].split(",").includes("json")) return socket.end("HTTP/1.1 400 Bad Request\r\n\r\n")
    // Construct response and return it back to client
    const response = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${createAcceptKey()}\r\nSec-Websocket-Protocol: json\r\n\r\n`
    socket.write(response);

    // Handshake was successful, cache client
    connectedClients.set(ip, true);

    // Receive all data from client
    socket.on("data", data => {
        console.log(decodeContent(data));
    });
}

module.exports = { webSocketHandler };