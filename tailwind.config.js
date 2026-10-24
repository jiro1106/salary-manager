/**
 * Every value here resolves to a CSS custom property declared once on
 * :root in src/index.css. Components style with utilities (bg-card,
 * rounded-slab, text-title) and never with a raw hex.
 */
export default {
  future: {
    // Compiles every `hover:` inside `@media (hover: hover)`. Without it
    // Tailwind 3 emits a bare `:hover`, which a touch device applies on
    // tap and then leaves applied until something else is tapped — so a
    // button stays lifted and its 6px edge stays grown after a tap,
    // reading as stuck rather than as pressed. `active:` is untouched and
    // still gives touch its press feedback. Default in Tailwind 4; opt-in
    // here. Removing this reintroduces the stuck state on phones.
    hoverOnlyWhenSupported: true,
  },
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        card: "var(--card)",
        sunk: "var(--sunk)",
        "sunk-deep": "var(--sunk-deep)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        "on-color": "var(--on-color)",
        "on-action": "var(--on-action)",
        // The committing action and every warning that names a
        // consequence. Off the category rotation on purpose.
        action: "var(--action)",
        "action-edge": "var(--action-edge)",
        "action-tint": "var(--action-tint)",
        spent: "var(--spent)",
        zest: "var(--zest)",
        "zest-deep": "var(--zest-deep)",
        "lime-deep": "var(--lime-deep)",
        blue: "var(--blue)",
        scrim: "var(--scrim)",
        "wash-ink": "var(--wash-ink)",
        "wash-color": "var(--wash-color)",
        // set per card from Category.color; see lib/palette.ts
        cat: "var(--c)",
      },
      // Text utilities read their own tokens so dark mode can lift the
      // text without moving the fill of the same name (see index.css).
      textColor: {
        "action-edge": "var(--action-text)",
        spent: "var(--spent-text)",
        "lime-deep": "var(--lime-text)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-rounded", "Segoe UI", "sans-serif"],
        // Same face; the utility survives as a marker for money and
        // display figures, which are set apart by weight and size.
        display: ["Plus Jakarta Sans", "ui-rounded", "Segoe UI", "sans-serif"],
      },
      // Seven distinct measures (11 / 13 / 16 / 19 / 23 / 28 / 32), no two
      // within 1.14 of each other. Ten names map onto them because a name
      // says what a thing is, not how big it is.
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        meta: ["0.8125rem", { lineHeight: "1.5" }],
        // Same measure as `body`, but marks a control's own label (button,
        // field, sub-item row) rather than prose.
        ui: ["1rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.6" }],
        title: ["1.1875rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        amt: ["1.4375rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        sec: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        // The dial's percentage, on `title`'s measure.
        total: ["1.1875rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        // The payday figure. Every other amount derives from it, so it has
        // to clear `amt` (by 1.39 at 32px).
        //
        // The ceiling is 2rem and not higher because the field is
        // `h-control` (48px): 32px at 1.05 is 33.6px of content, which
        // centres inside 48 with room. Going past this means moving
        // --control-h, which moves every full-size button too.
        hero: [
          "clamp(1.75rem, 3.5vw, 2rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em" },
        ],
        // On `amt`'s measure, so the payday figure outranks the brand.
        wordmark: ["1.4375rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        // Two only. `slab` is every surface, `control` is every control.
        slab: "var(--r)",
        control: "var(--r-sm)",
      },
      boxShadow: {
        action: "var(--sh-action)",
        "action-lift": "var(--sh-action-lift)",
        "action-press": "var(--sh-action-press)",
        danger: "var(--sh-danger)",
        "danger-lift": "var(--sh-danger-lift)",
        "danger-press": "var(--sh-danger-press)",
        alt: "var(--sh-alt)",
        "alt-lift": "var(--sh-alt-lift)",
        "alt-press": "var(--sh-alt-press)",
        inert: "var(--sh-inert)",
        field: "var(--sh-field)",
        "field-error": "var(--sh-field-error)",
      },
      letterSpacing: {
        caps: "0.14em",
        "caps-tight": "0.1em",
      },
      // Cancels the trailing letter-space on an optically centred tracked
      // label; pairs with tracking-caps and nothing else.
      textIndent: {
        caps: "0.14em",
      },
      maxWidth: {
        content: "var(--content)",
        prose: "65ch",
        measure: "52ch",
        dialog: "380px",
      },
      spacing: {
        "page-x": "var(--page-x)",
        "page-b": "var(--page-b)",
        "card-x": "var(--card-x)",
        "deck-x": "var(--deck-x)",
        control: "var(--control-h)",
        stack: "var(--stack)",
        gutter: "var(--gutter)",
        split: "var(--split)",
        dial: "var(--dial)",
        hit: "44px",
      },
      transitionTimingFunction: {
        paper: "var(--ease)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        mid: "var(--dur-mid)",
        slow: "var(--dur-slow)",
      },
    },
  },
  plugins: [
    // `narrow:` is the same query `max-[700px]:` compiles to. A variant,
    // not a `screens` entry, because an object screen disables the
    // `max-[…]:` variants the 450px layout still uses.
    ({ addVariant }) => addVariant("narrow", "@media not all and (min-width: 700px)"),
  ],
};
