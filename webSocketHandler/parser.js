function parseReceived(buff) {
    // Content is final frame in binary, represented Boolean
    const isFinalFrame = Boolean(buff[0].toString(2)[0]);

    // Reserved flags represented in binary
    const reservedFlags = buff[0].toString(2).substring(1, 4);

    // OP Code represented in decimal
    // 0 -> Continuation frame / 0x0
    // 1 -> Text frame / 0x1
    // 2 -> Binary frame / 0x2
    // 8 -> Connection close frame / 0x8
    // 9 -> Ping frame (Heartbeat received) / 0x9
    // 10 -> Pong frame (Heartbeat response) / 0xA
    const opCode = parseInt(buff[0].toString(2).substring(5, 8), 2);

    // Payload is masked represented in binary represented as Boolean
    const isMasked = Boolean(buff[1].toString(2)[0]);

    // Received string's length represented in decimal
    const contentLength = buff[1] - 0x80;

    // Check if content's length is bigger than 125,
    // content's opcode is something else than 1,
    // if so, return nothing.
    if(contentLength > 125 || opCode !== 1) return;
}

module.exports = { parseReceived };