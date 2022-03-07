function parseReceived(buff) {
    return new Promise((resolve, reject) => {
        // Content is final frame in binary, represented Boolean
        const ISFINALFRAME = Boolean(buff[0].toString(2)[0]);

        // Reserved flags represented in binary
        const RESERVEDFLAGS = buff[0].toString(2).substring(1, 4);

        // OP Code represented in decimal
        // 0 -> Continuation frame / 0x0
        // 1 -> Text frame / 0x1
        // 2 -> Binary frame / 0x2
        // 8 -> Connection close frame / 0x8
        // 9 -> Ping frame (Heartbeat received) / 0x9
        // 10 -> Pong frame (Heartbeat response) / 0xA
        const OPCODE = parseInt(buff[0].toString(2).substring(5, 8), 2);

        // Payload is masked represented in binary represented as Boolean
        const ISMASKED = Boolean(buff[1].toString(2)[0]);

        // Received string's length represented in decimal
        let contentLength = buff.readUInt8(1) & 0x7F;

        // Terminate the connection between client and server
        if(OPCODE === 0) return reject("disconnect");

        // Check if content's length is bigger than 125,
        // content's opcode is something else than 1,
        // if so, return nothing.
        if(OPCODE !== 1 || ISMASKED === false) return reject("unmasked");

        // We need to skip first two bytes containing the data about the payload
        let offset = 2;

        // Check if payload is bigger than 125 and equals 126
        // If so, read content length from there
        if(contentLength > 125 && contentLength === 126) {
            contentLength = buff.readUInt16BE(offset);
            offset += 2;
        };

        // Get the Masking key because content is masked
        let maskingKey = buff.readUInt32BE(offset);
        offset += 4;

        // Allocate data for payload and unmask it
        const data = Buffer.alloc(contentLength);
        for (let i = 0, j = 0; i < contentLength; i++, j = i % 4) {
            const SHIFT = j === 3 ? 0 : (3 - j) << 3;
            const MASK = (SHIFT == 0 ? maskingKey : (maskingKey >>> SHIFT)) & 0xFF;
            const SOURCE = buff.readUInt8(offset++);
            data.writeUInt8(MASK ^ SOURCE, i);
        };
        
        // Try to parse plaintext data as string
        try {
            const JSONDATA = JSON.parse(data.toString('utf-8'))
            return resolve(JSONDATA);
        } catch(e) {
            return reject("incorrectFormatting");
        }
    });
}

module.exports = { parseReceived };