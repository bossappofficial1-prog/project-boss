import { createUserPayload, updateUserPayload, User } from "@/types/userv2";
import { apiClient } from "../apis/base";
import { PaginationResponse } from "@/types/api.type";

export class UserService {
    private static readonly baseUrl = "/users";

    static async getAll(): Promise<{
        data: User[],
        pagination: PaginationResponse
    }> {
        return (await apiClient.get(this.baseUrl)).data;
    }

    static async create(data: createUserPayload): Promise<User> {
        return (await apiClient.post(this.baseUrl, data)).data.data
    }

    static async update(userId: string, data: updateUserPayload): Promise<User> {
        return (await apiClient.patch(`${this.baseUrl}/${userId}`, data)).data.data
    }

    static async getById(userId: string): Promise<User> {
        return (await apiClient.get(`${this.baseUrl}/${userId}`)).data.data
    }

    static async delete(userId: string): Promise<void> {
        return (await apiClient.delete(`${this.baseUrl}/${userId}`)).data
    }
}