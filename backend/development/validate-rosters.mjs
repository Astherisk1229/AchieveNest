import XLSX from 'xlsx'
import pg from 'pg'

const studentWorkbook = 'C:/Users/Admin/Downloads/AchieveNest_OSAD_Student_Demo_Roster_Updated.xlsx'
const personnelWorkbook = 'C:/Users/Admin/Downloads/AchieveNest_HR_Personnel_Demo_Roster_Updated.xlsx'
const accountStatuses = new Set(['provisioned', 'active', 'suspended', 'archived'])

const { Pool } = pg
const database = new Pool({
  host: process.env['database.development.hostname'],
  port: Number(process.env['database.development.port']),
  database: process.env['database.development.database'],
  user: process.env['database.development.username'],
  password: process.env['database.development.password'],
  ssl: { rejectUnauthorized: false },
})

function value(row, key) {
  return String(row[key] ?? '').trim()
}

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, cell]) => [key.trim().toLowerCase(), cell]))
}

function addError(errors, rowNumber, row, code, reason) {
  errors.push({
    rowNumber,
    institutionalId: value(row, 'institutional_id'),
    code,
    reason,
  })
}

async function loadReferenceData() {
  const read = async (table) => {
    const result = await database.query(`SELECT id, code, status${table === 'departments' ? ', college_id' : ''}${table === 'degree_programs' ? ', department_id' : ''} FROM public.${table}`)
    return result.rows
  }

  const [colleges, departments, programs] = await Promise.all([
    read('colleges'),
    read('departments'),
    read('degree_programs'),
  ])

  return {
    colleges: new Map(colleges.map((row) => [row.code, row])),
    departments: new Map(departments.map((row) => [row.code, row])),
    programs: new Map(programs.map((row) => [row.code, row])),
  }
}

