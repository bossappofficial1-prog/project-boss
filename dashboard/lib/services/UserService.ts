import { BaseService } from './BaseService';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '@/types';

class UserService extends BaseService<User> {
  constructor() {
    super('/users');
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
