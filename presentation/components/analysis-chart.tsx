"use client";

import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";
import type { DashboardChart } from "@/data/dashboard";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const palette = ["#97225a", "#ee5744", "#199861", "#ffb81c", "#4d4d4f", "#231f20"];
const negativeToPositive: Array<[number, string]> = [[0, "#ee5744"], [0.5, "#ffc84e"], [1, "#199861"]];
const trendColors: Record<string, string> = {
  "Delivery rescheduling": "#ffb81c",
  "Price transparency": "#199861",
  "Subscription cancellation": "#97225a",
};

const value = (row: DashboardChart["data"][number], key: string) => row[key];
const numberValue = (row: DashboardChart["data"][number], key: string) => Number(value(row, key));
const textValue = (row: DashboardChart["data"][number], key: string) => String(value(row, key));
const bold = (label: string) => `<b>${label}</b>`;
const boldCategories = (categories: string[]) => ({
  ticktext: categories.map(bold),
  tickvals: categories,
});

function chartData(chart: DashboardChart): Data[] {
  if (chart.id === "customer-themes") {
    return [{
      type: "bar",
      orientation: "h",
      x: chart.data.map((row) => numberValue(row, "tickets")),
      y: chart.data.map((row) => textValue(row, "theme")),
      marker: {
        color: chart.data.map((row) => numberValue(row, "average_sentiment")),
        colorscale: negativeToPositive,
        cmin: -1,
        cmax: 1,
        colorbar: { title: { text: bold("Average Sentiment") }, thickness: 12 },
      },
      hovertemplate: "<b>Theme</b>: %{y}<br><b>Ticket Amount</b>: %{x}<br><b>Average Sentiment Score</b>: %{marker.color:.2f}<extra></extra>",
    }];
  }

  if (chart.id === "theme-trends") {
    const themes = [...new Set(chart.data.map((row) => textValue(row, "theme")))];

    return themes.map((theme, index) => {
      const rows = chart.data.filter((row) => textValue(row, "theme") === theme);

      return {
        type: "scatter",
        mode: "lines+markers",
        name: bold(theme),
        x: rows.map((row) => textValue(row, "ticket_date")),
        y: rows.map((row) => numberValue(row, "share")),
        line: { color: trendColors[theme] ?? palette[index % palette.length], width: 2.5 },
        marker: { size: 6 },
        hovertemplate: `<b>Theme</b>: ${theme}<br><b>Ticket Date</b>: %{x}<br><b>Theme Share</b>: %{y:.2%}<extra></extra>`,
      };
    });
  }

  if (chart.id === "theme-churn") {
    return [{
      type: "scatter",
      mode: "text+markers",
      x: chart.data.map((row) => numberValue(row, "average_sentiment")),
      y: chart.data.map((row) => numberValue(row, "churn_rate")),
      text: chart.data.map((row) => bold(textValue(row, "label_theme"))),
      textposition: "middle center",
      textfont: { color: "#231f20", size: 13 },
      marker: {
        size: chart.data.map((row) => numberValue(row, "tickets")),
        sizemode: "area",
        sizeref: 0.05,
        color: palette[0],
        opacity: 0.72,
        line: { color: "#ffffff", width: 1.5 },
      },
      customdata: chart.data.map((row) => [textValue(row, "theme"), numberValue(row, "tickets")]),
      hovertemplate: "<b>Theme</b>: %{customdata[0]}<br><b>Average Sentiment Score</b>: %{x:.2f}<br><b>Churn Rate</b>: %{y:.2%}<br><b>Tickets</b>: %{customdata[1]}<extra></extra>",
    }];
  }

  if (chart.id === "resolution-time") {
    return [{
      type: "scatter",
      mode: "text+markers",
      x: chart.data.map((row) => numberValue(row, "median_resolution_hours")),
      y: chart.data.map((row) => textValue(row, "theme")),
      text: chart.data.map((row) => bold(textValue(row, "label_theme"))),
      textposition: "middle left",
      textfont: { color: "#231f20", size: 13 },
      marker: {
        size: chart.data.map((row) => numberValue(row, "tickets")),
        sizemode: "area",
        sizeref: 0.07,
        color: chart.data.map((row) => numberValue(row, "average_sentiment")),
        colorscale: negativeToPositive,
        cmin: -1,
        cmax: 1,
        colorbar: { title: { text: bold("Average Sentiment") }, thickness: 12 },
        line: { color: "#ffffff", width: 1.5 },
      },
      customdata: chart.data.map((row) => numberValue(row, "tickets")),
      hovertemplate: "<b>Theme</b>: %{y}<br><b>Median Resolution Hours</b>: %{x:.2f}<br><b>Average Sentiment Score</b>: %{marker.color:.2f}<br><b>Tickets</b>: %{customdata}<extra></extra>",
    }];
  }

  if (chart.id === "repeat-contact") {
    return [{
      type: "scatter",
      mode: "text+markers",
      x: chart.data.map((row) => numberValue(row, "average_customer_messages")),
      y: chart.data.map((row) => numberValue(row, "negative_message_share")),
      text: chart.data.map((row) => bold(textValue(row, "label_theme"))),
      textposition: "middle center",
      textfont: { color: "#231f20", size: 13 },
      marker: {
        size: chart.data.map((row) => numberValue(row, "tickets")),
        sizemode: "area",
        sizeref: 0.05,
        color: palette[1],
        opacity: 0.72,
        line: { color: "#ffffff", width: 1.5 },
      },
      customdata: chart.data.map((row) => [textValue(row, "theme"), numberValue(row, "tickets")]),
      hovertemplate: "<b>Theme</b>: %{customdata[0]}<br><b>Average Customer Messages</b>: %{x:.2f}<br><b>Negative Message Share</b>: %{y:.2%}<br><b>Tickets</b>: %{customdata[1]}<extra></extra>",
    }];
  }

  return [{
    type: "bar",
    orientation: "h",
    x: chart.data.map((row) => numberValue(row, "low_csat_rate")),
    y: chart.data.map((row) => textValue(row, "theme")),
    marker: { color: palette[1] },
    customdata: chart.data.map((row) => numberValue(row, "rated_tickets")),
    hovertemplate: "<b>Theme</b>: %{y}<br><b>Low CSAT Rate</b>: %{x:.2%}<br><b>Rated Tickets</b>: %{customdata}<extra></extra>",
  }];
}

