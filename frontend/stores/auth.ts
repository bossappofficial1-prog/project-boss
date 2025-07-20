// stores/auth.ts
import { defineStore } from 'pinia'
import type { User, Outlet, Role, LoginForm, Business } from '~/types'

interface AuthState {
  token: string | null
  user: User | null
  business: Business | null
  selectedOutlet: Outlet | null
  availableOutlets: Outlet[]
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    business: null,
    selectedOutlet: null,
    availableOutlets: [],
    isLoading: false
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token && !!state.user,
    userRole: (state): Role | null => state.user?.role || null,
    isOwner: (state): boolean => state.user?.role === 'OWNER',
    isAdmin: (state): boolean => state.user?.role === 'ADMIN',
    hasSelectedOutlet: (state): boolean => !!state.selectedOutlet,
    canAccessOwnerFeatures: (state): boolean => !!state.token && !!state.user && state.user.role === 'OWNER' && state.user.isVerified,
    hasBusinessProfile: (state): boolean => !!state.business
  },

  actions: {
    async login(credentials: LoginForm) {
      this.isLoading = true
      try {
        // Login hanya untuk mendapatkan token
        const response = await $fetch<{
          success: boolean
          token: string
        }>('/api/auth/login', {
          method: 'POST',
          body: credentials
        })
        
        if (!response.success || !response.token) {
          throw new Error('Login failed')
        }
        
        this.token = response.token
        
        // Setelah login, ambil data user dari /me
        await this.fetchUserData()
        
        await this.navigateAfterLogin()
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true
      try {
        if (this.token) {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}` }
          })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearSession()
        this.isLoading = false
        await navigateTo('/auth/login')
      }
    },

    async updateProfile(data: Partial<User>) {
      this.isLoading = true
      try {
        const response = await useApi<{ success: boolean }>('/api/user/profile', {
          method: 'PUT',
          body: data,
        })
        
        if (response.data.value?.success) {
          // Setelah update berhasil, ambil data user terbaru dari /me
          await this.fetchUserData()
        } else {
          throw new Error('Gagal update profile')
        }
      } catch (error) {
        console.error("Gagal update profile:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchOutlets() {
      if (!this.isOwner) return
      
      try {
        const outlets = await $fetch<Outlet[]>('/api/outlets', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.availableOutlets = outlets
      } catch (error) {
        console.error('Failed to fetch outlets:', error)
      }
    },

    setSelectedOutlet(outlet: Outlet | null) {
      this.selectedOutlet = outlet
    },

    clearSession() {
      this.token = null
      this.user = null
      this.business = null
      this.selectedOutlet = null
      this.availableOutlets = []
    },

    async navigateAfterLogin() {
      if (this.isOwner) {
        // Cek apakah owner sudah punya bisnis
        if (!this.hasBusinessProfile) {
          console.log("User:", this.user)
          console.log("Business Profile:", this.hasBusinessProfile)
          
          await navigateTo('/umkm/account?setup=true')
        } else {
          await navigateTo('/umkm')
        }
      } else {
        await navigateTo('/home')
      }
    },

    async initAuth() {
      if (this.token && this.user) {
        try {
          // Verify token dan ambil data user terbaru
          await this.fetchUserData()
          
          // Fetch outlets untuk owner
          if (this.isOwner) {
            await this.fetchOutlets()
          }
        } catch (error) {
          console.error('Auth verification failed:', error)
          this.clearSession()
        }
      }
    },

    async fetchUserData() {
      if (!this.token) return
      
      try {
        const response = await $fetch<{ 
          success: boolean
          data: User 
        }>('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        if (response.success && response.data) {
          this.user = response.data
          
          // Set business dari user data
          if (response.data.business) {
            this.business = response.data.business
            
            // Set outlets dari business
            if (response.data.business.outlets?.length) {
              this.availableOutlets = response.data.business.outlets
              if (response.data.business.outlets.length === 1) {
                this.selectedOutlet = response.data.business.outlets[0]
              }
            }
          }
        }
      } catch (error) {
        throw error
      }
    }
  },

  persist: true
})
