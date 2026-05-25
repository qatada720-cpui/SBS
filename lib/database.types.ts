export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'buyer' | 'seller' | 'both';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          sector: string;
          location: string;
          revenue: number;
          ebitda: number;
          asking_price: number;
          description: string | null;
          score: number;
          verified: boolean;
          premium: boolean;
          status: 'draft' | 'pending_review' | 'live' | 'under_offer' | 'sold';
          photos: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id' | 'created_at' | 'updated_at' | 'score' | 'verified'>;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          nda_signed_buyer: boolean;
          nda_signed_seller: boolean;
          status: 'active' | 'offer_made' | 'closed' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at' | 'read'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      offers: {
        Row: {
          id: string;
          conversation_id: string;
          buyer_id: string;
          listing_id: string;
          amount: number;
          structure: string | null;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['offers']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
