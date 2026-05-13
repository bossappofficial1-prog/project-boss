const serverUrl = process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

interface ServerFetchOptions {
    revalidate?: number | false;
    tags?: string[];
}

export async function serverFetch<T>(
    path: string,
    options: ServerFetchOptions = {},
): Promise<T | null> {
    const { revalidate = 60, tags } = options;

    try {
        const res = await fetch(`${serverUrl}${path}`, {
            next: {
                revalidate,
                ...(tags ? { tags } : {}),
            },
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        if (!res.ok) return null;

        const json = await res.json();
        return (json?.data as T) ?? null;
    } catch (error) {
        console.error(`[serverFetch] Error fetching ${path}:`, error);
        return null;
    }
}
