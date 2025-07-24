import { config } from '.';

export const twilioConfig = {
    accountSid: config.twilio.accountSid,
    authToken: config.twilio.authToken,
    phoneNumber: config.twilio.phoneNumber
};
