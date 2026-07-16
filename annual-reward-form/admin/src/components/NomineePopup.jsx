import React from "react";
import PropTypes from "prop-types";
import "./NomineePopup.css";

const NomineePopup = ({ nominee, onClose, onStatusUpdate }) => {
  const initials = nominee.name?.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3 className="popup-title">Nominee Details</h3>

        {/* PROFILE HEADER */}
        <div className="nominee-header">
          <div className="nominee-avatar">{initials}</div>
          <div className="nominee-info">
            <h3>{nominee.name}</h3>
            <p className="nominee-designation">{nominee.designation} — <span className="nominee-division">{nominee.division?.toUpperCase()}</span></p>
            <div className="nominee-award-badge">🎯 Target Award: <strong>{nominee.awardType || "N/A"}</strong></div>
          </div>
          <div className="nominee-count-badge">
            <span className="count-number">{nominee.count}</span>
            <span className="count-label">{nominee.count === 1 ? 'Submission' : 'Submissions'}</span>
          </div>
        </div>

        {/* CONTAINER FOR SUBMISSIONS */}
        <div className="popup-scroll-container">
          <div className="scroll-container-header">
            <h4>Submission Details</h4>
          </div>
          
          {nominee.nominations.map((nomination, index) => {
            const rawAnswers = nomination.answers || [];
            const summaryJustifications = rawAnswers.filter(ans =>
              !String(ans.answer || "").match(/^\d/) &&
              !String(ans.question || "").match(/rating/i)
            );

            const isApproved = nomination.status === 'approved';
            const isRejected = nomination.status === 'rejected';

            return (
              <div className="nomination-card" key={nomination._id || index}>
                <div className="nomination-card-meta">
                  <div className="meta-left">
                    <span className="nomination-index-tag">Form #{index + 1}</span>
                    <p><strong>Nominator:</strong> {nomination.nominatorName || "Anonymous"} <span className="nominator-dept">({nomination.nominatorDept || "N/A"})</span></p>
                  </div>
                  <div className="meta-right">
                    <p className="nomination-date">📅 {new Date(nomination.createdAt).toLocaleDateString()}</p>
                    
                    {/* Inline Status Badges inside the Card */}
                    <div className="card-status-container" style={{ marginTop: '8px', textAlign: 'right' }}>
                      {isApproved && <span className="status-approved-badge">Approved</span>}
                      {isRejected && <span className="status-rejected-badge">Rejected</span>}
                      {!isApproved && !isRejected && <span className="status-pending-badge">Pending</span>}
                    </div>
                  </div>
                </div>

                {/* ANSWERS (Take full height dynamically) */}
                <div className="qa-section block-justification">
                  <h5 className="section-block-title">Justifications & Comments</h5>
                  <ul className="qa-list">
                    {summaryJustifications.length > 0 ? (
                      summaryJustifications.map((ans) => (
                        <li key={ans.question} className="qa-item justification-item">
                          <p className="qa-question">💡 {ans.question}</p>
                          <div className="qa-answer-text-box">
                            <p className="qa-answer-paragraph">
                              {ans.answer || 'No narrative justification response provided.'}
                            </p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="empty-block-text">No text justifications recorded for this nomination entry.</p>
                    )}
                  </ul>
                </div>

                {/* INDIVIDUAL SUBMISSION ACTIONS FOOTER */}
                {!isApproved && !isRejected && (
                  <div className="card-action-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--fog)' }}>
                    <button 
                      className="btn btn-danger-outline table-action-btn"
                      onClick={() => {
                        if (window.confirm(`Reject this specific submission from ${nomination.nominatorName || 'Anonymous'}?`)) {
                          onStatusUpdate(nomination._id, 'rejected', nominee.name, nominee.awardType);
                        }
                      }}
                    >
                      Reject
                    </button>
                    <button 
                      className="popup-confirm-approve-btn"
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                      onClick={() => {
                        if (window.confirm(`Approve this specific submission from ${nomination.nominatorName || 'Anonymous'}?`)) {
                          onStatusUpdate(nomination._id, 'approved', nominee.name, nominee.awardType);
                        }
                      }}
                    >
                      Approve 
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* POPUP OVERALL CLOSING BANNER */}
        <div className="popup-actions-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="popup-dismiss-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

NomineePopup.propTypes = {
  nominee: PropTypes.shape({
    name: PropTypes.string.isRequired,
    designation: PropTypes.string.isRequired,
    division: PropTypes.string,
    awardType: PropTypes.string,
    count: PropTypes.number.isRequired,
    nominations: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func.isRequired
};

export default NomineePopup;