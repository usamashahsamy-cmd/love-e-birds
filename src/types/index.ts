declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      avatar: string | null;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    username: string;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    avatar: string | null;
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  activeIcon: string;
}

export interface ProfileCardData {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string;
  age?: number | null;
  location?: string | null;
  points: number;
  likesCount: number;
  isVerified: boolean;
  isOnline: boolean;
  photos: { id: string; url: string }[];
  interests: { id: string; name: string }[];
}

export interface DashboardMenuItemData {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export type TransactionDirection = "CREDIT" | "DEBIT";
export type WithdrawalStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";