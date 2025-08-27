#!/usr/bin/env node

/**
 * Public Socket.IO Test Script (No Auth Required)
 * Usage: node test-socket-public.js [server_url] [order_id]
 */

const { io } = require('socket.io-client');

// Default configuration
const DEFAULT_SERVER = 'http://192.168.18.13:1234';
const DEFAULT_ORDER_ID = 'test-order-123';

// Parse command line arguments
const serverUrl = process.argv[2] || DEFAULT_SERVER;
const orderId = process.argv[3] || DEFAULT_ORDER_ID;

console.log('🌐 Public Socket.IO Test Script (No Auth)');
console.log('==========================================');
console.log(`Server: ${serverUrl}`);
console.log(`Order ID: ${orderId}`);
console.log('==========================================\n');

// Create public socket connection (no auth required)
const socket = io(serverUrl, {
    query: { public: 'true' }, // Flag untuk public connection
    transports: ['polling', 'websocket'],
    timeout: 10000,
    forceNew: true
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to public socket server');
    console.log(`Socket ID: ${socket.id}`);

    // Test sequence
    runTests();
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);

    if (error.message.includes('Too many connections')) {
        console.log('⚠️ Rate limit reached. Try again later.');
    }

    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
    console.error('⚠️ Socket error:', error);
});

// Event listeners untuk public events
socket.on('order_tracking_joined', (orderId) => {
    console.log(`📦 Joined order tracking: ${orderId}`);
});

socket.on('order_tracking_left', (orderId) => {
    console.log(`📦 Left order tracking: ${orderId}`);
});

socket.on('announcements_joined', () => {
    console.log('📢 Joined announcements room');
});

socket.on('connection_info', (info) => {
    console.log('ℹ️ Connection info:', JSON.stringify(info, null, 2));
});

// Listen for order events
socket.on('order_created', (data) => {
    console.log('🆕 Order created:', JSON.stringify(data, null, 2));
});

socket.on('order_status_update', (data) => {
    console.log('🔄 Order status update:', JSON.stringify(data, null, 2));
});

socket.on('order_prepared', (data) => {
    console.log('👨‍🍳 Order prepared:', JSON.stringify(data, null, 2));
});

socket.on('order_ready', (data) => {
    console.log('✅ Order ready:', JSON.stringify(data, null, 2));
});

// Listen for announcements
socket.on('system_announcement', (data) => {
    console.log('📢 System announcement:', JSON.stringify(data, null, 2));
});

socket.on('maintenance_notice', (data) => {
    console.log('🔧 Maintenance notice:', JSON.stringify(data, null, 2));
});

socket.on('pong', (message) => {
    console.log('🏓 Pong received:', message);
});

// Test functions
async function runTests() {
    console.log('\n🧪 Starting public socket tests...\n');

    // Test 1: Get connection info
    await testGetInfo();

    // Test 2: Ping/Pong
    await testPing();

    // Test 3: Join order tracking
    await testJoinOrderTracking();

    // Test 4: Join announcements
    await testJoinAnnouncements();

    // Test 5: Leave order tracking
    await testLeaveOrderTracking();

    console.log('\n✅ All public socket tests completed');

    // Keep connection alive for manual testing
    console.log('\n💡 Connection will stay alive for manual testing...');
    console.log('   - Send order updates from your admin panel');
    console.log('   - Test announcements');
    console.log('   - Press Ctrl+C to exit');
}

function testGetInfo() {
    return new Promise((resolve) => {
        console.log('ℹ️ Testing get connection info...');
        socket.emit('get_info', (info) => {
            console.log(`   Info received: ${JSON.stringify(info, null, 2)}`);
            resolve();
        });
    });
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

function testJoinOrderTracking() {
    return new Promise((resolve) => {
        console.log(`📦 Testing join order tracking: ${orderId}...`);
        socket.emit('join_order_tracking', orderId, (success) => {
            console.log(`   Success: ${success}`);
            resolve();
        });
    });
}

function testJoinAnnouncements() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('📢 Testing join announcements...');
            socket.emit('join_announcements', (success) => {
                console.log(`   Success: ${success}`);
                resolve();
            });
        }, 1000);
    });
}

function testLeaveOrderTracking() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`📦 Testing leave order tracking: ${orderId}...`);
            socket.emit('leave_order_tracking', orderId, (success) => {
                console.log(`   Success: ${success}`);
                resolve();
            });
        }, 2000);
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Disconnecting from public socket...');
    socket.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Disconnecting from public socket...');
    socket.disconnect();
    process.exit(0);
});
