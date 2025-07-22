// server/api/user/profile.put.ts
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  // }

  // const token = authHeader.replace('Bearer ', '')
  
  // Dummy token validation
  // if (token !== 'dummy-jwt-token-123') {
  //   throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  // }

  // Handle both FormData and JSON body
  let updateData: any = {}
  
  try {
    const contentType = getHeader(event, 'content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await readFormData(event)
      
      updateData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        profileImage: formData.get('profileImage') as File | null
      }
    } else {
      updateData = await readBody(event)
    }
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  if (!updateData.name || !updateData.email) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan email wajib diisi' })
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Return only success status
  return { 
    success: true,
    message: 'Profile updated successfully'
  }
})
