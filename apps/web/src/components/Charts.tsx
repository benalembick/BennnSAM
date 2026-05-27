import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { currency } from '../lib/format';

const palette = ['#0891b2', '#0f766e', '#4f46e5', '#16a34a', '#d97706', '#e11d48', '#64748b'];
const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  color: '#0f172a',
  fontSize: '12px'
};
const axisTick = { fill: '#64748b', fontSize: 11, fontWeight: 600 };

export function SpendChart({ data }: { data: Array<{ vendor: string; spend: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 7)} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="vendor" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} tick={axisTick} width={48} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(value) => currency.format(Number(value))} />
          <Bar dataKey="spend" name="Monthly spend" radius={[5, 5, 0, 0]} isAnimationActive={false}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UsageChart({ data }: { data: Array<{ category: string; active: number; total: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} tick={axisTick} width={48} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
          <Legend iconType="circle" wrapperStyle={{ color: '#475569', fontSize: 12, fontWeight: 600, paddingTop: 12 }} />
          <Line type="monotone" dataKey="total" name="Total minutes" stroke="#94a3b8" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="active" name="Active minutes" stroke="#0891b2" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AssistantChart({ rows }: { rows: Array<Record<string, string | number | boolean | null>> }) {
  const data = rows.slice(0, 6).map((row, index) => {
    const label = String(row.application ?? row.app ?? row.user ?? row.finding ?? `Item ${index + 1}`);
    const numeric = Object.values(row).find((value) => typeof value === 'number') as number | undefined;
    return { label: label.slice(0, 22), value: numeric ?? index + 1 };
  });

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={88} innerRadius={42} paddingAngle={3} isAnimationActive={false}>
            {data.map((_entry, index) => (
              <Cell key={`assistant-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
