import { useEffect, useState } from 'react';
import { api as personApi } from '../../api/person';
import { LoadingState, ErrorState } from '../shared/States';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email: string;
}

interface CapabilityScore {
  capabilityId: string;
  capabilityName: string;
  scores: { knowledge: number | null; ability: number | null; skill: number | null; behaviour: number | null; attitude: number | null; overall: number | null };
  gaps: Array<{ dimension: string; currentLevel: number | null; targetLevel: number; gap: number }>;
  assessedDate: string | null;
}

interface ExecutionHistoryItem {
  id: string;
  esoId: string;
  status: string;
  completedDate: string | null;
  createdDate: string;
}

interface Twin {
  person: { firstName: string; lastName: string; jobTitle: string | null; email: string };
  capabilityCount: number;
  capabilityScores: CapabilityScore[];
  decisionParticipation: { total: number; approved: number };
  learningContributions: number;
  recentActivity: Array<{ type: string; createdAt: string; entityType: string }>;
  guardians: Array<{ firstName: string; lastName: string; relationship: string; email: string | null; phone: string | null; isPrimaryContact: boolean }>;
  executionHistory: ExecutionHistoryItem[];
  individualScore: { score: number | null; breakdown: { capabilityScore: number | null; decisionQuality: number | null; executionSuccess: number | null } };
}

const KASBA_DIMS: Array<{ key: 'knowledge' | 'ability' | 'skill' | 'behaviour' | 'attitude'; letter: string }> = [
  { key: 'knowledge', letter: 'K' },
  { key: 'ability', letter: 'A' },
  { key: 'skill', letter: 'S' },
  { key: 'behaviour', letter: 'B' },
  { key: 'attitude', letter: 'A' },
];

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('approved') || s.includes('success')) return 'eb-badge eb-badge-success';
  if (s.includes('fail') || s.includes('reject')) return 'eb-badge eb-badge-danger';
  if (s.includes('progress') || s.includes('pending')) return 'eb-badge eb-badge-warning';
  return 'eb-badge';
}

function eventLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PersonIntelligence({ tenantId, personId, onBack }: { tenantId: string; personId?: string; onBack?: () => void }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string>(personId ?? '');
  const [twin, setTwin] = useState<Twin | null>(null);
  const [listLoading, setListLoading] = useState(!personId);
  const [twinLoading, setTwinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personId) { setListLoading(false); return; }
    setListLoading(true);
    personApi.listPeople(tenantId)
      .then((data: Person[]) => {
        setPeople(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setListLoading(false));
  }, [tenantId, personId]);

  const loadTwin = () => {
    if (!selectedId) return;
    setTwinLoading(true);
    setError(null);
    personApi.getTwin(tenantId, selectedId)
      .then(setTwin)
      .catch((e: any) => setError(e.message))
      .finally(() => setTwinLoading(false));
  };

  useEffect(() => { loadTwin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tenantId, selectedId]);

  if (listLoading) return <LoadingState label="Loading people..." />;
  if (error && !twin) return <ErrorState message={error} />;

  if (!personId && people.length === 0) {
    return <div className="eb-dashed-empty">No people yet. Add someone to see their intelligence profile here.</div>;
  }

  const score = twin ? twin.individualScore.score : null;

  return (
    <div className="eb-fade-in">
      {onBack && <button onClick={onBack} className="eb-pill-btn" style={{ marginBottom: 14 }}>{'\u2190 Back'}</button>}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div className="eb-eyebrow">Person Intelligence</div>
          <h1 className="eb-headline">{twin ? twin.person.firstName + ' ' + twin.person.lastName : 'Loading...'}</h1>
        </div>
        {!personId && (
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ alignSelf: 'center' }}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.jobTitle ? ' \u2014 ' + p.jobTitle : ''}</option>
            ))}
          </select>
        )}
      </div>

      {twinLoading || !twin ? (
        <LoadingState label="Loading person twin..." />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className="eb-conn-pill"><span className="eb-conn-dot" />{'Live \u00B7 GET /people/' + tenantId + '/' + selectedId + '/twin'}</span>
            <button className="eb-pill-btn" onClick={loadTwin}>{'\u21BA Re-ingest'}</button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--eb-ink-muted)', marginBottom: 20 }}>
            {(twin.person.jobTitle ?? 'No title on record') + ' \u00B7 ' + twin.person.email}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
            <div className="eb-record-stat">
              <div className="eb-record-stat-label">Individual Score</div>
              <div className="eb-record-stat-value">{score != null ? Math.round(score) : '\u2014'}</div>
            </div>
            <div className="eb-record-stat">
              <div className="eb-record-stat-label">Capabilities</div>
              <div className="eb-record-stat-value">{twin.capabilityCount}</div>
            </div>
            <div className="eb-record-stat">
              <div className="eb-record-stat-label">Decisions</div>
              <div className="eb-record-stat-value">{twin.decisionParticipation.total}</div>
            </div>
            <div className="eb-record-stat">
              <div className="eb-record-stat-label">Approved</div>
              <div className="eb-record-stat-value">{twin.decisionParticipation.approved}</div>
            </div>
            <div className="eb-record-stat">
              <div className="eb-record-stat-label">Learning</div>
              <div className="eb-record-stat-value">{twin.learningContributions}</div>
            </div>
          </div>

          <div className="eb-panel" style={{ marginBottom: 20 }}>
            <div className="eb-panel-head">
              <span className="eb-panel-title">Capability profile</span>
              <span className="eb-panel-tag">capabilityScores[].scores</span>
            </div>
            <div className="eb-endpoint-note">
              KASBA \u2014 Knowledge, Ability, Skill, Behaviour, Attitude \u2014 from real assessment records. Nothing here is inferred without a source.
            </div>
            {twin.capabilityScores.length === 0 ? (
              <div className="eb-dashed-empty">No capability assessments on record yet \u2014 capabilityScores[] is empty.</div>
            ) : (
              <div className="eb-grid eb-grid-2">
                {twin.capabilityScores.map((cs) => (
                  <div key={cs.capabilityId} style={{ border: '1px solid var(--eb-border)', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--eb-ink)' }}>{cs.capabilityName}</span>
                      <span style={{ fontFamily: 'var(--eb-font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--eb-accent)' }}>
                        {cs.scores.overall != null ? cs.scores.overall.toFixed(1) : '\u2014'}<span style={{ color: 'var(--eb-ink-faint)', fontWeight: 400 }}> / 5</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {KASBA_DIMS.map(({ key, letter }) => {
                        const val = cs.scores[key];
                        return (
                          <div key={key} className="eb-bar-row" title={key}>
                            <span style={{ fontFamily: 'var(--eb-font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--eb-accent)', width: 14 }}>{letter}</span>
                            <span className="eb-bar-track"><span className="eb-bar-fill" style={{ width: ((val ?? 0) / 5) * 100 + '%' }} /></span>
                            <span className="eb-bar-value">{val != null ? val.toFixed(1) : '\u2014'}</span>
                          </div>
                        );
                      })}
                    </div>
                    {cs.gaps.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--eb-border)', fontSize: 12, color: 'var(--eb-warning)' }}>
                        Gap: {cs.gaps.map((g) => g.dimension + ' \u2212' + g.gap).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="eb-grid eb-grid-2" style={{ alignItems: 'start' }}>
            <div className="eb-panel">
              <div className="eb-panel-head">
                <span className="eb-panel-title">Execution history</span>
                <span className="eb-panel-tag">executionHistory[]</span>
              </div>
              {twin.executionHistory.length === 0 ? (
                <div className="eb-dashed-empty">No ESO executions recorded yet.</div>
              ) : (
                <table>
                  <thead><tr><th>ESO</th><th>Status</th><th>Completed</th></tr></thead>
                  <tbody>
                    {twin.executionHistory.map((ex) => (
                      <tr key={ex.id}>
                        <td style={{ fontFamily: 'var(--eb-font-mono)', fontSize: 12 }}>{ex.esoId}</td>
                        <td><span className={statusBadgeClass(ex.status)}>{ex.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--eb-ink-muted)' }}>{ex.completedDate ? new Date(ex.completedDate).toLocaleDateString() : '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="eb-panel">
              <div className="eb-panel-head">
                <span className="eb-panel-title">Recent activity</span>
                <span className="eb-panel-tag">recentActivity[]</span>
              </div>
              {twin.recentActivity.length === 0 ? (
                <div className="eb-dashed-empty">No attributed activity in this twin yet.</div>
              ) : (
                <div>
                  {twin.recentActivity.map((a, i) => (
                    <div key={i} className="eb-timeline-item">
                      <span className="eb-timeline-rail">
                        <span className="eb-timeline-dot" />
                        {i < twin.recentActivity.length - 1 && <span className="eb-timeline-line" />}
                      </span>
                      <span style={{ flex: 1 }}>
                        <div className="eb-timeline-text">{eventLabel(a.type)} <span style={{ color: 'var(--eb-ink-faint)' }}>{'\u00B7 ' + a.entityType}</span></div>
                        <div className="eb-timeline-meta">{new Date(a.createdAt).toLocaleDateString()}</div>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {twin.guardians.length > 0 && (
            <div className="eb-panel" style={{ marginTop: 20 }}>
              <div className="eb-panel-head"><span className="eb-panel-title">Guardians</span></div>
              <table>
                <thead><tr><th>Name</th><th>Relationship</th><th>Contact</th></tr></thead>
                <tbody>
                  {twin.guardians.map((g, i) => (
                    <tr key={i}>
                      <td>{g.firstName} {g.lastName} {g.isPrimaryContact && <span className="eb-badge eb-badge-info" style={{ marginLeft: 6 }}>Primary</span>}</td>
                      <td>{g.relationship}</td>
                      <td style={{ fontSize: 12, color: 'var(--eb-ink-muted)' }}>{g.email ?? g.phone ?? '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
