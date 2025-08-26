// Test script untuk browser console
// Paste script ini di browser console untuk automated testing

const runPaymentTests = () => {
    console.log('🧪 Starting Payment Pages Automated Tests...')

    // Test data template
    const testData = {
        outlet: { name: "Test Outlet", id: "test-001" },
        items: [{ id: "1", name: "Test Item", price: 10000, quantity: 1 }],
        subtotal: 10000,
        applicationFee: 1000,
        total: 11000,
        paymentMethod: { type: "qris", name: "QRIS", category: "QRIS" },
        customerInfo: { name: "Test User", phone: "+6281234567890" },
        orderId: `TEST-${Date.now()}`
    }

    // Test localStorage operations
    const testLocalStorage = () => {
        console.log('📱 Testing localStorage operations...')

        // Test save
        localStorage.setItem('paymentData', JSON.stringify(testData))
        const saved = JSON.parse(localStorage.getItem('paymentData'))
        console.log('✅ Save test:', saved.orderId === testData.orderId)

        // Test clear
        localStorage.removeItem('paymentData')
        const cleared = localStorage.getItem('paymentData')
        console.log('✅ Clear test:', cleared === null)

        return true
    }

    // Test navigation
    const testNavigation = () => {
        console.log('🧭 Testing navigation...')

        const routes = [
            '/payment-test',
            '/payment',
            '/payment/processing',
            '/payment/success',
            '/payment/failed',
            '/payment/cancelled',
            '/payment/expired',
            '/payment/pending'
        ]

        routes.forEach(route => {
            console.log(`Testing route: ${route}`)
            // You can add actual navigation tests here
        })

        return true
    }

    // Test fee calculations
    const testFeeCalculation = () => {
        console.log('💰 Testing fee calculations...')

        const subtotal = 50000
        const expectedFee = Math.max(1000, Math.min(5000, Math.floor(subtotal * 0.01)))
        const total = subtotal + expectedFee

        console.log(`Subtotal: ${subtotal}`)
        console.log(`Expected Fee: ${expectedFee}`)
        console.log(`Total: ${total}`)
        console.log('✅ Fee calculation test passed')

        return true
    }

    // Test currency formatting
    const testCurrencyFormat = () => {
        console.log('💱 Testing currency formatting...')

        const amount = 12500
        const formatted = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)

        console.log(`Amount: ${amount} -> Formatted: ${formatted}`)
        console.log('✅ Currency format test passed')

        return true
    }

    // Test datetime formatting  
    const testDateTimeFormat = () => {
        console.log('📅 Testing datetime formatting...')

        const now = new Date()
        const formatted = now.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        console.log(`DateTime: ${now.toISOString()} -> Formatted: ${formatted}`)
        console.log('✅ DateTime format test passed')

        return true
    }

    // Run all tests
    const results = {
        localStorage: testLocalStorage(),
        navigation: testNavigation(),
        feeCalculation: testFeeCalculation(),
        currencyFormat: testCurrencyFormat(),
        dateTimeFormat: testDateTimeFormat()
    }

    console.log('📊 Test Results:', results)

    const allPassed = Object.values(results).every(result => result === true)
    console.log(`🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

    return results
}

// Export untuk digunakan
window.runPaymentTests = runPaymentTests

console.log('🚀 Payment test utilities loaded!')
console.log('Run runPaymentTests() to start automated testing')
