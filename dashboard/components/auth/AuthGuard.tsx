'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { type UserRole } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface WithAuthProps {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// Default loading component
const DefaultLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// HOC for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const AuthenticatedComponent = (props: P) => {
    const { loading } = useAuthGuard({
      requiredRole: options.requiredRole,
      redirectTo: options.redirectTo
    });

    if (loading) {
      return options.fallback || <DefaultLoading />;
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

// Specific HOCs for common use cases
export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requiredRole: 'ADMIN' });

export const withOwnerAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requiredRole: 'OWNER' });

export const withAnyAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requiredRole: ['ADMIN', 'OWNER'] });

// Component-based auth guards
interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, requiredRole, redirectTo, fallback }: AuthGuardProps) {
  const { loading } = useAuthGuard({ requiredRole, redirectTo });

  if (loading) {
    return fallback || <DefaultLoading />;
  }

  return <>{children}</>;
}

// Specific guards for common use cases
export const AdminGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <AuthGuard requiredRole="ADMIN" fallback={fallback}>
    {children}
  </AuthGuard>
);

export const OwnerGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <AuthGuard requiredRole="OWNER" fallback={fallback}>
    {children}
  </AuthGuard>
);

export const AnyUserGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <AuthGuard requiredRole={['ADMIN', 'OWNER']} fallback={fallback}>
    {children}
  </AuthGuard>
);