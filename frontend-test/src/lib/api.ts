import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { OutletDetails, ProductsResponse } from "@/types/outlet";
import { NearbyOutletsParams } from '@/types';

const clientUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX ?? '';
const baseURL = `${clientUrl}${apiPrefix}` || '';

interface CustomAxiosInstance extends AxiosInstance {
    getData<T>(url: string, config?: AxiosRequestConfig): Promise<T>;

    addData<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const api: CustomAxiosInstance = axios.create({
    baseURL,
    timeout: 1000000,
    withCredentials: true
}) as CustomAxiosInstance


api.getData = async function <T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await api.get(url, config);
    return res.data.data;
};

api.addData = async function <T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await api.post(url, data, config)

    return res.data.data
}

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle request error
        return Promise.reject(error);
    }
);


export default api

export interface SearchOutletsParams {
    limit?: number;
    take?: number;
    skip?: number;
    search?: string;
}

export interface OutletApiResponse {
    success: boolean;
    message: string;
    data: OutletDetails[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
    path: string;
}

export interface NearbyOutletsResponse {
    data: OutletDetails[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
}

export async function getOutlet(id: string) {
    const res = await api.get<OutletDetails>(`/outlets/${id}`);
    return res.data;
}

export async function getOutletProducts(id: string) {
    const res = await api.get<ProductsResponse>(`/products/outlet/${id}`);
    return res.data;
}

export async function getNearbyOutlets(params: NearbyOutletsParams) {
    const searchParams = new URLSearchParams();

    if (params.latitude) searchParams.append('latitude', params.latitude.toString());
    if (params.longitude) searchParams.append('longitude', params.longitude.toString());
    if (params.radius) searchParams.append('radius', params.radius.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.take) searchParams.append('take', params.take.toString());
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.search) searchParams.append('search', params.search);

    const res = await api.get<NearbyOutletsResponse>(`/outlets/nearby?${searchParams.toString()}`);
    return res.data;
}

export async function searchOutlets(params: SearchOutletsParams) {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.take) searchParams.append('take', params.take.toString());
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.search) searchParams.append('search', params.search);

    const res = await api.get<OutletApiResponse>(`/outlets?${searchParams.toString()}`);

    // Transform response to match our interface
    return {
        data: res.data.data,
        total: res.data.pagination.total,
        hasMore: res.data.pagination.page < res.data.pagination.totalPages,
        nextCursor: res.data.pagination.page < res.data.pagination.totalPages ?
            (params.skip || 0) + (params.take || 10) : undefined
    };
}

