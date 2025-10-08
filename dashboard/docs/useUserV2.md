# useUserV2 Hook Documentation

## Overview

`useUserV2` adalah hook yang dirancang menggunakan pola factory dari `useReactQuery` yang telah diperbaiki. Hook ini menyediakan interface yang bersih dan konsisten untuk mengelola data user dengan dukungan caching, optimistic updates, dan error handling otomatis.

## Hook Factories yang Tersedia

### useUserList()

Mendapatkan daftar semua user dengan utility properties untuk handling common scenarios.

**Return Value:**

```typescript
{
    users: User[];              // Array user data
    isEmpty: boolean;           // Apakah list kosong
    hasUsers: boolean;          // Apakah ada user (kebalikan isEmpty)
    isLoading: boolean;         // Status loading
    isError: boolean;           // Status error
    pagination?: {              // Info pagination jika ada
        page: number;
        totalPages: number;
        total: number;
    };
    // ... standard React Query properties
}
```

**Basic Usage:**

```typescript
import useUserV2 from "@/hooks/useUserV2";

function UsersList() {
  const { useUserList } = useUserV2();
  const { users, isEmpty, hasUsers, isLoading } = useUserList();

  if (isLoading) return <div>Loading...</div>;
  if (isEmpty) return <div>No users found</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### useUser(userId: string)

Mendapatkan data user berdasarkan ID dengan tambahan utility properties.

**Parameters:**

- `userId: string` - ID user yang ingin diambil

**Return Value:**

```typescript
{
    user?: User;                // Data user (undefined jika loading/error)
    exists: boolean;            // Apakah user ada
    data: User;                 // Raw data (bisa throw error jika tidak ada)
    // ... standard React Query properties
}
```

**Basic Usage:**

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { useUser } = useUserV2();
  const { user, exists, isLoading, refetch } = useUser(userId);

  if (isLoading) return <div>Loading user...</div>;
  if (!exists) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## Mutation Factories

### createUser()

Factory untuk membuat user baru dengan toast notification otomatis.

**Return Value:**

```typescript
UseMutationResult<User, Error, createUserPayload>;
```

**Usage:**

```typescript
function CreateUserForm() {
  const { createUser } = useUserV2();
  const createMutation = createUser();

  const handleSubmit = (formData: createUserPayload) => {
    createMutation.mutate(formData, {
      onSuccess: (newUser) => {
        console.log("User created:", newUser);
        // Toast sukses sudah otomatis muncul
      },
      onError: (error) => {
        console.error("Create failed:", error);
        // Toast error sudah otomatis muncul
      },
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role: "ADMIN",
          phone: "+1234567890",
        });
      }}
    >
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### updateUser()

Factory untuk update user dengan optimistic updates.

**Return Value:**

```typescript
UseMutationResult<User, Error, updateUserPayload & { id: string }>;
```

**Usage:**

```typescript
function EditUserForm({ userId }: { userId: string }) {
  const { updateUser } = useUserV2();
  const updateMutation = updateUser();

  const handleUpdate = (changes: updateUserPayload) => {
    updateMutation.mutate(
      { id: userId, ...changes },
      {
        onSuccess: (updatedUser) => {
          console.log("User updated:", updatedUser);
        },
      }
    );
  };

  return (
    <button
      onClick={() => handleUpdate({ name: "New Name" })}
      disabled={updateMutation.isPending}
    >
      {updateMutation.isPending ? "Updating..." : "Update Name"}
    </button>
  );
}
```

### deleteUser()

Factory untuk menghapus user dengan konfirmasi dan cleanup cache.

**Return Value:**

```typescript
UseMutationResult<void, Error, string>;
```

**Usage:**

```typescript
function UserActions({ userId }: { userId: string }) {
  const { deleteUser } = useUserV2();
  const deleteMutation = deleteUser();

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate(userId, {
        onSuccess: () => {
          console.log("User deleted successfully");
          // Cache cleanup otomatis dilakukan
        },
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
      className="text-red-600"
    >
      {deleteMutation.isPending ? "Deleting..." : "Delete User"}
    </button>
  );
}
```

## Advanced Patterns

### Combining Multiple Operations

