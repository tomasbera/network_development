const net = require('net');
const crypto = require('crypto')

// Simple HTTP server responds with a simple WebSocket client test
const httpServer = net.createServer((connection) => {
    connection.on('data', () => {
        let content =
            `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>WebSocket Test</title>
                    </head>
                    <body>
                        <h1>WebSocket Test</h1>
                        <textarea id="output" rows="10" cols="50" disabled></textarea>
                        <br>
                        <textarea id="input" rows="3" cols="50"></textarea>
                        <br>
                        <button onclick="sendMessage()">Send Message</button>
                        <script>
                            const outputTextArea = document.getElementById('output');
                            const inputTextArea = document.getElementById('input');
                    
                            const ws = new WebSocket('ws://localhost:3001');
                    
                            ws.onmessage = event => {
                                outputTextArea.value += 'Message from server: ' + event.data + '\\n';
                            };
                    
                            function sendMessage() {
                                const message = inputTextArea.value.trim();
                    
                                if (message) {
                                    ws.send(message);
                                    inputTextArea.value = '';
                                }
                            }
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
        const d = data.toString().split("\r\n")
        for (let i = 0; i < d.length; i++){
            if (d[i].includes("Sec-WebSocket-Key:")){
                this.clientKey = d[i].replace("Sec-WebSocket-Key: ", "")
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
        const payloadLength = data[1] & 127;
        let payloadStart = 2;
        let responseWord = "";

        let mask = data.slice(payloadStart, payloadStart + 4);
        payloadStart += 4;

        const payload = data.slice(payloadStart, payloadStart + payloadLength);
        for (let i = 0; i < payloadLength; i++) {
            payload[i] ^= mask[i % 4];
        }
        responseWord = payload.toString("utf8");

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
