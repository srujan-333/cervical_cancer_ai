import React from "react";
import { Upload, X } from "lucide-react";

const LeftSection = ({ formData, setFormData, imagePreview, setImagePreview, setImageFile }) => {
  
  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const inputFields = [
    ["age", "Age"],
    ["sexualPartners", "Sexual Partners"],
    ["firstIntercourse", "First Intercourse Age"],
    ["pregnancies", "No. of Pregnancies"],
    ["smokes", "Smokes (0/1)"],
    ["smokesYears", "Smokes (Years)"],
    ["hormonalContraceptives", "Contraceptives (0/1)"], // ✅ Added
    ["hormonalContraceptivesYears", "Contraceptives (Years)"] // ✅ Added
  ];

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div 
        className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-8 text-center hover:bg-slate-100 transition-all cursor-pointer relative"
        onClick={() => document.getElementById('fileInput').click()}
      >
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} className="max-h-40 rounded-xl shadow-sm" alt="Preview" />
            <button 
              onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-white p-1 rounded-full border shadow-sm text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-slate-400">
            <Upload className="mx-auto mb-2 text-pink-500" />
            <p className="text-sm font-medium">Click to Upload Imaging</p>
          </div>
        )}
        <input id="fileInput" type="file" className="hidden" onChange={handleImage} />
      </div>

      {/* Input Grid - Fixed for high visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputFields.map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
              type="text"
              value={formData[key] || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all text-sm"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftSection;