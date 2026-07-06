
import React, { useState } from "react";
import PropTypes from "prop-types";
import "./NomineePopup.css";


const NomineePopup = ({ nominee, onClose }) => {
  const [error, setError] = useState(null);


  const initials = nominee.name?.split(" ").map(n => n[0]).join("").toUpperCase();


  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="popup-title">Nomination Details</h2>

          <div className="nominee-header">
            <div className="nominee-avatar">{initials}</div>
            <div className="nominee-info">
              <h3>{nominee.name}</h3>
              <p>{nominee.designation}</p>
              <p><strong>Total Nominations:</strong> {nominee.count}</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)} className="dismiss-error">
                ×
              </button>
            </div>
          )}

          {nominee.nominations.map((nomination, index) => (
            <div className="nomination-card" key={nomination.createdAt + '-' + (nomination.awardType || '')}>
              <div className="nomination-header">
                <h4>
                  <span className="nomination-index"><strong>{index + 1}.</strong></span>{" "}
                  Award Category: {nomination.awardType || 'N/A'}
                </h4>
                <p><strong>Year:</strong> {new Date(nomination.createdAt).toLocaleDateString()}</p>
                <p><strong>Nominator:</strong> {nomination.nominatorName} ({nomination.nominatorDept})</p>
              </div>

              <div className="qa-section">
                <h5>Nomination Responses:</h5>
                <ul className="qa-list">
                  {nomination.answers?.length > 0 ? nomination.answers.map((ans) => (
                    <li key={ans.question + '-' + (ans.answer || '')} className="qa-item">
                      <p><strong>Q:</strong> {ans.question}</p>
                      <p><strong>A:</strong> {ans.answer || 'No response provided'}</p>
                    </li>
                  )) : <p>No question responses available</p>}
                </ul>
              </div>

            </div>
          ))}
      </div>

    </div>
  );
};

NomineePopup.propTypes = {
  nominee: PropTypes.shape({
    name: PropTypes.string.isRequired,
    designation: PropTypes.string.isRequired,
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
        ),
        supportingFile: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default NomineePopup;
