# Folder Structure

This document outlines the key directories and configuration files in the `archLegal` repository.

```text
archLegal/
├── app/
│   ├── (auth)/
│   ├── (marketing)/
│   ├── auth/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── landing/
│   ├── layout/
│   ├── providers/
│   └── ui/
├── docs/
│   └── folder-structure.md
├── lib/
├── public/
│   └── docu/
├── supabase/
├── types/
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Directory Notes

- **app/** – Next.js App Router entrypoint containing route groups and global styling.
- **components/** – Shared UI building blocks organized by domain (auth, landing, layout, providers, and shadcn-based UI primitives).
- **docs/** – Project documentation, including this folder structure reference.
- **lib/** – Reusable non-UI utilities and Supabase access helpers.
- **public/** – Static assets served directly, including documentation imagery under `public/docu/`.
- **supabase/** – Supabase configuration, migrations, and related SQL policies.
- **types/** – Shared TypeScript type definitions consumed across the project.

## Configuration Files

- **components.json** – shadcn UI configuration synced with the TweakCN theme.
- **next.config.mjs** – Next.js runtime configuration.
- **postcss.config.js** – PostCSS plugins (Tailwind CSS, autoprefixer, etc.).
- **tailwind.config.ts** – Tailwind CSS theme definitions aligned with TweakCN tokens.
- **tsconfig.json** – TypeScript compiler options for the workspace.
- **next-env.d.ts** – Next.js ambient type declarations (auto-generated).
- **package.json** – Project dependencies and npm scripts.

Refer back to this document whenever you need a quick overview of where features or assets should reside.
