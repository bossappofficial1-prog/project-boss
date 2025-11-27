// Test data for export functionality
export const testExportData = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+62 812-3456-7890',
        role: 'admin' as const,
        status: 'active' as const,
        location: 'Jakarta',
        revenue: 5000000,
        rating: 4.8,
        joinDate: '2023-01-15T00:00:00Z',
        lastActive: '2024-09-28T10:30:00Z'
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+62 813-9876-5432',
        role: 'manager' as const,
        status: 'active' as const,
        location: 'Surabaya',
        revenue: 3500000,
        rating: 4.6,
        joinDate: '2023-03-20T00:00:00Z',
        lastActive: '2024-09-28T09:15:00Z'
    },
    {
        id: '3',
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+62 814-5555-4444',
        role: 'user' as const,
        status: 'pending' as const,
        location: 'Bandung',
        revenue: 1200000,
        rating: 4.2,
        joinDate: '2023-06-10T00:00:00Z',
        lastActive: '2024-09-27T16:45:00Z'
    }
];

// Export test utility
export const testExportFunctionality = () => {
    console.log('Testing export functionality...');
    console.log('Sample data:', testExportData);

    // Test CSV format
    const csvHeaders = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Location', 'Revenue', 'Rating', 'Join Date'];
    const csvData = testExportData.map(user => [
        user.name,
        user.email,
        user.phone,
        user.role,
        user.status,
        user.location,
        user.revenue,
        user.rating,
        new Date(user.joinDate).toLocaleDateString('id-ID')
    ]);

    const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field =>
            typeof field === 'string' && field.includes(',')
                ? `"${field}"`
                : field
        ).join(','))
    ].join('\n');

    console.log('Generated CSV content:');
    console.log(csvContent);

    return {
        csvContent,
        recordCount: testExportData.length,
        totalRevenue: testExportData.reduce((sum, user) => sum + user.revenue, 0),
        averageRating: testExportData.reduce((sum, user) => sum + user.rating, 0) / testExportData.length
    };
};