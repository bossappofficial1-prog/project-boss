import axios from 'axios';
import { config } from '../config';

const apiClient = axios.create({
    baseURL: config.BACKEND_API_URL,
    timeout: 10000, // 10 detik timeout
    headers: {
        'Content-Type': 'application/json',
        // Di masa depan, kita bisa menambahkan header otentikasi di sini
        // 'Authorization': `Bearer ${config.INTERNAL_API_KEY}`
    }
});

export default apiClient;
