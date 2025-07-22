export default defineEventHandler(async (event) => {
  await new Promise(resolve => setTimeout(resolve, 2000)) // delay 2 detik

  const body = await readBody(event)

  const errors: Record<string, string> = {}

  if (!body.name || !body.name.trim()) {
    errors.name = 'Nama bisnis harus diisi'
  }

  if (Object.keys(errors).length > 0) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Validasi gagal',
      data: { message: 'Data tidak valid', errors }
    }))
  }

  // Dummy response update
  return {
    status: 'success',
    data: {
      business: {
        id: 'dummy-id-123',
        ...body,
        updatedAt: new Date().toISOString()
      }
    }
  }
})
