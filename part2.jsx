                  {selectedDomain ? (
                    <div>
                      <button onClick={() => setSelectedDomain(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 group">
                        <Icon.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sections
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'concept' ? conceptDomains : problemDomains)
                          .find(d => d.id === selectedDomain)?.subDomains.map(sub => (
                          <button key={sub.id} onClick={() => navigate(`${activeTab === 'concept' ? '/assessment' : '/problem-assessment'}?domain=${selectedDomain}&subtopic=${sub.id}`)}
                            className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all text-left group">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                  <Icon.BookOpen className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-bold uppercase py-1 px-2 rounded-md bg-slate-800 text-slate-400">{sub.difficulty}</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">{sub.title}</h4>
                            <p className="text-xs text-slate-500">Personalized pathway ready.</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(activeTab === 'concept' ? conceptDomains : problemDomains).map(domain => {
                        const style = colorMap[domain.color] || colorMap.blue;
                        return (
                          <button key={domain.id} onClick={() => handleSelection(domain.id)}
                            className={`p-6 rounded-2xl border ${style.border} ${style.bg} ${style.hover} transition-all text-left relative group overflow-hidden`}>
                            <div className="relative z-10">
                              <div className={`w-12 h-12 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center mb-6`}>
                                 {activeTab === 'concept' ? <Icon.BookOpen className={`w-6 h-6 ${style.icon}`} /> : <Icon.Code className={`w-6 h-6 ${style.icon}`} />}
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{domain.title}</h3>
                              <p className="text-sm text-slate-400 mb-6 leading-relaxed">{domain.description}</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                                 EXPLORE <Icon.ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'exam' && (
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="mb-10 text-center">
                      <h1 className="text-4xl font-black text-white mb-4">Interview Simulator</h1>
                      <p className="text-slate-400">Adaptive mock interviews tailored to your target company.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {examDomains.map(exam => (
                         <button key={exam.id} onClick={() => handleSelection(exam.id)}
                           className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all text-left relative group">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                               <Icon.Award className="w-8 h-8" />
                            </div>
                            <span className="absolute top-8 right-8 text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{exam.badge}</span>
                            <h3 className="text-2xl font-bold text-white mb-4">{exam.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">{exam.description}</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                               START SIMULATION <Icon.ChevronRight className="w-3 h-3" />
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
              )}

               {activeTab === 'settings' && (
                  <div className="max-w-4xl mx-auto py-10 space-y-12">
                     <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">System Settings</h1>
                        <p className="text-slate-400 font-medium">Configure your AI workspace behavior and appearance.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Appearance Card */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                              <Icon.Settings className={`w-4 h-4 ${currentTheme.accent}`} />
                              Appearance
                           </h3>
                           
                           <div className="space-y-8">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Workspace Theme</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button 
                                      onClick={() => setTheme('glass')}
                                      className={`p-4 rounded-2xl border transition-all text-left group ${theme === 'glass' ? `${currentTheme.bg} ${currentTheme.border} border-opacity-100` : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                    >
                                       <div className="text-sm font-bold text-white mb-1">Cyber Glass</div>
                                       <div className="text-[10px] text-slate-500">Translucent & Vibrant</div>
                                    </button>
                                    <button 
                                      onClick={() => setTheme('dark')}
                                      className={`p-4 rounded-2xl border transition-all text-left group ${theme === 'dark' ? 'bg-slate-800 border-white/40' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                    >
                                       <div className="text-sm font-bold text-white mb-1">Deep Dark</div>
                                       <div className="text-[10px] text-slate-500">Solid & High Contrast</div>
                                    </button>
                                 </div>
                              </div>

                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Accent Color</label>
                                 <div className="flex gap-4">
                                    {['blue', 'cyan', 'rose', 'amber'].map(color => (
                                       <button 
                                          key={color}
                                          onClick={() => updateAccent(color)}
                                          className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                                             ${color === 'blue' ? 'bg-blue-500 shadow-blue-500/20' : color === 'cyan' ? 'bg-cyan-500 shadow-cyan-500/20' : color === 'rose' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'}
                                             ${accentColor === color ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                       >
                                          {accentColor === color && <Icon.CheckCircle className="w-5 h-5 text-white" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* AI Behavior Card */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                              <Icon.Agent className={`w-4 h-4 ${currentTheme.accent}`} />
                              AI Assistant Settings
                           </h3>
                           <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">High Contrast Mode</div>
                                    <div className="text-[10px] text-slate-500">Boost visibility for charts</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-1 w-3 h-3 bg-slate-500 rounded-full" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Reduced Motion</div>
                                    <div className="text-[10px] text-slate-500">Simplify UI animations</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-1 w-3 h-3 bg-slate-500 rounded-full" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Adaptive Learning</div>
                                    <div className="text-[10px] text-slate-500">AI adjusts difficulty based on performance</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Personalized Feedback</div>
                                    <div className="text-[10px] text-slate-500">AI provides tailored insights and suggestions</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                 </div>
                              </div>
                              <button className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all ${currentTheme.accent}`}>
                                 Reset Progress Data
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast System */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 px-8 py-5 rounded-2xl shadow-3xl min-w-[320px]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Icon.Cpu className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase text-blue-500 mb-1">Alert</div>
                <div className="text-sm font-bold text-white">{notification}</div>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white"><Icon.LogOut className="w-4 h-4 rotate-45" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Agent Activity Trace Widget */}
      <div className="fixed bottom-8 left-80 z-60 flex flex-col items-end pointer-events-none">
         <AnimatePresence>
            {activeTab !== 'settings' && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="pointer-events-auto"
               >
                  <div className={`bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-3xl transition-all duration-500 pointer-events-auto
                      ${isTraceMinimized ? 'w-48 h-12 flex items-center p-3 rounded-full cursor-pointer hover:border-blue-500/50' : 'w-80 h-auto'}`}
                      onClick={() => isTraceMinimized && setIsTraceMinimized(false)}>
                      <div className="flex items-center justify-between pointer-events-none w-full">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${currentTheme.bar}`} />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Agent Analysis</span>
                         </div>
                         <button 
                            className="pointer-events-auto text-slate-600 hover:text-white transition-colors"
                            onClick={(e) => {
                               e.stopPropagation();
                               setIsTraceMinimized(!isTraceMinimized);
                            }}
                         >
                            {isTraceMinimized ? <Icon.ChevronRight className="w-4 h-4" /> : <Icon.ChevronDown className="w-4 h-4" />}
                         </button>
                      </div>
                      
                      {!isTraceMinimized && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="mt-4 space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                               {[
                                 { agent: "Coordinator", msg: "Optimizing learning path...", time: "now" },
                                 { agent: "Tutor", msg: "Generating adaptive challenges...", time: "2s ago" },
                                 { agent: "Memory", msg: "Uplinking session vectors...", time: "5s ago" }
                               ].map((log, i) => (
                                  <div key={i} className="flex gap-3">
                                     <div className="flex flex-col items-center gap-1">
                                        <div className={`w-1 h-full rounded-full ${i === 0 ? currentTheme.bar : 'bg-slate-800'}`} />
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[9px] font-bold text-white uppercase">{log.agent}</span>
                                           <span className="text-[8px] text-slate-600 font-mono">{log.time}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium leading-relaxed">{log.msg}</div>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                               <div className="flex -space-x-2">
                                  {[1, 2, 3].map(i => (
                                     <div key={i} className={`w-6 h-6 rounded-full border-2 border-slate-900 ${i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-purple-500' : 'bg-cyan-500'} flex items-center justify-center text-[8px] font-bold text-white`}>
                                        {i === 1 ? 'C' : i === 2 ? 'T' : 'E'}
                                     </div>
                                  ))}
                               </div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">3 Agents active</span>
                            </div>
                         </div>
                      )}
                   </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
