export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = query.limit ? parseInt(query.limit as string) : undefined;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  
  const business = [
    {
      id: '1',
      name: 'Acme Corp',
      description: 'Leading retailer in Indonesia',
      createdAt: new Date(),
      updatedAt: new Date(),
      bankName: 'Bank Central Asia',
      bankAccount: '1234567890',
      accountHolder: 'John Doe',
      ownerId: '1',
      defaultTransactionFeeBearer: 'OWNER',
      wallet: undefined,
      memberships: []
    },
    {
      id: '2',
      name: 'Beta Mart',
      description: 'Convenience store chain',
      createdAt: new Date(),
      updatedAt: new Date(),
      bankName: 'Bank Mandiri',
      bankAccount: '9876543210',
      accountHolder: 'Jane Smith',
      ownerId: '2',
      defaultTransactionFeeBearer: 'BUSINESS',
      wallet: undefined,
      memberships: []
    }
  ]
  const outlets = [
    {
      id: "1",
      name: "Main Store",
      address: "Jl. Sudirman No. 123",
      phone: "+6281234567890",
      businessId: "1",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUD3RvDNL0Idc4lwUBfhbE7nFpjRwCJqD3HQ&s",
      createdAt: new Date(),
      updatedAt: new Date(),
      business: business[1],
    },
    {
      id: "2",
      name: "Branch Store",
      address: "Jl. Thamrin No. 456",
      phone: "+6281234567891",
      businessId: "1",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz9uJiPPaqjtr6F0-R_Nbsd19TyBWiRI9SuA&s",
      createdAt: new Date(),
      updatedAt: new Date(),
      business: business[0],
    },
    {
      id: "3",
      name: "Outlet 3",
      address: "Jl. Gatot Subroto No. 789",
      phone: "+6281234567892",
      businessId: "2",
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      business: business[0],
    },
    {
      id: "4",
      name: "Outlet 4",
      address: "Jl. Rasuna Said No. 101",
      phone: "+6281234567893",
      businessId: "2",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxpVkU6L_4FB2LGueJ_QPdT_vuibIvbTiPDQ&s",
      createdAt: new Date(),
      updatedAt: new Date(),
      business: business[1],
    },
  ];

  const result = limit ? outlets.slice(0, limit) : outlets;

  return {
    success: true,
    data: result,
  };
});
