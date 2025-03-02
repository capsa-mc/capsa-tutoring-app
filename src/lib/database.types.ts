export type UserRole = "admin" | "staff" | "coordinator" | "tutor" | "tutee";

export type SchoolGroup = "ADMIN" | "LES" | "UES" | "MHS";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  student_phone: string;
  student_email: string;
  parent_phone: string;
  parent_email: string;
  group: SchoolGroup | null;
  apply_role: UserRole | null;
  created_at: string;
  updated_at: string;
}

export interface Pair {
  id: string;
  tutor_id: string;
  tutee_id: string;
  created_at: string;
  updated_at: string;
}

export type SessionType = "Mix" | "Onsite" | "Remote";

export interface Session {
  id: string;
  pair_id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  session_type: SessionType;
  location: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  user_id: string;
  status: "present" | "absent" | "late";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      pairs: {
        Row: Pair;
        Insert: Omit<Pair, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Pair, "id" | "created_at" | "updated_at">>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Session, "id" | "created_at" | "updated_at">>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Attendance, "id" | "created_at" | "updated_at">>;
      };
    };
  };
}; 