import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PersonGraphRepository } from '../src/person/person.graph.repository.js';
function fakeSession(tenantId, rows = []) {
    const captured = [];
    const wrapped = rows.map((r) => ({ ...r, toObject: () => r }));
    const s = {
        tenantId,
        captured,
        run: async (cypher, params = {}) => {
            captured.push({ cypher, params });
            if (!wrapped.length && params.id && params.tenantId) {
                return { records: [{ ...params, toObject: () => params }] };
            }
            return { records: wrapped };
        },
        close: async () => { },
    };
    return s;
}
test('Neo4j: Person create uses Person label and tenantId', async () => {
    const session = fakeSession('t1');
    const repo = new PersonGraphRepository(session);
    await repo.create({ tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', orgId: 'o1', createdBy: 'u1' });
    const call = session.captured[0];
    assert.ok(call.cypher.includes('CREATE (p:Person'), 'CREATE should use :Person label');
    assert.ok(call.cypher.includes('tenantId: $tenantId'), 'CREATE must include tenantId');
    assert.equal(call.params.tenantId, 't1');
    assert.equal(call.params.orgId, 'o1');
});
test('Neo4j: Person findById uses Person label and tenantId', async () => {
    const session = fakeSession('t1');
    const repo = new PersonGraphRepository(session);
    await repo.findById('t1', 'p1');
    const call = session.captured[0];
    assert.ok(call.cypher.includes('MATCH (p:Person'), 'findById should use :Person label');
    assert.ok(call.cypher.includes('tenantId'), 'findById must reference tenantId');
    assert.equal(call.params.tenantId, 't1');
});
test('Neo4j: Person list scopes by tenantId', async () => {
    const session = fakeSession('t1');
    const repo = new PersonGraphRepository(session);
    await repo.list('t1');
    const call = session.captured[0];
    assert.ok(call.cypher.includes('tenantId'), 'list must reference tenantId');
    assert.equal(call.params.tenantId, 't1');
});
test('Neo4j: Person update uses Person label and tenantId', async () => {
    const session = fakeSession('t1', [{ id: 'p1', tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', displayName: null, email: 'john@example.com', phone: null, profilePhoto: null, gender: null, dateOfBirth: null, employmentType: 'full_time', employmentStatus: 'active', joiningDate: null, departmentId: null, managerId: null, designation: null, location: null, reportingManagerId: null, orgId: 'o1', status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
    const repo = new PersonGraphRepository(session);
    await repo.update('t1', 'p1', { firstName: 'Jane' });
    const call = session.captured[session.captured.length - 1];
    assert.ok(call.cypher.includes('MATCH (p:Person'), 'update should use :Person label');
    assert.ok(call.cypher.includes('tenantId'), 'update must reference tenantId');
    assert.equal(call.params.tenantId, 't1');
});
test('Neo4j: Person archive sets status to archived', async () => {
    const session = fakeSession('t1', [{ id: 'p1', tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', displayName: null, email: 'john@example.com', phone: null, profilePhoto: null, gender: null, dateOfBirth: null, employmentType: 'full_time', employmentStatus: 'active', joiningDate: null, departmentId: null, managerId: null, designation: null, location: null, reportingManagerId: null, orgId: 'o1', status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
    const repo = new PersonGraphRepository(session);
    await repo.archive('t1', 'p1');
    const call = session.captured[session.captured.length - 1];
    assert.ok(call.cypher.includes('status = $status'), 'archive must set status');
    assert.equal(call.params.status, 'archived');
});
