import { BaseService } from './BaseService';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '@/types';

/**
 * User Service menggunakan BaseService
 * Inherit semua CRUD operations dari BaseService
 * 
 * @example
 * ```typescript
 * // List users
 * const users = await userService.list({ page: 1, limit: 10 });
 * 
 * // Get user by ID
 * const user = await userService.getById('user-id');
 * 
 * // Create user
 * const newUser = await userService.create({ name: 'John', email: 'john@example.com' });
 * 
 * // Custom method
 * await userService.changeRole('user-id', 'ADMIN');
 * ```
 */
class UserService extends BaseService<User> {
  constructor() {
    super('/api/v1/users');
  }

  /**
   * List users dengan filters spesifik
   */
  async listUsers(filters?: UserFilters) {
    return this.list(filters);
  }

  /**
   * Change user role
   */
  async changeRole(userId: string, role: string): Promise<User> {
    const response = await this.put<{ data: User }>(`/${userId}/role`, { role });
    return response.data;
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<User> {
    const response = await this.post<{ data: User }>(`/${userId}/verify`, {});
    return response.data;
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<User> {
    const response = await this.post<{ data: User }>(`/${userId}/suspend`, {});
    return response.data;
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<User> {
    const response = await this.post<{ data: User }>(`/${userId}/activate`, {});
    return response.data;
  }

  /**
   * Reset user password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await this.post(`/${userId}/reset-password`, { password: newPassword });
  }

  /**
   * Get user statistics
   */
  async getStats() {
    return this.get<any>('/stats');
  }

  /**
   * Export users to CSV
   */
  async exportToCSV(filters?: UserFilters): Promise<Blob> {
    return this.get<Blob>('/export', filters);
  }
}

// Export singleton instance
export const userService = new UserService();
