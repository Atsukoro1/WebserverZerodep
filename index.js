// Libraries
const http = require("http");

// Handlers
const { handleWebserverRequest } = require("./webServerHandler/handler");
const { webSocketHandler } = require("./webSocketHandler/handler");

// Create Webserver
const server = http.createServer()
.on("request", handleWebserverRequest)
.on("upgrade", webSocketHandler)

// Start the Webserver
const PORT = process.env.PORT || 3000;
server.listen(PORT, "127.0.0.1", function() {
    console.log(`[SERVER] Server is listening to port *${PORT}`)
});

const { validateBody } = require("./utils/bodyValidator");

validateBody({ num: 1 }, { num: "number;max:0" })