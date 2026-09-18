"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function readCredentials(formData: FormData) {
  return credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) redirect("/login?erro=Confira+o+e-mail+e+a+senha");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?erro=E-mail+ou+senha+incorretos");
  redirect("/");
}

export async function signup(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) redirect("/login?erro=Use+um+e-mail+válido+e+senha+com+6+caracteres");

  const origin = (await headers()).get("origin") ?? "https://bazar-casual.vercel.app";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      data: { display_name: "Bazar Casual" },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  if (data.session) redirect("/");
  redirect("/login?aviso=Confira+seu+e-mail+para+confirmar+o+acesso");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