function validateWorkbook(filePath, kind, referenceData) {
  const workbook = XLSX.readFile(filePath, { cellDates: false })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
  const headers = sheetRows[3].map((header) => String(header ?? '').trim().toLowerCase())
  const rawRows = sheetRows.slice(4).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? null])))
  const rows = rawRows.map(normalizeRow)
  const errors = []
  const ids = new Map()
  const emails = new Map()

  rows.forEach((row, index) => {
    const rowNumber = index + 5
    const institutionalId = value(row, 'institutional_id')
    const email = value(row, 'institutional_email')
    const accountStatus = value(row, 'account_status').toLowerCase()

    if (!institutionalId) addError(errors, rowNumber, row, 'INSTITUTIONAL_ID_REQUIRED', 'institutional_id is required.')
    if (institutionalId && institutionalId !== String(row.institutional_id ?? '')) addError(errors, rowNumber, row, 'INSTITUTIONAL_ID_NOT_TRIMMED', 'institutional_id must be trimmed.')
    if (institutionalId.includes('-')) addError(errors, rowNumber, row, 'INSTITUTIONAL_ID_HAS_DASH', 'institutional_id must not contain a dash.')
    if (institutionalId) {
      if (ids.has(institutionalId)) addError(errors, rowNumber, row, 'DUPLICATE_INSTITUTIONAL_ID', `institutional_id duplicates row ${ids.get(institutionalId)}.`)
      else ids.set(institutionalId, rowNumber)
    }

    if (!email) addError(errors, rowNumber, row, 'INSTITUTIONAL_EMAIL_REQUIRED', 'institutional_email is required.')
    if (email && email !== email.toLowerCase()) addError(errors, rowNumber, row, 'INSTITUTIONAL_EMAIL_NOT_LOWERCASE', 'institutional_email must be lowercase.')
    if (email && !email.endsWith('@ndmu.edu.ph')) addError(errors, rowNumber, row, 'INSTITUTIONAL_EMAIL_DOMAIN_INVALID', 'institutional_email must end with @ndmu.edu.ph.')
    if (email) {
      if (emails.has(email)) addError(errors, rowNumber, row, 'DUPLICATE_INSTITUTIONAL_EMAIL', `institutional_email duplicates row ${emails.get(email)}.`)
      else emails.set(email, rowNumber)
    }

    if (!value(row, 'first_name')) addError(errors, rowNumber, row, 'FIRST_NAME_REQUIRED', 'first_name is required.')
    if (!value(row, 'last_name')) addError(errors, rowNumber, row, 'LAST_NAME_REQUIRED', 'last_name is required.')
    if (!accountStatuses.has(accountStatus)) addError(errors, rowNumber, row, 'ACCOUNT_STATUS_INVALID', 'account_status is not a valid profile status.')

    if (kind === 'student') {
      const collegeCode = value(row, 'college_code').toUpperCase()
      const departmentCode = value(row, 'department_code').toUpperCase()
      const programCode = value(row, 'degree_program_code').toUpperCase()
      const college = referenceData.colleges.get(collegeCode)
      const department = referenceData.departments.get(departmentCode)
      const program = referenceData.programs.get(programCode)

      if (!collegeCode) addError(errors, rowNumber, row, 'COLLEGE_CODE_REQUIRED', 'college_code is required.')
      if (!departmentCode) addError(errors, rowNumber, row, 'DEPARTMENT_CODE_REQUIRED', 'department_code is required.')
      if (!programCode) addError(errors, rowNumber, row, 'DEGREE_PROGRAM_CODE_REQUIRED', 'degree_program_code is required.')
      if (!value(row, 'year_level')) addError(errors, rowNumber, row, 'YEAR_LEVEL_REQUIRED', 'year_level is required.')
      if (collegeCode && (!college || college.status !== 'active')) addError(errors, rowNumber, row, 'COLLEGE_NOT_FOUND', 'college_code does not resolve to an active college.')
      if (departmentCode && (!department || department.status !== 'active')) addError(errors, rowNumber, row, 'DEPARTMENT_NOT_FOUND', 'department_code does not resolve to an active department.')
      if (college && department && department.college_id !== college.id) addError(errors, rowNumber, row, 'DEPARTMENT_COLLEGE_MISMATCH', 'department does not belong to college.')
      if (programCode && (!program || program.status !== 'active')) addError(errors, rowNumber, row, 'DEGREE_PROGRAM_NOT_FOUND', 'degree_program_code does not resolve to an active degree program.')
      if (department && program && program.department_id !== department.id) addError(errors, rowNumber, row, 'DEGREE_PROGRAM_DEPARTMENT_MISMATCH', 'degree program does not belong to department.')
    }

    if (kind === 'personnel') {
      const collegeCode = value(row, 'college_code').toUpperCase()
      const departmentCode = value(row, 'department_code').toUpperCase()
      const college = collegeCode ? referenceData.colleges.get(collegeCode) : null
      const department = departmentCode ? referenceData.departments.get(departmentCode) : null

      if (!value(row, 'designation')) addError(errors, rowNumber, row, 'DESIGNATION_REQUIRED', 'designation is required.')
      if (collegeCode && (!college || college.status !== 'active')) addError(errors, rowNumber, row, 'COLLEGE_NOT_FOUND', 'college_code does not resolve to an active college.')
      if (departmentCode && (!department || department.status !== 'active')) addError(errors, rowNumber, row, 'DEPARTMENT_NOT_FOUND', 'department_code does not resolve to an active department.')
      if (college && department && department.college_id !== college.id) addError(errors, rowNumber, row, 'DEPARTMENT_COLLEGE_MISMATCH', 'department does not belong to college.')
    }
  })

  return { totalRows: rows.length, errors }
}

const referenceData = await loadReferenceData()
const student = validateWorkbook(studentWorkbook, 'student', referenceData)
const personnel = validateWorkbook(personnelWorkbook, 'personnel', referenceData)
await database.end()

console.log('Student workbook:')
console.log(`total rows: ${student.totalRows}`)
console.log(`valid rows: ${student.totalRows - new Set(student.errors.map((error) => error.rowNumber)).size}`)
console.log(`invalid rows: ${new Set(student.errors.map((error) => error.rowNumber)).size}`)
for (const error of student.errors) console.log(`row ${error.rowNumber} | ${error.institutionalId} | ${error.code} | ${error.reason}`)

console.log('Personnel workbook:')
console.log(`total rows: ${personnel.totalRows}`)
console.log(`valid rows: ${personnel.totalRows - new Set(personnel.errors.map((error) => error.rowNumber)).size}`)
console.log(`invalid rows: ${new Set(personnel.errors.map((error) => error.rowNumber)).size}`)
for (const error of personnel.errors) console.log(`row ${error.rowNumber} | ${error.institutionalId} | ${error.code} | ${error.reason}`)
