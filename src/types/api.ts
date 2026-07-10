export type Role = "SUPER_ADMIN" | "ADMIN" | "ELECTION_OFFICER" | "STUDENT" | string;
export type ElectionStatus = "DRAFT" | "SCHEDULED" | "ONGOING" | "ENDED" | "ARCHIVED" | string;

export interface InstitutionBase {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}


export type Level = InstitutionBase;


export interface Faculty {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  facultyId: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface StudentProfile {
  id: string;
  userId: string;
  facultyId: string;
  departmentId: string;
  levelId: string;
  isActive: boolean;
  isVerified: boolean;
  faculty?: Faculty;
  department?: Department;
  level?: Level;
  facultyRecord?: Faculty;       // Kept if your backend uses this fallback alias
  departmentRecord?: Department; // Kept if your backend uses this fallback alias
  levelRecord?: Level;           // Kept if your backend uses this fallback alias
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string | null;
  matricNumber: string;
  role: Role | string;
  createdAt: string;
  studentProfile?: StudentProfile; // The crucial nested object from your API response
}

export interface AuthResponse {
  user?: User;
  data?: { user?: User };
  [k: string]: unknown;
}

export interface Election {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
  positions?: Position[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  title: string;
  description?: string;
  electionId: string;
  candidates?: Candidate[];
}

export interface Candidate {
  id: string;
  userId?: string;
  positionId: string;
  manifesto?: string;
  isApproved?: boolean;
  pictureUrl?: string;
  picture?: string;
  user?: User;
  position?: Position;
}

export interface VoteResult {
  candidateId: string;
  candidateName?: string;
  positionId: string;
  positionTitle?: string;
  votes: number;
  percentage?: number;
}

export interface ElectionResults {
  electionId: string;
  electionTitle?: string;
  totalVotes: number;
  results: VoteResult[];
  status?: ElectionStatus;
  winners?: VoteResult[];
}

export interface VoteReceipt {
  id?: string;
  electionId?: string;
  positionId?: string;
  candidateId?: string;
  message?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId?: string;
  actor?: User;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// DTOs
export interface AdminLoginDto {
  email: string;
  password: string;
}
export interface StudentLoginDto {
  matricNumber: string;
  password: string;
}
export interface StudentRegisterDto {
  matricNumber: string;
  password: string;
  facultyId?: string;
  departmentId?: string;
  levelId?: string;
}
export interface CreateUserDto {
  email?: string;
  matricNumber?: string;
  password: string;
  role: Role;
}
export interface UpdateUserDto {
  email?: string;
}
export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}
export interface CreateElectionDto {
  title: string;
  startDate: string;
  endDate: string;
  status?: ElectionStatus;
}
export type UpdateElectionDto = Partial<CreateElectionDto>;
export interface CreatePositionDto {
  title: string;
  description?: string;
  electionId: string;
}
export type UpdatePositionDto = Partial<CreatePositionDto>;
export interface UpdateStudentProfileDto {
  facultyId?: string;
  departmentId?: string;
  levelId?: string;
  isActive?: boolean;
  isVerified?: boolean;
}
export interface UpdateCandidateDto {
  userId?: string;
  positionId?: string;
  manifesto?: string;
  isApproved?: boolean;
}
export interface CreateVoteDto {
  electionId: string;
  positionId: string;
  candidateId: string;
}

export interface CreateFacultyDto {
  name: string;
  description?: string;
}
export type UpdateFacultyDto = Partial<CreateFacultyDto>;
export interface CreateDepartmentDto {
  name: string;
  description?: string;
  facultyId: string;
}
export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
export interface CreateLevelDto {
  name: string;
  description?: string;
}
export type UpdateLevelDto = Partial<CreateLevelDto>;
