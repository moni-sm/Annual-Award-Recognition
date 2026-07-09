import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageClient.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const QUESTION_TYPES = ['input', 'textarea', 'checkbox', 'section', 'scoringGuide'];
const DESIGNATIONS   = ['manager', 'management', 'director', 'vp', 'avp', 'senior manager'];

function emptyAward() {
  return {
    awardName: '',
    description: [''],
    questions: [],
    scoringCriteria: [],
    eligibleDesignations: [],
    isActive: true,
  };
}

function emptyQuestion() {
  return { type: 'textarea', question: '', placeholder: '', options: [], title: '', order: 0 };
}

function emptyCriterion() {
  return {
    criterionName: '',
    weight: 0,
    descriptions: { 5: '', 4: '', 3: '', 2: '', 1: '' }
  };
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
const ManageClient = () => {
  const navigate  = useNavigate();
  const [awards,  setAwards]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  // Scroll-to-bottom refs for newly added items
  const questionsEndRef  = useRef(null);
  const criteriaEndRef   = useRef(null);
  const descEndRef       = useRef(null);

  // Panel state
  const [activeAwardId, setActiveAwardId] = useState(null); // null = list view
  const [editData,      setEditData]      = useState(null); // the award being edited
  const [activeTab,     setActiveTab]     = useState('questions'); // questions | scoring | description | settings

  // ── fetch all awards ──────────────────────────────────────
  const fetchAwards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/award-config`);
      setAwards(res.data);
    } catch (e) {
      showToast('Failed to load awards', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAwards(); }, [fetchAwards]);

  // ── toast helper ─────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── open award for editing ────────────────────────────────
  const openAward = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/award-config/${id}`);
      setEditData(res.data);
      setActiveAwardId(id);
      setActiveTab('questions');
    } catch {
      showToast('Failed to load award details', 'error');
    }
  };

  // ── open new award form ───────────────────────────────────
  const openNew = () => {
    setEditData(emptyAward());
    setActiveAwardId('__new__');
    setActiveTab('questions');
  };

  // ── save (create or update) ───────────────────────────────
  const saveAward = async () => {
    if (!editData.awardName.trim()) {
      showToast('Award name is required', 'error'); return;
    }
    try {
      setSaving(true);
      if (activeAwardId === '__new__') {
        await axios.post(`${API_BASE}/award-config`, editData);
        showToast('Award created successfully! ✅');
      } else {
        await axios.put(`${API_BASE}/award-config/${activeAwardId}`, editData);
        showToast('Award updated successfully! ✅');
      }
      await fetchAwards();
      setActiveAwardId(null);
      setEditData(null);
    } catch (e) {
      showToast(e.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────────
  const deleteAward = async (id, name) => {
    if (!window.confirm(`Delete award "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/award-config/${id}`);
      showToast(`"${name}" deleted`);
      await fetchAwards();
      if (activeAwardId === id) { setActiveAwardId(null); setEditData(null); }
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // ── toggle active ─────────────────────────────────────────
  const toggleActive = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE}/award-config/${id}/toggle`);
      setAwards(prev => prev.map(a => a._id === id ? { ...a, isActive: res.data.isActive } : a));
    } catch {
      showToast('Toggle failed', 'error');
    }
  };

  /* ═══════════════════════════════════════════
     EDIT DATA HELPERS
  ═══════════════════════════════════════════ */

  // ── description lines ─────────────────────
  const updateDescLine = (i, val) => setEditData(p => {
    const d = [...p.description]; d[i] = val; return { ...p, description: d };
  });
  const addDescLine = () => {
    setEditData(p => ({ ...p, description: [...p.description, ''] }));
    setTimeout(() => descEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  };
  const removeDescLine = (i) => setEditData(p => ({ ...p, description: p.description.filter((_, idx) => idx !== i) }));

  // ── questions ─────────────────────────────
  const addQuestion = () => {
    setEditData(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }));
    setTimeout(() => questionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  };
  const removeQuestion = (i)      => setEditData(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i, key, val) => setEditData(p => {
    const qs = [...p.questions];
    qs[i] = { ...qs[i], [key]: val };
    return { ...p, questions: qs };
  });
  const moveQuestion = (i, dir) => setEditData(p => {
    const qs = [...p.questions];
    const j = i + dir;
    if (j < 0 || j >= qs.length) return p;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return { ...p, questions: qs };
  });

  // checkbox options
  const addCheckboxOption = (qi)     => updateQuestion(qi, 'options', [...(editData.questions[qi].options || []), '']);
  const updateCheckboxOpt = (qi, oi, val) => {
    const opts = [...(editData.questions[qi].options || [])]; opts[oi] = val;
    updateQuestion(qi, 'options', opts);
  };
  const removeCheckboxOpt = (qi, oi) => {
    const opts = (editData.questions[qi].options || []).filter((_, idx) => idx !== oi);
    updateQuestion(qi, 'options', opts);
  };

  // ── scoring criteria ──────────────────────
  const addCriterion = () => {
    setEditData(p => ({ ...p, scoringCriteria: [...p.scoringCriteria, emptyCriterion()] }));
    setTimeout(() => criteriaEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  };
  const removeCriterion = (i)      => setEditData(p => ({ ...p, scoringCriteria: p.scoringCriteria.filter((_, idx) => idx !== i) }));
  const updateCriterion = (i, key, val) => setEditData(p => {
    const sc = [...p.scoringCriteria]; sc[i] = { ...sc[i], [key]: val };
    return { ...p, scoringCriteria: sc };
  });
  const updateCriterionDesc = (i, rating, val) => setEditData(p => {
    const sc = [...p.scoringCriteria];
    sc[i] = { ...sc[i], descriptions: { ...sc[i].descriptions, [rating]: val } };
    return { ...p, scoringCriteria: sc };
  });

  // ── eligibility ───────────────────────────
  const toggleDesig = (desig) => {
    setEditData(p => {
      const cur = p.eligibleDesignations || [];
      return {
        ...p,
        eligibleDesignations: cur.includes(desig) ? cur.filter(d => d !== desig) : [...cur, desig]
      };
    });
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="mc-wrapper">
      {/* ── Toast ── */}
      {toast && <div className={`mc-toast mc-toast--${toast.type}`}>{toast.msg}</div>}

      {/* ── Sidebar ── */}
      <aside className="mc-sidebar">
        <div className="mc-sidebar-brand">
          <button className="mc-back-btn" onClick={() => navigate('/')} title="Back to Dashboard">←</button>
          <span>Manage Client</span>
        </div>
        <div className="mc-sidebar-scroll">
          <button className="mc-new-btn" onClick={openNew}>＋ New Award</button>

          {loading ? (
            <div className="mc-sidebar-loading">Loading…</div>
          ) : awards.length === 0 ? (
            <div className="mc-sidebar-empty">No awards yet</div>
          ) : (
            awards.map(a => (
              <div
                key={a._id}
                className={`mc-award-item ${activeAwardId === a._id ? 'mc-award-item--active' : ''} ${!a.isActive ? 'mc-award-item--inactive' : ''}`}
                onClick={() => openAward(a._id)}
              >
                <span className={`mc-status-dot ${a.isActive ? 'mc-status-dot--on' : 'mc-status-dot--off'}`} />
                <span className="mc-award-item-name">{a.awardName}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="mc-main">
        {/* LIST / WELCOME VIEW */}
        {!editData && (
          <div className="mc-welcome">
            <div className="mc-welcome-icon">🏆</div>
            <h1>Manage Client Awards</h1>
            <p>Select an award from the sidebar to edit, or create a new one.</p>
            <div className="mc-stats-row">
              <div className="mc-stat-box">
                <span className="mc-stat-num">{awards.length}</span>
                <span className="mc-stat-lbl">Total Awards</span>
              </div>
              <div className="mc-stat-box">
                <span className="mc-stat-num">{awards.filter(a => a.isActive).length}</span>
                <span className="mc-stat-lbl">Active</span>
              </div>
              <div className="mc-stat-box">
                <span className="mc-stat-num">{awards.filter(a => !a.isActive).length}</span>
                <span className="mc-stat-lbl">Inactive</span>
              </div>
            </div>
            {/* Award Cards Grid */}
            <div className="mc-card-grid">
              {awards.map(a => (
                <div
                  key={a._id}
                  className={`mc-card ${a.isActive ? '' : 'mc-card--inactive'}`}
                  onClick={() => openAward(a._id)}
                >
                  <div className="mc-card-header">
                    <span className={`mc-badge ${a.isActive ? 'mc-badge--active' : 'mc-badge--inactive'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="mc-card-actions" onClick={e => e.stopPropagation()}>
                      <button className="mc-icon-btn mc-icon-btn--toggle" onClick={() => toggleActive(a._id)} title="Toggle active">
                        {a.isActive ? '🔴' : '🟢'}
                      </button>
                      <button className="mc-icon-btn mc-icon-btn--delete" onClick={() => deleteAward(a._id, a.awardName)} title="Delete">🗑️</button>
                    </div>
                  </div>
                  <h3 className="mc-card-name">{a.awardName}</h3>
                  <p className="mc-card-meta">
                    Updated: {new Date(a.updatedAt).toLocaleDateString()}
                  </p>
                  <button className="mc-card-edit-btn" onClick={() => openAward(a._id)}>✏️ Edit</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT PANEL */}
        {editData && (
          <div className="mc-editor">
            {/* ── Editor Header ── */}
            <div className="mc-editor-header">
              <div className="mc-editor-title-row">
                <button className="mc-back-link" onClick={() => { setActiveAwardId(null); setEditData(null); }}>← Back</button>
                <h2>{activeAwardId === '__new__' ? '✨ New Award' : `✏️ Edit: ${editData.awardName}`}</h2>
              </div>
              <div className="mc-editor-actions">
                {activeAwardId !== '__new__' && (
                  <button
                    className={`mc-toggle-btn ${editData.isActive ? 'mc-toggle-btn--on' : 'mc-toggle-btn--off'}`}
                    onClick={() => setEditData(p => ({ ...p, isActive: !p.isActive }))}
                  >
                    {editData.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </button>
                )}
                <button className="mc-save-btn" onClick={saveAward} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Award'}
                </button>
              </div>
            </div>

            {/* ── Award Name ── */}
            <div className="mc-field-row">
              <label className="mc-label">Award Name *</label>
              <input
                className="mc-input mc-input--large"
                value={editData.awardName}
                onChange={e => setEditData(p => ({ ...p, awardName: e.target.value }))}
                placeholder="e.g. Customer Service Performance"
              />
            </div>

            {/* ── Tabs ── */}
            <div className="mc-tabs">
              {['questions', 'scoring', 'description', 'settings'].map(tab => (
                <button
                  key={tab}
                  className={`mc-tab ${activeTab === tab ? 'mc-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'questions'   && '📋 Questions'}
                  {tab === 'scoring'     && '📊 Scoring Guide'}
                  {tab === 'description' && '📝 Description'}
                  {tab === 'settings'    && '⚙️ Settings'}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════
                TAB: QUESTIONS
            ════════════════════════════════ */}
            {activeTab === 'questions' && (
              <div className="mc-tab-body">
                <div className="mc-section-header">
                  <span>Form Questions & Sections</span>
                  <button className="mc-add-btn" onClick={addQuestion}>＋ Add Question</button>
                </div>

                {editData.questions.length === 0 && (
                  <div className="mc-empty-hint">No questions yet. Click "＋ Add Question" to begin.</div>
                )}

                {editData.questions.map((q, i) => (
                  <div key={i} className={`mc-question-card mc-question-card--${q.type}`}>
                    {/* ── Question Header ── */}
                    <div className="mc-question-header">
                      <span className={`mc-type-badge mc-type-badge--${q.type}`}>{q.type}</span>
                      <span className="mc-question-num">#{i + 1}</span>
                      <div className="mc-question-controls">
                        <button className="mc-icon-btn" onClick={() => moveQuestion(i, -1)} disabled={i === 0} title="Move up">↑</button>
                        <button className="mc-icon-btn" onClick={() => moveQuestion(i, 1)} disabled={i === editData.questions.length - 1} title="Move down">↓</button>
                        <button className="mc-icon-btn mc-icon-btn--delete" onClick={() => removeQuestion(i)} title="Remove">✕</button>
                      </div>
                    </div>

                    {/* ── Type selector ── */}
                    <div className="mc-q-row">
                      <label className="mc-q-label">Type</label>
                      <select
                        className="mc-select"
                        value={q.type}
                        onChange={e => updateQuestion(i, 'type', e.target.value)}
                      >
                        {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* ── Section title ── */}
                    {q.type === 'section' && (
                      <div className="mc-q-row">
                        <label className="mc-q-label">Section Title</label>
                        <input className="mc-input" value={q.title || ''} onChange={e => updateQuestion(i, 'title', e.target.value)} placeholder="e.g. Scoring Weight Grid Reference (Total: 100)" />
                      </div>
                    )}

                    {/* ── scoringGuide title ── */}
                    {q.type === 'scoringGuide' && (
                      <div className="mc-q-row">
                        <label className="mc-q-label">Scoring Guide Title</label>
                        <input className="mc-input" value={q.title || ''} onChange={e => updateQuestion(i, 'title', e.target.value)} placeholder="e.g. Rating Criteria" />
                      </div>
                    )}

                    {/* ── Question text ── */}
                    {(q.type === 'input' || q.type === 'textarea' || q.type === 'checkbox') && (
                      <>
                        <div className="mc-q-row">
                          <label className="mc-q-label">Question</label>
                          <input className="mc-input" value={q.question || ''} onChange={e => updateQuestion(i, 'question', e.target.value)} placeholder="Enter question text…" />
                        </div>
                        <div className="mc-q-row">
                          <label className="mc-q-label">Placeholder</label>
                          <input className="mc-input" value={q.placeholder || ''} onChange={e => updateQuestion(i, 'placeholder', e.target.value)} placeholder="Hint text for the field…" />
                        </div>
                      </>
                    )}

                    {/* ── Checkbox options ── */}
                    {q.type === 'checkbox' && (
                      <div className="mc-checkbox-opts">
                        <div className="mc-q-label">Options</div>
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} className="mc-opt-row">
                            <input className="mc-input mc-input--opt" value={opt} onChange={e => updateCheckboxOpt(i, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                            <button className="mc-icon-btn mc-icon-btn--delete" onClick={() => removeCheckboxOpt(i, oi)}>✕</button>
                          </div>
                        ))}
                        <button className="mc-add-opt-btn" onClick={() => addCheckboxOption(i)}>＋ Add Option</button>
                      </div>
                    )}
                  </div>
                ))}

                {editData.questions.length > 0 && (
                  <button className="mc-add-btn mc-add-btn--bottom" onClick={addQuestion}>＋ Add Another Question</button>
                )}
                <div ref={questionsEndRef} />
              </div>
            )}

            {/* ════════════════════════════════
                TAB: SCORING GUIDE
            ════════════════════════════════ */}
            {activeTab === 'scoring' && (
              <div className="mc-tab-body">
                <div className="mc-section-header">
                  <span>Scoring Criteria & Rating Descriptions</span>
                  <button className="mc-add-btn" onClick={addCriterion}>＋ Add Criterion</button>
                </div>
                <p className="mc-hint">Each criterion has a name, weight, and descriptions for ratings 1–5.</p>

                {editData.scoringCriteria.length === 0 && (
                  <div className="mc-empty-hint">No scoring criteria yet. Click "＋ Add Criterion" to begin.</div>
                )}

                {editData.scoringCriteria.map((sc, i) => (
                  <div key={i} className="mc-criterion-card">
                    <div className="mc-criterion-header">
                      <span className="mc-criterion-num">Criterion #{i + 1}</span>
                      <button className="mc-icon-btn mc-icon-btn--delete" onClick={() => removeCriterion(i)}>✕ Remove</button>
                    </div>

                    <div className="mc-criterion-row">
                      <div className="mc-criterion-field">
                        <label className="mc-q-label">Criterion Name</label>
                        <input
                          className="mc-input"
                          value={sc.criterionName}
                          onChange={e => updateCriterion(i, 'criterionName', e.target.value)}
                          placeholder="e.g. Schedule adherence Rating (Weight: 15)"
                        />
                      </div>
                      <div className="mc-criterion-weight">
                        <label className="mc-q-label">Weight</label>
                        <input
                          className="mc-input"
                          type="number"
                          min="0" max="100"
                          value={sc.weight}
                          onChange={e => updateCriterion(i, 'weight', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="mc-ratings-grid">
                      {[5, 4, 3, 2, 1].map(r => (
                        <div key={r} className={`mc-rating-row mc-rating-row--${r}`}>
                          <span className="mc-rating-badge">{r}</span>
                          <input
                            className="mc-input"
                            value={sc.descriptions[r] || ''}
                            onChange={e => updateCriterionDesc(i, r, e.target.value)}
                            placeholder={`Description for rating ${r}…`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {editData.scoringCriteria.length > 0 && (
                  <>
                    <div className="mc-weight-total">
                      Total Weight: <strong>{editData.scoringCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0)}</strong>
                      {editData.scoringCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) !== 100 && (
                        <span className="mc-weight-warn"> ⚠️ Should total 100</span>
                      )}
                    </div>
                    <button className="mc-add-btn mc-add-btn--bottom" onClick={addCriterion}>＋ Add Another Criterion</button>
                  </>
                )}
                <div ref={criteriaEndRef} />
              </div>
            )}

            {/* ════════════════════════════════
                TAB: DESCRIPTION
            ════════════════════════════════ */}
            {activeTab === 'description' && (
              <div className="mc-tab-body">
                <div className="mc-section-header">
                  <span>Award Description Lines</span>
                  <button className="mc-add-btn" onClick={addDescLine}>＋ Add Line</button>
                </div>
                <p className="mc-hint">Each line is rendered as a paragraph in the nomination form. Lines starting with "Award Description:", "Applicable to all divisions:", or "Note:" are highlighted.</p>

                {editData.description.map((line, i) => (
                  <div key={i} className="mc-desc-row">
                    <span className="mc-desc-num">{i + 1}</span>
                    <input
                      className="mc-input mc-input--desc"
                      value={line}
                      onChange={e => updateDescLine(i, e.target.value)}
                      placeholder="Description line…"
                    />
                    <button className="mc-icon-btn mc-icon-btn--delete" onClick={() => removeDescLine(i)}>✕</button>
                  </div>
                ))}

                {editData.description.length > 0 && (
                  <>
                    <div className="mc-desc-preview">
                      <div className="mc-desc-preview-title">Preview</div>
                      {editData.description.filter(l => l).map((line, i) => {
                        const isHighlighted = line.startsWith('Award Description:') || line.startsWith('Applicable to all divisions:') || line.startsWith('Note:');
                        return (
                          <p key={i} style={{
                            fontWeight: isHighlighted ? 'bold' : 'normal',
                            color: line.startsWith('Note:') ? '#ff6b6b' : '#c9c8c8',
                            margin: '0.2em 0'
                          }}>{line}</p>
                        );
                      })}
                    </div>
                    <button className="mc-add-btn mc-add-btn--bottom" onClick={addDescLine}>＋ Add Another Line</button>
                  </>
                )}
                <div ref={descEndRef} />
              </div>
            )}

            {/* ════════════════════════════════
                TAB: SETTINGS
            ════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="mc-tab-body">
                <div className="mc-section-header"><span>Eligibility & Settings</span></div>

                <div className="mc-settings-block">
                  <label className="mc-settings-label">Who can nominate for this award?</label>
                  <p className="mc-hint">Check all designations that are eligible to submit this nomination.</p>
                  <div className="mc-desig-chips">
                    {DESIGNATIONS.map(d => (
                      <button
                        key={d}
                        className={`mc-desig-chip ${(editData.eligibleDesignations || []).includes(d) ? 'mc-desig-chip--on' : ''}`}
                        onClick={() => toggleDesig(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="mc-hint" style={{ marginTop: '0.5rem' }}>
                    Leave all unchecked to allow any logged-in user.
                  </p>
                </div>

                <div className="mc-settings-block">
                  <label className="mc-settings-label">Award Status</label>
                  <div className="mc-toggle-row">
                    <button
                      className={`mc-big-toggle ${editData.isActive ? 'mc-big-toggle--on' : 'mc-big-toggle--off'}`}
                      onClick={() => setEditData(p => ({ ...p, isActive: !p.isActive }))}
                    >
                      {editData.isActive ? '🟢 Active — visible in nomination form' : '🔴 Inactive — hidden from nomination form'}
                    </button>
                  </div>
                </div>

                {activeAwardId !== '__new__' && (
                  <div className="mc-settings-block mc-settings-block--danger">
                    <label className="mc-settings-label">Danger Zone</label>
                    <button
                      className="mc-delete-award-btn"
                      onClick={() => deleteAward(activeAwardId, editData.awardName)}
                    >
                      🗑️ Delete This Award Permanently
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Save bar ── */}
            <div className="mc-save-bar">
              <button className="mc-cancel-btn" onClick={() => { setActiveAwardId(null); setEditData(null); }}>Cancel</button>
              <button className="mc-save-btn mc-save-btn--lg" onClick={saveAward} disabled={saving}>
                {saving ? '⏳ Saving…' : '💾 Save Award'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageClient;
