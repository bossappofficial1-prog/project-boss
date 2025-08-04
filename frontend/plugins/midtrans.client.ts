export default defineNuxtPlugin(() => {
    // Extend Window interface for Midtrans
    if (process.client) {
        // Wait for Midtrans script to load
        const checkMidtrans = () => {
            if (window.snap) {
                console.log('Midtrans Snap is ready')
                return
            }
            setTimeout(checkMidtrans, 100)
        }

        checkMidtrans()
    }
})

// The Window interface with snap is already declared in types/index.ts, so no need to redeclare here.
