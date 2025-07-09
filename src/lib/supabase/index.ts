export { 
  supabase,
  getCurrentUser,
  getCurrentSession,
  signOut,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  updatePassword,
  updateProfile,
  uploadFile,
  getPublicUrl,
  deleteFile,
  subscribeToTable
} from './client'

export * from './utils'
export * from './query-builder'

// Re-export types
export type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/supabase.types'

