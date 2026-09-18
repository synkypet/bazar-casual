"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, CircleDollarSign, HandCoins, Home, LogOut, Menu, Plus, ReceiptText, Settings, ShoppingBag, Users, WalletCards, X } from "lucide-react";
import { createCashEntry, createCustomer, createSale } from "@/app/actions";
import { logout } from "@/app/login/actions";

type Props = {
  customers: { id: string; name: string }[];
  summary: { incomeCents: number; expenseCents: number; receivableCents: number; overdueCents: number; soonCents: number };
  alerts: { id: string; customer: string; description: string; dueDate: string; amountCents: number; overdue: boolean }[];
};

const navItems = [
  { label: "Início", icon: Home, active: true }, { label: "Clientes", icon: Users },
  { label: "Cobranças", icon: WalletCards }, { label: "Movimentações", icon: ReceiptText, desktopOnly: true },
  { label: "Configurações", icon: Settings, desktopOnly: true },
];
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const today = () => new Date().toISOString().slice(0, 10);

function MoneyCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof WalletCards; tone: "pink" | "green" | "amber" }) {
  return <article className="money-card"><span className={`icon-badge ${tone}`}><Icon size={18} /></span><div><p>{label}</p><strong>{value}</strong></div></article>;
}

export function DashboardShell({ customers, summary, alerts }: Props) {
  const [modal, setModal] = useState<"menu" | "customer" | "sale" | "cash" | null>(null);
  const close = () => setModal(null);
  const run = (action: (data: FormData) => Promise<void>) => async (data: FormData) => { await action(data); close(); };
  const balance = summary.incomeCents - summary.expenseCents;

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="brand-lockup"><Image src="/bazar-casual-logo.png" alt="Bazar Casual" width={92} height={72} priority /></div>
      <nav className="desktop-nav">{navItems.map(({ label, icon: Icon, active }) => <button className={active ? "nav-item active" : "nav-item"} key={label}><Icon size={20} /><span>{label}</span></button>)}</nav>
      <form action={logout}><button className="nav-item logout-button"><LogOut size={19} />Sair</button></form>
      <div className="sidebar-note"><span className="note-mark">BC</span><div><strong>Bazar Casual</strong><span>Gestão financeira</span></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">BC</span><div><strong>Bazar Casual</strong><span>Gestão financeira</span></div></div><div className="topbar-actions"><button className="icon-button" aria-label="Abrir alertas"><Bell size={20} /></button><button className="primary-button desktop-register" onClick={() => setModal("menu")}><Plus size={19} />Registrar</button></div></header>
      <section className="dashboard">
        <div className="dashboard-heading"><div><p className="eyebrow">Visão geral</p><h1>Olá! Vamos organizar o caixa?</h1><p className="heading-copy">Acompanhe o que entrou, saiu e ainda falta receber.</p></div><span className="period-label">Este mês</span></div>
        <section className="balance-panel" aria-label="Resumo do caixa"><div className="balance-main"><div className="balance-label"><span>Saldo do período</span><CircleDollarSign size={19} /></div><strong>{money(balance)}</strong><p>{summary.incomeCents || summary.expenseCents ? "Valores registrados neste mês." : "Você ainda não registrou movimentações neste mês."}</p></div><div className="balance-divider" /><div className="balance-stat"><span className="stat-icon income"><ArrowDownLeft size={17} /></span><div><span>Entradas</span><strong>{money(summary.incomeCents)}</strong></div></div><div className="balance-stat"><span className="stat-icon expense"><ArrowUpRight size={17} /></span><div><span>Despesas</span><strong>{money(summary.expenseCents)}</strong></div></div></section>
        <section className="money-grid"><MoneyCard label="A receber" value={money(summary.receivableCents)} icon={WalletCards} tone="pink" /><MoneyCard label="Em atraso" value={money(summary.overdueCents)} icon={Bell} tone="amber" /><MoneyCard label="Vencem em breve" value={money(summary.soonCents)} icon={HandCoins} tone="green" /></section>
        <div className="content-grid"><section className="attention-card"><div className="section-title-row"><div><p className="eyebrow">Cobranças</p><h2>Precisa de atenção</h2></div></div>{alerts.length ? <div className="alert-list">{alerts.map((alert) => <article className="alert-row" key={alert.id}><span className={alert.overdue ? "alert-dot overdue" : "alert-dot"} /><div><strong>{alert.customer}</strong><small>{alert.description} · vence {new Date(`${alert.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small></div><b>{money(alert.amountCents)}</b></article>)}</div> : <div className="empty-attention"><span className="empty-icon"><Bell size={24} /></span><strong>Tudo em dia por aqui</strong><p>Quando uma parcela estiver próxima ou atrasada, ela aparece neste espaço.</p></div>}</section>
        <section className="start-card"><span className="start-kicker">REGISTRO RÁPIDO</span><h2>Seu controle começa aqui</h2><p>Cadastre uma cliente ou registre a primeira movimentação do bazar.</p><div className="start-actions"><button className="primary-button" onClick={() => setModal("menu")}><Plus size={18} />Registrar agora</button><button className="secondary-button" onClick={() => setModal("customer")}><Users size={18} />Nova cliente</button></div></section></div>
      </section>
    </main>
    <button className="floating-register" onClick={() => setModal("menu")}><Plus size={21} />Registrar</button>
    <nav className="bottom-nav">{navItems.filter((item) => !item.desktopOnly).map(({ label, icon: Icon, active }) => <button className={active ? "bottom-item active" : "bottom-item"} key={label}><Icon size={21} /><span>{label}</span></button>)}<button className="bottom-item"><Menu size={21} /><span>Mais</span></button></nav>

    {modal && <div className="modal-backdrop" onMouseDown={close}><section className="register-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="sheet-heading"><div><p className="eyebrow">Registro rápido</p><h2>{modal === "menu" ? "O que você quer registrar?" : modal === "customer" ? "Nova cliente" : modal === "sale" ? "Nova venda" : "Movimentação do caixa"}</h2></div><button className="icon-button" aria-label="Fechar" onClick={close}><X size={20} /></button></div>
      {modal === "menu" && <div className="quick-action-list"><button className="quick-action" onClick={() => setModal("sale")}><span className="quick-icon pink"><ShoppingBag size={21} /></span><span className="quick-copy"><strong>Nova venda</strong><small>À vista, fiado ou parcelada</small></span><ArrowRight size={18} /></button><button className="quick-action" onClick={() => setModal("cash")}><span className="quick-icon dark"><ArrowUpRight size={21} /></span><span className="quick-copy"><strong>Entrada ou despesa</strong><small>Registre uma movimentação do caixa</small></span><ArrowRight size={18} /></button><button className="quick-action" onClick={() => setModal("customer")}><span className="quick-icon green"><Users size={21} /></span><span className="quick-copy"><strong>Nova cliente</strong><small>Nome e telefone para identificação</small></span><ArrowRight size={18} /></button></div>}
      {modal === "customer" && <form className="entry-form" action={run(createCustomer)}><label>Nome<input name="name" required autoFocus /></label><label>WhatsApp<input name="phone" inputMode="tel" placeholder="(00) 00000-0000" /></label><button className="primary-button">Salvar cliente</button></form>}
      {modal === "cash" && <form className="entry-form" action={run(createCashEntry)}><label>Tipo<select name="direction"><option value="expense">Despesa</option><option value="income">Entrada extra</option></select></label><label>Descrição<input name="description" required autoFocus placeholder="Ex.: sacolas para entrega" /></label><label>Categoria<input name="category" required defaultValue="Outros" /></label><label>Valor<input name="amount" required inputMode="decimal" placeholder="0,00" /></label><label>Data<input name="occurred_on" type="date" required defaultValue={today()} /></label><button className="primary-button">Salvar movimentação</button></form>}
      {modal === "sale" && <form className="entry-form" action={run(createSale)}><label>Cliente<select name="customer_id" required defaultValue=""><option value="" disabled>Selecione</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>{!customers.length && <p className="form-hint">Cadastre uma cliente antes da primeira venda.</p>}<label>Descrição<input name="description" placeholder="Ex.: vestido floral" /></label><label>Valor total<input name="amount" required inputMode="decimal" placeholder="0,00" /></label><label>Forma<select name="mode"><option value="paid_now">Pago agora</option><option value="credit">Fiado</option><option value="installments">Parcelado</option></select></label><label>Data da venda<input name="sold_on" type="date" required defaultValue={today()} /></label><label>Primeiro vencimento<input name="due_date" type="date" required defaultValue={today()} /></label><label>Quantidade de parcelas<input name="installment_count" type="number" min="1" max="12" defaultValue="1" /></label><button className="primary-button" disabled={!customers.length}>Salvar venda</button></form>}
    </section></div>}
  </div>;
}
