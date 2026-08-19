# String Transformer — Guía para agentes

Herramienta web estática (GitHub Pages) que transforma strings entre 58
formatos: naming conventions, encoding, cifrados, hashes, dev tools y
utilidades de texto multilínea.

Demo: https://nandovejer.github.io/string-transformer/

## Regla de oro

**Todo en vanilla JS, siempre.** Sin frameworks, sin TypeScript, sin
dependencias de runtime. ES modules nativos en el navegador. Node solo se usa
para tooling (tests con `node --test`, el generador de páginas SEO, el CLI) —
siempre sin dependencias externas. El gestor de paquetes es **pnpm** (fijado
con `packageManager` en `package.json`); no uses `npm` ni `yarn`. Pico CSS está vendorizado localmente
(`src/css/vendor/`), no por CDN.

## Comandos

- Servir en local: `pnpm serve` (`pnpm dlx serve .`)
- Tests: `pnpm test` (`node --test`, 82 tests en ficheros `*.test.js`
  co-localizados junto a cada módulo)
- Generar páginas SEO: `pnpm build:seo` (regenera `t/`, `sitemap.xml`,
  `robots.txt` — todo gitignored, se regenera en cada deploy de CI)
- CLI: `node bin/cli.js <mode> "texto"` o `pnpm dlx string-transformer <mode> "texto"`

## Arquitectura

- `index.html` → `index.js` → `src/js/app/app.js` (toda la lógica de UI/DOM) +
  registro del service worker (`sw.js`, PWA offline)
- `src/js/core.js` — registro central: combina todos los módulos de
  transformers en un objeto `transformers` y expone
  `strTo({ mode, str, transformers })`, que:
  - hace `trim()` del input una vez antes de transformar
  - es **async** (algunos transformers como los hashes usan `crypto.subtle`)
  - siempre resuelve `{ ok, value, error }`, nunca lanza — un transformer
    inválido lanza `FormatError` (`src/js/modules/errors.js`) y `strTo` lo
    convierte en `{ ok:false, error: mensaje }`
- `src/js/modules/` — transformers puros por categoría:
  - `basic.js`, `naming.js` (sobre el normalizador `text.js#toWords`),
    `converters.js` (binario/Base64/Morse/HTML entities, todo unicode-safe
    con `TextEncoder`/`TextDecoder`), `encoding.js` (URL/hex/Base64
    URL-safe/Unicode escape/JSON escape/slugify), `hashing.js` (SHA-1/256/512,
    async), `dev.js` (JWT decode, text stats), `ciphers.js` (ROT13, Atbash,
    ROT47, NATO, leetspeak, small caps, fullwidth, zalgo), `textTools.js`
    (utilidades multilínea), `fun.js` (reverse, upside down)
  - `text.js` — `toWords(str)`: entiende espacios, `-`, `_` y límites de
    mayúsculas/acrónimos (`XMLParser` → `["XML", "Parser"]`); base de todos
    los naming conventions
  - `checker.js` — validadores de formato (isBinary, isBase64, isMorse)
  - `detect.js` — auto-detección de formato del input (sugiere modo)
  - `commandMenu.js` — combobox accesible (buscador + categorías + teclado)
    que reemplaza el `<select>` original
  - `utils.js` — helpers de DOM (copiar con feedback, reset, debounce)
  - `passwordGenerator.js` — generador de contraseñas (rejection sampling con
    `crypto.getRandomValues`, entropía real) + `easterEgg.js` — botón oculto en
    el footer (funciona con click y con tap) que abre un `<dialog>` nativo con
    ese generador. Se auto-monta desde `index.js`, no toca `index.html` ni el
    generador de páginas SEO, así aparece en todas las páginas sin duplicar HTML.
- `src/js/data/msg.js` — **fuente única de verdad de la UI**: cada transformer
  tiene `{ title, description, inputLabel, outputLabel, category, format? }`.
  `category` alimenta el menú nuevo y la agrupación de "relacionados" en las
  páginas SEO. `format` es el mensaje de error cuando el transformer valida el
  input (solo lo tienen los que pueden fallar: decodificadores, JWT, etc.)
- `src/js/data/dictionary.js` — mapas de caracteres (morse, upside-down, NATO,
  small caps)
- `src/js/data/opposites.js` — pares de transformers que se invierten entre sí
  (usado por el botón Swap ⇄); los cifrados auto-inversos como ROT13 se listan
  como par de sí mismos
