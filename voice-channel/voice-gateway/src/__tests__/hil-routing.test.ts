import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/client', () => ({
  db: { query: vi.fn() },
}))

vi.mock('../notifications', () => ({
  sendNotifications: vi.fn().mockResolvedValue(undefined),
}))

import { selectNextAgent } from '../human-loop'

describe('selectNextAgent', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('first_available mode', () => {
    it('returns first user id when mode is first_available', () => {
      const result = selectNextAgent(
        { assignmentMode: 'users', userIds: ['u1', 'u2', 'u3'], distributionMode: 'first_available', roundRobinIndex: 0 },
      )
      expect(result).toBe('u1')
    })

    it('returns null when no users configured', () => {
      const result = selectNextAgent(
        { assignmentMode: 'users', userIds: [], distributionMode: 'first_available', roundRobinIndex: 0 },
      )
      expect(result).toBeNull()
    })
  })

  describe('round_robin mode', () => {
    it('picks user at current index', () => {
      const result = selectNextAgent(
        { assignmentMode: 'users', userIds: ['u1', 'u2', 'u3'], distributionMode: 'round_robin', roundRobinIndex: 1 },
      )
      expect(result).toBe('u2')
    })

    it('wraps around when index exceeds list length', () => {
      const result = selectNextAgent(
        { assignmentMode: 'users', userIds: ['u1', 'u2'], distributionMode: 'round_robin', roundRobinIndex: 5 },
      )
      expect(result).toBe('u2') // 5 % 2 = 1 → u2
    })
  })

  describe('role/department modes', () => {
    it('returns roleId when assignmentMode is role', () => {
      const result = selectNextAgent(
        { assignmentMode: 'role', userIds: [], roleId: 'role-abc', distributionMode: 'first_available', roundRobinIndex: 0 },
      )
      expect(result).toBe('role-abc')
    })

    it('returns departmentId when assignmentMode is department', () => {
      const result = selectNextAgent(
        { assignmentMode: 'department', userIds: [], departmentId: 'dept-xyz', distributionMode: 'first_available', roundRobinIndex: 0 },
      )
      expect(result).toBe('dept-xyz')
    })
  })
})
