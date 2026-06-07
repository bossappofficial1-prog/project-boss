import { createClient } from 'redis';
import { AuthenticationState } from '@whiskeysockets/baileys';

export class RedisAuthState implements AuthenticationState {
  private client: ReturnType<typeof createClient>;
  private prefix: string;

  constructor(redisUrl: string, businessId: string) {
    this.client = createClient({ url: redisUrl });
    this.prefix = `wa:${businessId}:`;
    this.client.connect().catch(console.error);
  }

  async set({ creds, keys }: { creds?: any; keys?: any }) {
    if (creds) {
      await this.client.set(`${this.prefix}creds`, JSON.stringify(creds));
    }
    if (keys) {
      await this.client.set(`${this.prefix}keys`, JSON.stringify(keys));
    }
  }

  async get() {
    const credsStr = await this.client.get(`${this.prefix}creds`);
    const keysStr = await this.client.get(`${this.prefix}keys`);
    return {
      creds: credsStr ? JSON.parse(credsStr) : { me: { id: "unknown", name: "WhatsApp" } },
      keys: keysStr ? JSON.parse(keysStr) : {},
    };
  }

  async delete() {
    await this.client.del(`${this.prefix}creds`, `${this.prefix}keys`);
  }
}