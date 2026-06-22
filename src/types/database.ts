/**
 * Supabase 데이터베이스 타입 (수기 작성).
 * 프로덕션에서는 `supabase gen types typescript` 로 자동 생성을 권장한다.
 * 현재는 멀티테넌시 골격(workspace → member → 거래처/현장/견적)만 정의.
 */

export type MemberRole = "owner" | "staff";

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: MemberRole;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: MemberRole;
          display_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          phone: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          phone?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string | null;
          name: string;
          address: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id?: string | null;
          name: string;
          address?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
        Relationships: [];
      };
      estimates: {
        Row: {
          id: string;
          workspace_id: string;
          site_id: string | null;
          title: string;
          status: string;
          /** 견적가 합계 (고객 제시가) */
          quote_total: number;
          /** 실행가 합계 (실제 원가) */
          cost_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          site_id?: string | null;
          title: string;
          status?: string;
          quote_total?: number;
          cost_total?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimates"]["Insert"]>;
        Relationships: [];
      };
      estimate_items: {
        Row: {
          id: string;
          workspace_id: string;
          estimate_id: string;
          name: string;
          unit: string | null;
          qty: number;
          /** 견적 단가 */
          quote_unit_price: number;
          /** 실행 단가 (원가) */
          cost_unit_price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          estimate_id: string;
          name: string;
          unit?: string | null;
          qty?: number;
          quote_unit_price?: number;
          cost_unit_price?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimate_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      member_role: MemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
