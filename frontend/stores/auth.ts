// stores/auth.ts
import { defineStore } from 'pinia'
import type { User, Outlet, Role, LoginForm } from '~/types'

interface AuthState {
  token: string | null
  user: User | null
  selectedOutlet: Outlet | null
  availableOutlets: Outlet[]
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
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
    canAccessOwnerFeatures: (state): boolean => !!state.token && !!state.user && state.user.role === 'OWNER' && state.user.isVerified
  },

  actions: {
    async login(credentials: LoginForm) {
      this.isLoading = true
      try {
        const response = await $fetch<{
          token: string
          user: User
          outlets?: Outlet[]
        }>('/api/auth/login', {
          method: 'POST',
          body: credentials
        })
        
        this.token = response.token
        this.user = response.user
        
        if (response.outlets?.length) {
          this.availableOutlets = response.outlets
          if (response.outlets.length === 1) {
            this.selectedOutlet = response.outlets[0]
          }
        }
        
        await this.navigateAfterLogin()
      } finally {
        this.isLoading = false
      }
    },

    // jika logout dengan endpoint 
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
        const response = await $fetch<{ user: User }>('/api/user/profile', {
          method: 'PUT',
          body: data,
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        this.user = response.user
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
      this.selectedOutlet = null
      this.availableOutlets = []
    },

    async navigateAfterLogin() {
      if (this.isOwner) {
        await navigateTo('/umkm')
      // admin aplikasi 
      // } else if (this.isAdmin) {
        // await navigateTo('/') 
      } else {
        await navigateTo('/home')
      }
    },

    async initAuth() {
      if (this.token && this.user) {
        try {
          // Verify token masih valid
          await $fetch('/api/auth/verify', {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          
          // Fetch outlets untuk owner
          if (this.isOwner) {
            await this.fetchOutlets()
          }
        } catch (error) {
          console.error('Auth verification failed:', error)
          this.clearSession()
        }
      }
    }
  },

  persist: true
})
