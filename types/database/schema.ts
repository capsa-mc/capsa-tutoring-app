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

export enum SessionType {
  Mix = 'Mix',
  Onsite = 'Onsite',
  Remote = 'Remote'
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
          start_time: string
          end_time: string
          date: string
          type: SessionType
        }
        Insert: {
          id?: number
          location: string
          start_time: string
          end_time: string
          date: string
          type: SessionType
        }
        Update: {
          id?: number
          location?: string
          start_time?: string
          end_time?: string
          date?: string
          type?: SessionType
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
      attendance: {
        Row: {
          id: number
          session_id: number | null
          tutor_id: string | null
          tutee_id: string | null
        }
        Insert: {
          id?: number
          session_id?: number | null
          tutor_id?: string | null
          tutee_id?: string | null
        }
        Update: {
          id?: number
          session_id?: number | null
          tutor_id?: string | null
          tutee_id?: string | null
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
    }
  }
}