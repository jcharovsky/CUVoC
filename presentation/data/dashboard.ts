import dashboardArtifact from "./dashboard.json";

export type ChartDatum = Record<string, string | number | null>;

export type DashboardChart = {
  id:
    | "customer-themes"
    | "theme-trends"
    | "theme-churn"
    | "resolution-time"
    | "repeat-contact"
    | "low-csat";
  title: string;
  kind: "bar" | "line" | "bubble";
  data: ChartDatum[];
  findings: string[];
};

export type DashboardData = {
  coverage: {
    start_date: string;
    end_date: string;
    tickets: number;
  };
  charts: DashboardChart[];
};

export const dashboardData = dashboardArtifact as DashboardData;
