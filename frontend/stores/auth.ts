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
          await this.fetchUserData()
          
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
          business: Business
          outlets: Outlet[]
        }>('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        if (response.success && response.data) {
          this.user = response.data
          this.business = response.business
          this.availableOutlets = response.outlets
        }
      } catch (error) {
        throw error
      }
    }
  },

  persist: true
})
