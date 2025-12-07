import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { RegistryItem } from '../types';

interface StatsProps {
  items: RegistryItem[];
}

const Stats: React.FC<StatsProps> = ({ items }) => {
  // Compute category data
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [items]);

  // Compute timeline data
  const timelineData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) return [{name: 'Today', value: 0}];
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [items]);

  const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#059669'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 text-white text-xs p-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/30">
          <p className="font-bold mb-1 font-mono text-emerald-400">{label}</p>
          <p className="text-slate-300">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight font-mono">System_Analytics</h1>
          <p className="text-lg text-slate-400">Real-time performance metrics and knowledge distribution.</p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                </div>
                <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider font-mono">Total Items</h3>
                <p className="text-4xl font-bold text-white mt-2">{items.length}</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                     <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </div>
                <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider font-mono">Categories</h3>
                <p className="text-4xl font-bold text-emerald-400 mt-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{categoryData.length}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900 to-black p-6 rounded-2xl shadow-lg border border-emerald-500/30 flex flex-col justify-between h-32 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <h3 className="text-emerald-100 font-medium text-sm uppercase tracking-wider font-mono relative z-10">System Status</h3>
                <div className="flex items-center gap-2 mt-2 relative z-10">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></span>
                    <p className="text-2xl font-bold text-emerald-50">Operational</p>
                </div>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/10 h-[28rem]">
                <h3 className="text-lg font-bold text-slate-200 mb-6 font-mono">Distribution Protocol</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-slate-400">{value}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/10 h-[28rem]">
                <h3 className="text-lg font-bold text-slate-200 mb-6 font-mono">Activity Log</h3>
                 <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                        data={timelineData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar 
                            dataKey="value" 
                            fill="#10b981" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40} 
                            activeBar={{ fill: '#34d399', filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.5))' }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;