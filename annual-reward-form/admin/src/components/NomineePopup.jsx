import React, { useState } from "react";
import PropTypes from "prop-types";
import "./NomineePopup.css";

const NomineePopup = ({ nominee, onClose, onApprove, isAlreadyApproved, isAlreadyRejected }) => {
  const [error, setError] = useState(null);

  const initials = nominee.name?.split(" ").map(n => n[0]).join("").toUpperCase();

  const handleBottomApproveClick = () => {
    const confirmApprove = window.confirm(`Are you sure you want to approve ${nominee.name} for the ${nominee.awardType}?`);
    if (confirmApprove) {
      onApprove(nominee);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="popup-title">Nomination Profile Review</h2>

        {/* PROFILE HEADER: Selected Row Identity */}
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

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="dismiss-error">×</button>
          </div>
        )}

        {/* CONTAINER: Iterates safely over one or multiple nominations for this award row */}
        <div className="popup-scroll-container">
          <div className="scroll-container-header">
            <h4>📋 Nominator Submission Details</h4>
          </div>
          
          {nominee.nominations.map((nomination, index) => {
            const rawAnswers = nomination.answers || [];
            
            // Justifications: exclude rating questions entirely from display
            const summaryJustifications = rawAnswers.filter(ans =>
              !String(ans.answer || "").match(/^\d/) &&
              !String(ans.question || "").match(/rating/i)
            );
            
            // Score Grid references (Answers starting with numbers 1-5)
            // const weightMatrixGrids = rawAnswers.filter(ans => String(ans.answer || "").match(/^\d/));

            return (
              <div className="nomination-card" key={index}>
                <div className="nomination-card-meta">
                  <div className="meta-left">
                    <span className="nomination-index-tag">Form #{index + 1}</span>
                    <p><strong>Nominator:</strong> {nomination.nominatorName || "Anonymous"} <span className="nominator-dept">({nomination.nominatorDept || "N/A"})</span></p>
                  </div>
                  <div className="meta-right">
                    <p className="nomination-date">📅 {new Date(nomination.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* BLOCK 1: PERFORMANCE JUSTIFICATIONS */}
                <div className="qa-section block-justification">
                  <h5 className="section-block-title">📝 Narrative Justifications & Comments</h5>
                  <ul className="qa-list">
                    {summaryJustifications.length > 0 ? (
                      summaryJustifications.map((ans) => (
                        <li key={ans.question} className="qa-item justification-item">
                          <p className="qa-question">💡 {ans.question}</p>
                          <div className="qa-answer-text-box">
                            {ans.answer || 'No narrative justification response provided.'}
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="empty-block-text">No text justifications recorded for this nomination entry.</p>
                    )}
                  </ul>
                </div>

                {/* BLOCK 2: SCORING WEIGHT MATRIX GRIDS */}
                
                {/* <div className="qa-section block-matrix-scores">
                  <h5 className="section-block-title">📊 Metric Performance Evaluation</h5>
                  <ul className="qa-list">
                    {weightMatrixGrids.length > 0 ? (
                      weightMatrixGrids.map((ans) => {
                        const rawAnswer = String(ans.answer || "");
                        // Stored answers look like "5 - Delivered on time, within budget..."
                        // Pull out the rating number AND the selected option's description text.
                        const ratingWithDescription = rawAnswer.match(/^(\d)\s*-\s*(.*)$/s);
                        const ratingNumber = ratingWithDescription
                          ? ratingWithDescription[1]
                          : (rawAnswer.match(/^\d/)?.[0] || "N/A");
                        const ratingDescription = ratingWithDescription ? ratingWithDescription[2].trim() : "";

                        return (
                          <li key={ans.question} className="qa-item justification-item">
                            <p className="qa-question">📊 {ans.question}</p>
                            <div className="qa-answer-text-box">
                              {ratingNumber}{ratingDescription && ` — ${ratingDescription}`}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <p className="empty-block-text">No metric performance scores evaluated for this nomination entry.</p>
                    )}
                  </ul>
                </div> */}
               
              </div>
            );
          })}
        </div>

        {/* BOTTOM POPUP APPROVAL ACTIONS FOOTER */}
        <div className="popup-actions-footer">
          {isAlreadyApproved && (
            <div className="status-banner banner-approved">
              ✓ This nominee selection has been officially approved for this award category.
            </div>
          )}
          {isAlreadyRejected && (
            <div className="status-banner banner-rejected">
              ✗ This nominee selection has been officially rejected for this award category.
            </div>
          )}
          {!isAlreadyApproved && !isAlreadyRejected && (
            <div className="footer-button-group">
              <button className="popup-dismiss-btn" onClick={onClose}>
                Close View
              </button>
              <button className="popup-confirm-approve-btn" onClick={handleBottomApproveClick}>
                Confirm Nomination Approval
              </button>
            </div>
          )}
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
    nominations: PropTypes.arrayOf(
      PropTypes.shape({
        awardType: PropTypes.string,
        createdAt: PropTypes.string,
        nominatorName: PropTypes.string,
        nominatorDept: PropTypes.string,
        answers: PropTypes.arrayOf(
          PropTypes.shape({
            question: PropTypes.string,
            answer: PropTypes.string
          })
        )
      })
    ).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  isAlreadyApproved: PropTypes.bool.isRequired,
  isAlreadyRejected: PropTypes.bool.isRequired
};

export default NomineePopup;