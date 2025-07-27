import midtransclient from 'midtrans-client';
import { config } from '../config';

export const snap = new midtransclient.Snap({
    isProduction: config.MIDTRANS_IS_PRODUCTION,
    serverKey: config.MIDTRANS_SERVER_KEY,
    clientKey: config.MIDTRANS_CLIENT_KEY,
});
