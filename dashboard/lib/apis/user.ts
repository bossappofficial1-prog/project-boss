import { apiClient, apiCallPaginated } from './base';
import type {
    User,
    CreateUserInput,
    UpdateUserInput,
    PaginationParams,
    PaginatedUsersResponse,
    UserStats
} from '@/types/user';

class UserApiService {
    private readonly baseUrl = '/users';

    // Get all users with pagination and filters
    async getUsers(params?: PaginationParams): Promise<PaginatedUsersResponse> {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = queryParams.toString()
            ? `${this.baseUrl}?${queryParams.toString()}`
            : this.baseUrl;

        const response = await apiClient.get(url);

        return {
            data: response.data.data || [],
            pagination: response.data.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }

    // Get single user by ID
    async getUserById(userId: string): Promise<User> {
        const response = await apiClient.get(`${this.baseUrl}/${userId}`);
        return response.data.data;
    }

    // Create new user
    async createUser(userData: CreateUserInput): Promise<User> {
        const response = await apiClient.post(this.baseUrl, userData);
        return response.data.data;
    }

    // Update existing user
    async updateUser(userId: string, userData: UpdateUserInput): Promise<User> {
        const response = await apiClient.patch(`${this.baseUrl}/${userId}`, userData);
        return response.data.data;
    }

    // Delete user
    async deleteUser(userId: string): Promise<{ message: string }> {
        const response = await apiClient.delete(`${this.baseUrl}/${userId}`);
        return response.data;
    }

    // Bulk delete users
    async bulkDeleteUsers(userIds: string[]): Promise<{ message: string; deletedCount: number }> {
        const response = await apiClient.post(`${this.baseUrl}/bulk-delete`, { userIds });
        return response.data.data;
    }

    // Update user status (verify/unverify)
    async updateUserStatus(userId: string, isVerified: boolean): Promise<User> {
        const response = await apiClient.patch(`${this.baseUrl}/${userId}/status`, { isVerified });
        return response.data.data;
    }

    // Get user statistics
    async getUserStats(): Promise<UserStats> {
        const response = await apiClient.get(`${this.baseUrl}/stats`);
        return response.data.data;
    }

    // Search users (alternative endpoint if needed)
    async searchUsers(query: string, options?: { role?: string; limit?: number }): Promise<User[]> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', query);

        if (options?.role) queryParams.append('role', options.role);
        if (options?.limit) queryParams.append('limit', options.limit.toString());

        const response = await apiClient.get(`${this.baseUrl}/search?${queryParams.toString()}`);
        return response.data.data || [];
    }

    // Reset user password (admin action)
    async resetUserPassword(userId: string, newPassword: string): Promise<{ message: string }> {
        const response = await apiClient.post(`${this.baseUrl}/${userId}/reset-password`, {
            password: newPassword
        });
        return response.data;
    }

    // Send verification email
    async sendVerificationEmail(userId: string): Promise<{ message: string }> {
        const response = await apiClient.post(`${this.baseUrl}/${userId}/send-verification`);
        return response.data;
    }
}

// Export singleton instance
export const userApi = new UserApiService();

// Export class for testing purposes
export { UserApiService };