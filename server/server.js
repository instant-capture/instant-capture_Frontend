// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Arduino Serial Port Configuration
// Check your port name using 'ls /dev/tty.*' in terminal
const PORT_NAME = '/dev/tty.usbmodem11401';
const BAUD_RATE = 9600;

let port;
let isMockMode = false;
let mockInterval = null;

try {
    port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
        console.log(`✅ Serial port ${PORT_NAME} opened`);
    });

    parser.on('data', (data) => {
        const raw = data.toString().trim();
        if (!raw) return;

        // Filter for JSON format
        if (raw.startsWith('{') && raw.endsWith('}')) {
            try {
                const json = JSON.parse(raw);
                console.log('📤 Sending to Web:', json);
                io.emit('sensor-data', json);
            } catch (e) {
                console.log('⚠️ JSON Parse Error:', raw);
            }
        } else {
            // Log non-JSON messages (debug info from Arduino)
            console.log('🤖 Arduino Log:', raw);
        }
    });

    port.on('error', (err) => {
        console.error('❌ Serial port error:', err.message);
        startMockMode();
    });

} catch (err) {
    console.error('❌ Failed to create SerialPort:', err.message);
    startMockMode();
}

// =====================================================================
// Mock Mode - Simulates Arduino data when no hardware is connected
// =====================================================================
function startMockMode() {
    if (isMockMode) return;
    isMockMode = true;
    console.log('⚠️ Running server in Mock Mode (No Arduino connected)');
    console.log('📡 Sending mock distance data every 500ms...');

    // Send mock distance data every 500ms
    mockInterval = setInterval(() => {
        const mockDistance = (50 + Math.random() * 100).toFixed(1); // Random 50-150cm
        const mockData = { type: 'distance', dist: parseFloat(mockDistance), state: 'play' };
        console.log('📤 [MOCK] Sending:', mockData);
        io.emit('sensor-data', mockData);
    }, 500);
}

io.on('connection', (socket) => {
    console.log('👤 Web client connected');
    socket.on('disconnect', () => console.log('👋 Web client disconnected'));

    // Forward commands from Web to Arduino
    socket.on('send-command', (cmd) => {
        console.log(`Command received: ${cmd}`);
        if (port && port.isOpen) {
            port.write(cmd, (err) => {
                if (err) console.error('Error writing to serial:', err.message);
            });
        } else {
            console.log('[MOCK] Would send to Arduino:', cmd);
        }
    });
});

const SERVER_PORT = 3001;
server.listen(SERVER_PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${SERVER_PORT}`);
    console.log(`👉 Open http://localhost:5173 to view the dashboard\n`);
});
