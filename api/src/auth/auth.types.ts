/**
 * Authentication types (Sprint 1, Story 2).
 *
 * Users are stored as `Person` nodes in Neo4j (already in 001_constraints.cypher).
 * A formal auth/identity contract is introduced in Story 8 (Contract Framework).
 */
export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface RegisterInput {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface LoginInput {
  tenantId: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
