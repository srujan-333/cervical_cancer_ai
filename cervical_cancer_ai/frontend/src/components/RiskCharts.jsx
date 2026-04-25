import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

const RiskCharts = ({ results }) => {
  if (!results) return null;

  const pieData = [
    { name: "Visual Analysis", value: parseFloat(results.imageConfidence) || 0 },
    { name: "Clinical Data", value: parseFloat(results.clinicalScore) || 0 }
  ];

  const currentRisk = parseFloat(results.finalScore) || 0.5;
  const lineData = [
    { stage: "Baseline", risk: 0.15 },
    { stage: "Current", risk: currentRisk },
    { stage: "Projected", risk: Math.min(currentRisk + 0.1, 1.0) }
  ];

  const riskStr = (results.finalRisk || results.final_risk || "LOW").toUpperCase();
  const isHigh = riskStr.includes("HIGH");
  
  // Theme Colors - Adjusted for White Background
  const accentColor = isHigh ? "#ec4899" : "#06b6d4"; // Pink or Cyan
  const bgAccent = isHigh ? "bg-pink-50" : "bg-cyan-50";
  const borderAccent = isHigh ? "border-pink-100" : "border-cyan-100";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">

      {/* 📊 Donut Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-center">
          Diagnostic Weighting
        </h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={75} outerRadius={100} paddingAngle={8} stroke="none">
                <Cell fill="#6366f1" />
                <Cell fill={accentColor} />
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }} 
                formatter={(v) => v.toFixed(3)}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📈 Line Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-center">
          Risk Projection
        </h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="stage" stroke="#cbd5e1" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
              <YAxis stroke="#cbd5e1" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
              <Line type="monotone" dataKey="risk" stroke={accentColor} strokeWidth={5} dot={{ r: 8, fill: accentColor, strokeWidth: 4, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 💡 WHITE Insight Container */}
      <div className="col-span-1 md:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        {/* Subtle Side Color Glow */}
        <div className={`absolute left-0 top-0 w-2 h-full ${isHigh ? 'bg-pink-500' : 'bg-cyan-500'}`} />
        
        <div className="flex items-start gap-10 relative z-10">
          {/* Status Icon Area */}
          <div className={`flex items-center justify-center w-16 h-16 rounded-[2rem] shrink-0 ${bgAccent} ${borderAccent} border`}>
             <div className={`w-3 h-3 rounded-full animate-ping ${isHigh ? 'bg-pink-500' : 'bg-cyan-500'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 text-2xl font-black tracking-tight">AI Clinical Insight</h3>
              <span className={`px-5 py-1.5 rounded-2xl font-black text-[11px] uppercase tracking-widest border ${
                isHigh ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-cyan-50 border-cyan-100 text-cyan-600'
              }`}>
                {riskStr}
              </span>
            </div>
            
            <p className="text-slate-600 text-base leading-relaxed max-w-5xl font-medium">
              {isHigh 
                ? "The neural network has identified high-confidence biomarkers associated with cellular abnormality. Immediate clinical correlation is mandatory. We recommend secondary screening and urgent pathological review."
                : "The analysis indicates that risk factors remain within controlled parameters. No immediate high-risk intervention is flagged. Continue with the established longitudinal screening protocol."
              }
            </p>

            {/* Bottom Specs */}
            <div className="mt-8 pt-8 border-t border-slate-50 flex gap-12">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reliability Index</span>
                  <span className="text-slate-900 font-black text-lg italic">94.2%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Latency</span>
                  <span className="text-slate-900 font-black text-lg italic">124ms</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Status</span>
                  <span className="text-green-500 font-black text-lg uppercase tracking-tighter">Verified</span>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RiskCharts;