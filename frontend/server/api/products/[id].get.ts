export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const token = getHeader(event, "authorization")?.replace("Bearer ", "");

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const product = {
    id: id,
    name: "Nasi Goreng",
    description: "Nasi goreng spesial dengan telur",
    costPrice: 8000,
    price: 15000,
    type: "GOODS",
    quantity: 50,
    unit: "porsi",
    status: "ACTIVE",
    transactionFeeBearer: "CUSTOMER",
    serviceDurationMinutes: null,
    outletId: "1",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return { success: true, data: product };
});
