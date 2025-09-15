import { messagePublisher } from './src/service/message-publisher.service';

async function testWhatsApp() {
    console.log('🧪 Testing WhatsApp message publishing...');

    try {
        await messagePublisher.publishWhatsAppPaymentSuccess('TEST123');
        console.log('✅ WhatsApp message published successfully');
    } catch (error) {
        console.error('❌ Error publishing WhatsApp message:', error);
    }
}

testWhatsApp();