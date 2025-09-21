#!/usr/bin/env node

const { io } = require('socket.io-client');

// Test socket connection for business outlet notifications
const serverUrl = 'http://localhost:1234';
const testOutletId = 'test-outlet-123';

console.log('🧪 Testing Socket.IO Business Outlet Notifications');
console.log('==================================================');
console.log(`Server: ${serverUrl}`);
console.log(`Test Outlet ID: ${testOutletId}`);
console.log('==================================================\n');

// Create socket connection
const socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to server');
    console.log(`Socket ID: ${socket.id}`);

    // Join business outlet room
    console.log(`📡 Joining business outlet room: ${testOutletId}`);
    socket.emit('business:outlet', testOutletId);

    // Wait a bit then test emit
    setTimeout(() => {
        console.log('\n🧪 Testing emitToBusinessOutlet from backend...');
        console.log('   (This should trigger if backend is running and emitting events)');
    }, 1000);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.log('💡 Make sure backend server is running on port 1234');
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

// Listen for business events
socket.on('businessEvent', (payload) => {
    console.log('🏢 Business event received!');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('✅ Socket notifications are working!');
});

// Listen for order events (fallback)
socket.on('orderEvent', (payload) => {
    console.log('📦 Order event received (fallback):', JSON.stringify(payload, null, 2));
});

// Keep alive for testing
setTimeout(() => {
    console.log('\n⏰ Test timeout - exiting...');
    socket.disconnect();
    process.exit(0);
}, 10000);