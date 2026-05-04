import type {
  PhoneNumber, VolumePoint, HilConfig,
  BusinessHourSchedule, VoiceSession, TranscriptEntry,
  AvailableNumber,
} from '../types/voice'

const BASE = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:3001/api/v1/voice'

function headers(workspaceId: string, userId?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
    ...(userId ? { 'x-user-id': userId } : {}),
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return (res.json() as Promise<{ data: T }>).then((r) => r.data)
}

// ── Numbers ────────────────────────────────────────────────────────────────
export const numbersApi = {
  list: (workspaceId: string, status?: 'active' | 'unassigned') =>
    request<PhoneNumber[]>(
      `${BASE}/numbers${status ? `?status=${status}` : ''}`,
      { headers: headers(workspaceId) },
    ),

  get: (workspaceId: string, id: string) =>
    request<PhoneNumber>(`${BASE}/numbers/${id}`, { headers: headers(workspaceId) }),

  searchAvailable: (workspaceId: string, params: {
    type?: string; countryCode?: string; areaCode?: string; limit?: number
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    return request<AvailableNumber[]>(
      `${BASE}/numbers/search/available?${qs}`,
      { headers: headers(workspaceId) },
    )
  },

  purchase: (workspaceId: string, userId: string, body: {
    phoneNumber: string; type: string; label?: string
  }) =>
    request<PhoneNumber>(`${BASE}/numbers`, {
      method: 'POST',
      headers: headers(workspaceId, userId),
      body: JSON.stringify(body),
    }),

  update: (workspaceId: string, id: string, body: Partial<PhoneNumber>) =>
    request<void>(`${BASE}/numbers/${id}`, {
      method: 'PATCH',
      headers: headers(workspaceId),
      body: JSON.stringify(body),
    }),

  release: (workspaceId: string, id: string) =>
    request<void>(`${BASE}/numbers/${id}`, {
      method: 'DELETE',
      headers: headers(workspaceId),
    }),

  volume: (workspaceId: string, id: string, days = 7) =>
    request<VolumePoint[]>(`${BASE}/numbers/${id}/volume?days=${days}`, {
      headers: headers(workspaceId),
    }),

  getBusinessHours: (workspaceId: string, id: string) =>
    request<{ timezone: string; daySchedule: BusinessHourSchedule[] } | null>(
      `${BASE}/numbers/${id}/business-hours`,
      { headers: headers(workspaceId) },
    ),

  updateBusinessHours: (workspaceId: string, id: string, body: {
    timezone: string; daySchedule: BusinessHourSchedule[]
  }) =>
    request<void>(`${BASE}/numbers/${id}/business-hours`, {
      method: 'PUT',
      headers: headers(workspaceId),
      body: JSON.stringify(body),
    }),
}

// ── HiL ───────────────────────────────────────────────────────────────────
export const hilApi = {
  get: (workspaceId: string, numberId: string) =>
    request<HilConfig | null>(`${BASE}/numbers/${numberId}/hil`, {
      headers: headers(workspaceId),
    }),

  save: (workspaceId: string, numberId: string, body: Partial<HilConfig>) =>
    request<void>(`${BASE}/numbers/${numberId}/hil`, {
      method: 'PUT',
      headers: headers(workspaceId),
      body: JSON.stringify(body),
    }),

  getCustomerAlerts: (workspaceId: string, customerId: string) =>
    request<HilConfig[]>(`${BASE}/alerts/customer/${customerId}`, {
      headers: headers(workspaceId),
    }),
}

// ── Sessions / Logs ────────────────────────────────────────────────────────
export const sessionsApi = {
  list: (workspaceId: string, params?: {
    direction?: string; page?: number; limit?: number
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    return request<{ data: VoiceSession[]; meta: { total: number; page: number; limit: number } }>(
      `${BASE}/sessions${qs ? `?${qs}` : ''}`,
      { headers: headers(workspaceId) },
    )
  },

  get: (workspaceId: string, id: string) =>
    request<VoiceSession & { transcript: TranscriptEntry[] }>(
      `${BASE}/sessions/${id}`,
      { headers: headers(workspaceId) },
    ),

  exportText: async (workspaceId: string, id: string): Promise<string> => {
    const res = await fetch(`${BASE}/sessions/${id}/export?format=text`, {
      headers: headers(workspaceId),
    })
    return res.text()
  },
}
