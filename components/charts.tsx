"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const TEAL = "#1a7d9c";
const GOLD = "#c69a34";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 10,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

// 6-month payroll vs invoice trend (mock)
const trend = [
  { m: "Mar", gaji: 452, tagihan: 598 },
  { m: "Apr", gaji: 468, tagihan: 611 },
  { m: "Mei", gaji: 471, tagihan: 623 },
  { m: "Jun", gaji: 480, tagihan: 634 },
  { m: "Jul", gaji: 476, tagihan: 628 },
  { m: "Agu", gaji: 492, tagihan: 650 },
];

export function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={trend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gGaji" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gTagihan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `Rp ${value} jt`} />
        <Area type="monotone" dataKey="tagihan" stroke={GOLD} strokeWidth={2} fill="url(#gTagihan)" name="Tagihan" />
        <Area type="monotone" dataKey="gaji" stroke={TEAL} strokeWidth={2} fill="url(#gGaji)" name="Gaji" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AttendanceDonut({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MiniBar({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="value" fill={TEAL} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
