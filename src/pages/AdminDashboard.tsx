import React, { useState, useEffect, useCallback } from "react";
const BASE_URL = "https://fulz.onrender.com";

type Boost = {
  id: number;
  identificationNumber: string;
  amount: number;
  fee: number;
  paymentStatus: string;
  paymentDate: string | null;
  externalReference: string;
  mpesaReceipt: string | null;
  paid: boolean;
};
const fetchAllBoosts = async (startDate?: string, endDate?: string): Promise<Boost[]> => {
  let url = startDate && endDate
    ? `${BASE_URL}/api/boosts/paid/filter?startDate=${startDate}&endDate=${endDate}`
    : `${BASE_URL}/api/boosts`;  // ← this should already be correct
  
  console.log("Fetching from:", url); // 👈 add this to debug
  const res = await fetch(url);
  console.log("Response status:", res.status); // 👈 and this
  const data = await res.json();
  console.log("Data received:", data); // 👈 and this
  return data;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    COMPLETED: { bg: "#0d2b1a", color: "#22c55e", dot: "#22c55e" },
    PENDING:   { bg: "#2b1f00", color: "#f59e0b", dot: "#f59e0b" },
    FAILED:    { bg: "#2b0d0d", color: "#ef4444", dot: "#ef4444" },
    CANCELLED: { bg: "#1a1a2b", color: "#8b5cf6", dot: "#8b5cf6" },
  };
  const s = map[status?.toUpperCase()] || map.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      display: "inline-flex", alignItems: "center", gap: 5,
      border: `1px solid ${s.color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status || "PENDING"}
    </span>
  );
};

const AdminDashboard: React.FC = () => {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ startDate: "", endDate: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 10;

  const loadData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await fetchAllBoosts(start, end);
      setBoosts(Array.isArray(data) ? data : []);
    } catch {
      setBoosts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(filter.startDate || undefined, filter.endDate || undefined);
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (!filter.startDate || !filter.endDate) return;
    loadData(filter.startDate, filter.endDate);
    setPage(1);
  };

  const clearFilter = () => {
    setFilter({ startDate: "", endDate: "" });
    loadData();
    setPage(1);
  };

  // Derived stats
  const completed = boosts.filter(b => b.paymentStatus === "COMPLETED");
  const pending   = boosts.filter(b => b.paymentStatus === "PENDING");
  const failed    = boosts.filter(b => b.paymentStatus === "FAILED" || b.paymentStatus === "CANCELLED");
  const totalRevenue = completed.reduce((s, b) => s + b.fee, 0);
  const totalApplied = boosts.reduce((s, b) => s + b.amount, 0);

  // Filtered rows
  const filtered = boosts.filter(b => {
    const matchSearch =
      b.identificationNumber?.includes(search) ||
      b.externalReference?.includes(search) ||
      (b.mpesaReceipt || "").includes(search);
    const matchStatus = statusFilter === "ALL" || b.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const conversionRate = boosts.length > 0
    ? ((completed.length / boosts.length) * 100).toFixed(1)
    : "0.0";

  // Simple bar chart data — fee per day (last 7 days)
  const dailyMap: Record<string, number> = {};
  completed.forEach(b => {
    if (b.paymentDate) {
      const day = new Date(b.paymentDate).toLocaleDateString("en-KE", { weekday: "short" });
      dailyMap[day] = (dailyMap[day] || 0) + b.fee;
    }
  });
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const maxBar = Math.max(...days.map(d => dailyMap[d] || 0), 1);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080b10;
      --surface: #0f1419;
      --surface2: #161d27;
      --border: #1e2a38;
      --accent: #00e5ff;
      --accent2: #22c55e;
      --accent3: #f59e0b;
      --text: #e8f0fe;
      --muted: #5a7084;
      --danger: #ef4444;
    }
    html, body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; }

    .admin-root { display: flex; min-height: 100vh; }

    /* SIDEBAR */
    .sidebar {
      width: 230px; background: var(--surface); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
      transition: transform 0.3s ease;
    }
    .sidebar-logo {
      padding: 28px 20px 20px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-logo .logo-mark {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px;
      color: var(--accent); letter-spacing: -0.5px;
    }
    .sidebar-logo .logo-sub { font-size: 10px; color: var(--muted); letter-spacing: 2px; margin-top: 2px; }
    .sidebar-nav { padding: 20px 12px; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;
      font-size: 13px; color: var(--muted); cursor: pointer; margin-bottom: 4px;
      transition: all 0.15s; letter-spacing: 0.5px;
    }
    .nav-item.active { background: #00e5ff12; color: var(--accent); border: 1px solid #00e5ff22; }
    .nav-item:hover:not(.active) { background: var(--surface2); color: var(--text); }
    .nav-icon { font-size: 16px; }
    .sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 10px; color: var(--muted); letter-spacing: 1px; }

    /* MAIN */
    .main-content { margin-left: 230px; flex: 1; padding: 0; min-width: 0; }

    /* TOP BAR */
    .topbar {
      background: var(--surface); border-bottom: 1px solid var(--border);
      padding: 16px 28px; display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .hamburger { display: none; background: none; border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 16px; }
    .page-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; }
    .page-subtitle { font-size: 11px; color: var(--muted); margin-top: 2px; letter-spacing: 1px; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .refresh-btn {
      background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px;
      padding: 8px 14px; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'DM Mono', monospace;
      display: flex; align-items: center; gap: 6px;
    }
    .refresh-btn:hover { border-color: var(--accent); color: var(--accent); }
    .refresh-btn.spinning svg { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .live-badge { background: #0d2b1a; border: 1px solid #22c55e44; color: #22c55e; border-radius: 20px; padding: 4px 12px; font-size: 11px; display: flex; align-items: center; gap: 6px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

    /* CONTENT */
    .content { padding: 24px 28px; }

    /* STAT CARDS */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 20px; position: relative; overflow: hidden; transition: border-color 0.2s;
    }
    .stat-card:hover { border-color: #2e3f52; }
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    }
    .stat-card.revenue::before { background: linear-gradient(90deg, var(--accent), transparent); }
    .stat-card.applications::before { background: linear-gradient(90deg, #8b5cf6, transparent); }
    .stat-card.conversion::before { background: linear-gradient(90deg, var(--accent2), transparent); }
    .stat-card.pending-card::before { background: linear-gradient(90deg, var(--accent3), transparent); }
    .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .stat-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }
    .stat-value.cyan { color: var(--accent); }
    .stat-value.purple { color: #8b5cf6; }
    .stat-value.green { color: var(--accent2); }
    .stat-value.amber { color: var(--accent3); }
    .stat-sub { font-size: 11px; color: var(--muted); margin-top: 6px; }
    .stat-icon { position: absolute; right: 16px; top: 16px; font-size: 22px; opacity: 0.15; }

    /* CHART + MINI CARDS ROW */
    .middle-row { display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-bottom: 24px; }

    .chart-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px;
    }
    .chart-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .chart-sub { font-size: 11px; color: var(--muted); margin-bottom: 20px; }
    .bar-row { display: flex; align-items: flex-end; gap: 10px; height: 120px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
    .bar-fill {
      width: 100%; border-radius: 4px 4px 0 0; min-height: 4px;
      background: linear-gradient(180deg, var(--accent), #006080);
      transition: height 0.3s ease; position: relative;
    }
    .bar-fill:hover::after {
      content: attr(data-val); position: absolute; top: -24px; left: 50%; transform: translateX(-50%);
      background: var(--surface2); color: var(--accent); font-size: 10px; padding: 2px 6px; border-radius: 4px;
      white-space: nowrap; border: 1px solid var(--border);
    }
    .bar-day { font-size: 10px; color: var(--muted); }

    .breakdown-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .breakdown-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .breakdown-item { display: flex; flex-direction: column; gap: 4px; }
    .breakdown-label { display: flex; justify-content: space-between; font-size: 11px; }
    .breakdown-bar-bg { background: var(--surface2); border-radius: 4px; height: 6px; overflow: hidden; }
    .breakdown-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }

    /* FILTERS */
    .filter-row {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .filter-label { font-size: 11px; color: var(--muted); letter-spacing: 1px; white-space: nowrap; }
    .filter-input {
      background: var(--bg); border: 1px solid var(--border); color: var(--text);
      border-radius: 8px; padding: 8px 12px; font-size: 12px; font-family: 'DM Mono', monospace;
      outline: none; transition: border-color 0.15s;
    }
    .filter-input:focus { border-color: var(--accent); }
    .filter-btn {
      background: var(--accent); color: #000; border: none; border-radius: 8px;
      padding: 8px 16px; font-size: 12px; cursor: pointer; font-weight: 700; font-family: 'DM Mono', monospace;
      transition: opacity 0.15s;
    }
    .filter-btn:hover { opacity: 0.85; }
    .filter-btn.clear { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }
    .filter-btn.clear:hover { color: var(--text); border-color: var(--text); }
    .search-wrap { position: relative; flex: 1; min-width: 180px; }
    .search-wrap input { width: 100%; padding-left: 34px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--muted); }
    .status-select {
      background: var(--bg); border: 1px solid var(--border); color: var(--text);
      border-radius: 8px; padding: 8px 12px; font-size: 12px; font-family: 'DM Mono', monospace;
      outline: none; cursor: pointer;
    }

    /* TABLE */
    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .table-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .table-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
    .table-count { font-size: 11px; color: var(--muted); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th { font-size: 10px; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); background: var(--bg); font-weight: 500; }
    td { padding: 13px 16px; font-size: 12px; border-bottom: 1px solid #1a2330; white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #0f1e2e55; }
    .mono { font-family: 'DM Mono', monospace; color: var(--muted); font-size: 11px; }
    .amount-val { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text); }
    .fee-val { color: var(--accent2); font-weight: 500; }

    /* PAGINATION */
    .pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 8px; }
    .page-info { font-size: 11px; color: var(--muted); }
    .page-btns { display: flex; gap: 6px; }
    .page-btn {
      background: var(--surface2); border: 1px solid var(--border); color: var(--muted);
      border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'DM Mono', monospace;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-btn.active { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 700; }

    /* EMPTY / LOADING */
    .empty-row td { text-align: center; color: var(--muted); padding: 48px; font-size: 13px; }
    .loading-overlay { display: flex; align-items: center; justify-content: center; padding: 80px; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }

    /* SIDEBAR OVERLAY */
    .sidebar-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }

    /* RESPONSIVE */
    @media (max-width: 1100px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .middle-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay.open { display: block; }
      .main-content { margin-left: 0; }
      .hamburger { display: flex; }
      .topbar { padding: 12px 16px; }
      .content { padding: 16px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-value { font-size: 20px; }
      .filter-row { flex-direction: column; align-items: stretch; }
      .filter-input, .status-select, .filter-btn, .search-wrap { width: 100%; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stat-card { padding: 14px; }
      .topbar-right .live-badge { display: none; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="admin-root">

        {/* SIDEBAR OVERLAY (mobile) */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">⚡ FulizaBoost</div>
            <div className="logo-sub">ADMIN CONSOLE</div>
          </div>
          <nav className="sidebar-nav">
            {[
              { icon: "▦", label: "Dashboard", active: true },
              { icon: "◈", label: "All Boosts" },
              { icon: "◉", label: "Payments" },
              { icon: "◎", label: "Reports" },
              { icon: "⊙", label: "Settings" },
            ].map(item => (
              <div key={item.label} className={`nav-item ${item.active ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">v1.0.0 • FulizaBoost</div>
        </aside>

        {/* MAIN */}
        <div className="main-content">

          {/* TOPBAR */}
          <header className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
              <div>
                <div className="page-title">Dashboard</div>
                <div className="page-subtitle">FULIZA BOOST OVERVIEW</div>
              </div>
            </div>
            <div className="topbar-right">
              <div className="live-badge">
                <span className="live-dot" /> LIVE
              </div>
              <button className={`refresh-btn ${refreshing ? "spinning" : ""}`} onClick={handleRefresh}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="content">

            {/* STAT CARDS */}
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value cyan">Ksh {totalRevenue.toLocaleString()}</div>
                <div className="stat-sub">{completed.length} completed payments</div>
              </div>
              <div className="stat-card applications">
                <div className="stat-icon">📋</div>
                <div className="stat-label">Total Applications</div>
                <div className="stat-value purple">{boosts.length}</div>
                <div className="stat-sub">Ksh {totalApplied.toLocaleString()} requested</div>
              </div>
              <div className="stat-card conversion">
                <div className="stat-icon">📈</div>
                <div className="stat-label">Conversion Rate</div>
                <div className="stat-value green">{conversionRate}%</div>
                <div className="stat-sub">{failed.length} failed / cancelled</div>
              </div>
              <div className="stat-card pending-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-label">Pending</div>
                <div className="stat-value amber">{pending.length}</div>
                <div className="stat-sub">Awaiting payment</div>
              </div>
            </div>

            {/* CHART + BREAKDOWN */}
            <div className="middle-row">
              <div className="chart-card">
                <div className="chart-title">Revenue by Day</div>
                <div className="chart-sub">Fees collected (completed payments)</div>
                <div className="bar-row">
                  {days.map(day => {
                    const val = dailyMap[day] || 0;
                    const pct = (val / maxBar) * 100;
                    return (
                      <div key={day} className="bar-col">
                        <div
                          className="bar-fill"
                          data-val={`Ksh ${val.toLocaleString()}`}
                          style={{ height: `${Math.max(pct, val > 0 ? 8 : 4)}%`, opacity: val > 0 ? 1 : 0.15 }}
                        />
                        <span className="bar-day">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="breakdown-card">
                <div className="breakdown-title">Status Breakdown</div>
                {[
                  { label: "Completed", count: completed.length, color: "#22c55e" },
                  { label: "Pending",   count: pending.length,   color: "#f59e0b" },
                  { label: "Failed",    count: boosts.filter(b => b.paymentStatus === "FAILED").length, color: "#ef4444" },
                  { label: "Cancelled", count: boosts.filter(b => b.paymentStatus === "CANCELLED").length, color: "#8b5cf6" },
                ].map(item => (
                  <div key={item.label} className="breakdown-item">
                    <div className="breakdown-label">
                      <span style={{ color: item.color }}>{item.label}</span>
                      <span style={{ color: "#5a7084" }}>{item.count} / {boosts.length}</span>
                    </div>
                    <div className="breakdown-bar-bg">
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: boosts.length > 0 ? `${(item.count / boosts.length) * 100}%` : "0%",
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FILTERS */}
            <div className="filter-row">
              <span className="filter-label">FILTER</span>
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input
                  className="filter-input"
                  placeholder="Search ID, reference, receipt..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="status-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <input
                type="date" className="filter-input"
                value={filter.startDate}
                onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))}
              />
              <input
                type="date" className="filter-input"
                value={filter.endDate}
                onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))}
              />
              <button className="filter-btn" onClick={applyFilter}>Apply</button>
              <button className="filter-btn clear" onClick={clearFilter}>Clear</button>
            </div>

            {/* TABLE */}
            <div className="table-card">
              <div className="table-header">
                <div className="table-title">All Boost Applications</div>
                <div className="table-count">{filtered.length} records</div>
              </div>

              {loading ? (
                <div className="loading-overlay"><div className="spinner" /></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ID Number</th>
                        <th>Amount</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                        <th>M-Pesa Receipt</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr className="empty-row">
                          <td colSpan={8}>No records found</td>
                        </tr>
                      ) : paginated.map((b, i) => (
                        <tr key={b.id}>
                          <td className="mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{b.identificationNumber}</td>
                          <td><span className="amount-val">Ksh {b.amount?.toLocaleString()}</span></td>
                          <td><span className="fee-val">Ksh {b.fee}</span></td>
                          <td><StatusBadge status={b.paymentStatus} /></td>
                          <td className="mono">{b.paymentDate ? new Date(b.paymentDate).toLocaleString("en-KE") : "—"}</td>
                          <td className="mono">{b.mpesaReceipt || "—"}</td>
                          <td className="mono" style={{ fontSize: 10 }}>{b.externalReference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION */}
              {!loading && filtered.length > PAGE_SIZE && (
                <div className="pagination">
                  <div className="page-info">
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </div>
                  <div className="page-btns">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return p <= totalPages ? (
                        <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                      ) : null;
                    })}
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                  </div>
                </div>
              )}
            </div>

          </div>{/* /content */}
        </div>{/* /main */}
      </div>
    </>
  );
};

export default AdminDashboard;