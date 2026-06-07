export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'contributor' | 'maintainer';
  created_at?: string;
  updated_at?: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export type IPUser = Omit<IUser, 'password' | 'created_at' | 'updated_at'>

