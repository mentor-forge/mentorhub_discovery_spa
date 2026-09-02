// Type definitions based on OpenAPI spec

export interface Error {
  error: string
}

export type CardType =
  | 'Customer'
  | 'Coordinator'
  | 'Member'
  | 'Mentee'
  | 'Products'
  | 'Discounts'
  | 'Logs'
  | 'Resource'
  | 'Path'
  | 'Plan'
  | 'Journey'
  | 'Notification'
  | 'Event'

export interface Card {
  _id?: string
  name?: string
  description?: string
  link?: string
  type?: CardType
}

export interface Breadcrumb {
  from_ip: string
  by_user: string
  at_time: string
  correlation_id: string
}

export interface Notification {
  _id?: string
  name?: string
  message?: string
  profile_id?: string
  customer_id?: string
  mentor_id?: string
  global?: Breadcrumb
  status?: 'active' | 'archived'
  link_metadata?: Record<string, unknown>
  created?: Breadcrumb
  dismissed?: Breadcrumb
  cancelled?: Breadcrumb
}

export interface ConfigResponse {
  config_items: unknown[]
  versions: unknown[]
  enumerators: unknown[]
  token?: {
    claims?: Record<string, unknown>
  }
}
