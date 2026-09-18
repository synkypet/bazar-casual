# Bazar Casual — Gestão financeira

Sistema mobile-first para controle interno do Bazar Casual. O produto organiza clientes, vendas à vista, fiado, parcelamentos, recebimentos parciais, despesas e alertas de cobrança.

## Escopo do MVP

- Painel de entradas, despesas, saldo e valores a receber
- Cadastro de clientes
- Vendas pagas, fiadas e parceladas
- Pagamentos totais e parciais
- Cobranças próximas e atrasadas
- Histórico e lançamentos manuais
- Uso individual com autenticação

Estoque, emissão fiscal e integrações com WhatsApp não fazem parte da primeira versão.

## Tecnologias

- Next.js 16 com App Router e TypeScript
- Supabase Auth + Postgres com RLS
- Vercel

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e informe a URL e a chave pública do projeto Supabase.

## Banco de dados

As alterações do banco ficam em `supabase/migrations`. Todas as tabelas expostas usam RLS e isolam registros por `owner_id`.
