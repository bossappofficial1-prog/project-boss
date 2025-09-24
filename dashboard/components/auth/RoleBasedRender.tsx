'use client';

import { useAuth } from '@/hooks/useAuth';
import { type UserRole } from '@/lib/auth';

interface RoleBasedRenderProps {
  allowedRoles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Component to render content based on user role
export function RoleBasedRender({ allowedRoles, children, fallback = null }: RoleBasedRenderProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRole = roles.includes(user.role);

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

// Specific components for common role checks
export const AdminOnly = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleBasedRender allowedRoles="ADMIN" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

export const OwnerOnly = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleBasedRender allowedRoles="OWNER" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

export const AnyUser = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleBasedRender allowedRoles={['ADMIN', 'OWNER']} fallback={fallback}>
    {children}
  </RoleBasedRender>
);

// Hook for conditional rendering in components
export function useRoleAccess() {
  const { user, isAuthenticated, hasRole } = useAuth();

  return {
    canAccess: (roles: UserRole | UserRole[]) => {
      if (!isAuthenticated || !user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    isAdmin: hasRole('ADMIN'),
    isOwner: hasRole('OWNER'),
    user,
    isAuthenticated
  };
}