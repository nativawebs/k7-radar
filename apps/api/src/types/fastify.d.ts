import "fastify";
import type { SupabaseContext } from "@supabase/server";
import type { SupabaseClient } from "@supabase/server/peer/supabase-js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
  }

  interface FastifyRequest {
    user?: { id: string; role: string; email: string };
    supabaseContext?: SupabaseContext;
    supabase?: SupabaseClient;
    supabaseAdmin?: SupabaseClient;
  }
}

export {};
