import React, { useRef } from 'react';
import { Download, Activity, CheckCircle, AlertCircle, Info, FileText } from 'lucide-react';

export default function RightSection({ results }) {
  const reportRef = useRef();

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
        <Activity className="mb-4 opacity-20 animate-pulse" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Analysis...</p>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch("http://localhost:8000/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellType: results.cellType || "N/A",
          imageConfidence: results.imageConfidence || 0,
          clinicalScore: results.clinicalScore || 0,
          finalRisk: results.finalRisk || results.final_risk || "LOW"
        })
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Clinical_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // FIX: getTheme must be defined BEFORE it is called
  const getTheme = () => {
    const risk = (results.finalRisk || results.final_risk || "LOW").toUpperCase();

    if (risk === "HIGH") {
      return {
        label: "HIGH RISK",
        bg: "bg-red-50 border-red-200",
        text: "text-red-600",
        icon: <AlertCircle className="text-red-500" size={32} />,
        msg: "Abnormalities detected. Immediate consultation required."
      };
    }
    if (risk === "MEDIUM") {
      return {
        label: "MEDIUM RISK",
        bg: "bg-orange-50 border-orange-200",
        text: "text-orange-600",
        icon: <Info className="text-orange-500" size={32} />,
        msg: "Borderline cells detected. Regular monitoring advised."
      };
    }
    return {
      label: "LOW RISK",
      bg: "bg-green-50 border-green-200",
      text: "text-green-600",
      icon: <CheckCircle className="text-green-500" size={32} />,
      msg: "Normal healthy cells detected."
    };
  };

  const theme = getTheme();

  return (
    <div className="space-y-6">
      <div ref={reportRef} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Clinical Report</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              AI Neural Engine • {new Date().toLocaleDateString()}
            </p>
          </div>
          <FileText className="text-pink-500" size={28} />
        </div>

        <div className="space-y-4">
          <MetricItem label="Cell Category" value={results.cellType || "Detected"} />

          <div className="grid grid-cols-2 gap-4">
            <MetricItem
              label="Image Score"
              value={results.imageConfidence ? results.imageConfidence.toString().substring(0, 8) : "0.000"}
            />
            <MetricItem
              label="Cell Score"
              value={results.clinicalScore ? results.clinicalScore.toString().substring(0, 8) : "0.000"}
              isHighlight
            />
          </div>

          <div className={`mt-8 p-10 rounded-3xl border-2 text-center transition-all duration-500 ${theme.bg}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Final Assessment
            </p>
            <h2 className={`text-6xl font-black mb-4 tracking-tighter ${theme.text}`}>
              {theme.label}
            </h2>
            <div className="flex flex-col items-center gap-3">
              {theme.icon}
              <p className={`text-sm font-bold leading-relaxed max-w-[200px] mx-auto ${theme.text}`}>
                {theme.msg}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownloadPDF}
        className="w-full group flex items-center justify-center gap-3 py-5 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black transition-all shadow-xl active:scale-[0.98]"
      >
        <Download size={20} className="group-hover:translate-y-1 transition-transform text-cyan-400" />
        Download Diagnosis PDF
      </button>
    </div>
  );
}

const MetricItem = ({ label, value, isHighlight }) => (
  <div className="flex flex-col p-5 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <span className={`text-sm font-black truncate ${isHighlight ? 'text-pink-600' : 'text-slate-900'}`}>
      {value}
    </span>
  </div>
);