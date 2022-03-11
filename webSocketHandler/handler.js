const crypto = require("crypto");

// Import parsers
const { parseReceived, parseResponse } = require("./parser");

// We'll cache all connected clients here
const CONNECTEDCLIENTS = new Map();

const webSocketHandler = function(req, socket) {
    // Get client's ip address in order to identify it
    const IP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Check if client is already connected
    if(CONNECTEDCLIENTS.get(IP)) return socket.end("HTTP/1.1 429 Too Many Requests\r\n\r\n");

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
        // Create SHA-1 HASH
        const SHASUM = crypto.createHash('sha1');

        // Assert the value into it and return it base64 encoded
        SHASUM.update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        return SHASUM.digest().toString("base64");
    }

    if(!req.headers['sec-websocket-protocol'] || !req.headers['sec-websocket-protocol'].split(",").includes("json")) return socket.end("HTTP/1.1 400 Bad Request\r\n\r\n")
    // Construct response and return it back to client
    const RESPONSE = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${createAcceptKey()}\r\nSec-Websocket-Protocol: json\r\n\r\n`
    socket.write(RESPONSE);

    // Handshake was successful
    // Create setTimeout that will run when client's pinging time runs out.
    let pingInterval = setTimeout(() => {
        socket.end();
        CONNECTEDCLIENTS.delete(IP);
    }, 26000);

    // Set a newly connected client
    CONNECTEDCLIENTS.set(IP, {
        connected: true,
        pingInterval: pingInterval,
        nextPingAt: Date.now() + 25000
    });

    // Receive all data from client
    socket.on("data", async (data) => {
        try {
            // We are ready to work with JSON content 
            const CONTENT = await parseReceived(data);

            if(CONTENT.ping) {
                // Get client that pinged our websocket server by ip address
                let pingedClient = CONNECTEDCLIENTS.get(IP);

                // Clear actual interval and replace it with new interval
                clearTimeout(pingedClient.pingInterval);
                let newPingInterval = setTimeout(() => {
                    socket.end();
                    CONNECTEDCLIENTS.delete(IP);
                }, 26000);

                // Asign new values to currently connected client and save it
                pingedClient.pingInterval = newPingInterval;
                pingedClient.nextPingAt = Date.now() + 25000;
                CONNECTEDCLIENTS.set(IP, pingedClient);
                
                // Return pong response
                socket.write(parseResponse({ pong: true, nextPingAt: Date.now() + 25000 }));
            } else {
                // Return response
                socket.write(parseResponse({ received: true }));
            }

        } catch(e) {
            if(e === "disconnect") {
                // Client disconnected by itself
                CONNECTEDCLIENTS.delete(IP);
                socket.end();
            }
        }
    });
}

module.exports = { webSocketHandler };