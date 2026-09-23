/**
 * Session store for the Workers permission matrix (ARP-612).
 * Mirrors the shape of mockApi/people.ts: immutable updates, module-level state.
 */

import type { WorkerAction, WorkerMatrix } from '../fixtures/workers';
import {
  WORKER_ACTION_MAP,
  WORKER_LOCKED_ROLES,
  WORKER_MATRIX_DEFAULTS,
  WORKER_DEFAULT_OWNER_ROLE,
} from '../fixtures/workers';

function clone(m: WorkerMatrix): WorkerMatrix {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v]]));
}

let matrix: WorkerMatrix = clone(WORKER_MATRIX_DEFAULTS);
let defaultOwnerRole: string = WORKER_DEFAULT_OWNER_ROLE;

export function getWorkerMatrix(): WorkerMatrix {
  return matrix;
}

export function getRoleActions(roleId: string): WorkerAction[] {
  if (WORKER_LOCKED_ROLES.includes(roleId)) {
    return [...(WORKER_MATRIX_DEFAULTS[roleId] ?? [])];
  }
  return [...(matrix[roleId] ?? [])];
}

export function roleCan(roleId: string, action: WorkerAction): boolean {
  return getRoleActions(roleId).includes(action);
}

/**
 * Grant or revoke one cell, keeping the action dependency graph consistent:
 * granting an action also grants what it requires; revoking one also revokes
 * everything that depends on it.
 */
export function setRoleAction(roleId: string, action: WorkerAction, granted: boolean): WorkerMatrix {
  if (WORKER_LOCKED_ROLES.includes(roleId)) return matrix;

  const current = new Set(matrix[roleId] ?? []);

  if (granted) {
    current.add(action);
    (WORKER_ACTION_MAP[action].requires ?? []).forEach(dep => current.add(dep));
  } else {
    current.delete(action);
    Object.values(WORKER_ACTION_MAP).forEach(def => {
      if ((def.requires ?? []).includes(action)) current.delete(def.id);
    });
  }

  matrix = { ...matrix, [roleId]: [...current] };
  return matrix;
}

export function getDefaultOwnerRole(): string {
  return defaultOwnerRole;
}

export function setDefaultOwnerRole(roleId: string): void {
  defaultOwnerRole = roleId;
}

export function resetWorkerMatrix(): WorkerMatrix {
  matrix = clone(WORKER_MATRIX_DEFAULTS);
  defaultOwnerRole = WORKER_DEFAULT_OWNER_ROLE;
  return matrix;
}

export function isMatrixDirty(): boolean {
  if (defaultOwnerRole !== WORKER_DEFAULT_OWNER_ROLE) return true;
  return Object.keys(WORKER_MATRIX_DEFAULTS).some(roleId => {
    const a = [...(matrix[roleId] ?? [])].sort().join(',');
    const b = [...(WORKER_MATRIX_DEFAULTS[roleId] ?? [])].sort().join(',');
    return a !== b;
  });
}
