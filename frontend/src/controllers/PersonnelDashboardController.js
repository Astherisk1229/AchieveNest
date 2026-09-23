export default class PersonnelDashboardController {
  static getDefaultProfile(currentUser) {
    const employeeId = currentUser?.employee_id || 'EMP-2021-0842'

    return {
      full_name: currentUser?.full_name || 'Dr. Maria Santos',
      student_id: currentUser?.employee_id || employeeId,
      employee_id: employeeId,
      college: currentUser?.college || 'College of Engineering, Architecture, and Technology',
      college_code: currentUser?.college_code || 'CEAT',
      program: currentUser?.program || 'Bachelor of Science in Computer Science',
      program_affiliations: currentUser?.program_affiliations || ['Bachelor of Science in Computer Science'],
      administrative_unit: currentUser?.administrative_unit || '',
      academic_rank: currentUser?.academic_rank || 'Associate Professor & Research Coordinator',
      year_level: '8 Years Service',
      age: 38,
      location: 'Koronadal City, South Cotabato',
      email: currentUser?.email || 'faculty@ndmu.edu.ph',
      phone: '+63 917 845 2910',
      avatar_url: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      qr_code_id: `NDMU-FAC-${employeeId}`
    }
  }

  static mergeProfile(previousProfile, currentUser) {
    const baseProfile = this.getDefaultProfile(currentUser)
    return {
      ...previousProfile,
      ...baseProfile,
      full_name: currentUser?.full_name || previousProfile.full_name || baseProfile.full_name,
      employee_id: currentUser?.employee_id || previousProfile.employee_id || baseProfile.employee_id,
      college: currentUser?.college || previousProfile.college || baseProfile.college,
      college_code: currentUser?.college_code || previousProfile.college_code || baseProfile.college_code,
      program_affiliations: currentUser?.program_affiliations || previousProfile.program_affiliations || baseProfile.program_affiliations,
      administrative_unit: currentUser?.administrative_unit || previousProfile.administrative_unit || baseProfile.administrative_unit,
      email: currentUser?.email || previousProfile.email || baseProfile.email,
      avatar_url: currentUser?.avatar_url || previousProfile.avatar_url || baseProfile.avatar_url
    }
  }

  static getDefaultAccomplishments() {
    return [
      {
        id: 1,
        title: 'Machine Learning Frameworks in Education Analytics',
        date: 'Apr 15, 2026',
        status: 'Verified',
        statusLabel: 'HR Verified',
        category: 'Research & Publications',
        academic_year: 'AY 2025-2026',
        issuer: 'IEEE Access Journal (Scopus Indexed)',
        description: 'Lead author on peer-reviewed Scopus research paper detailing automated evaluation metrics for student submission code bases.',
        icon: 'BookOpen',
        iconColor: 'text-[#16834a] bg-[#E7F3E9] border-[#cbe6d2]',
        attached_file_name: 'ieee_paper_scopus_santos_2026.pdf'
      },
      {
        id: 2,
        title: 'CHED Regional Training on AI Curriculum Integration',
        date: 'Dec 04, 2025',
        status: 'Endorsed',
        statusLabel: 'Dean Endorsed',
        category: 'Seminars & Workshops',
        academic_year: 'AY 2025-2026',
        issuer: 'Commission on Higher Education (CHED IX)',
        description: 'Completed 40-hour intensive faculty development seminar on embedding generative AI tools into IT curricula.',
        icon: 'Users',
        iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
        attached_file_name: 'ched_ai_training_cert.pdf'
      },
      {
        id: 3,
        title: 'Barangay Smart Literacy Outreach Program',
        date: 'Nov 20, 2025',
        status: 'Verified',
        statusLabel: 'HR Verified',
        category: 'Extension Services',
        academic_year: 'AY 2024-2025',
        issuer: 'NDMU Extension & Community Involvement Office',
        description: 'Lead proponent for digital literacy training program for barangay officials in Koronadal City.',
        icon: 'Building2',
        iconColor: 'text-[#16834a] bg-[#E7F3E9] border-[#cbe6d2]',
        attached_file_name: 'community_extension_report.pdf'
      },
      {
        id: 4,
        title: 'NDMU Outstanding Faculty Researcher of the Year',
        date: 'Feb 10, 2025',
        status: 'Verified',
        statusLabel: 'HR Verified',
        category: 'Institutional Awards',
        academic_year: 'AY 2024-2025',
        issuer: 'Notre Dame of Marbel University',
        description: 'University-wide recognition for high research publication output and Scopus citation index.',
        icon: 'Award',
        iconColor: 'text-[#16834a] bg-[#E7F3E9] border-[#cbe6d2]',
        attached_file_name: 'outstanding_researcher_award.pdf'
      },
      {
        id: 5,
        title: 'AWS Certified Solutions Architect - Associate',
        date: 'Jan 28, 2026',
        status: 'Pending',
        statusLabel: 'Pending Review',
        category: 'Certifications & Licenses',
        academic_year: 'AY 2025-2026',
        issuer: 'Amazon Web Services (AWS)',
        description: 'Industry certification validating cloud architecture design, security, and enterprise deployment capabilities.',
        icon: 'ShieldCheck',
        iconColor: 'text-slate-600 bg-slate-100 border-slate-200',
        attached_file_name: 'aws_solutions_architect_certificate.pdf'
      }
    ]
  }

  static addNewAccomplishment(existingAccomplishments, newEntry) {
    return [
      {
        ...newEntry,
        statusLabel: newEntry.status === 'Pending' ? 'Pending Review' : newEntry.status,
        icon: 'Award',
        iconColor: 'text-amber-700 bg-amber-50 border-amber-200'
      },
      ...existingAccomplishments
    ]
  }

  static filterAccomplishments(entries, activeFilter) {
    return entries.filter(item => {
      if (activeFilter === 'All') return true
      if (activeFilter === 'Degrees & Orgs') return item.category.includes('Degree') || item.category.includes('Membership') || item.category.includes('A.1') || item.category.includes('A.2')
      if (activeFilter === 'Seminars & Trainings') return item.category.includes('Seminar') || item.category.includes('Training') || item.category.includes('A.3')
      if (activeFilter === 'Lectures & Publications') return item.category.includes('Lecturer') || item.category.includes('Publication') || item.category.includes('B.1') || item.category.includes('B.2')
      if (activeFilter === 'Research & Awards') return item.category.includes('Research') || item.category.includes('Award') || item.category.includes('Recognition') || item.category.includes('B.3') || item.category.includes('B.4')
      if (activeFilter === 'Instructional Materials') return item.category.includes('Instructional') || item.category.includes('Material') || item.category.includes('B.5')
      if (activeFilter === 'Service & Community') return item.category.includes('Service') || item.category.includes('Community') || item.category.includes('Involvement') || item.category.includes('C.1') || item.category.includes('C.2')
      return item.category === activeFilter
    })
  }
}