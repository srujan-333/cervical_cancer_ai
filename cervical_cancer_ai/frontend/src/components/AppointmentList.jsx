import React, { useEffect, useState } from "react";
import { Trash2, Calendar, Clock } from "lucide-react";

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);

  // Load data on mount
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("appointments")) || [];
    setAppointments(data);
  }, []);

  // ✅ Delete function: Updates state and storage SILENTLY (No black boxes)
  const deleteAppointment = (id) => {
    // Filter by ID (or index if you don't have IDs)
    const updated = appointments.filter((_, index) => index !== id);
    setAppointments(updated);
    localStorage.setItem("appointments", JSON.stringify(updated));
  };

  if (appointments.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-slate-400 font-medium text-sm italic"></p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((a, i) => (
        <div
          key={i}
          className="group flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-pink-200 transition-all shadow-sm"
        >
          <div className="space-y-1">
            {/* High visibility text for the Doctor's name */}
            <p className="text-slate-900 font-black text-sm leading-tight">
              {a.doctor}
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                <Calendar size={10} className="text-pink-500" /> {a.date}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                <Clock size={10} className="text-pink-500" /> {a.time}
              </span>
            </div>
          </div>

          {/* Delete Button - Silent Action */}
          <button
            onClick={() => deleteAppointment(i)}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Remove Appointment"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AppointmentList;