import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as null | {
      id: number
      email: string
      name: string
      avatar: string | null
      role: 'CUSTOMER' | 'OWNER' | 'ADMIN'
    },
    outletFokus: null as null | {
      id: string
      name: string
    },
    outletOptions: [
      { id: '1', name: 'Outlet Pusat' },
      { id: '2', name: 'Outlet Cabang A' },
      { id: '3', name: 'Outlet Cabang B' }
    ]
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    role: (state) => state.user?.role,
    isOwner: (state) => state.user?.role === 'OWNER',
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isCustomer: (state) => state.user?.role === 'CUSTOMER'
  },

  actions: {
    setToken(token: string) {
      this.token = token
    },
    setUser(userData: {
      id: number
      email: string
      name: string
      avatar: string | null
      role: 'CUSTOMER' | 'OWNER' | 'ADMIN'
    }) {
      this.user = userData
    },
    setOutletFokus(outlet: { id: string; name: string }) {
      this.outletFokus = outlet
    },
    clearSession() {
      this.token = null
      this.user = null
      this.outletFokus = null
    }
  },
  persist: true 
})
