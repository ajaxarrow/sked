export interface School {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  createdAt: string | null
}

export interface ScheduleType {
  id: number
  schoolId: string
  name: string
}

export interface YearLevel {
  id: number
  scheduleTypeId: number
  name: string
  gradeNumber: number
  sortOrder: number
}

export interface Subject {
  id: number
  scheduleTypeId: number
  name: string
  hoursPerWeek: number
  colorHex: string
}

export interface SchoolYear {
  id: string
  schoolId: string
  scheduleTypeId: number
  label: string
  isActive: boolean | null
  createdAt: string | null
}

export interface Teacher {
  id: string
  schoolId: string
  name: string
  maxHoursPerWeek: number
  maxHoursPerDay: number
  subjects: TeacherSubjectAssignment[]
}

export interface TeacherSubjectAssignment {
  id: number
  teacherId: string
  subjectId: number
  yearLevelId: number
  sectionCount: number
  subjectName: string
  yearLevelName: string
}

export interface Section {
  id: string
  schoolYearId: string
  yearLevelId: number
  name: string
  adviserId: string | null
  adviserName?: string | null
  yearLevelName?: string
}

export interface ScheduleSet {
  id: string
  schoolYearId: string
  name: string
  createdAt: string | null
}

export interface ScheduleEntry {
  id: number
  scheduleSetId: string
  sectionId: string
  subjectId: number | null
  teacherId: string | null
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string | null
  subjectColor: string | null
  teacherName: string | null
  specialLabel: string | null
}

export interface VacantTeacher {
  teacherId: string
  teacherName: string
}

export interface FlagCeremonyConfig {
  enabled: boolean
  startTime: string
  endTime: string
  days: 'everyday' | 'monday' | number[]
}

export interface GenerateScheduleConfig {
  startTime: string
  endTime: string
  recessStart: string
  recessEnd: string
  lunchStart: string
  lunchEnd: string
  slotDurationMinutes: number
  avoidConsecutiveSameSubject: boolean
  extraBreaks: Array<{ label: string; startTime: string; endTime: string }>
  flagCeremony: FlagCeremonyConfig
}

export interface GenerateSchedulePayload {
  scheduleSetId?: string
  scheduleName?: string
  schoolYearId: string
  sectionIds: string[]
  config: GenerateScheduleConfig
}
