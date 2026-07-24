/**
 * OpenAPI spec (Sprint 7 hardening — audit finding: zero API docs existed).
 *
 * Scope: the core intelligence loop (auth, signals, evidence, reasoning,
 * recommendations, decisions) — not all 16 route groups. Documenting all of
 * them accurately by hand risked exactly the kind of overclaiming this project
 * has repeatedly had to correct; a real, useful subset beats a rushed,
 * possibly-wrong complete one. Extending this to policy/risk/analytics/
 * mental-models/eso-executions/executors is mechanical follow-up work using
 * this file as the template.
 */
/**
 * OpenAPI spec (Sprint 7 hardening — audit finding: zero API docs existed).
 * Now covers all 16 route groups — every path below was checked against the
 * actual router file, not written from memory of what the routes "should" be.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HP Enterprise Brain API',
    version: '1.0.0',
    description: 'Foundation (tenant/org/department/person/capability) + Decision Intelligence loop (signal through learning) + governance (policy/risk) + search.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Log in and receive an access + refresh token pair',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } },
        },
        responses: { '200': { description: 'Tokens issued' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/signals': {
      post: {
        summary: 'Detect a new Signal',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              tenantId: { type: 'string' }, orgId: { type: 'string' },
              source: { type: 'string', enum: ['attendance', 'leave', 'performance', 'capability', 'learning', 'recruitment', 'tasks', 'external'] },
              classification: { type: 'string' }, priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }, confidence: { type: 'number' },
            },
            required: ['tenantId', 'orgId', 'source'],
          } } },
        },
        responses: { '201': { description: 'Signal created' }, '400': { description: 'Validation error' } },
      },
    },
    '/signals/{tenantId}': {
      get: { summary: 'List signals for a tenant', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/signals/{tenantId}/{id}/timeline': {
      get: { summary: 'Full chronological chain for one signal (signal + evidence + reasoning steps)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/evidence': {
      post: { summary: 'Collect Evidence, linked to a Signal', responses: { '201': { description: 'Evidence created' } } },
    },
    '/reasoning': {
      post: { summary: 'Generate a ReasoningStep — confidence computed from evidence corroboration and freshness, never asserted', responses: { '201': { description: 'ReasoningStep created' } } },
    },
    '/recommendations': {
      post: { summary: 'Generate a Recommendation from a ReasoningStep. Category forced to watch below 0.4 confidence.', responses: { '201': { description: 'Recommendation created' } } },
    },
    '/decisions': {
      post: { summary: 'Approve a Recommendation — resolves an executor and creates a Decision', responses: { '201': { description: 'Decision created' } } },
    },
    '/decisions/{tenantId}/{recId}/auto-approve-attempt': {
      post: {
        summary: 'Attempt autonomous approval via an active Policy. Never succeeds for opportunity-category recommendations.',
        parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'recId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '{ autoApproved: false } if no policy matched' }, '201': { description: '{ autoApproved: true, decision } if a policy matched' } },
      },
    },
    '/workspace/{tenantId}': {
      get: { summary: 'Cross-entity rollup for the Intelligence Workspace screen', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },

    '/organizations': {
      post: { summary: 'Create an Organization', responses: { '201': { description: 'Created' } } },
    },
    '/organizations/{tenantId}': {
      get: { summary: 'List organizations', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/organizations/{tenantId}/{id}': {
      get: { summary: 'Get an organization', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
      patch: { summary: 'Update an organization', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
    },
    '/organizations/{tenantId}/{id}/archive': {
      post: { summary: 'Archive an organization', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Archived' } } },
    },
    '/organizations/{tenantId}/{id}/audit': {
      get: { summary: 'Audit history for an organization', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },

    '/departments': {
      post: { summary: 'Create a Department', responses: { '201': { description: 'Created' } } },
    },
    '/departments/{tenantId}': {
      get: { summary: 'List departments', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/departments/{tenantId}/{id}': {
      get: { summary: 'Get a department', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
      patch: { summary: 'Update a department', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
    },
    '/departments/{tenantId}/{id}/archive': {
      post: { summary: 'Archive a department', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Archived' } } },
    },

    '/people': {
      post: { summary: 'Create a Person', responses: { '201': { description: 'Created' } } },
    },
    '/people/{tenantId}': {
      get: { summary: 'List people', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/people/{tenantId}/search': {
      get: { summary: 'Search people by name', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/people/{tenantId}/{id}': {
      get: { summary: 'Get a person', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
      patch: { summary: 'Update a person', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
    },

    '/capabilities': {
      post: { summary: 'Create a Capability (KASBA)', responses: { '201': { description: 'Created' } } },
    },
    '/capabilities/{tenantId}': {
      get: { summary: 'List capabilities', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/capabilities/{tenantId}/{id}/assign': {
      post: { summary: 'Assign a capability to a person or org unit', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Assigned' } } },
    },
    '/capabilities/{tenantId}/{id}/version': {
      post: { summary: 'Create a new version of a capability', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Versioned' } } },
    },

    '/policies': {
      post: { summary: 'Create a Policy (executor_autonomy or business_rule)', responses: { '201': { description: 'Created' } } },
    },
    '/policies/{tenantId}': {
      get: { summary: 'List policies', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/policies/{tenantId}/{id}/version': {
      post: { summary: 'Create a new version of a policy (previous version preserved, not mutated)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'New version created' } } },
    },
    '/policies/{tenantId}/{id}/evaluate': {
      post: { summary: 'Evaluate a policy against a context object (safe field-comparison, no eval)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Matched rules and actions' } } },
    },

    '/risks': {
      post: { summary: 'Assess a Risk — score computed server-side as probability x impact weight', responses: { '201': { description: 'Created' } } },
    },
    '/risks/{tenantId}': {
      get: { summary: 'List risks', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/risks/{tenantId}/{id}/mitigate': {
      post: { summary: 'Mark a risk mitigated', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Mitigated' } } },
    },

    '/analytics/{tenantId}': {
      get: { summary: 'Decision statistics: acceptance rate, recommendation accuracy, risk distribution, evidence quality', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/analytics/{tenantId}/executive-summary': {
      get: { summary: 'Cross-domain rollup: statistics + top 5 risks + organizational knowledge (Mental Models)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/analytics/{tenantId}/department/{departmentId}': {
      get: { summary: 'Department-scoped Signal breakdown (by source, by severity)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'departmentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },

    '/mental-models/{tenantId}': {
      get: { summary: 'List Mental Models (organizational learning, per domain)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/mental-models/{tenantId}/domain/{domain}': {
      get: { summary: 'Get the active Mental Model for a domain', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'domain', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'No model yet for this domain' } } },
    },
    '/learnings/{tenantId}/patterns': {
      get: { summary: 'Detected patterns: terms recurring across 2+ reusable Learnings (real clustering, not individual capture)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'min', in: 'query', required: false, schema: { type: 'integer' }, description: 'Minimum occurrence threshold, default 2' }], responses: { '200': { description: 'OK' } } },
    },

    '/eso-executions': {
      post: { summary: 'Queue an ESO execution (does not touch the ESO Contract itself — runtime status tracking only)', responses: { '201': { description: 'Queued' } } },
    },
    '/eso-executions/{tenantId}/eso/{esoId}': {
      get: { summary: 'Execution history for an ESO', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'esoId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/eso-executions/{tenantId}/{id}/transition': {
      patch: { summary: 'Transition execution status (queued->running->completed/failed->rolled_back)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Transitioned' }, '409': { description: 'Invalid state transition' } } },
    },
    '/eso-executions/{tenantId}/{id}/rollback': {
      post: { summary: 'Roll back a completed execution', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Rolled back' } } },
    },

    '/executors': {
      post: { summary: 'Register an Executor (human/ai_agent/software/hybrid) with capability tags and trust level', responses: { '201': { description: 'Registered' } } },
    },
    '/executors/{tenantId}': {
      get: { summary: 'List executors', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/executors/{tenantId}/match': {
      post: { summary: 'Match a recommendation to a concrete available executor (capability + availability + workload)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Match result (may be no match)' } } },
    },

    '/cases': {
      post: { summary: 'Open a Case (EPIC-004) — optionally from a Signal', responses: { '201': { description: 'Created, status=open' } } },
    },
    '/cases/{tenantId}': {
      get: { summary: 'List cases', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/cases/{tenantId}/{id}/transition': {
      patch: { summary: 'Transition case status (open->investigating->hypothesized->resolved->closed). Resolving requires a confirmed hypothesis.', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Transitioned' }, '409': { description: 'Invalid transition' } } },
    },
    '/cases/{tenantId}/{id}/evidence': {
      post: { summary: 'Attach Evidence to a Case', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Linked' } } },
    },
    '/hypotheses': {
      post: { summary: 'Propose a Hypothesis against one of the 8 root-cause families (EPIC-004 F-004.2/F-004.3)', responses: { '201': { description: 'Created, status=proposed' } } },
    },
    '/hypotheses/{tenantId}/case/{caseId}': {
      get: { summary: 'The full Deliberation Trace for a case — every hypothesis tried, in order, including rejections and why', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'caseId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/hypotheses/{tenantId}/case/{caseId}/{id}/reject': {
      post: { summary: 'Reject a hypothesis with a required reason (append-only — a new ledger row, original preserved)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'caseId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Rejected' }, '400': { description: 'Reason required' } } },
    },
    '/hypotheses/{tenantId}/case/{caseId}/{id}/confirm': {
      post: { summary: 'Confirm a hypothesis — resolves the case', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'caseId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Confirmed, case resolved' } } },
    },

    '/graph/{tenantId}/entity/{label}/{id}': {
      get: { summary: 'Node Details: one entity by label + id, with all properties', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'label', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '400': { description: 'Unknown label' }, '404': { description: 'Not found' } } },
    },
    '/graph/{tenantId}/entity/{label}/{id}/related': {
      get: { summary: 'Relationship browser: every directly connected node, both directions, capped at 50', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'label', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/graph/{tenantId}/search': {
      get: { summary: 'Enterprise Search — substring match on name/title/statement across node labels (honestly simple, not a separate search index)', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'q', in: 'query', required: true, schema: { type: 'string' } }, { name: 'labels', in: 'query', required: false, schema: { type: 'string' }, description: 'Comma-separated label filter' }], responses: { '200': { description: 'OK' } } },
    },

    '/health': {
      get: { summary: 'Liveness check', security: [], responses: { '200': { description: 'OK' } } },
    },
  },
};
