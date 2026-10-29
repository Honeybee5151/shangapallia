# Shangapallia

The personal page and interactive **Idea Fragments** reader of **Miles Raven Alv Sunhede** (*From 2025 →*).

- **Live Website:** [https://honeybee5151.github.io/shangapallia/](https://honeybee5151.github.io/shangapallia/)
- **Theme & Emblem:** Built around the original pixel-art fruit emblem and `#111424` midnight blue cover from the *Idea Fragments* book.

## Structure

- `index.html` — Main personal page and interactive book reader layout
- `styles.css` — Midnight blue (`#111424`) & pixel-emblem accent design system (plus optional Paper mode inside the reader)
- `script.js` — Section & theme filtering, live search, keyboard navigation, and deep-linked book reader (`#fragment-1` … `#fragment-15`, `#fragment-0`)
- `data/fragments.js` — Full verbatim text of all Idea Fragments (`Del 1`, `Del 2`, `Del 3`, and `0: Who am i?`)
- `assets/` — Extracted pixel-art emblem (`icon.png`, `favicon.png`) and downloadable PDF (`idea-fragments.pdf`)

## Adding New Idea Fragments

Open `data/fragments.js` and append a new entry to `window.IDEA_FRAGMENTS`:

```js
{
  id: "16",
  numberLabel: "16:",
  part: "Del 3",
  category: "Philosophy & Logic",
  title: "Your Idea Title",
  lead: "A philosophical idea I want to share:",
  blocks: [
    { type: "p", text: "First paragraph..." },
    { type: "p", text: "Second paragraph..." }
  ]
}
```
