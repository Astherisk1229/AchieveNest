import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Award, PlusCircle, CheckCircle, Clock, FileText, Download, QrCode, Search, Globe, Trophy, ChevronRight, ChevronLeft, Sparkles, UploadCloud } from 'lucide-react';

const defaultCategories = [
  { id: 'cat-1', name: 'Academics' },
  { id: 'cat-2', name: 'Leadership' },
  { id: 'cat-3', name: 'Sports' },
  { id: 'cat-4', name: 'Community Extension' }
];

const defaultAchievements = [
  {
    id: 'ach-1',
    user_id: 'u-101',
    user_name: 'Maria Santos',
    user_type: 'student',
    category_id: 'cat-1',
    category_name: 'Academics',
    title: "Dean's Lister - First Semester AY 2025-2026",
    event_name: '12th SOCCSKSARGEN IT Summit',
    issuer_organization: 'NDMU CITE / DOST Region XII',
    academic_year: 'AY 2025-2026',
    semester: '1st Semester',
    scope_level: 'Regional (Region XII)',
    rank_conferred: "Dean's Lister",
    description: 'Awarded for achieving academic excellence.',
    date_achieved: '2025-12-15',
    verification_status: 'approved',
    verifier_name: 'Dr. Maria Santos',
    verified_at: '2025-12-16',
    document_url: '#'
  },
  {
    id: 'ach-2',
    user_id: 'u-101',
    user_name: 'Maria Santos',
    user_type: 'student',
    category_id: 'cat-2',
    category_name: 'Leadership',
    title: 'Student Council President',
    event_name: 'NDMU Supreme Student Council Election',
    issuer_organization: 'NDMU OSAD / COMELEC',
    academic_year: 'AY 2025-2026',
    semester: '1st Semester',
    scope_level: 'Institutional / Campus-Wide',
    rank_conferred: 'Leadership Officer / Lead',
    description: 'Elected student council president.',
    date_achieved: '2026-01-10',
    verification_status: 'approved',
    verifier_name: 'Prof. Juan Dela Cruz',
    verified_at: '2026-01-11',
    document_url: '#'
  },
  {
    id: 'ach-3',
    user_id: 'u-101',
    user_name: 'Maria Santos',
    user_type: 'student',
    category_id: 'cat-3',
    category_name: 'Sports',
    title: 'Basketball Intramurals Champion',
    event_name: 'NDMU Palaro Intramurals 2026',
    issuer_organization: 'NDMU Athletics Office',
    academic_year: 'AY 2025-2026',
    semester: '2nd Semester',
    scope_level: 'Institutional / Campus-Wide',
    rank_conferred: 'Champion / 1st Place',
    description: 'Champion team captain.',
    date_achieved: '2026-02-14',
    verification_status: 'pending',
    verifier_name: 'Coach Robert Tan',
    verified_at: null,
    document_url: '#'
  }
];

export default function StudentDashboard({ 
  achievements = defaultAchievements, 
  onAddAchievement = () => {}, 
  categories = defaultCategories 
}) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Scope & Rank, 3: Proof
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  
  // Form State
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [academicYear, setAcademicYear] = useState('AY 2025-2026');
  const [semester, setSemester] = useState('1st Semester');
  const [scopeLevel, setScopeLevel] = useState('Regional (Region XII)');
  const [rankConferred, setRankConferred] = useState('Champion / 1st Place');
  const [dateAchieved, setDateAchieved] = useState('');
  const [description, setDescription] = useState('');

  const safeAchievements = Array.isArray(achievements) ? achievements : defaultAchievements;
  const studentAchievements = safeAchievements.filter(a => a.user_type === 'student' || !a.user_type);
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
    const selectedCategoryObj = (categories || defaultCategories).find(c => c.id === categoryId);
    const newAch = {
      id: `ach-${Date.now()}`,
      user_id: 'u-101',
      user_name: 'Maria Santos',
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
    setTitle('');
    setEventName('');
    setIssuer('');
    setDescription('');
  };

  const filtered = studentAchievements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.issuer_organization && item.issuer_organization.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCat === 'All' || item.category_name === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        
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
                  <h1 className="text-xl font-bold text-slate-100">Maria Santos</h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    Active Student
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-mono mt-0.5">ID: 2024-01234 | BS Computer Science (3rd Year)</p>
                <p className="text-xs text-slate-500">College of Engineering, Architecture and Computing (CEAC)</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 cursor-pointer"
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
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">TOPSIS Score Points</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">30 Pts</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl flex items-center space-x-4 border border-slate-800">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Barcode Digital ID</p>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">Verified Active ✓</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-slate-100 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            {['All', 'Academics', 'Leadership', 'Sports', 'Community Extension'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCat === cat 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.category_name}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.verification_status === 'approved' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.verification_status === 'approved' ? 'Verified ✓' : 'Pending Review'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.event_name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{item.issuer_organization}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{item.date_achieved}</span>
                <span className="text-emerald-400 font-medium">{item.scope_level}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
