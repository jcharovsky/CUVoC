"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  BarChart3,
  ChartNoAxesCombined,
  DoorClosed,
  Clock3,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { dashboardData, type DashboardChart } from "@/data/dashboard";
import { ChatPanel } from "./chat-panel";
import { AnalysisChart } from "./analysis-chart";

const chartIcons = {
  "customer-themes": BarChart3,
  "theme-trends": ChartNoAxesCombined,
  "theme-churn": DoorClosed,
  "resolution-time": Clock3,
  "repeat-contact": MessageSquareText,
  "low-csat": Star,
};

const chartById = (id: DashboardChart["id"]) => dashboardData.charts.find((chart) => chart.id === id)!;
const chartDatum = (chartId: DashboardChart["id"], theme: string) =>
  chartById(chartId).data.find((row) => row.theme === theme)!;

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(new Date(`${startDate}T00:00:00`))} to ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
}

function renderFinding(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function Overview({ coverage, onSelectChart }: { coverage: string; onSelectChart: (chartId: DashboardChart["id"]) => void }) {
  const mealReplacement = chartDatum("customer-themes", "Meal replacement");
  const priceTransparencyTrend = chartById("theme-trends").data.filter((row) => row.theme === "Price transparency").pop()!;
  const subscriptionCancellation = chartDatum("theme-churn", "Subscription cancellation");
  const missedDelivery = chartDatum("resolution-time", "Missed delivery");
  const mealDamage = chartDatum("repeat-contact", "Meal damage");
  const deliveryStatus = chartDatum("low-csat", "Delivery status");
  const cards = [
    { label: "Customer themes", value: `${mealReplacement.tickets} tickets`, detail: "Meal replacement", chartId: "customer-themes" as const },
    { label: "Theme trends", value: `${(Number(priceTransparencyTrend.share) * 100).toFixed(1)}% share`, detail: "Price transparency on May 1", chartId: "theme-trends" as const },
    { label: "Theme churn", value: `${(Number(subscriptionCancellation.churn_rate) * 100).toFixed(1)}%`, detail: "Subscription cancellation", chartId: "theme-churn" as const },
    { label: "Resolution time", value: `${Number(missedDelivery.median_resolution_hours).toFixed(1)}h`, detail: "Missed delivery", chartId: "resolution-time" as const },
    { label: "Repeat contact", value: `${(Number(mealDamage.negative_message_share) * 100).toFixed(1)}% negative`, detail: "Meal damage", chartId: "repeat-contact" as const },
    { label: "Low CSAT", value: `${(Number(deliveryStatus.low_csat_rate) * 100).toFixed(1)}%`, detail: "Delivery status", chartId: "low-csat" as const },
  ];

  return (
    <>
      <section className="page-heading overview-heading">
        <div>
          <span className="eyebrow">CookUnity Voice of Customer</span>
          <h1>Overview</h1>
          <p>Analysis of {dashboardData.coverage.tickets.toLocaleString()} customer support tickets, {coverage}.</p>
        </div>
      </section>
      <section className="overview-grid" aria-label="Essential customer support signals">
        {cards.map((card) => (
          <button className="overview-card" key={card.label} type="button" onClick={() => onSelectChart(card.chartId)}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        ))}
      </section>
    </>
  );
}

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<DashboardChart["id"] | "overview">("overview");

  const selectedChart = selectedChartId === "overview" ? null : chartById(selectedChartId);
  const coverage = formatDateRange(dashboardData.coverage.start_date, dashboardData.coverage.end_date);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Image src="/cookunity-logo.png" alt="CookUnity" width={34} height={34} priority /></span><span>CU<span>VoC</span></span></div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Dashboard views">
          <p className="nav-label">Dashboard</p>
          <button className={`nav-item ${selectedChartId === "overview" ? "active" : ""}`} type="button" onClick={() => { setSelectedChartId("overview"); setSidebarOpen(false); }}><LayoutDashboard size={18} />Overview</button>
          {dashboardData.charts.map((chart) => {
            const Icon = chartIcons[chart.id];

            return (
              <button
                className={`nav-item ${selectedChartId === chart.id ? "active" : ""}`}
                key={chart.id}
                type="button"
                onClick={() => { setSelectedChartId(chart.id); setSidebarOpen(false); }}
              >
                <Icon size={18} />{chart.title}
              </button>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumbs"><span>Dashboard</span><b>/</b><strong>{selectedChart?.title ?? "Overview"}</strong></div>
          <button className="ask-button" type="button" onClick={() => setChatOpen(true)}><Sparkles size={16} />Ask CUVoC</button>
        </header>

        <div className="dashboard-content analysis-dashboard">
          {selectedChart ? (
            <>
              <section className="page-heading chart-heading">
                <div>
                  <span className="eyebrow">CookUnity Voice of Customer</span>
                  <h1>{selectedChart.title}</h1>
                </div>
              </section>

              <section className="panel analysis-chart-panel" aria-label={selectedChart.title}>
                <AnalysisChart chart={selectedChart} />
              </section>

              <section className="findings-panel" aria-labelledby="findings-title">
                <h2 className="findings-title" id="findings-title">Findings</h2>
                <div className="findings-copy">
                  {selectedChart.findings.map((finding) => <p key={finding}>{renderFinding(finding)}</p>)}
                </div>
              </section>
            </>
          ) : <Overview coverage={coverage} onSelectChart={setSelectedChartId} />}
        </div>
      </main>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
