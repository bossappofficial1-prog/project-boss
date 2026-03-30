import webpush from 'web-push';
import dotenv from 'dotenv';
import { config } from '.';

dotenv.config();

webpush.setVapidDetails(
    'mailto:bossappofficial1@gmail.com',
    config.vapid.publicVapidKey,
    config.vapid.privateVapidKey
);

export default webpush;