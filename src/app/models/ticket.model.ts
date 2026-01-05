import { User } from './user.model';
import { Department } from './department.model';

export enum TicketStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  AWAITING_CLIENT = 'AWAITING_CLIENT',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketType {
  PROBLEM = 'PROBLEM',
  INCIDENT = 'INCIDENT',
  REQUEST = 'REQUEST',
}

export enum SupportLevel {
  FIRST_LEVEL = 'FIRST_LEVEL',
  SECOND_LEVEL = 'SECOND_LEVEL',
  THIRD_LEVEL = 'THIRD_LEVEL',
}

export interface Ticket {
  id?: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  department?: Department;
  departementId?: string;
  departementName?: string;
  creatorId?: string;
  creatorName?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  creator?: User;
  assignedTo?: User;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  contact?: string;
  email?: string;
  attachmentPath?: string;
  attachmentName?: string;
  hasAttachment?: boolean;
  hasSolution?: boolean;
  solutionName?: string;
  solutionUploadedAt?: string;
  estimatedResolutionTime?: number;
  feedback?: string;
  supportLevel: SupportLevel;
  transferredById?: string;
  transferredFromDepartementId?: string;
}