function chartLayout(chart: DashboardChart): Partial<Layout> {
  const base: Partial<Layout> = {
    autosize: true,
    font: { color: "#231f20", family: 'Inter, "Avenir Next", "Segoe UI", sans-serif' },
    hoverlabel: { bgcolor: "#231f20", font: { color: "#ffffff" } },
    margin: { t: 30, r: 80, b: 65, l: chart.id === "resolution-time" ? 190 : 80 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    showlegend: chart.id === "theme-trends",
    legend: { orientation: "h", y: -0.22 },
    xaxis: { gridcolor: "#ece9e7", linecolor: "#d8d2cf", zerolinecolor: "#d8d2cf" },
    yaxis: { gridcolor: "#ece9e7", linecolor: "#d8d2cf", zerolinecolor: "#d8d2cf" },
  };

  if (chart.id === "customer-themes") {
    const categories = chart.data.map((row) => textValue(row, "theme"));
    return { ...base, margin: { t: 30, r: 120, b: 55, l: 190 }, xaxis: { ...base.xaxis, title: { text: bold("Ticket Amount") } }, yaxis: { ...base.yaxis, ...boldCategories(categories), categoryorder: "array", categoryarray: categories } };
  }

  if (chart.id === "theme-trends") return { ...base, yaxis: { ...base.yaxis, tickformat: ".0%", title: { text: bold("Theme Share") } }, xaxis: { ...base.xaxis, title: { text: bold("Ticket Date") } } };
  if (chart.id === "theme-churn") return { ...base, yaxis: { ...base.yaxis, tickformat: ".0%", title: { text: bold("Churn Rate") } }, xaxis: { ...base.xaxis, title: { text: bold("Average Sentiment Score") } } };
  if (chart.id === "resolution-time") {
    const categories = chart.data.map((row) => textValue(row, "theme"));
    return { ...base, xaxis: { ...base.xaxis, title: { text: bold("Median Resolution Hours") } }, yaxis: { ...base.yaxis, ...boldCategories(categories), categoryorder: "array", categoryarray: categories } };
  }
  if (chart.id === "repeat-contact") return { ...base, yaxis: { ...base.yaxis, tickformat: ".0%", title: { text: bold("Negative Message Share") } }, xaxis: { ...base.xaxis, title: { text: bold("Average Customer Messages") } } };
  const categories = chart.data.map((row) => textValue(row, "theme"));
  return { ...base, margin: { t: 30, r: 55, b: 55, l: 170 }, xaxis: { ...base.xaxis, tickformat: ".0%", title: { text: bold("Low CSAT Rate") } }, yaxis: { ...base.yaxis, ...boldCategories(categories), categoryorder: "array", categoryarray: categories } };
}

export function AnalysisChart({ chart }: { chart: DashboardChart }) {
  return (
    <div className="analysis-chart">
      <Plot
        data={chartData(chart)}
        layout={chartLayout(chart)}
        config={{ displaylogo: false, responsive: true }}
        style={{ height: "min(62vw, 580px)", minHeight: "400px", width: "100%" }}
        useResizeHandler
      />
    </div>
  );
}
