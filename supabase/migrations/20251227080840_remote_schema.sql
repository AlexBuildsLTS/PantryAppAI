


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."sub_tier" AS ENUM (
    'FREE',
    'PREMIUM_MONTHLY',
    'PREMIUM_ANNUAL',
    'LIFETIME'
);


ALTER TYPE "public"."sub_tier" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'ADMIN',
    'SUPPORT',
    'PREMIUM_MEMBER',
    'MEMBER'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tier)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Parent'), 
    'MEMBER',
    'FREE'
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_system_health"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.system_health_logs (event_type, metadata)
  VALUES ('DATA_SYNC', jsonb_build_object('table', TG_TABLE_NAME, 'user_id', auth.uid()));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_system_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_ticket_reply"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    (SELECT user_id FROM public.support_tickets WHERE id = NEW.ticket_id),
    'Support Update',
    'A staff member has replied to your ticket.',
    'TICKET'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_ticket_reply"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_tickets"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.support_tickets 
  WHERE status = 'CLOSED' 
  AND updated_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."purge_old_tickets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_tier"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (NEW.status = 'active') THEN
    UPDATE public.profiles SET tier = 'PREMIUM_MONTHLY' WHERE id = NEW.user_id;
  ELSE
    UPDATE public.profiles SET tier = 'FREE' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_tier"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."care_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "correlation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_synced" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "care_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['FEED'::"text", 'SLEEP'::"text", 'DIAPER'::"text", 'MEDICATION'::"text", 'SOLIDS'::"text", 'PUMPING'::"text"])))
);


ALTER TABLE "public"."care_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "tier_required" "public"."sub_tier" DEFAULT 'PREMIUM_MONTHLY'::"public"."sub_tier",
    "thumbnail_url" "text",
    CONSTRAINT "courses_category_check" CHECK (("category" = ANY (ARRAY['SLEEP'::"text", 'ATTACHMENT'::"text", 'NUTRITION'::"text"])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faq_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "category" "text" DEFAULT 'General'::"text" NOT NULL,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."faq_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_access" (
    "role" "public"."user_role" NOT NULL,
    "can_use_ai" boolean DEFAULT false,
    "can_access_courses" boolean DEFAULT false,
    "can_view_analytics" boolean DEFAULT false,
    "max_babies_tracked" integer DEFAULT 1
);


ALTER TABLE "public"."feature_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "used_by" "uuid",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text" NOT NULL,
    "content_body" "text",
    "video_url" "text",
    "order_index" integer NOT NULL
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['SYSTEM'::"text", 'TICKET'::"text", 'SUBSCRIPTION'::"text", 'BIOMETRIC'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'MEMBER'::"public"."user_role" NOT NULL,
    "tier" "public"."sub_tier" DEFAULT 'FREE'::"public"."sub_tier" NOT NULL,
    "baby_name" "text",
    "baby_dob" "date",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "is_onboarded" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pumping_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "side" "text",
    "amount_ml" numeric(6,2),
    "duration_minutes" integer,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "pumping_logs_side_check" CHECK (("side" = ANY (ARRAY['LEFT'::"text", 'RIGHT'::"text", 'BOTH'::"text"])))
);


ALTER TABLE "public"."pumping_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "previous_tier" "public"."sub_tier",
    "new_tier" "public"."sub_tier" NOT NULL,
    "transaction_ref" "text",
    "event_date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "comment_body" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'OPEN'::"public"."ticket_status" NOT NULL,
    "priority" integer DEFAULT 1,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5)))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_health_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "latency_ms" integer,
    "status" "text" DEFAULT 'OPERATIONAL'::"text",
    "logged_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_health_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "user_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."care_events"
    ADD CONSTRAINT "care_events_correlation_id_key" UNIQUE ("correlation_id");



ALTER TABLE ONLY "public"."care_events"
    ADD CONSTRAINT "care_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq_entries"
    ADD CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_access"
    ADD CONSTRAINT "feature_access_pkey" PRIMARY KEY ("role");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pumping_logs"
    ADD CONSTRAINT "pumping_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_comments"
    ADD CONSTRAINT "support_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_logs"
    ADD CONSTRAINT "system_health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("user_id", "lesson_id");



CREATE INDEX "idx_care_events_user_id" ON "public"."care_events" USING "btree" ("user_id");



CREATE INDEX "idx_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "on_subscription_change" AFTER INSERT OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_tier"();



CREATE OR REPLACE TRIGGER "on_support_comment" AFTER INSERT ON "public"."support_comments" FOR EACH ROW WHEN (("new"."is_internal" = false)) EXECUTE FUNCTION "public"."notify_on_ticket_reply"();



ALTER TABLE ONLY "public"."care_events"
    ADD CONSTRAINT "care_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pumping_logs"
    ADD CONSTRAINT "pumping_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_comments"
    ADD CONSTRAINT "support_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_comments"
    ADD CONSTRAINT "support_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Creators view own invites" ON "public"."invitations" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Profiles: Self/Support access" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = ANY (ARRAY['ADMIN'::"public"."user_role", 'SUPPORT'::"public"."user_role"])))))));



CREATE POLICY "Public can view FAQs" ON "public"."faq_entries" FOR SELECT USING (true);



CREATE POLICY "Public can view courses" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Tickets: Owners/Support/Admin" ON "public"."support_tickets" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ADMIN'::"public"."user_role", 'SUPPORT'::"public"."user_role"])))))));



CREATE POLICY "Users can insert own events" ON "public"."care_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own events" ON "public"."care_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own entitlements" ON "public"."feature_access" FOR SELECT USING (true);



CREATE POLICY "Users manage own notifications" ON "public"."notifications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own progress" ON "public"."user_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own pump logs" ON "public"."pumping_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."care_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faq_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pumping_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_health_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_system_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_system_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_system_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_ticket_reply"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_ticket_reply"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_ticket_reply"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_old_tickets"() TO "anon";
GRANT ALL ON FUNCTION "public"."purge_old_tickets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_old_tickets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_tier"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_tier"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_tier"() TO "service_role";


















GRANT ALL ON TABLE "public"."care_events" TO "anon";
GRANT ALL ON TABLE "public"."care_events" TO "authenticated";
GRANT ALL ON TABLE "public"."care_events" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."faq_entries" TO "anon";
GRANT ALL ON TABLE "public"."faq_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."faq_entries" TO "service_role";



GRANT ALL ON TABLE "public"."feature_access" TO "anon";
GRANT ALL ON TABLE "public"."feature_access" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_access" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."pumping_logs" TO "anon";
GRANT ALL ON TABLE "public"."pumping_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pumping_logs" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_comments" TO "anon";
GRANT ALL ON TABLE "public"."support_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."support_comments" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admin Academy Management"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'academy'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::public.user_role))))));



  create policy "Avatar Public View"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Avatar Upload Logic"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



