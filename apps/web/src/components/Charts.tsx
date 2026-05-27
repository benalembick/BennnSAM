import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { currency } from '../lib/format';

const palette = ['#0891b2', '#16a34a', '#f59e0b', '#ef4444', '#2563eb', '#7c3aed', '#64748b'];

export function SpendChart({ data }: { data: Array<{ vendor: string; spend: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 7)} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="vendor" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip formatter={(value) => currency.format(Number(value))} />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]} isAnimationActive={false}>
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
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#64748b" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="active" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
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
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
