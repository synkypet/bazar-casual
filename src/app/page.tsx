import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const [customersResult, cashResult, installmentsResult, paymentsResult, salesResult] = await Promise.all([
    supabase.from("customers").select("id,name").eq("is_active", true).order("name"),
    supabase.from("cash_entries").select("direction,amount_cents").gte("occurred_on", monthStart).is("voided_at", null),
    supabase.from("installment_balances").select("id,sale_id,due_date,outstanding_cents,status").gt("outstanding_cents", 0).order("due_date"),
    supabase.from("payments").select("amount_cents,paid_at").gte("paid_at", `${monthStart}T00:00:00`).is("voided_at", null),
    supabase.from("sales").select("id,customer_id,description").is("voided_at", null),
  ]);
  const cash = cashResult.data ?? [];
  const paymentIncome = (paymentsResult.data ?? []).reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const otherIncome = cash.filter((item) => item.direction === "income").reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const expenses = cash.filter((item) => item.direction === "expense").reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const pending = installmentsResult.data ?? [];
  const sales = new Map((salesResult.data ?? []).map((sale) => [sale.id, sale]));
  const customers = new Map((customersResult.data ?? []).map((customer) => [customer.id, customer.name]));
  const alerts = pending.slice(0, 5).map((item) => {
    const sale = sales.get(item.sale_id);
    return { id: item.id, customer: sale ? customers.get(sale.customer_id) ?? "Cliente" : "Cliente",
      description: sale?.description || "Venda", dueDate: item.due_date,
      amountCents: Number(item.outstanding_cents), overdue: item.due_date < today };
  });

  return <DashboardShell customers={customersResult.data ?? []} summary={{
    incomeCents: paymentIncome + otherIncome, expenseCents: expenses,
    receivableCents: pending.reduce((sum, item) => sum + Number(item.outstanding_cents), 0),
    overdueCents: pending.filter((item) => item.due_date < today).reduce((sum, item) => sum + Number(item.outstanding_cents), 0),
    soonCents: pending.filter((item) => item.due_date >= today && item.due_date <= soon.toISOString().slice(0, 10)).reduce((sum, item) => sum + Number(item.outstanding_cents), 0),
  }} alerts={alerts} />;
}
