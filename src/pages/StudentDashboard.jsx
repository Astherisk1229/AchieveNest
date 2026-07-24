import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Award, PlusCircle, CheckCircle, Clock, FileText, Download, QrCode, Search, Globe, Trophy, ChevronRight, ChevronLeft, Sparkles, UploadCloud } from 'lucide-react';

export default function StudentDashboard({ 
  achievements = [
    {
      id: 'ach-1',
      user_id: 'u-101',
      user_name: 'Maria Santos',
      user_type: 'student',
      category_id: 'cat-1',
      category_name: 'Academic',
      title: "Dean's Lister - First Semester AY 2025-2026",
      event_name: '12th SOCCSKSARGEN IT Summit',
      issuer_organization: 'NDMU CITE / DOST Region XII',
      academic_year: 'AY 2025-2026',
      semester: '1st Semester',
      scope_level: 'Regional (Region XII)',
      rank_conferred: "Dean's Lister",
      description: 'Awarded for achieving a Grade Point Average of 1.25 and demonstrating academic excellence across all CS subjects.',
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
      description: 'Elected as Supreme Student Council President representing 5,000+ NDMU undergraduate students.',
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
      description: 'Led CITE Wildcats Men Basketball Team to victory in NDMU University Intramurals.',
      date_achieved: '2026-02-14',
      verification_status: 'pending',
      verifier_name: 'Coach Robert Tan',
      verified_at: null,
      document_url: '#'
    }
  ], 
  onAddAchievement = () => {}, 
  categories = [
    { id: 'cat-1', name: 'Academic' },
    { id: 'cat-2', name: 'Leadership' },
    { id: 'cat-3', name: 'Sports' },
    { id: 'cat-4', name: 'Community' }
  ] 
}) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

  const safeAchievements = Array.isArray(achievements) ? achievements : [];
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
    const selectedCategoryObj = categories.find(c => c.id === categoryId);
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
      <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
        
        {/* Student Profile Banner */}
        <div className="bg-[#1b4332] rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-[#245233] text-white shadow-xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="Student Avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-500/40 shadow-xl"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-white">Maria Santos</h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    Active Student
                  </span>
                </div>
                <p className="text-xs text-emerald-200 font-mono">ID: 2024-01234 | BS Computer Science (3rd Year)</p>
                <p className="text-xs text-emerald-300/80 font-medium">College of Engineering, Architecture and Computing (CEAC)</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="flex items-center justify-center space-x-2 bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Submit New Achievement</span>
            </button>
          </div>
        </div>

        {/* Analytics & Barcode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-3xl flex items-center space-x-4 border border-slate-100 shadow-xs">
            <div className="p-3 bg-emerald-50 text-[#2d8a4e] rounded-2xl border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Achievements</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{approvedCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl flex items-center space-x-4 border border-slate-100 shadow-xs">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Verification</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl flex items-center space-x-4 border border-slate-100 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOPSIS Score Points</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">30 Pts</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl flex items-center space-x-4 border border-slate-100 shadow-xs">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Barcode Digital ID</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">Verified Active ✓</p>
            </div>
          </div>
        </div>

        {/* Recent Achievements Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2d8a4e]" />
              <span>Recent Accomplishment Submissions</span>
            </h2>

            <button
              onClick={() => navigate('/student/achievements')}
              className="text-xs font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200/80">
                <tr>
                  <th className="p-3">Achievement Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Scope / Rank</th>
                  <th className="p-3">Conferred Date</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{item.title}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">{item.category_name}</span></td>
                    <td className="p-3 text-slate-600">{item.scope_level} • {item.rank_conferred}</td>
                    <td className="p-3 text-slate-500">{item.date_achieved}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.verification_status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.verification_status === 'approved' ? 'Verified ✓' : 'Pending Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
