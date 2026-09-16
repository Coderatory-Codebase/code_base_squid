# UI Composition Instructions

The default web foundation is shadcn/ui, Tailwind CSS, and CSS-variable design tokens.
Before creating UI, check whether shadcn already supplies the primitive. Generate and use
that primitive under the configured `components/ui` root instead of building a parallel
Button, Input, Dialog, Card, or other named primitive.

Compose upward in this order:

```text
shadcn primitive -> generic element -> generic component -> composition
-> feature UI -> application UI -> page/route
```

A lower layer never imports a higher layer. Generic UI must not know about features or
application-specific components. Pages stay thin: they connect configuration or application
capabilities and compose UI below them; they do not own reusable markup, validation, shared
types, or business behavior.

Create custom UI only when no suitable primitive exists, when a reusable composition of
primitives is needed, or when a meaningful repeated visual pattern exists. Split by semantic
responsibility, not JSX size. Keep component-private prop types local and move only real
cross-boundary contracts to the owning type package.

Prefer theme tokens and reusable components over repeated application-specific utility
conventions. `packages/ui` is available when UI is genuinely reused across applications;
do not create it or copy app pages into it before that reuse exists. Product branding may
extend tokens later but must not introduce a competing design system by default.
