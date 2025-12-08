const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// CHANGE THIS TO YOUR ARDUINO PORT (e.g., 'COM3' on Windows, '/dev/tty.usbmodem...' on Mac)
const PORT_NAME = '/dev/tty.usbmodem11401';

const BAUD_RATE = 9600;

let port;

try {
    port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        console.log(`Serial port ${PORT_NAME} opened`);
    });

    parser.on('data', (data) => {
        console.log('Received from Arduino:', data);
        try {
            // Expecting JSON data from Arduino
            const jsonData = JSON.parse(data);
            io.emit('sensor-data', jsonData);
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

    port.on('error', (err) => {
        console.error('Serial port error:', err.message);
    });

} catch (err) {
    console.error('Failed to open serial port. Is Arduino connected?', err.message);
    console.log('Starting server without Serial connection (Mock mode possible)');
}

io.on('connection', (socket) => {
    console.log('Web client connected');

    socket.on('disconnect', () => {
        console.log('Web client disconnected');
    });
});

const SERVER_PORT = 3001;
server.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`);
});
