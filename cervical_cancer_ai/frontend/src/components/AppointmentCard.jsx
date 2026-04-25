import React, { useState, useEffect } from "react";
import { Calendar, Phone, User, Clock, Trash2 } from "lucide-react";

const Appointment = () => {
  const [form, setForm] = useState({
    doctor: "",
    phone: "",
    date: "",
    time: ""
  });

  const [appointments, setAppointments] = useState([]);
  const [phoneError, setPhoneError] = useState("");

  const isValidIndianPhone = (phone) => /^[6-9][0-9]{9}$/.test(phone);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("appointments")) || [];
    const cleaned = data.filter((a) => isValidIndianPhone(a.phone));
    setAppointments(cleaned);
    localStorage.setItem("appointments", JSON.stringify(cleaned));
  }, []);

  const handlePhoneChange = (value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 10) return;
    if (value.length === 1 && !/[6-9]/.test(value)) return;

    setForm({ ...form, phone: value });
    setPhoneError(value.length > 0 && !isValidIndianPhone(value) 
      ? "Use 10 digits starting with 6-9" 
      : "");
  };

  const handleBook = () => {
    if (!form.doctor || !form.phone || !form.date || !form.time) return;
    const newAppointment = { ...form, id: Date.now() };
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    localStorage.setItem("appointments", JSON.stringify(updated));
    setForm({ doctor: "", phone: "", date: "", time: "" });
  };

  const deleteAppointment = (id) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem("appointments", JSON.stringify(updated));
  };

  return (
    <div className="p-5 space-y-6 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Calendar className="text-pink-600" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Schedule Appointment</h2>
      </div>

      {/* Input Fields with High Contrast Text */}
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            placeholder="Doctor Name"
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border text-slate-900 font-semibold outline-none ${
              phoneError ? "border-red-500" : "border-slate-200"
            }`}
          />
        </div>
        {phoneError && <p className="text-red-500 text-xs font-bold mt-1 ml-2">{phoneError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
          />
        </div>

        <button
          onClick={handleBook}
          disabled={!form.doctor || !form.phone || phoneError}
          className="w-full py-4 rounded-xl font-extrabold text-white bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-100 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
        >
          Confirm Booking
        </button>
      </div>

      {/* Appointment List with Visible Labels */}
      <div className="pt-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Upcoming Visits</h3>
        {appointments.length === 0 ? (
          <p className="text-slate-400 text-sm italic text-center py-4">No appointments scheduled</p>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="bg-slate-50 p-4 mb-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <p className="font-bold text-slate-900">{a.doctor}</p>
                <div className="flex items-center gap-3 text-slate-600 text-xs font-bold">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {a.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {a.time}</span>
                </div>
                <p className="text-slate-500 text-[11px] font-medium italic">📞 {a.phone}</p>
              </div>
              <button onClick={() => deleteAppointment(a.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Appointment;