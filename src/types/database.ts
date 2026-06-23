/**
 * Supabase 데이터베이스 타입.
 *
 * ⚠️ 이 파일은 `supabase/migrations` 스키마를 그대로 미러링한 것이다.
 * 스키마를 바꾸면 아래로 재생성하는 것을 권장한다:
 *
 *   pnpm gen:types          # (로컬 Supabase) supabase gen types ...
 *
 * 자세한 내용은 README 의 "타입 생성" 참고.
 */

export type WorkspacePlan = "free" | "pro";
export type MemberRole = "owner" | "staff";
export type MemberStatus = "invited" | "active" | "disabled";
export type ProjectStatus = "estimating" | "contracted" | "in_progress" | "done";
export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected";
export type StatementType = "purchase_order" | "trade_statement";
export type PaymentStatus = "pending" | "paid";

type WithTimestamps = { created_at: string; updated_at: string };
type InsertTimestamps = { created_at?: string; updated_at?: string };

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          plan: WorkspacePlan;
          trial_ends_at: string;
          billing_customer_id: string | null;
          owner_id: string;
          biz_name: string | null;
          biz_owner: string | null;
          biz_reg_no: string | null;
          biz_phone: string | null;
          biz_address: string | null;
          logo_path: string | null;
          stamp_path: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          plan?: WorkspacePlan;
          trial_ends_at?: string;
          billing_customer_id?: string | null;
          owner_id: string;
          biz_name?: string | null;
          biz_owner?: string | null;
          biz_reg_no?: string | null;
          biz_phone?: string | null;
          biz_address?: string | null;
          logo_path?: string | null;
          stamp_path?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string | null;
          role: MemberRole;
          status: MemberStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          name?: string | null;
          role?: MemberRole;
          status?: MemberStatus;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          memo: string | null;
          deleted_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          phone?: string | null;
          address?: string | null;
          memo?: string | null;
          deleted_at?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string | null;
          name: string;
          site_address: string | null;
          status: ProjectStatus;
          memo: string | null;
          deleted_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          client_id?: string | null;
          name: string;
          site_address?: string | null;
          status?: ProjectStatus;
          memo?: string | null;
          deleted_at?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      catalog_items: {
        Row: {
          id: string;
          workspace_id: string;
          category: string | null;
          name: string;
          unit: string | null;
          default_unit_price: number;
          default_cost: number;
          is_favorite: boolean;
          deleted_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          category?: string | null;
          name: string;
          unit?: string | null;
          default_unit_price?: number;
          default_cost?: number;
          is_favorite?: boolean;
          deleted_at?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["catalog_items"]["Insert"]>;
        Relationships: [];
      };
      catalog_categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          sort_order: number;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          sort_order?: number;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["catalog_categories"]["Insert"]>;
        Relationships: [];
      };
      estimates: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          version: number;
          status: EstimateStatus;
          total_price: number;
          total_cost: number;
          memo: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          version?: number;
          status?: EstimateStatus;
          total_price?: number;
          total_cost?: number;
          memo?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["estimates"]["Insert"]>;
        Relationships: [];
      };
      estimate_lines: {
        Row: {
          id: string;
          workspace_id: string;
          estimate_id: string;
          category: string | null;
          name: string;
          unit: string | null;
          qty: number;
          unit_price: number;
          cost: number;
          sort_order: number;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          estimate_id: string;
          category?: string | null;
          name: string;
          unit?: string | null;
          qty?: number;
          unit_price?: number;
          cost?: number;
          sort_order?: number;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["estimate_lines"]["Insert"]>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          estimate_id: string | null;
          amount: number;
          signed_on: string | null;
          terms: string | null;
          memo: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          estimate_id?: string | null;
          amount?: number;
          signed_on?: string | null;
          terms?: string | null;
          memo?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]>;
        Relationships: [];
      };
      statements: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          type: StatementType;
          vendor: string | null;
          amount: number;
          issued_on: string | null;
          memo: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          type: StatementType;
          vendor?: string | null;
          amount?: number;
          issued_on?: string | null;
          memo?: string | null;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["statements"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          label: string;
          amount: number;
          due_on: string | null;
          paid_on: string | null;
          status: PaymentStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          label: string;
          amount?: number;
          due_on?: string | null;
          paid_on?: string | null;
          status?: PaymentStatus;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          kind: string | null;
          file_path: string;
          ai_extracted: boolean;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          kind?: string | null;
          file_path: string;
          ai_extracted?: boolean;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          workspace_id: string;
          month: string;
          input_tokens: number;
          output_tokens: number;
          doc_count: number;
          est_cost_krw: number;
        } & WithTimestamps;
        Insert: {
          id?: string;
          workspace_id: string;
          month: string;
          input_tokens?: number;
          output_tokens?: number;
          doc_count?: number;
          est_cost_krw?: number;
        } & InsertTimestamps;
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          actor_member_id: string | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          actor_member_id?: string | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          workspace_id: string;
          type: string;
          raw: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          raw?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      project_overview: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string | null;
          name: string;
          site_address: string | null;
          status: ProjectStatus;
          memo: string | null;
          created_at: string;
          updated_at: string;
          client_name: string | null;
          contract_amount: number;
          receivable: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_estimate: {
        Args: {
          p_project_id: string;
          p_status: string;
          p_memo: string;
          p_lines: Json;
        };
        Returns: Database["public"]["Tables"]["estimates"]["Row"];
      };
      current_month_extractions: {
        Args: { p_workspace_id: string };
        Returns: number;
      };
      record_ai_usage: {
        Args: {
          p_workspace_id: string;
          p_input_tokens: number;
          p_output_tokens: number;
          p_doc_count: number;
          p_est_cost_krw: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      workspace_plan: WorkspacePlan;
      member_role: MemberRole;
      member_status: MemberStatus;
      project_status: ProjectStatus;
      estimate_status: EstimateStatus;
      statement_type: StatementType;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
