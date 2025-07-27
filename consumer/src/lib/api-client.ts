import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

const apiClient = axios.create({
    baseURL: config.BACKEND_API_URL,
    timeout: 10000, // 10 detik timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor untuk logging request
apiClient.interceptors.request.use(request => {
    logger.info(`Starting API Request to ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`, {
        component: 'ApiClient',
    });
    return request;
});

// Interceptor untuk logging error
apiClient.interceptors.response.use(
    response => response,
    (error) => {
        const { config, request, response } = error;
        logger.error('API Request Failed', {
            component: 'ApiClient',
            method: config.method,
            url: config.url,
            // Log detail error jaringan jika ada (misal: koneksi ditolak)
            networkError: error.isAxiosError && !response ? error.message : undefined,
            // Log detail respons error jika ada (misal: 404, 500)
            status: response ? response.status : undefined,
            response: response ? response.data : undefined,
        });
        return Promise.reject(error);
    }
);

export default apiClient;
