"use client";

import Image from "next/image";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, ChevronDown,
  CircleDollarSign, HandCoins, Home, Menu, Plus, ReceiptText,
  Search, Settings, ShoppingBag, Users, WalletCards, X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Início", icon: Home, active: true },
  { label: "Clientes", icon: Users },
  { label: "Cobranças", icon: WalletCards },
  { label: "Movimentações", icon: ReceiptText, desktopOnly: true },
  { label: "Configurações", icon: Settings, desktopOnly: true },
];

const quickActions = [
  { label: "Nova venda", description: "À vista, fiado ou parcelada", icon: ShoppingBag, tone: "pink" },
  { label: "Nova despesa", description: "Registre um gasto do bazar", icon: ArrowUpRight, tone: "dark" },
  { label: "Receber pagamento", description: "Quite ou abata uma cobrança", icon: HandCoins, tone: "green" },
];

function MoneyCard({ label, value, icon: Icon, tone }: {
  label: string;
  value: string;
  icon: typeof WalletCards;
  tone: "pink" | "green" | "amber";
}) {
  return (
    <article className="money-card">
      <span className={`icon-badge ${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={2.2} /></span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </article>
  );
}

export function DashboardShell() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand-lockup">
          <Image src="/bazar-casual-logo.png" alt="Bazar Casual" width={92} height={72} priority />
        </div>
        <nav className="desktop-nav">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button className={active ? "nav-item active" : "nav-item"} key={label}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-mark">BC</span>
          <div><strong>Bazar Casual</strong><span>Gestão financeira</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">BC</span>
            <div><strong>Bazar Casual</strong><span>Gestão financeira</span></div>
          </div>
          <div className="topbar-actions">
            <button className="icon-button search-button" aria-label="Buscar"><Search size={20} /></button>
            <button className="icon-button" aria-label="Abrir alertas"><Bell size={20} /></button>
            <button className="primary-button desktop-register" onClick={() => setRegisterOpen(true)}>
              <Plus size={19} />Registrar
            </button>
          </div>
        </header>

        <section className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">Visão geral</p>
              <h1>Olá! Vamos organizar o caixa?</h1>
              <p className="heading-copy">Acompanhe o que entrou, saiu e ainda falta receber.</p>
            </div>
            <div className="period-picker">
              <button onClick={() => setPeriodOpen((open) => !open)} aria-expanded={periodOpen}>
                Este mês <ChevronDown size={17} />
              </button>
              {periodOpen && (
                <div className="period-menu">
                  <button onClick={() => setPeriodOpen(false)}>Hoje</button>
                  <button onClick={() => setPeriodOpen(false)}>Esta semana</button>
                  <button className="selected" onClick={() => setPeriodOpen(false)}>Este mês</button>
                </div>
              )}
            </div>
          </div>

          <section className="balance-panel" aria-label="Resumo do caixa">
            <div className="balance-main">
              <div className="balance-label"><span>Saldo do período</span><CircleDollarSign size={19} /></div>
              <strong>R$ 0,00</strong>
              <p>Você ainda não registrou movimentações neste mês.</p>
            </div>
            <div className="balance-divider" />
            <div className="balance-stat">
              <span className="stat-icon income"><ArrowDownLeft size={17} /></span>
              <div><span>Entradas</span><strong>R$ 0,00</strong></div>
            </div>
            <div className="balance-stat">
              <span className="stat-icon expense"><ArrowUpRight size={17} /></span>
              <div><span>Despesas</span><strong>R$ 0,00</strong></div>
            </div>
          </section>

          <section className="money-grid" aria-label="Valores a receber">
            <MoneyCard label="A receber" value="R$ 0,00" icon={WalletCards} tone="pink" />
            <MoneyCard label="Em atraso" value="R$ 0,00" icon={Bell} tone="amber" />
            <MoneyCard label="Vencem em breve" value="R$ 0,00" icon={HandCoins} tone="green" />
          </section>

          <div className="content-grid">
            <section className="attention-card">
              <div className="section-title-row">
                <div><p className="eyebrow">Cobranças</p><h2>Precisa de atenção</h2></div>
                <button className="text-button">Ver todas <ArrowRight size={16} /></button>
              </div>
              <div className="empty-attention">
                <span className="empty-icon"><Bell size={24} /></span>
                <strong>Tudo em dia por aqui</strong>
                <p>Quando uma parcela estiver próxima ou atrasada, ela aparece neste espaço.</p>
              </div>
            </section>

            <section className="start-card">
              <span className="start-kicker">PRIMEIROS PASSOS</span>
              <h2>Seu controle começa aqui</h2>
              <p>Cadastre uma cliente ou registre a primeira movimentação do bazar.</p>
              <div className="start-actions">
                <button className="primary-button" onClick={() => setRegisterOpen(true)}><Plus size={18} /> Registrar agora</button>
                <button className="secondary-button"><Users size={18} /> Nova cliente</button>
              </div>
            </section>
          </div>
        </section>
      </main>

      <button className="floating-register" onClick={() => setRegisterOpen(true)}><Plus size={21} /> Registrar</button>

      <nav className="bottom-nav" aria-label="Navegação principal no celular">
        {navItems.filter((item) => !item.desktopOnly).map(({ label, icon: Icon, active }) => (
          <button className={active ? "bottom-item active" : "bottom-item"} key={label}>
            <Icon size={21} /><span>{label}</span>
          </button>
        ))}
        <button className="bottom-item"><Menu size={21} /><span>Mais</span></button>
      </nav>

      {registerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setRegisterOpen(false)}>
          <section className="register-sheet" role="dialog" aria-modal="true" aria-labelledby="register-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-heading">
              <div><p className="eyebrow">Registro rápido</p><h2 id="register-title">O que você quer registrar?</h2></div>
              <button className="icon-button" aria-label="Fechar" onClick={() => setRegisterOpen(false)}><X size={20} /></button>
            </div>
            <div className="quick-action-list">
              {quickActions.map(({ label, description, icon: Icon, tone }) => (
                <button className="quick-action" key={label}>
                  <span className={`quick-icon ${tone}`}><Icon size={21} /></span>
                  <span className="quick-copy"><strong>{label}</strong><small>{description}</small></span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
