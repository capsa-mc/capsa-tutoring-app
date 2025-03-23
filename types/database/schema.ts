export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 枚举类型
export enum Group {
  LES = 'LES',
  UES = 'UES',
  MHS = 'MHS',
  ADMIN = 'ADMIN'
}

export enum Role {
  Admin = 'Admin',
  Staff = 'Staff',
  Coordinator = 'Coordinator',
  Tutor = 'Tutor',
  Tutee = 'Tutee'
}

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive'
}

export enum SessionType {
  Tutoring = 'Tutoring',
  Training = 'Training',
  Adhoc = 'Adhoc'
}

export enum SessionStatus {
  Before = 'Before',
  During = 'During',
  After = 'After'
}

export enum AttendanceType {
  Present = 'Present',
  Excused = 'Excused',
  Absent = 'Absent'
}

export enum PaymentMethod {
  Cash = 'Cash',
  Paypal = 'Paypal',
  Venmo = 'Venmo',
  Zelle = 'Zelle'
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  student_phone: string | null
  student_email: string | null
  parent_phone: string | null
  parent_email: string | null
  group: Group | null
  role: Role | null
  apply_role: Role | null
  status: Status
}

export interface Session {
  id: number
  location: string
  date: string
  type: SessionType
  comment: string | null
  hours: number
  status: SessionStatus
}

export interface Attendance {
  id: number
  session_id: number
  user_id: string
  attendance_type: AttendanceType
}

export interface Pair {
  id: number
  tutor_id: string | null
  tutee_id: string | null
}

export interface Payment {
  id: number
  created_at: string
  amount: number
  payment_method: PaymentMethod
  comment: string | null
  user_id: string
}

export interface Content {
  id: number
  name: string | null
  content: string | null
  old_content: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          student_phone: string | null
          student_email: string | null
          parent_phone: string | null
          parent_email: string | null
          group: Group | null
          role: Role | null
          apply_role: Role | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          student_phone?: string | null
          student_email?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          group?: Group | null
          role?: Role | null
          apply_role?: Role | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          student_phone?: string | null
          student_email?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          group?: Group | null
          role?: Role | null
          apply_role?: Role | null
        }
      }
      sessions: {
        Row: {
          id: number
          location: string
          hours: number
          date: string
          type: SessionType
          status: SessionStatus
          comment: string | null
        }
        Insert: {
          id?: number
          location?: string
          hours: number
          date: string
          type: SessionType
          status: SessionStatus
          comment?: string | null
        }
        Update: {
          id?: number
          location?: string
          hours: number
          date?: string
          type?: SessionType
          status?: SessionStatus
          comment?: string | null
        }
      }
      pairs: {
        Row: {
          id: number
          tutor_id: string | null
          tutee_id: string | null
        }
        Insert: {
          id?: number
          tutor_id?: string | null
          tutee_id?: string | null
        }
        Update: {
          id?: number
          tutor_id?: string | null
          tutee_id?: string | null
        }
      }
      attendances: {
        Row: {
          id: number
          session_id: number
          user_id: string
          attendance_type: AttendanceType
        }
        Insert: {
          id?: number
          session_id: number
          user_id: string
          attendance_type: AttendanceType
        }
        Update: {
          id?: number
          session_id?: number
          user_id?: string
          attendance_type?: AttendanceType
        }
      }
      contents: {
        Row: {
          id: number
          name: string | null
          content: string | null
          old_content: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          content?: string | null
          old_content?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          content?: string | null
          old_content?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      group: Group
      role: Role
      session_type: SessionType
      attendance_type: AttendanceType
    }
  }
}