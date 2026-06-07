'use client'

import React from 'react';
import useUserV2 from '@/hooks/use-user-v2';

// Simple component showing how to use individual user data
export const UserProfile = ({ userId }: { userId: string }) => {
    const { useUser } = useUserV2();
    const { user, isLoading, isError, refetch } = useUser(userId);

    if (isLoading) {
        return (
            <div className="animate-pulse p-4 border rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <p className="text-red-600">Error loading user profile</p>
                <button
                    onClick={() => refetch()}
                    className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">{user.name}</h3>
            <p className="text-gray-600 mb-1">{user.email}</p>
            <p className="text-sm text-gray-500">
                Joined: {new Date(user.createdAt || '').toLocaleDateString()}
            </p>
        </div>
    );
};

// Component showing user list with basic functionality
export const UserDropdown = ({
    onUserSelect
}: {
    onUserSelect: (userId: string) => void
}) => {
    const { useUserList } = useUserV2();
    const { users, isLoading, isEmpty } = useUserList();

    if (isLoading) {
        return (
            <select disabled className="w-full p-2 border rounded-md bg-gray-100">
                <option>Loading users...</option>
            </select>
        );
    }

    return (
        <select
            onChange={(e) => e.target.value && onUserSelect(e.target.value)}
            className="w-full p-2 border rounded-md"
            defaultValue=""
        >
            <option value="" disabled>
                {isEmpty ? 'No users available' : 'Select a user'}
            </option>
            {users.map((user) => (
                <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                </option>
            ))}
        </select>
    );
};

// Component showing quick actions with mutations
export const QuickUserActions = ({ userId }: { userId: string }) => {
    const { useUser, deleteUser, updateUser } = useUserV2();
    const { user } = useUser(userId);
    const deleteMutation = deleteUser();
    const updateMutation = updateUser();

    const handleToggleStatus = () => {
        if (!user) return;

        updateMutation.mutate({
            id: userId,
            // Assuming you have a status field
            // status: user.status === 'active' ? 'inactive' : 'active'
        });
    };

    const handleDelete = () => {
        if (confirm(`Delete user "${user?.name}"?`)) {
            deleteMutation.mutate(userId);
        }
    };

    if (!user) return null;

    return (
        <div className="flex gap-2">
            <button
                onClick={handleToggleStatus}
                disabled={updateMutation.isPending}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {updateMutation.isPending ? 'Updating...' : 'Toggle Status'}
            </button>

            <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
        </div>
    );
};

// Usage in a parent component
export const UserManagementDashboard = () => {
    const [selectedUserId, setSelectedUserId] = React.useState<string>('');

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">
                    Select User:
                </label>
                <UserDropdown onUserSelect={setSelectedUserId} />
            </div>

            {selectedUserId && (
                <div className="space-y-4">
                    <UserProfile userId={selectedUserId} />
                    <QuickUserActions userId={selectedUserId} />
                </div>
            )}
        </div>
    );
};