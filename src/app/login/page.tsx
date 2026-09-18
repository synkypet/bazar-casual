import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  return (
    <main className="login-page">
      <section className="login-card">
        <Image src="/bazar-casual-logo.png" alt="Bazar Casual" width={150} height={112} priority />
        <div className="login-copy">
          <p className="eyebrow">Gestão financeira</p>
          <h1>Seu bazar organizado, sem caderninho.</h1>
          <p>Entre para acompanhar vendas, gastos e cobranças em um só lugar.</p>
        </div>
        {params.erro && <p className="form-message error">{params.erro}</p>}
        {params.aviso && <p className="form-message success">{params.aviso}</p>}
        <form className="login-form">
          <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" minLength={6} required /></label>
          <button className="primary-button" formAction={login}>Entrar</button>
          <button className="secondary-button" formAction={signup}>Criar primeiro acesso</button>
        </form>
        <small>Os dados de cada acesso ficam separados e protegidos.</small>
      </section>
    </main>
  );
}