```typescript
function UserManagement() {
  const { useUserList, useUser, createUser, updateUser, deleteUser } =
    useUserV2();

  const { users, isLoading: isLoadingList } = useUserList();
  const createMutation = createUser();
  const updateMutation = updateUser();
  const deleteMutation = deleteUser();

  // All operations have consistent API and built-in optimizations

  return <div>{/* List, create, update, delete UI */}</div>;
}
```

### Custom Callbacks with Toast Control

```typescript
function UserFormWithCustomToast() {
  const { createUser } = useUserV2();
  const createMutation = createUser({
    // Override default toast config
    successMessage: (user) => `Welcome, ${user.name}!`,
    errorMessage: (error) => `Failed to create user: ${error.message}`,
    showSuccess: true, // Dapat dimatikan jika tidak diinginkan
    showError: true,
  });

  // Rest of component...
}
```

### Loading States Management

```typescript
function UserDashboard() {
  const { useUserList, createUser, updateUser } = useUserV2();
  const { users, isLoading, isEmpty } = useUserList();
  const createMutation = createUser();
  const updateMutation = updateUser();

  // Centralized loading state
  const isAnyLoading =
    isLoading || createMutation.isPending || updateMutation.isPending;

  if (isAnyLoading) {
    return <div>Processing...</div>;
  }

  // Rest of component...
}
```

## Error Handling

Hook ini memiliki error handling otomatis:

1. **Query Errors**: Ditangani oleh React Query dengan retry logic
2. **Mutation Errors**: Menampilkan toast error otomatis
3. **Network Errors**: Retry otomatis dengan exponential backoff
4. **Type Safety**: Full TypeScript support untuk error types

```typescript
function UserComponent() {
  const { useUser } = useUserV2();
  const { user, isError, error } = useUser("123");

  if (isError) {
    // Error object memiliki type yang proper
    console.error("Error loading user:", error);
  }

  // Component logic...
}
```

## Performance Optimizations

1. **Caching**: Data user di-cache otomatis oleh React Query
2. **Optimistic Updates**: Update mutations menggunakan optimistic updates
3. **Background Refetch**: Data diupdate di background saat stale
4. **Deduplicated Requests**: Request yang sama dideduplikasi
5. **Memory Management**: Cache dibersihkan otomatis saat tidak digunakan

## Types Reference

```typescript
// Import dari types
import { User, createUserPayload, updateUserPayload } from "@/types/userv2";

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  password: string;
  role: "ADMIN" | "OWNER";
  isVerivied: boolean;
  phone?: string;
  googleId?: string;
  provider: "local" | "google";
  createdAt: string;
  updateAt: string;
}

// Payload types
type createUserPayload = Pick<
  User,
  "name" | "email" | "password" | "phone" | "role"
>;
type updateUserPayload = Partial<createUserPayload>;
```

## Migration Guide

Jika sebelumnya menggunakan hook user yang lama:

**Before:**

```typescript
// Old pattern
const { data: users, isLoading } = useQuery(["users"], fetchUsers);
const { mutate: createUser } = useMutation(createUserApi, {
  onSuccess: () => {
    toast.success("User created");
    queryClient.invalidateQueries(["users"]);
  },
});
```

**After:**

```typescript
// New pattern with useUserV2
const { useUserList, createUser } = useUserV2();
const { users, isLoading } = useUserList();
const createMutation = createUser(); // Toast dan invalidation otomatis
```

## Best Practices

1. **Gunakan factory pattern**: Panggil hook factories di level component, bukan di level aplikasi
2. **Handle loading states**: Selalu handle loading dan error states
3. **Optimistic updates**: Biarkan hook menangani optimistic updates otomatis
4. **Custom callbacks**: Gunakan onSuccess/onError untuk logic tambahan
5. **Type safety**: Manfaatkan TypeScript types yang sudah disediakan

## Troubleshooting

**Q: Hook tidak update setelah mutation**
A: Pastikan UserService mengembalikan data yang benar dan cache invalidation berjalan

**Q: Toast tidak muncul**
A: Pastikan toast provider (sonner) sudah disetup di level aplikasi

**Q: Loading state tidak konsisten**
A: Gunakan properties isLoading/isPending yang disediakan oleh hook, bukan manual state

**Q: Error tidak tertangani**
A: Hook sudah menangani error otomatis, gunakan isError dan error properties untuk custom handling
