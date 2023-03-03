const net = require('net');
const crypto = require('crypto')

// Simple HTTP server responds with a simple WebSocket client test
const httpServer = net.createServer((connection) => {
    connection.on('data', () => {
        let content =
            `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8" />
                    </head>
                        <body>
                        WebSocket test page
                            <script>
                                let ws = new WebSocket('ws://localhost:3001');
                                ws.onmessage = event => alert('Message from server: ' + event.data);
                                ws.onopen = () => ws.send('hello');
                            </script>
                        </body>
                    </html>`;

        connection.write('HTTP/1.1 200 OK\r\nContent-Length: ' + content.length + '\r\n\r\n' + content);
    });
});
httpServer.listen(3000, () => {
    console.log('HTTP server listening on port 3000');
});


// Incomplete WebSocket server
let connections = []
const wsServer = net.createServer((connection) => {
    const mws = new MyWebSocket();
    console.log('Client connected');

    connection.on('data', async (data) => {
        let mustHave = data.toString().includes("Sec-WebSocket-Key:")
        let firstLine = data.toString().includes("GET / HTTP/1.1", 0)
        if (mustHave && firstLine) {
            await mws.handshake(data);
            await mws.response(connection)
        }else {
            mws.decodePayload(data);
        }
    });

    connection.on('end', () => {
        console.log('Client disconnected');
    });
});
wsServer.on('error', (error) => {
    console.error('Error: ', error);
});
wsServer.listen(3001, () => {
    console.log('WebSocket server listening on port 3001');
});




class MyWebSocket {

    sha = crypto.createHash("sha1")
    magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    serverResponse = ""
    clientKey = ""
    hashKey = ""
    base64Key = ""
    keys = []


    handshake(data) {
        const d = data.toString().split("\n")
        for (let i = 0; i < d.length; i++){
            if (d[i].includes("Sec-WebSocket-Key:")){
                this.clientKey = d[i].replace("Sec-WebSocket-Key: ", "")
                this.clientKey = this.clientKey.replace("\r", "")
                this.keys.push(this.clientKey);
                break;
            }
        }
    }
    response(connection){
        let key = this.clientKey + this.magicString;

        this.hashKey = this.sha.update(key);
        this.base64Key = this.sha.digest('base64');
        this.serverResponse =
            "HTTP/1.1 101 Switching Protocols\r\n"+
            "Upgrade: websocket\r\n"+
            "Connection: Upgrade\r\n"+
            "Sec-WebSocket-Accept: "+ this.base64Key +"\r\n\r\n";

        connection.write(this.serverResponse);
        connections.push(connection)

    }

    decodePayload(data){
        let bytes = data;
        let payloadLength = bytes[1] & 127;
        let maskStart = 2;
        let dataStart = maskStart + 4;
        let responseWord = "";

        for (let i = dataStart; i < dataStart + payloadLength; i++) {
            let byte = bytes[i] ^ bytes[maskStart + ((i - dataStart) % 4)]
            responseWord += String.fromCharCode(byte)
        }
        for (let i = 0; i < connections.length; i++) {
            connections[i].write(this.sendMessage(responseWord))
        }
    }

    sendMessage(message) {
        const json = JSON.stringify(message);
        const jsonByteLength = Buffer.byteLength(json);
        const lengthByteCount = jsonByteLength < 126 ? 0 : 2;
        const payloadLength = lengthByteCount === 0 ? jsonByteLength : 126;
        //Gir de to første bytesene til type og den andre verdien
        const buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength);

        buffer.writeUInt8(0b10000001, 0); // set message type to text (opcode 0x01)
        buffer.writeUInt8(payloadLength, 1); // set payload length

        let payloadOffset = 2;
        if (lengthByteCount > 0) {
            buffer.writeUInt16BE(jsonByteLength, 2); // set extended payload length
            payloadOffset += lengthByteCount;
        }

        buffer.write(json, payloadOffset); // write payload
        return buffer;
    }
}
