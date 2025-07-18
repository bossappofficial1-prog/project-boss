export default defineEventHandler(async (event) => {
  await new Promise(resolve => setTimeout(resolve, 2000)) // delay 2 detik

  const body = await readBody(event)

  const errors: Record<string, string> = {}

  if (!body.name || !body.name.trim()) {
    errors.name = 'Nama bisnis harus diisi'
  }

  if (!body.accountHolder || !body.accountHolder.trim()) {
    errors.accountHolder = 'Nama pemilik rekening harus diisi'
  }

  if (body.bankAccount && body.bankAccount.length < 10) {
    errors.bankAccount = 'Nomor rekening minimal 10 digit'
  }

  if (Object.keys(errors).length > 0) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Validasi gagal',
      data: { message: 'Data tidak valid', errors }
    }))
  }

  // Dummy response sukses
  return {
    status: 'success',
    data: {
      business: {
        id: 'dummy-id-123',
        ...body,
        createdAt: new Date().toISOString()
      }
    }
  }
})
