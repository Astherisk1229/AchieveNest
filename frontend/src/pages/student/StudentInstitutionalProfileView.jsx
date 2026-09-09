import React, { useState, useEffect } from 'react'
import { 
  User, 
  GraduationCap, 
  Building2, 
  Users, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  RefreshCw,
  Info
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { getApiBaseUrl } from '../../config/api'

export default function StudentInstitutionalProfileView({ currentUser }) {
  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('achievenest_local_token') || localStorage.getItem('token') || ''
      const res = await fetch(`${getApiBaseUrl()}/api/v1/student/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Failed to load student profile (${res.status})`)
      }

      const json = await res.json()
      if (json.data) {
        setProfileData(json.data)
      } else {
        throw new Error('Invalid response structure received from server.')
      }
    } catch (err) {
      // Fallback to local session data if offline or mock environment
      if (currentUser) {
        setProfileData({
          identity: {
            student_id: currentUser.student_id || currentUser.institutional_id || '2024-01234',
            full_name: currentUser.full_name || 'Maria Clara Santos',
            first_name: currentUser.first_name || 'Maria Clara',
            last_name: currentUser.last_name || 'Santos',
            sex: currentUser.sex || 'Female',
            institutional_email: currentUser.email || 'maria.santos@ndmu.edu.ph',
            avatar_url: currentUser.avatar_url || null
          },
          academic: {
            program_code: currentUser.academic_program_code || 'BSCS',
            program_name: currentUser.academic_program_name || 'Bachelor of Science in Computer Science',
            year_level: currentUser.year_level || '3rd Year',
            academic_year: currentUser.academic_year || '2025-2026'
          },
          college: {
            college_code: currentUser.college_code || 'CITE',
            college_name: currentUser.college_name || 'College of Information Technology Education',
            acronym_badge_color: currentUser.college_color || '#15803d'
          },
          organization: currentUser.organization_name ? {
            organization_code: currentUser.organization_code || 'JPCS',
            organization_name: currentUser.organization_name,
            scope: 'college'
          } : null,
          moderator: currentUser.moderator_name ? {
            full_name: currentUser.moderator_name,
            institutional_email: currentUser.moderator_email || 'moderator@ndmu.edu.ph',
            designation_title: 'Organization Moderator'
          } : null,
          coordinator: currentUser.coordinator_name ? {
            full_name: currentUser.coordinator_name,
            institutional_email: currentUser.coordinator_email || 'coordinator@ndmu.edu.ph',
            designation_title: 'Program Coordinator'
          } : null,
          account: {
            status: currentUser.status || 'active',
            account_type: 'student'
          },
          availability: {
            has_program: true,
            has_college: true,
            has_coordinator: Boolean(currentUser.coordinator_name),
            has_organization: Boolean(currentUser.organization_name),
            has_moderator: Boolean(currentUser.moderator_name)
          }
        })
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading authoritative student profile...</p>
      </div>
    )
  }

  if (error && !profileData) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-rose-900">Unable to Load Profile</h2>
        <p className="text-xs text-rose-700">{error}</p>
        <Button onClick={fetchProfile} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  const { identity, academic, college, organization, moderator, coordinator, account, availability } = profileData || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
      
      {/* 1. Profile Header */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="w-20 h-20 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
            <AvatarImage src={identity?.avatar_url || ''} alt={identity?.full_name} />
            <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xl">
              {identity?.first_name?.charAt(0) || 'S'}{identity?.last_name?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                {identity?.full_name}
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit mx-auto sm:mx-0">
                ID: {identity?.student_id}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {academic?.program_name || 'Academic Program Unassigned'} &bull; {academic?.year_level || 'Year Level Unassigned'}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span 
                className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs"
                style={{ backgroundColor: college?.acronym_badge_color || '#15803d' }}
              >
                {college?.college_code || 'NDMU'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {college?.college_name || 'Notre Dame of Marbel University'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Academic Information Section */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Academic Information</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            Institutional Record (Read-Only)
          </span>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Academic Year</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{academic?.academic_year || 'Current AY'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Year Level</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{academic?.year_level || 'Not Assigned'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Degree Program</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{academic?.program_name || 'Not Assigned'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">College / Faculty</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{college?.college_name || 'Not Assigned'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Student Organization Section */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Student Organization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          {organization ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{organization.organization_name}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Code: {organization.organization_code} &bull; Scope: {organization.scope}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Affiliated
              </Badge>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-center">
              Student organization not yet assigned
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Your Institutional Contacts Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 px-1">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Your Institutional Contacts</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coordinator Card */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Program Coordinator
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Academic Advisor</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {coordinator ? (
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <AvatarImage src={coordinator.avatar_url || ''} alt={coordinator.full_name} />
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                      {coordinator.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'PC'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{coordinator.full_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{coordinator.designation_title || 'Program Coordinator'}</p>
                    <p className="text-slate-500 flex items-center gap-1.5 pt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a 
                        href={`mailto:${coordinator.institutional_email}`} 
                        className="hover:underline text-emerald-700 dark:text-emerald-400 font-medium truncate"
                        aria-label={`Send email to Program Coordinator ${coordinator.full_name}`}
                      >
                        {coordinator.institutional_email}
                      </a>
                    </p>
                    <div className="pt-1.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Scope: {academic?.program_code || academic?.program_name || 'Academic Program'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 italic">
                  Program coordinator not yet assigned
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moderator Card */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Organization Moderator
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Faculty Moderator</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {moderator ? (
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <AvatarImage src={moderator.avatar_url || ''} alt={moderator.full_name} />
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                      {moderator.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'OM'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{moderator.full_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{moderator.designation_title || 'Organization Moderator'}</p>
                    <p className="text-slate-500 flex items-center gap-1.5 pt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a 
                        href={`mailto:${moderator.institutional_email}`} 
                        className="hover:underline text-emerald-700 dark:text-emerald-400 font-medium truncate"
                        aria-label={`Send email to Organization Moderator ${moderator.full_name}`}
                      >
                        {moderator.institutional_email}
                      </a>
                    </p>
                    <div className="pt-1.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Scope: {organization?.organization_code || organization?.organization_name || 'Organization'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 italic">
                  Organization moderator not yet assigned
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Account and Security Section */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Account & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Account Status: <span className="text-emerald-600 font-extrabold capitalize">{account?.status || 'Active'}</span></p>
              <p className="text-slate-500 text-[11px]">Primary authentication via NDMU institutional credentials.</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1.5 text-xs font-bold w-fit cursor-pointer"
              onClick={() => window.location.href = '/change-password'}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </Button>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice on Institutional Records</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Academic placements, year levels, and institutional advisor assignments are officially maintained by the Office of Student Affairs & Services (OSAD) and the Office of the Registrar. If any details are incorrect, please contact the OSAD office for official record reconciliation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
