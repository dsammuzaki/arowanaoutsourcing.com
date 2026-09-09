import { NextResponse } from "next/server";
import {
  dashboardKpis,
  weeklyAttendance,
  leaveOverviewData,
  hiringTrend,
  payrollTrendMonthly,
  clientComparison,
} from "@/lib/data";

// GET /api/dashboard — ringkasan untuk dashboard
export async function GET() {
  return NextResponse.json({
    kpis: dashboardKpis,
    clientComparison: clientComparison.map((c) => ({
      clientId: c.client.id,
      name: c.client.name,
      payrollNow: c.payrollNow,
      growth: c.growth,
      headcountNow: c.headcountNow,
    })),
    charts: {
      weeklyAttendance,
      leaveOverview: leaveOverviewData,
      hiringTrend,
      payrollTrend: payrollTrendMonthly,
    },
  });
}
