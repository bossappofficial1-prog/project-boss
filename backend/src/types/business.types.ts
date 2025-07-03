export type OutletPayload = {
    address: string
    name: string
    phone: string
}

export type BusinessPayload = {
    name: string
    description: string
    outlets: OutletPayload[]
}

export type RegisterPayload = {
    name: string
    email: string
    password: string
    avatar: string
    business: BusinessPayload
}
