export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ListingRow = {
  id: string;
  seller_id: string;
  name: string;
  sector: string;
  location: string;
  founded: number | null;
  employees: number | null;
  revenue: number;
  ebitda: number;
  asking_price: number;
  description: string | null;
  score: number;
  verified: boolean;
  premium: boolean;
  status: 'draft' | 'pending_review' | 'live' | 'under_offer' | 'sold' | 'rejected';
  rejection_reason: string | null;
  phases: Json | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type ListingInsert = Omit<ListingRow, 'id' | 'created_at' | 'updated_at' | 'verified' | 'premium'>;
export type ListingUpdate = Partial<ListingRow>;

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
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'buyer' | 'seller' | 'both';
          avatar_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      listings: {
        Row: ListingRow;
        Insert: ListingInsert;
        Update: ListingUpdate;
      };
      saved_listings: {
        Row: {
          id: string;
          buyer_id: string;
          listing_id: string;
          created_at: string;
          listings: ListingRow | null;
        };
        Insert: { buyer_id: string; listing_id: string };
        Update: Partial<Database['public']['Tables']['saved_listings']['Insert']>;
      };
      ndas: {
        Row: {
          id: string;
          buyer_id: string;
          listing_id: string;
          status: 'pending' | 'signed' | 'rejected';
          created_at: string;
        };
        Insert: { buyer_id: string; listing_id: string; status?: 'pending' | 'signed' | 'rejected' };
        Update: Partial<Database['public']['Tables']['ndas']['Insert']>;
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
        Insert: {
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          nda_signed_buyer?: boolean;
          nda_signed_seller?: boolean;
          status?: 'active' | 'offer_made' | 'closed' | 'archived';
        };
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
        Insert: { conversation_id: string; sender_id: string; body: string };
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
        Insert: {
          conversation_id: string;
          buyer_id: string;
          listing_id: string;
          amount: number;
          structure?: string | null;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
        };
        Update: Partial<Database['public']['Tables']['offers']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
