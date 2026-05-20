import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PasswordSchema = z.object({
  newPassword: z.string().min(6).max(128),
});

/**
 * Tri (suami) bisa mengganti password Mutia.
 * Validasi:
 *  - Pemanggil harus authenticated
 *  - Pemanggil harus role 'tri'
 *  - Hanya boleh menggati password user dengan role 'mutia'
 */
export const changePartnerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PasswordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verifikasi pemanggil adalah Tri
    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!callerRole || callerRole.role !== "tri") {
      throw new Response("Hanya Tri yang dapat mengubah password pasangan", {
        status: 403,
      });
    }

    // Cari user_id Mutia
    const { data: mutiaRow } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "mutia")
      .maybeSingle();

    if (!mutiaRow?.user_id) {
      throw new Response("Akun Mutia belum terdaftar", { status: 404 });
    }

    // Update password via admin client
    const { error } = await supabaseAdmin.auth.admin.updateUserById(mutiaRow.user_id, {
      password: data.newPassword,
    });

    if (error) {
      throw new Response("Gagal: " + error.message, { status: 500 });
    }

    return { ok: true };
  });