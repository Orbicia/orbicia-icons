# orbicia-icons

React icon library for Orbicia projects.

## Install
```bash
npm i @orbicia/icons
````

## Usage

```tsx
import { HomeIcon } from "@orbicia/icons";

export function App() {
  return (
    <>
      {/* Default: outline, size 24, color black */}
      <HomeIcon />

      {/* Fill variant */}
      <HomeIcon type="fill" />

      {/* Custom size */}
      <HomeIcon size={32} />

      {/* Custom color */}
      <HomeIcon size={24} style={{ color: "red" }} />

      {/* Outline variant with custom color */}
      <HomeIcon type="outline" style={{ color: "#2563eb" }} />
    </>
  );
}
```

---

## Icon variants

Some icons provide multiple variants:

* `outline`
* `fill`

If a variant is not available, the icon automatically falls back to the closest available one.

```tsx
<HomeIcon type="fill" />
<HomeIcon type="outline" />
```

---

## Props

All icons accept standard SVG props plus a few custom ones:

|      Prop | Type                  | Default     | Description                  |
| --------: | --------------------- | ----------- | ---------------------------- |
|      size | `number \| string`    | `24`        | Icon width & height          |
|      type | `"fill" \| "outline"` | `"outline"` | Icon variant                 |
|     style | `React.CSSProperties` | –           | Override color using `color` |
| className | `string`              | –           | Style via CSS / Tailwind     |

> Icons use `currentColor`.
> Default color is **black**, and can be overridden via `style` or CSS.

---

## Example with Tailwind CSS

```tsx
<HomeIcon className="text-red-500" size={20} />
<HomeIcon className="text-blue-600" type="fill" />
```

---

## License

MIT