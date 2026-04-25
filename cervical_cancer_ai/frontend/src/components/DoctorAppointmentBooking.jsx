import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Phone, Trash2, User, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DOCTORS = [
  "Dr. Sarah Johnson (Oncologist)",
  "Dr. Michael Chen (Gynecologist)",
  "Dr. Emily Davis (Radiologist)",
  "Dr. Robert Wilson (GP)"
];

const DoctorAppointmentBooking = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    doctor: DOCTORS[0],
    date: '',
    time: '',
    phone: '',
  });

  // Get today's date in YYYY-MM-DD format to disable past dates
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("appointments");
      if (savedData) setAppointments(JSON.parse(savedData));
    } catch (err) {
      setAppointments([]);
    }
  }, []);

  const updateStorage = (newList) => {
    setAppointments(newList);
    localStorage.setItem("appointments", JSON.stringify(newList));
  };

  const deleteAppointment = (id) => {
    const updated = appointments.filter((a) => a.id !== id);
    updateStorage(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate Date (Must not be older than today)
    if (formData.date < today) {
      setError("Please select a future date.");
      return;
    }

    // 2. Validate Indian Phone Number
    // Must be 10 digits and start with 6, 7, 8, or 9
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(formData.phone)) {
      setError("Enter a valid 10-digit Indian number (starts with 6-9).");
      return;
    }

    // 3. Convert time to Indian Format (12-hour AM/PM) if needed
    // The native time input returns 24h format; we can store it or format it here
    const [hours, minutes] = formData.time.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;

    const newAppointment = { 
      ...formData, 
      time: formattedTime, // Store in Indian format
      id: Date.now() 
    };

    updateStorage([...appointments, newAppointment]);
    setFormData({ doctor: DOCTORS[0], date: '', time: '', phone: '' });
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 font-sans">
      <div className="p-4 border-b border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Specialist Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialist</label>
            <select
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none text-sm"
            >
              {DOCTORS.map(doc => <option key={doc} value={doc}>{doc}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date Input - Restricted to Today+ */}
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
               <input
                type="date"
                min={today}
                value={formData.date}
                required
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none"
              />
            </div>
            {/* Time Input */}
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time (IST)</label>
               <input
                type="time"
                value={formData.time}
                required
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none"
              />
            </div>
          </div>

          {/* Indian Phone Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">+91</span>
              <input
                type="text"
                maxLength="10"
                
                value={formData.phone}
                required
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none"
              />
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase ml-1"
              >
                <AlertCircle size={12} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black h-12 rounded-xl shadow-lg shadow-pink-100 transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> Confirm Booking
          </Button>
        </form>
      </div>

      {/* Schedule List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upcoming Schedule (IST)</h4>
        
        <AnimatePresence initial={false}>
          {appointments.length === 0 ? (
            <div className="py-10 text-center text-slate-300 text-xs italic">No active appointments</div>
          ) : (
            appointments.map((a) => (
              <motion.div 
                key={a.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-pink-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">{a.doctor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-bold text-slate-500">{a.date}</p>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <p className="text-[10px] font-extrabold text-pink-600">{a.time}</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteAppointment(a.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DoctorAppointmentBooking;