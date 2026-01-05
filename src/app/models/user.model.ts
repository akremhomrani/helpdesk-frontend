export interface User {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  enabled?: boolean;
  departmentId?: string;
  departmentName?: string;
  createdAt?: string | number;
  updatedAt?: string;
}

export interface UserResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
