export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface InviteUserData {
  email: string;
  role?: 'admin' | 'user';
}
