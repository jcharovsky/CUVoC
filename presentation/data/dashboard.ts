export type Theme = {
  name: string;
  description: string;
  volume: number;
  share: number;
  change: number;
  csat: number;
  churn: number;
  color: string;
};

export const dashboardData = {
  coverage: "Apr 23 – May 1, 2026",
  metrics: [
    { label: "Conversations", value: "10,000", change: "+8.2%", detail: "vs. prior period", tone: "neutral" },
    { label: "Average CSAT", value: "3.72", change: "−0.18", detail: "vs. prior period", tone: "negative" },
    { label: "Churn risk", value: "6.4%", change: "+1.1 pts", detail: "flagged conversations", tone: "negative" },
    { label: "First response", value: "42m", change: "−7m", detail: "median response time", tone: "positive" },
  ],
  themes: [
    { name: "Delivery experience", description: "Late, missed, or incorrect delivery", volume: 2348, share: 23.5, change: 14.2, csat: 2.8, churn: 9.4, color: "#ee5744" },
    { name: "Meal quality", description: "Taste, freshness, and preparation", volume: 1862, share: 18.6, change: 6.8, csat: 3.2, churn: 7.1, color: "#97225a" },
    { name: "Billing & credits", description: "Charges, refunds, and account credits", volume: 1411, share: 14.1, change: -3.4, csat: 3.5, churn: 5.8, color: "#199861" },
    { name: "Menu & availability", description: "Selection, stock, and dietary needs", volume: 1206, share: 12.1, change: 9.1, csat: 3.9, churn: 4.2, color: "#ffb81c" },
    { name: "Subscription changes", description: "Pauses, skips, and cancellations", volume: 984, share: 9.8, change: -1.8, csat: 3.7, churn: 12.6, color: "#3939d8" },
  ] satisfies Theme[],
  trend: [
    { day: "Apr 23", conversations: 1080, negative: 318 },
    { day: "Apr 24", conversations: 1210, negative: 352 },
    { day: "Apr 25", conversations: 1140, negative: 331 },
    { day: "Apr 26", conversations: 1310, negative: 417 },
    { day: "Apr 27", conversations: 1190, negative: 380 },
    { day: "Apr 28", conversations: 1470, negative: 502 },
    { day: "Apr 29", conversations: 1540, negative: 489 },
    { day: "Apr 30", conversations: 1280, negative: 402 },
    { day: "May 1", conversations: 780, negative: 251 },
  ],
  signals: [
    { title: "Delivery delays are accelerating", detail: "Up 22% over the last three days, concentrated in the Northeast.", tag: "Emerging", tone: "coral" },
    { title: "Cancellation intent follows billing contacts", detail: "Customers mentioning duplicate charges show 2.4× higher churn risk.", tag: "Outcome", tone: "violet" },
    { title: "Fast responses recover satisfaction", detail: "CSAT improves by 0.7 when first response stays below 20 minutes.", tag: "Opportunity", tone: "teal" },
  ],
} as const;
