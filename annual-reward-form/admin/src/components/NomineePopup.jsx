import React, { useRef } from "react";
import PropTypes from "prop-types";
import html2pdf from "html2pdf.js";
import "./NomineePopup.css";

const NomineePopup = ({ nominee, onClose, onStatusUpdate }) => {
  const pdfPrintAreaRef = useRef(null);

  const initials = nominee.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const formattedMonthYear = `${currentYear - 1}-${currentYear}`;

  const handleDownloadAll = () => {
    const element = pdfPrintAreaRef.current;
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${nominee.name.replace(/\s+/g, "_")}_Nomination_Summary.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, logging: false, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      // MODE: USE STANDARD CSS RULES WITHOUT AGGRESSIVE ALL-BLOCK AVOIDING
      pagebreak: { mode: ["css", "legacy"] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {/* MODAL HEADER */}
        <div className="popup-header">
          <h3 className="popup-title">Nominee Details</h3>
          <div className="divider"></div>
        </div>

        {/* NOMINEE SUMMARY CARD (UI View) */}
        <div className="nominee-header">
          <div className="nominee-avatar">{initials}</div>
          <div className="nominee-info">
            <h3>{nominee.name}</h3>
            <p className="nominee-designation">
              {nominee.designation} —{" "}
              <span className="nominee-division">
                {nominee.division?.toUpperCase()}
              </span>
            </p>
            <div className="nominee-award-badge">
              🎯 Target Award: <strong>{nominee.awardType || "N/A"}</strong>
            </div>
          </div>
          <div className="nominee-count-badge">
            <span className="count-number">{nominee.count}</span>
            <span className="count-label">
              {nominee.count === 1 ? "Submission" : "Submissions"}
            </span>
          </div>
        </div>

        {/* TOP ACTION BAR */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
          <button
            type="button"
            className="popup-confirm-approve-btn"
            onClick={handleDownloadAll}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            📥 Export PDF Summary
          </button>
        </div>

        {/* MODAL SCROLL CONTAINER */}
        <div className="popup-scroll-container">
          <div className="scroll-container-header">
            <h4>Submission Details</h4>
          </div>

          <div className="nominations-container">
            {nominee.nominations.map((nomination, index) => {
              const rawAnswers = nomination.answers || [];
              const summaryJustifications = rawAnswers.filter(
                (ans) =>
                  !String(ans.answer || "").match(/^\d/) &&
                  !String(ans.question || "").match(/rating/i)
              );

              const isApproved = nomination.status === "approved";
              const isRejected = nomination.status === "rejected";

              return (
                <div className="nomination-card" key={nomination._id || index}>
                  <div className="nomination-card-meta">
                    <div className="meta-left">
                      <span className="nomination-index-tag">Form #{index + 1}</span>
                      <p>
                        <strong>Nominator:</strong>{" "}
                        {nomination.nominatorName || "Anonymous"}{" "}
                        <span className="nominator-dept">
                          ({nomination.nominatorDept || "N/A"})
                        </span>
                      </p>
                    </div>
                    <div className="meta-right">
                      <p className="nomination-date">
                        📅 {new Date(nomination.createdAt).toLocaleDateString()}
                      </p>
                      <div>
                        {isApproved && <span className="banner-approved" style={{ padding: "4px 8px" }}>Approved</span>}
                        {isRejected && <span className="banner-rejected" style={{ padding: "4px 8px" }}>Rejected</span>}
                        {!isApproved && !isRejected && <span className="designation">Pending</span>}
                      </div>
                    </div>
                  </div>

                  <div className="qa-section">
                    <h5 className="section-title">Justifications & Comments</h5>
                    <div className="qa-list">
                      {summaryJustifications.length > 0 ? (
                        summaryJustifications.map((ans, i) => (
                          <div key={i} className="qa-item">
                            <div className="question">
                              <span className="q-number">Q</span>
                              <p>{ans.question}</p>
                            </div>
                            <div className="qa-answer-text-box">
                              <p className="qa-answer-paragraph">
                                {ans.answer || "No response provided."}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-responses">
                          No text justifications recorded for this nomination entry.
                        </p>
                      )}
                    </div>
                  </div>

                  {!isApproved && !isRejected && (
                    <div
                      className="card-action-footer"
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        marginTop: "15px",
                        paddingTop: "15px",
                        borderTop: "1px dashed var(--fog)",
                      }}
                    >
                      <button
                        className="popup-dismiss-btn"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Reject this submission from ${nomination.nominatorName || "Anonymous"}?`
                            )
                          ) {
                            onStatusUpdate(nomination._id, "rejected", nominee.name, nominee.awardType);
                          }
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="popup-confirm-approve-btn"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Approve this submission from ${nomination.nominatorName || "Anonymous"}?`
                            )
                          ) {
                            onStatusUpdate(nomination._id, "approved", nominee.name, nominee.awardType);
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
        </div>

        <div className="popup-actions-footer">
          <div className="footer-button-group">
            <button className="popup-dismiss-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HIDDEN PDF PRINT TEMPLATE
         ========================================================================= */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          ref={pdfPrintAreaRef}
          style={{
            padding: "20px",
            color: "#333",
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#ffffff",
            width: "800px",
          }}
        >
          {/* PDF MAIN HEADER */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              borderBottom: "3px double #007bff",
              paddingBottom: "10px",
            }}
          >
            <h1 style={{ margin: "0 0 5px 0", fontSize: "1.8rem", color: "#007bff" }}>
              Nomination Summary
            </h1>
            <p style={{ margin: 0, color: "#555", fontWeight: "bold" }}>
              Year Cycle: {formattedMonthYear}
            </p>
          </div>

          {/* GENERAL PROFILE METRICS */}
          <h3
            style={{
              borderBottom: "1px solid #ddd",
              paddingBottom: "5px",
              color: "#007bff",
              fontSize: "1.1rem",
              marginTop: "15px",
              marginBottom: "10px",
            }}
          >
            General Profile Metrics
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
              fontSize: "0.9rem",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "6px", fontWeight: "bold", width: "22%" }}>Award Type:</td>
                <td style={{ padding: "6px", width: "28%" }}>{nominee.awardType || "N/A"}</td>
                <td style={{ padding: "6px", fontWeight: "bold", width: "22%" }}>Export Date:</td>
                <td style={{ padding: "6px", width: "28%" }}>{new Date().toISOString().split("T")[0]}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px", fontWeight: "bold" }}>Nominee Name:</td>
                <td style={{ padding: "6px" }}>{nominee.name}</td>
                <td style={{ padding: "6px", fontWeight: "bold" }}>Total Submissions:</td>
                <td style={{ padding: "6px" }}>{nominee.count}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px", fontWeight: "bold" }}>Role & Dept:</td>
                <td style={{ padding: "6px" }} colSpan={3}>
                  {nominee.designation} [{nominee.division?.toUpperCase()}]
                </td>
              </tr>
            </tbody>
          </table>

          {/* INDIVIDUAL SUBMISSIONS SECTION */}
          <h3
            style={{
              borderBottom: "1px solid #ddd",
              paddingBottom: "5px",
              color: "#007bff",
              fontSize: "1.1rem",
              marginTop: "20px",
              marginBottom: "15px",
            }}
          >
            Performance Summaries & Custom Responses
          </h3>

          {nominee.nominations.map((nomination, subIndex) => {
            const rawAnswers = nomination.answers || [];
            const summaryJustifications = rawAnswers.filter(
              (ans) =>
                !String(ans.answer || "").match(/^\d/) &&
                !String(ans.question || "").match(/rating/i)
            );

            return (
              <div
                key={nomination._id || subIndex}
                style={{
                  marginBottom: "20px",
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  // REMOVED pageBreakInside: "avoid" HERE SO FORM STARTS ON PAGE 1 IMMEDIATELY
                }}
              >
                {/* NOMINATOR META HEADER */}
                <div
                  style={{
                    backgroundColor: "#f0f4f8",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pageBreakInside: "avoid",
                    breakInside: "avoid",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "bold", color: "#007bff", fontSize: "0.95rem" }}>
                      Form #{subIndex + 1}
                    </span>
                    <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
                    <strong style={{ fontSize: "0.9rem" }}>Nominator:</strong>{" "}
                    <span style={{ fontSize: "0.9rem" }}>
                      {nomination.nominatorName || "Anonymous"} ({nomination.nominatorDept || "N/A"})
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#555" }}>
                    📅 {new Date(nomination.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* RESPONSES FOR THIS FORM */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {summaryJustifications.length > 0 ? (
                    summaryJustifications.map((ans, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px",
                          borderLeft: "3px solid #6c757d",
                          // PREVENT INDIVIDUAL QUESTION/ANSWER BOX FROM BREAKING IN HALF
                          pageBreakInside: "avoid",
                          breakInside: "avoid",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: "bold",
                            margin: "0 0 5px 0",
                            fontSize: "0.9rem",
                            color: "#444",
                          }}
                        >
                          {ans.question}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "#111",
                            lineHeight: "1.4",
                          }}
                        >
                          {ans.answer || <i style={{ color: "#888" }}>No Response Provided</i>}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontStyle: "italic", fontSize: "0.85rem", color: "#777", margin: 0 }}>
                      No text responses recorded for this entry.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
    nominations: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
};

export default NomineePopup;