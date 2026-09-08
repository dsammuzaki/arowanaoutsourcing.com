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
  LabelList,
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

// Grouped bars: hadir / cuti / alpha per hari
export function WeeklyBars({
  data,
}: {
  data: { day: string; present: number; leave: number; absent: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="present" name="Hadir" stackId="a" fill={TEAL} radius={[0, 0, 0, 0]} />
        <Bar dataKey="leave" name="Cuti" stackId="a" fill={GOLD} />
        <Bar dataKey="absent" name="Alpha" stackId="a" fill="#c0392b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Labeled bars — tren rekrutmen
export function HiringBars({
  data,
}: {
  data: { m: string; hires: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="hires" name="Rekrut" fill={TEAL} fillOpacity={0.85} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="hires" position="top" style={{ fill: TEAL, fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Area — tren payroll (juta Rupiah)
export function PayrollArea({
  data,
}: {
  data: { m: string; net: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `Rp ${v} jt`} />
        <Area type="monotone" dataKey="net" name="Net Pay" stroke={TEAL} strokeWidth={2} fill="url(#gNet)" dot={{ r: 2.5, fill: TEAL }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
