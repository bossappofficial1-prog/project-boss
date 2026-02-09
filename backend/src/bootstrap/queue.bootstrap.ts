import { queues } from "../queues"

export const bootstrapQueues = async () => {
    console.log(`Bootsraping queue...`)

    queues.forEach(queue => {
        console.log(`[${queue.name.toUpperCase().replace('-', '_')}] Aktif`)
    })
}