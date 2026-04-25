import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, MessageSquare, X } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import AppointmentList from '@/components/AppointmentList';
import DoctorAppointmentBooking from '@/components/DoctorAppointmentBooking';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [activeTab, setActiveTab] = useState('chat');

  const sidebarVariants = {
    open: { x: 0, opacity: 1, width: '400px' },
    closed: { x: '100%', opacity: 0, width: '0px' }
  };

  return (
    <>
      {/* Overlay for small screens */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}

      <motion.div
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed right-0 top-0 h-screen bg-white border-l border-slate-100 shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header & Tabs */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Medical Hub</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                activeTab === 'chat' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare size={16} /> Assistant
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                activeTab === 'appointments' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={16} /> Schedule
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <ChatInterface />
              </motion.div>
            ) : (
              <motion.div key="appts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
                <DoctorAppointmentBooking />
                <div className="border-t border-slate-100 pt-4">
                  <AppointmentList />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 border-r-0 p-3 rounded-l-2xl shadow-xl text-pink-600 hover:bg-pink-50 transition-all z-40"
        >
          <ChevronLeft size={24} />
        </button>
      )}
    </>
  );
};

export default Sidebar;