import { Database as SchemaDatabase } from './schema'

export type Database = SchemaDatabase

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Profile = Tables<'profiles'>
export type Session = Tables<'sessions'>
// Supabase Auth User type (not from database tables)
export type User = {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  created_at: string;
}