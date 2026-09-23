/**
 * Workers RBAC — ARP-612 (Admin Configuration — Workers RBAC).
 *
 * The permission matrix is roles × actions. Roles come from the platform RBAC
 * registry (fixtures/people.ts), so this file only owns the action vocabulary
 * and the default grants a fresh tenant starts with.
 */

export type WorkerAction =
  | 'view' | 'create' | 'edit' | 'publish' | 'archive' | 'delete' | 'execute';

export type WorkerActionDef = {
  id: WorkerAction;
  label: string;
  /** Shown in the column tooltip and in the enforcement preview. */
  description: string;
  /** Actions that cannot be granted without this one also being granted. */
  requires?: WorkerAction[];
  /** Destructive or irreversible — highlighted in the matrix. */
  sensitive?: boolean;
};

export const WORKER_ACTIONS: WorkerActionDef[] = [
  { id: 'view',    label: 'View',    description: 'Open the worker list, overview, contract, logs and version history.' },
  { id: 'create',  label: 'Create',  description: 'Create a new draft worker.',                                        requires: ['view'] },
  { id: 'edit',    label: 'Edit',    description: 'Change the flow graph, node config and the draft I/O contract.',     requires: ['view'] },
  { id: 'publish', label: 'Publish', description: 'Promote a draft to active, locking its contract for callers.',       requires: ['view', 'edit'], sensitive: true },
  { id: 'archive', label: 'Archive', description: 'Retire a worker so networks can no longer call it.',                 requires: ['view'], sensitive: true },
  { id: 'delete',  label: 'Delete',  description: 'Permanently remove a worker and its version history.',               requires: ['view'], sensitive: true },
  { id: 'execute', label: 'Execute', description: 'Run a worker manually, in the Playground or through the API.',       requires: ['view'] },
];

export const WORKER_ACTION_MAP = Object.fromEntries(
  WORKER_ACTIONS.map(a => [a.id, a]),
) as Record<WorkerAction, WorkerActionDef>;

/** Roles that always hold every action — the matrix renders these locked. */
export const WORKER_LOCKED_ROLES = ['super-admin', 'tenant-admin'];

export type WorkerMatrix = Record<string, WorkerAction[]>;

/** Project-level defaults (ARP-612 §1 "Default permissions set at project level"). */
export const WORKER_MATRIX_DEFAULTS: WorkerMatrix = {
  'super-admin':  ['view', 'create', 'edit', 'publish', 'archive', 'delete', 'execute'],
  'tenant-admin': ['view', 'create', 'edit', 'publish', 'archive', 'delete', 'execute'],
  'developer':    ['view', 'create', 'edit', 'execute'],
  'auditor':      ['view'],
  'data-steward': ['view', 'execute'],
  'viewer':       ['view'],
};

/** Role assigned as owner of a newly created worker (ARP-612 §2). */
export const WORKER_DEFAULT_OWNER_ROLE = 'developer';

/** Permission ids exposed to the platform RBAC registry, one per action. */
export function workerPermId(action: WorkerAction): string {
  return `ag.workers.${action}`;
}
