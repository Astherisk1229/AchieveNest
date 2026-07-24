import React, { useState } from 'react';
import { Award, PlusCircle, CheckCircle, Clock, FileText, Download, QrCode, Search, Globe, Trophy, ChevronRight, ChevronLeft, Sparkles, UploadCloud } from 'lucide-react';

export default function StudentDashboard({ achievements, onAddAchievement, categories }) {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Scope & Rank, 3: Proof
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  
  // Form State
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [academicYear, setAcademicYear] = useState('AY 2025-2026');
  const [semester, setSemester] = useState('1st Semester');
  const [scopeLevel, setScopeLevel] = useState('Regional (Region XII)');
  const [rankConferred, setRankConferred] = useState('Champion / 1st Place');
  const [dateAchieved, setDateAchieved] = useState('');
  const [description, setDescription] = useState('');

  const studentAchievements = achievements.filter(a => a.user_type === 'student');
  const approvedCount = studentAchievements.filter(a => a.verification_status === 'approved').length;
  const pendingCount = studentAchievements.filter(a => a.verification_status === 'pending').length;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCategoryObj = categories.find(c => c.id === categoryId);
    const newAch = {
      id: `ach-${Date.now()}`,
      user_id: 'u-101',
      user_name: 'Zahrah Zaheer S. Ahmed',
      user_type: 'student',
      category_id: categoryId,
      category_name: selectedCategoryObj ? selectedCategoryObj.name : 'Academics',
      title,
      event_name: eventName,
      issuer_organization: issuer,
      academic_year: academicYear,
      semester,
      scope_level: scopeLevel,
      rank_conferred: rankConferred,
      description,
      date_achieved: dateAchieved || new Date().toISOString().split('T')[0],
      verification_status: 'pending',
      verifier_name: 'Pending Program Coordinator',
      verified_at: null,
      verifier_remarks: null,
      document_url: '#'
    };
    onAddAchievement(newAch);
    setShowModal(false);
    setCurrentStep(1);
    // Reset Form
    setTitle('');
    setEventName('');
    setIssuer('');
    setDescription('');
  };

  const filtered = studentAchievements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.issuer_organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'All' || item.category_name === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Student Profile Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Student Avatar"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400/50 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Zahrah Zaheer S. Ahmed</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  Active Student
                </span>
              </div>
              <p className="text-sm text-slate-400 font-mono mt-0.5">ID: NDMU-2023-0142 | BS Information Technology (3rd Year)</p>
              <p className="text-xs text-slate-500">College of Engineering, Architecture and Computing (CEAC)</p>
            </div>
          </div>

          <button
            onClick={() => { setShowModal(true); setCurrentStep(1); }}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Submit New Achievement</span>
          </button>
        </div>
      </div>

      {/* Analytics & Barcode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Verified Achievements</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{approvedCount}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Verification</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Event Certificates</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">4 Issued</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <QrCode className="w-4 h-4" /> Digital NDMU ID Barcode
            </span>
            <span className="text-[10px] text-slate-500 font-mono">SCAN READY</span>
          </div>
          <div className="my-2 p-2 bg-white rounded flex flex-col items-center justify-center">
            <div className="h-8 w-full flex items-center justify-between gap-1 px-2">
              <div className="h-full w-1 bg-black"></div>
              <div className="h-full w-2 bg-black"></div>
              <div className="h-full w-0.5 bg-black"></div>
              <div className="h-full w-1.5 bg-black"></div>
              <div className="h-full w-1 bg-black"></div>
              <div className="h-full w-3 bg-black"></div>
              <div className="h-full w-1 bg-black"></div>
              <div className="h-full w-2 bg-black"></div>
              <div className="h-full w-0.5 bg-black"></div>
            </div>
            <p className="text-[10px] text-slate-800 font-mono font-bold mt-1 tracking-widest">NDMU-2023-0142</p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">My Achievement Records</h2>
            <p className="text-xs text-slate-400">View and manage your academic, leadership, and extracurricular submissions.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No achievements found matching your filter criteria.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category_name}
                    </span>
                    {item.scope_level && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {item.scope_level}
                      </span>
                    )}
                    {item.rank_conferred && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> {item.rank_conferred}
                      </span>
                    )}
                    {item.verification_status === 'approved' && (
                      <span className="badge-approved">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {item.verification_status === 'pending' && (
                      <span className="badge-pending">
                        <Clock className="w-3.5 h-3.5" /> Pending Verification
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                    {item.event_name && <span>Event: <strong className="text-slate-300">{item.event_name}</strong></span>}
                    <span>Issuer: <strong className="text-slate-400">{item.issuer_organization}</strong></span>
                    <span>Date: <strong className="text-slate-400">{item.date_achieved}</strong></span>
                  </div>
                </div>

                <button className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-lg border border-slate-700 transition">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Proof</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spacious 3-Step Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-8 border border-slate-700/80 shadow-2xl space-y-6 my-8 transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-100">Submit New Achievement</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Step {currentStep} of 3: {currentStep === 1 ? 'Basic Details' : currentStep === 2 ? 'Scope & Rank' : 'Proof & Summary'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Indicator Bar */}
            <div className="flex items-center justify-between px-2 relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              
              <div className={`relative z-10 flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${currentStep >= 1 ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                <span>1</span>
                <span className="hidden sm:inline">Basic Info</span>
              </div>

              <div className={`relative z-10 flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${currentStep >= 2 ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                <span>2</span>
                <span className="hidden sm:inline">Scope & Rank</span>
              </div>

              <div className={`relative z-10 flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${currentStep === 3 ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                <span>3</span>
                <span className="hidden sm:inline">Proof & Summary</span>
              </div>
            </div>

            {/* STEP 1: BASIC DETAILS */}
            {currentStep === 1 && (
              <form onSubmit={handleNextStep} className="space-y-5 text-xs py-2">
                <div className="space-y-1">
                  <label className="block text-slate-200 font-bold text-sm">Award / Achievement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dean's Lister - First Semester AY 2025-2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-200 font-bold text-sm">Event / Competition Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDMU Intramurals 2025 / 12th SOCCSKSARGEN IT Summit"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-200 font-bold text-sm">Issuing Body / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDMU College of Information Technology Education"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-900/30 flex items-center space-x-2"
                  >
                    <span>Next: Scope & Rank</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: SCOPE & RANKING */}
            {currentStep === 2 && (
              <form onSubmit={handleNextStep} className="space-y-5 text-xs py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Geographic Scope *</label>
                    <select
                      value={scopeLevel}
                      onChange={(e) => setScopeLevel(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Institutional / Campus-Wide">Institutional / Campus-Wide</option>
                      <option value="Local / City Level">Local / City Level</option>
                      <option value="Regional (Region XII)">Regional (Region XII)</option>
                      <option value="National Level">National Level</option>
                      <option value="International Level">International Level</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Rank / Distinction *</label>
                    <select
                      value={rankConferred}
                      onChange={(e) => setRankConferred(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Champion / 1st Place">Champion / 1st Place</option>
                      <option value="2nd Place">2nd Place</option>
                      <option value="3rd Place">3rd Place</option>
                      <option value="Finalist / Runner-Up">Finalist / Runner-Up</option>
                      <option value="Dean's Lister">Dean's Lister</option>
                      <option value="Leadership Officer / Lead">Leadership Officer / Lead</option>
                      <option value="Participant / Special Award">Participant / Special Award</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Date Conferred *</label>
                    <input
                      type="date"
                      required
                      value={dateAchieved}
                      onChange={(e) => setDateAchieved(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Academic Year *</label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="AY 2025-2026">AY 2025-2026</option>
                      <option value="AY 2024-2025">AY 2024-2025</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-200 font-bold text-sm">Semester *</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer Term">Summer Term</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-900/30 flex items-center space-x-2"
                  >
                    <span>Next: Proof & Submit</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PROOF & SUBMIT */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs py-2">
                <div className="space-y-1">
                  <label className="block text-slate-200 font-bold text-sm">Narrative Description</label>
                  <textarea
                    rows="3"
                    placeholder="Brief details about the accomplishment or criteria met..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-slate-100 text-sm outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-200 font-bold text-sm">Supporting Evidence Document (PDF/JPG/PNG) *</label>
                  <div className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-900/40 transition cursor-pointer flex flex-col items-center justify-center space-y-2">
                    <UploadCloud className="w-8 h-8 text-emerald-400" />
                    <p className="text-slate-200 font-bold text-xs">Click or drag certificate attachment here</p>
                    <p className="text-slate-500 text-[11px]">PDF, JPG, PNG up to 5MB</p>
                    <input type="file" required className="hidden" id="file-upload" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-900/30 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Entry</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