- `scripts/build-seo-pages.mjs` — genera una landing page real por transformer
  (`t/<slug>/`) con ejemplo calculado en build (ejecuta el transformer de
  verdad, no texto inventado), FAQ, JSON-LD, más el hub `t/`, `sitemap.xml` y
  `robots.txt`. Node vanilla, sin dependencias. **No duplica el marcado de la
  app**: lo extrae de `index.html` entre los marcadores `<!-- st:app -->` /
  `<!-- /st:app -->` (y `st:theme-bootstrap`). Si cambias el formulario, cámbialo
  solo en `index.html` y vuelve a generar; si borras un marcador, el build falla.
- `bin/cli.js` — CLI (`string-transformer <mode> "texto"`, soporta stdin y `--list`)

## Cómo añadir un transformer

1. Función pura `(str) => string | Promise<string>` en el módulo de su
   categoría (o uno nuevo, añadiéndolo al spread de `core.js`). Si el input
   puede ser inválido, valida y lanza `new FormatError(msg.<id>.format)` — no
   devuelvas el mensaje de error como si fuera el resultado.
2. Entrada con el **mismo id** en `src/js/data/msg.js`, incluyendo `category`
   — el menú se genera solo desde el registro y hace `msg[id].title`, así que
   sin esa entrada el menú rompe (hay un test que lo comprueba: `core.test.js`).
3. Si tiene transformación inversa, registrar el par en `src/js/data/opposites.js`.
4. Test en un `*.test.js` co-localizado junto al módulo (round-trip si aplica,
   caso UTF-8, string vacío, y el `FormatError` si corresponde).
5. `pnpm build:seo` generará su página automáticamente en el próximo build.

## CSS / UI

- Pico CSS v1.5.10 vendorizado (`src/css/vendor/`) + una capa propia encima.
  Entrada única: `style.css` → `src/css/app.css`, que importa el resto.
- `src/css/tokens.css` es la fuente de verdad del diseño: escalas fluidas con
  `clamp()`, radios, superficies por tema (`--st-surface*`), `--st-tap-target`
  (2.75rem, mínimo de WCAG 2.2) y `--st-font-mono`. Sobrescribe también algunas
  variables de Pico (`--border-radius`, `--spacing`) para que sus componentes
  hereden el look.
- Mobile-first. El layout de los dos paneles usa **container queries** sobre
  `.st-workspace` (no media queries), para que la misma tarjeta funcione
  embebida en las páginas SEO. El breakpoint de los patrones específicos de
  móvil es `48em`, duplicado en `command-menu.css` y `commandMenu.js`
  (`OVERLAY_QUERY`) — si cambias uno, cambia el otro.
- Patrones móviles: barra de acciones fija en la zona del pulgar (`.st-actions`
  con `is-pinned`, que app.js activa vía `IntersectionObserver` solo cuando el
  formulario está en pantalla), selector de transformer como overlay a pantalla
  completa, `env(safe-area-inset-*)` en los bordes y `100svh` en el body.
- Nada de fuentes ni CSS por CDN. Cualquier input debe ser >= 16px de
  `font-size` o iOS Safari hace zoom al enfocarlo.
- El tema se pinta antes del primer frame con el script inline de `<head>`
  (marcador `st:theme-bootstrap`); `app.js` toma el control después.

## Convenciones

- Transformers: funciones puras string → string (o Promise<string>), sin
  tocar el DOM, sin estado.
- El input llega ya con `trim()` aplicado (lo hace `strTo` en `core.js`); no
  volver a trimear dentro del transformer.
- Errores de formato: siempre `FormatError`, nunca un string de error como
  valor de retorno normal.
- Estado de la app: el transformer activo vive en `window.transformerId` vía
  el wrapper `transformerStatus` de `app.js`; se sincroniza con el hash de la
  URL (deep links, reutilizado por las páginas SEO).
- `t/`, `sitemap.xml`, `robots.txt` son build output — no se editan a mano, se
  regeneran con `pnpm build:seo`. **Sí se commitean**: GitHub Pages sirve
  directamente de la rama y no hay workflow de CI que los genere, así que sin
  ellos las 58 landing pages no existen en producción. Si algún día se añade
  CI de build, entonces sí conviene ignorarlos.

## Plan de mejora

El plan por fases (qué se hizo, qué se descartó a propósito y qué queda) está
en `ROADMAP.md`.
