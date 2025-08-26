#!/usr/bin/env node

const { io } = require('socket.io-client');

// Default configuration
const DEFAULT_SERVER = 'http://localhost:1234';
const DEFAULT_TOKEN = 'your_jwt_token_here';
const DEFAULT_BUSINESS_ID = 'test-business-123';

// Parse command line arguments
const serverUrl = process.argv[2] || DEFAULT_SERVER;
const token = process.argv[3] || DEFAULT_TOKEN;
const businessId = process.argv[4] || DEFAULT_BUSINESS_ID;

console.log('🧪 Socket.IO Test Script');
console.log('========================');
console.log(`Server: ${serverUrl}`);
console.log(`Token: ${token.substring(0, 20)}...`);
console.log(`Business ID: ${businessId}`);
console.log('========================\n');

// Create socket connection
const socket = io(serverUrl, {
    auth: {
        token: token
    },
    transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to server');
    console.log(`Socket ID: ${socket.id}`);

    // Test sequence
    runTests();
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
    console.error('⚠️ Socket error:', error);
});

// Event listeners
socket.on('business_room_joined', (businessId) => {
    console.log(`📡 Joined business room: ${businessId}`);
});

socket.on('business_room_left', (businessId) => {
    console.log(`📡 Left business room: ${businessId}`);
});

socket.on('new_order', (orderData) => {
    console.log('🆕 New order received:', JSON.stringify(orderData, null, 2));
});

socket.on('order_status_update', (updateData) => {
    console.log('🔄 Order status update:', JSON.stringify(updateData, null, 2));
});

socket.on('notification', (notification) => {
    console.log('🔔 Notification received:', JSON.stringify(notification, null, 2));
});

socket.on('pong', (message) => {
    console.log('🏓 Pong received:', message);
});

// Test functions
async function runTests() {
    console.log('\n🧪 Starting tests...\n');

    // Test 1: Ping/Pong
    await testPing();

    // Test 2: Join Business Room
    await testJoinBusinessRoom();

    // Test 3: Leave Business Room
    await testLeaveBusinessRoom();

    // Test 4: Multiple rapid events (rate limiting test)
    await testRateLimit();

    console.log('\n✅ All tests completed');

    // Keep connection alive for manual testing
    console.log('\n💡 Connection will stay alive for manual testing...');
    console.log('   You can now test real-time events from your application');
    console.log('   Press Ctrl+C to exit');
}

function testPing() {
    return new Promise((resolve) => {
        console.log('🏓 Testing ping/pong...');
        socket.emit('ping', (response) => {
            console.log(`   Response: ${response}`);
            resolve();
        });
    });
}

function testJoinBusinessRoom() {
    return new Promise((resolve) => {
        console.log(`📡 Testing join business room: ${businessId}...`);
        socket.emit('join_business_room', businessId, (success) => {
            console.log(`   Success: ${success}`);
            resolve();
        });
    });
}

function testLeaveBusinessRoom() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`📡 Testing leave business room: ${businessId}...`);
            socket.emit('leave_business_room', businessId, (success) => {
                console.log(`   Success: ${success}`);
                resolve();
            });
        }, 1000);
    });
}

function testRateLimit() {
    return new Promise((resolve) => {
        console.log('⚡ Testing rate limiting (sending 10 rapid pings)...');

        let responseCount = 0;
        const totalRequests = 10;

        for (let i = 0; i < totalRequests; i++) {
            socket.emit('ping', (response) => {
                responseCount++;
                console.log(`   Ping ${i + 1}: ${response}`);

                if (responseCount === totalRequests) {
                    resolve();
                }
            });
        }
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Disconnecting...');
    socket.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Disconnecting...');
    socket.disconnect();
    process.exit(0);
});
