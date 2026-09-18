"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const text = z.string().trim().min(1);
const optionalText = z.string().trim().optional();

function cents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").replace(/\./g, "").replace(",", ".");
  return Math.round(Number(normalized) * 100);
}

async function authenticated() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;
  if (!ownerId) throw new Error("Sua sessão expirou. Entre novamente.");
  return { supabase, ownerId };
}

export async function createCustomer(formData: FormData) {
  const parsed = z.object({ name: text, phone: optionalText }).safeParse({
    name: formData.get("name"), phone: formData.get("phone"),
  });
  if (!parsed.success) throw new Error("Informe o nome da cliente.");
  const { supabase, ownerId } = await authenticated();
  const { error } = await supabase.from("customers").insert({ owner_id: ownerId, ...parsed.data });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function createCashEntry(formData: FormData) {
  const amountCents = cents(formData.get("amount"));
  const parsed = z.object({
    direction: z.enum(["income", "expense"]), description: text,
    category: text, occurred_on: z.string().date(),
  }).safeParse({
    direction: formData.get("direction"), description: formData.get("description"),
    category: formData.get("category"), occurred_on: formData.get("occurred_on"),
  });
  if (!parsed.success || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Preencha os dados e informe um valor válido.");
  }
  const { supabase, ownerId } = await authenticated();
  const { error } = await supabase.from("cash_entries").insert({ owner_id: ownerId, amount_cents: amountCents, ...parsed.data });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function createSale(formData: FormData) {
  const amountCents = cents(formData.get("amount"));
  const parsed = z.object({
    customer_id: z.string().uuid(), description: optionalText,
    sold_on: z.string().date(), mode: z.enum(["paid_now", "credit", "installments"]),
    due_date: z.string().date(), installment_count: z.coerce.number().int().min(1).max(12),
  }).safeParse({
    customer_id: formData.get("customer_id"), description: formData.get("description"),
    sold_on: formData.get("sold_on"), mode: formData.get("mode"),
    due_date: formData.get("due_date"), installment_count: formData.get("installment_count") || 1,
  });
  if (!parsed.success || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Confira cliente, valor e datas da venda.");
  }

  const { supabase, ownerId } = await authenticated();
  const { data: sale, error: saleError } = await supabase.from("sales").insert({
    owner_id: ownerId, customer_id: parsed.data.customer_id,
    description: parsed.data.description, sold_on: parsed.data.sold_on,
    total_cents: amountCents, mode: parsed.data.mode,
  }).select("id").single();
  if (saleError) throw new Error(saleError.message);

  const count = parsed.data.mode === "installments" ? parsed.data.installment_count : 1;
  const base = Math.floor(amountCents / count);
  const installments = Array.from({ length: count }, (_, index) => {
    const due = new Date(`${parsed.data.due_date}T12:00:00`);
    due.setMonth(due.getMonth() + index);
    return {
      owner_id: ownerId, sale_id: sale.id, installment_number: index + 1,
      due_date: due.toISOString().slice(0, 10),
      amount_cents: base + (index === count - 1 ? amountCents - base * count : 0),
    };
  });
  const { data: created, error: installmentError } = await supabase.from("installments").insert(installments).select("id, amount_cents");
  if (installmentError) throw new Error(installmentError.message);

  if (parsed.data.mode === "paid_now") {
    const first = created?.[0];
    if (!first) throw new Error("Não foi possível registrar o recebimento.");
    const { error } = await supabase.rpc("record_payment", {
      installment_id_input: first.id, amount_cents_input: first.amount_cents, method_input: "pix",
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
}
