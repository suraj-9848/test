import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    id_token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
  }
}

export interface ProPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_months: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
