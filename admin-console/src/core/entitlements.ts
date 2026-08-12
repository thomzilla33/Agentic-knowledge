import type { Product, Entitlement, ScopeClosure } from '../types';
import { ancestorsWithSelf } from './scopeTree';

// Entitlements are set at the top of a tree and inherited downward.
// A scope is entitled if any ancestor (including itself) has the entitlement active.
export function entitledProducts(scopeId: string, entitlements: Entitlement[], closure: ScopeClosure[]): Product[] {
  const scopeChain = ancestorsWithSelf(scopeId, closure);
  const products = new Set<Product>();
  for (const ent of entitlements) {
    if (ent.active && scopeChain.includes(ent.scopeId)) {
      products.add(ent.product);
    }
  }
  return Array.from(products);
}

export function isEntitled(scopeId: string, product: Product, entitlements: Entitlement[], closure: ScopeClosure[]): boolean {
  return entitledProducts(scopeId, entitlements, closure).includes(product);
}
