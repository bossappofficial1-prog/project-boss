import { usePathname, useRouter } from 'next/navigation';
import { useAppBar } from '@/context/AppBarContext';
import AppBar from './AppBar';

export default function GlobalAppBar() {
    const { appBarState } = useAppBar();
    const pathname = usePathname();
    const router = useRouter();

    // Routes where AppBar should be hidden
    const hiddenRoutes = [
        '/login',
        '/register',
        '/onboarding',
        '/splash',
        "/profile"
    ];

    if (hiddenRoutes.includes(pathname)) return null;

    // Routes where back button should be hidden (main tabs)
    const mainRoutes = ['/', '/search', '/cart', '/nearby', '/profile'];
    const showBackButton = !mainRoutes.includes(pathname) && appBarState.showBackButton;

    return (
        <AppBar
            {...appBarState}
            variant="transparent"
            showBackButton={showBackButton}
            onLeftClick={() => router.back()}
        />
    );
}