export interface School {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  createdAt: string | null
}

export interface ScheduleType {
  id: number
  schoolId: number
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
  id: number
  schoolId: number
  scheduleTypeId: number
  label: string
  isActive: boolean | null
  createdAt: string | null
}

export interface Teacher {
  id: number
  schoolId: number
  name: string
  maxHoursPerWeek: number
  maxHoursPerDay: number
  subjects: TeacherSubjectAssignment[]
}

export interface TeacherSubjectAssignment {
  id: number
  teacherId: number
  subjectId: number
  yearLevelId: number
  subjectName: string
  yearLevelName: string
}

export interface Section {
  id: number
  schoolYearId: number
  yearLevelId: number
  name: string
  adviserId: number | null
  adviserName?: string | null
  yearLevelName?: string
}

export interface ScheduleConfig {
  id: number
  sectionId: number
  startTime: string
  endTime: string
  recessStart: string
  recessEnd: string
  lunchStart: string
  lunchEnd: string
  slotDurationMinutes: number
  avoidConsecutiveSameSubject: boolean
  extraBreaks: ExtraBreak[]
}

export interface ExtraBreak {
  id?: number
  startTime: string
  endTime: string
  label: string | null
}

export interface ScheduleEntry {
  id: number
  sectionId: number
  subjectId: number
  teacherId: number
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string
  subjectColor: string
  teacherName: string
}

export interface VacantTeacher {
  teacherId: number
  teacherName: string
}

export interface ScheduleSlot {
  start: string
  end: string
}

export interface GenerateSchedulePayload {
  sectionIds: number[]
  config: {
    startTime: string
    endTime: string
    recessStart: string
    recessEnd: string
    lunchStart: string
    lunchEnd: string
    slotDurationMinutes: number
    avoidConsecutiveSameSubject: boolean
    extraBreaks: Array<{ startTime: string; endTime: string; label: string }>
  }
}
