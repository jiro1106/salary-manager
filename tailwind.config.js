/**
 * Every value here resolves to a CSS custom property declared once on
 * :root in src/index.css. Components style with utilities (bg-card,
 * rounded-slab, text-title) and never with a raw hex.
 */
export default {
  future: {
    // Compiles every `hover:` inside `@media (hover: hover)`. Without it
    // Tailwind 3 emits a bare `:hover`, which a touch device applies on
    // tap and then leaves applied until something else is tapped — so the
    // Save button stays lifted and its 6px edge stays grown after a save,
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
        punch: "var(--punch)",
        "punch-deep": "var(--punch-deep)",
        zest: "var(--zest)",
        "zest-deep": "var(--zest-deep)",
        lime: "var(--lime)",
        "lime-deep": "var(--lime-deep)",
        aqua: "var(--aqua)",
        "aqua-deep": "var(--aqua-deep)",
        violet: "var(--violet)",
        "violet-deep": "var(--violet-deep)",
        blue: "var(--blue)",
        "blue-edge": "var(--blue-edge)",
        scrim: "var(--scrim)",
        "wash-ink": "var(--wash-ink)",
        "wash-color": "var(--wash-color)",
        // set per card from Category.color; see lib/palette.ts
        cat: "var(--c)",
        "cat-edge": "var(--ce)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-rounded", "Segoe UI", "sans-serif"],
        // Same face; the utility survives as a marker for money and
        // display figures, which are set apart by weight and size.
        display: ["Plus Jakarta Sans", "ui-rounded", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        meta: ["0.8125rem", { lineHeight: "1.5" }],
        ui: ["0.9375rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.6" }],
        title: ["1.1875rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        amt: ["1.4375rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        sec: ["1.8125rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        // `total` is the dial's percentage and `hero` the payday figure —
        // the two display numbers that sit side by side in the deck. They
        // are one rung apart from each other and one rung down from where
        // they started, so the deck leads without shouting.
        total: ["1.25rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        hero: [
          "clamp(1.25rem, 3vw, 1.5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em" },
        ],
        wordmark: ["1.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
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
        "action-blue": "var(--sh-action-blue)",
        "action-blue-lift": "var(--sh-action-blue-lift)",
        "action-blue-press": "var(--sh-action-blue-press)",
        alt: "var(--sh-alt)",
        "alt-lift": "var(--sh-alt-lift)",
        "alt-press": "var(--sh-alt-press)",
        inert: "var(--sh-inert)",
        field: "var(--sh-field)",
      },
      letterSpacing: {
        caps: "0.14em",
        "caps-tight": "0.1em",
        tag: "0.08em",
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
  plugins: [],
};
