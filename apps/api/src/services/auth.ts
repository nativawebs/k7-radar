import { withSupabase } from "@supabase/server";
import type { AuthModeWithKey, SupabaseContext } from "@supabase/server";
import type { FastifyReply, FastifyRequest } from "fastify";

function requestHeadersToWebHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(name, value);
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(name, value.join(", "));
    }
  }

  return headers;
}

function toWebRequest(request: FastifyRequest): Request {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string" ? forwardedProto.split(",")[0]?.trim() || "http" : "http";
  const host = request.headers.host ?? "localhost";
  const url = request.url.startsWith("http") ? request.url : `${protocol}://${host}${request.url}`;

  return new Request(url, {
    method: request.method,
    headers: requestHeadersToWebHeaders(request)
  });
}

async function responseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : { message: response.statusText };
}

export function createSupabaseAuthPreHandler(auth: AuthModeWithKey | AuthModeWithKey[] = "user") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const contextRef: { current?: SupabaseContext } = {};

    const verifyRequest = withSupabase(
      {
        auth,
        cors: false
      },
      async (_webRequest, ctx) => {
        contextRef.current = ctx;
        return new Response(null, { status: 204 });
      }
    );

    const response = await verifyRequest(toWebRequest(request));

    if (!response.ok) {
      return reply.code(response.status).send(await responseBody(response));
    }

    const supabaseContext = contextRef.current;
    if (!supabaseContext) {
      return reply.code(500).send({ message: "No se pudo crear el contexto de Supabase." });
    }

    request.supabaseContext = supabaseContext;
    request.supabase = supabaseContext.supabase;
    request.supabaseAdmin = supabaseContext.supabaseAdmin;
    request.user = supabaseContext.userClaims
      ? {
          id: supabaseContext.userClaims.id,
          email: supabaseContext.userClaims.email ?? "",
          role: supabaseContext.userClaims.role ?? "authenticated"
        }
      : undefined;
  };
}
