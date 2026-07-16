"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { dashboardData, type Theme } from "@/data/dashboard";
import { VolumeChart } from "./volume-chart";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Themes", icon: MessageSquareText },
  { label: "Trends", icon: TrendingUp },
  { label: "Outcomes", icon: Target },
  { label: "Segments", icon: UsersRound },
];

function MetricCard({ metric }: { metric: (typeof dashboardData.metrics)[number] }) {
  const isPositive = metric.tone === "positive";
  const isNegative = metric.tone === "negative";
  return (
    <article className="metric-card">
      <div className="metric-heading"><span>{metric.label}</span><CircleHelp size={15} /></div>
      <strong>{metric.value}</strong>
      <p className={isPositive ? "change positive" : isNegative ? "change negative" : "change"}>
        {metric.change.startsWith("−") ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
        <span>{metric.change}</span> {metric.detail}
      </p>
    </article>
  );
}

function ThemeRow({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`theme-row ${selected ? "selected" : ""}`} onClick={onSelect} type="button">
      <span className="theme-name-cell">
        <i style={{ background: theme.color }} />
        <span><strong>{theme.name}</strong><small>{theme.description}</small></span>
      </span>
      <span><strong>{theme.volume.toLocaleString()}</strong><small>{theme.share}% of total</small></span>
      <span className={theme.change > 0 ? "row-change up" : "row-change down"}>
        {theme.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(theme.change)}%
      </span>
      <span><strong>{theme.csat.toFixed(1)}</strong><small>out of 5</small></span>
      <span><strong>{theme.churn}%</strong><small>churn risk</small></span>
    </button>
  );
}

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("Last 9 days");
  const [query, setQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Delivery experience");

  const themes = useMemo(() => dashboardData.themes.filter((theme) => theme.name.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Image src="/cookunity-logo.png" alt="CookUnity" width={34} height={34} priority /></span><span>CU<span>VoC</span></span></div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ label, icon: Icon }, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={label} type="button"><Icon size={18} />{label}</button>
          ))}
          <p className="nav-label secondary">Tools</p>
          <button className="nav-item" type="button"><Sparkles size={18} />Ask CUVoC<span className="beta">AI</span></button>
          <button className="nav-item" type="button"><SlidersHorizontal size={18} />Data quality</button>
        </nav>
        <div className="sidebar-foot">
          <div className="coverage"><span className="status-dot" /><div><strong>Data is current</strong><small>{dashboardData.coverage}</small></div></div>
          <div className="profile"><span className="avatar">JC</span><div><strong>Juan Charovsky</strong><small>Analysis workspace</small></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumbs"><span>Voice of Customer</span><b>/</b><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <button className="ask-button"><Sparkles size={16} />Ask about the data</button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading">
            <div><span className="eyebrow">Customer intelligence</span><h1>What are customers telling us?</h1><p>A focused view of contact drivers, emerging themes, and the outcomes they influence.</p></div>
            <div className="filters">
              <button className="filter-button"><span className="filter-label">Channel</span>All channels<ChevronDown size={15} /></button>
              <label className="filter-button period-filter"><span className="filter-label">Period</span><Clock3 size={15} /><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 9 days</option><option>Last 7 days</option><option>Last 3 days</option></select><ChevronDown size={15} /></label>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Key metrics">
            {dashboardData.metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
          </section>

          <section className="insight-strip">
            <span className="insight-icon"><Sparkles size={18} /></span>
            <div><span>Top signal</span><strong>Delivery issues now drive nearly 1 in 4 support conversations.</strong><p>Volume rose 14.2%, with lower satisfaction and higher churn risk than the overall baseline.</p></div>
            <button type="button">Explore signal <ArrowUpRight size={15} /></button>
          </section>

          <section className="content-grid">
            <article className="panel trend-panel">
              <div className="panel-heading"><div><span className="section-kicker">Volume over time</span><h2>Conversation trend</h2></div><button className="more-button">Daily<ChevronDown size={15} /></button></div>
              <VolumeChart data={[...dashboardData.trend]} />
            </article>
            <article className="panel signals-panel">
              <div className="panel-heading"><div><span className="section-kicker">Worth attention</span><h2>Signals</h2></div><button className="text-button">View all</button></div>
              <div className="signal-list">
                {dashboardData.signals.map((signal) => (
                  <button className="signal-item" key={signal.title} type="button"><span className={`signal-marker ${signal.tone}`} /><span><small>{signal.tag}</small><strong>{signal.title}</strong><p>{signal.detail}</p></span><ArrowUpRight size={16} /></button>
                ))}
              </div>
            </article>
          </section>

          <section className="panel themes-panel">
            <div className="panel-heading themes-heading"><div><span className="section-kicker">Contact drivers</span><h2>Leading themes</h2><p>Select a theme to inspect it across the dashboard.</p></div><label className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a theme" /></label></div>
            <div className="theme-table">
              <div className="theme-header"><span>Theme</span><span>Volume</span><span>Change</span><span>Avg. CSAT</span><span>Risk</span></div>
              {themes.map((theme) => <ThemeRow theme={theme} key={theme.name} selected={selectedTheme === theme.name} onSelect={() => setSelectedTheme(theme.name)} />)}
              {themes.length === 0 && <div className="empty-state">No themes match “{query}”.</div>}
            </div>
            <button className="table-footer" type="button">View all themes <ArrowUpRight size={15} /></button>
          </section>
          <p className="data-note">Illustrative dashboard data. Final metrics populate from the validated analysis pipeline.</p>
        </div>
      </main>
    </div>
  );
}
