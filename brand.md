# Brand — HUSH

HUSH is a next-generation, on-chain Donor Advised Fund (DAF). It transforms static crypto donations into high-performance, private financial instruments.

_Updated on 2026-05-11 to "Dark Jewel" aesthetic._

## Palette — Dark Jewel

**Vibe:** royal · mysterious · high-contrast
**Category:** defi · privacy · luxury
**Mood:** opulent

### Seeds

| Role | OKLCH | Hex |
|---|---|---|
| bg-base | `oklch(0.08 0.04 280)` | `#0B0612` |
| bg-elevated | `oklch(0.12 0.05 280)` | `#140C22` |
| primary (Gold) | `oklch(0.78 0.14 85)` | `#D4AF37` |
| accent-purple | `oklch(0.40 0.15 280)` | `#4C1D95` |
| accent-green | `oklch(0.45 0.12 165)` | `#065F46` |
| fg-base | `oklch(0.96 0.01 280)` | `#F4F0F6` |

### shadcn tokens (applied to `app/globals.css`)

**Dark mode (`.dark`):**

```css
--background: oklch(0.08 0.04 280);
--foreground: oklch(0.96 0.01 280);
--primary: oklch(0.78 0.14 85);
--primary-foreground: oklch(0.10 0 0);
--card: oklch(0.12 0.05 280);
--border: oklch(0.20 0.06 280);
```

## Typography — Cabinet Grotesk + Satoshi

- **Display:** Cabinet Grotesk
- **Body:** Satoshi
- **Mono:** JetBrains Mono

## Gradients

### Gold Metallic

```css
--gradient-gold: linear-gradient(135deg, #8E6E2E 0%, #CBB067 25%, #EED993 50%, #CBB067 75%, #8E6E2E 100%);
```

### Deep Void (Purple/Green)

```css
--gradient-void: radial-gradient(circle at top right, #4C1D95 0%, #065F46 100%);
```

## Tone and voice

### Words to use

confidential, opulent, sovereign. Lean into high contrast and deep textures. 

### Words to avoid

"minimal", "bright", "accessible", "simple".

### Voice example

> Privacy is the ultimate luxury. Secure your legacy in the void.
