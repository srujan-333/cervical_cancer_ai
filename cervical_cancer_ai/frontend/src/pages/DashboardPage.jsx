import React, { useState } from "react";
import { Menu } from "lucide-react";
import LeftSection from "@/components/LeftSection";
import RightSection from "@/components/RightSection";
import PredictionForm from "@/components/PredictionForm";
import RiskCharts from "@/components/RiskCharts";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPage = () => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    age: "", 
    sexualPartners: "", 
    firstIntercourse: "", 
    pregnancies: "",
    smokes: "", 
    smokesYears: "",
    hormonalContraceptives: "", 
    hormonalContraceptivesYears: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 overflow-y-auto py-10 px-6">
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-1000">
          
          {/* Header Container - Simplified Typography */}
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 transition-colors">
                <Menu size={22} />
              </button>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                Cervical<span className="text-pink-600">AI</span>
              </h1>
            </div>
            <button onClick={logout} className="px-6 py-3 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 hover:text-red-600 hover:border-red-100 transition-all">
              Sign Out
            </button>
          </div>

          {/* Main Grid: TOP ROWS (Column-Grid) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            
            {/* 1. CONTAINER: Patient Data Input (Wider) */}
            <div className="xl:col-span-7 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                Patient Entry Data
              </h2>
              
              <LeftSection 
                formData={formData} 
                setFormData={setFormData} 
                imagePreview={imagePreview} 
                setImagePreview={setImagePreview} 
                setImageFile={setImageFile} 
              />
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <PredictionForm 
                  formData={formData} 
                  imageFile={imageFile} 
                  setResults={setResults} 
                  setLoading={setLoading} 
                />
              </div>
            </div>

            {/* 2. CONTAINER: Analysis Result Summary (Narrower/Sticky) */}
            <div className="xl:col-span-5 sticky top-6">
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 min-h-[400px]">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">
                  Analysis Summary
                </h2>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-5 text-slate-500 font-bold animate-pulse text-sm">Processing Diagnostics...</p>
                  </div>
                ) : (
                  <RightSection results={results} />
                )}
              </div>
            </div>
          </div>

          {/* 3. NEW CONTAINER: Full-Width Visual Risk Analytics (Generating below) */}
          {results && !loading && (
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Visual Risk Analytics
              </h2>
              <RiskCharts results={results} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;