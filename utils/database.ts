/**
 * PROJECT CRADLE: CORE TYPE SYSTEM
 */

export type EventType = 'FEED' | 'SLEEP' | 'DIAPER' | 'MEDICATION' | 'SOLIDS' | 'ACTIVITY';
export type UserRole = 'ADMIN' | 'SUPPORT' | 'PREMIUM_MEMBER' | 'MEMBER';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_onboarded: boolean;
}

export interface Baby {
  id: string;
  parent_id: string;
  name: string;
  dob: string;
}

export interface CareEventMetadata {
  baby_id?: string;
  logged_by?: string;
  amount_ml?: number;
  side?: 'LEFT' | 'RIGHT' | 'BOTH';
  diaper_type?: 'WET' | 'DIRTY' | 'BOTH';
  sleep_quality?: 1 | 2 | 3 | 4 | 5;
  [key: string]: any;
}

export interface CareEvent {
  id: string;
  correlation_id: string;
  user_id: string;
  event_type: EventType;
  timestamp: string;
  metadata: CareEventMetadata;
  created_at: string;
}