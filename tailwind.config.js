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
      // Seven distinct measures — 11 / 13 / 16 / 19 / 23 / 28 / 32 — and no
      // two of them are within 1.14 of each other. Ten names still resolve
      // onto those seven, because a name is where a component says what a
      // thing *is* and merging the names would mean editing every call site
      // to say the same thing in fewer words.
      //
      // It used to be nine measures inside 11–29, three of which were
      // invisible: ui/body were 15 and 16, total/title were 20 and 19, and
      // hero/wordmark were 24 and 24. A step you cannot see is not a step,
      // and the crowding cost the one figure that mattered — see `hero`.
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        meta: ["0.8125rem", { lineHeight: "1.5" }],
        // Same measure as `body`, kept as a separate name because it marks
        // a different thing: a control's own label (button, field, sub-item
        // row) rather than prose. It was 15 against body's 16, which is a
        // 1.07 step — under any threshold at which two sizes read as two.
        ui: ["1rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.6" }],
        title: ["1.1875rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        amt: ["1.4375rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        sec: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        // The dial's percentage, on `title`'s measure. It was 20 against
        // title's 19 and it is read inside a 110px disc, where a rung of
        // size buys nothing the disc doesn't already give it. CutDial's
        // `figureSize` guard still steps a runaway total down to `text-title`
        // — the two are the same size now, so that guard is a no-op rather
        // than a bug, and it stays for the day the measures diverge again.
        total: ["1.1875rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        // The payday figure, and the reason the whole scale moved. Every
        // other number on the page is `salary * percent / 100`, so this is
        // the source and the rest are derivatives — but at a 24px ceiling it
        // tied `amt` (23) exactly, and there are three to five cards each
        // printing an `amt`. The source was outweighed by its own output,
        // N to 1. At 32 it clears `amt` by 1.39 and there is only one of it.
        //
        // The ceiling is 2rem and not higher because the field is
        // `h-control` (48px) and shares that row with the Save button:
        // 32px at 1.05 is 33.6px of content, which centres inside 48 with
        // room. Going past this means moving --control-h, which moves the
        // button too.
        hero: [
          "clamp(1.75rem, 3.5vw, 2rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em" },
        ],
        // On `amt`'s measure. It was 24, which tied the old hero — the
        // brand and the money read at one level. The payday now leads it
        // by 1.39, which is the ordering this screen wants.
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
