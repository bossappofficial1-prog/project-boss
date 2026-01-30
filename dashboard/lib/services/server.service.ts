import { apiClient } from "../apis/base";

export const triggerTestTraffic = async () => {
    return apiClient.get('/health');
};

export const connectServerStatusStream = () => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/server/status/stream`;
};
