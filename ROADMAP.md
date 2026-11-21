# ROADMAP — String Transformer

Objetivo: ser **el referente** para transformar un string a cualquier otro formato.
Restricción innegociable: **todo en vanilla JS** (sin frameworks, sin TypeScript,
sin dependencias de runtime). Las devDependencies de tooling están permitidas,
pero se prioriza lo nativo (`node --test`, `crypto.subtle`, ES modules).

**Estado (2026-07-18): Fases 0-5 ejecutadas** en una pasada grande. Ver
"Decisiones y pendientes reales" al final para lo que quedó fuera a propósito.

---

## Fase 0 — Base técnica ✅

- [x] **Tests con `node --test`**: 66 tests en ficheros `*.test.js` co-localizados
      junto a cada módulo, incluyendo los round-trips que antes fallaban.
      `src/test/test.js` (manual) portado y borrado.
- [x] **pnpm scripts**: `test` (`node --test`), `serve` (`pnpm dlx serve .`), `build:seo`.
- [x] **GitHub Actions** (`.github/workflows/deploy.yml`): tests en cada push/PR
      + deploy a GitHub Pages en push a `main` (job `deploy` corre `build:seo`
      antes de publicar). **Pendiente manual**: activar "GitHub Actions" como
      fuente de Pages en Settings → Pages del repo (no se puede hacer por código).
- [ ] ESLint + Prettier — no añadido (ver decisiones al final).
- [x] Gestor de paquetes: pnpm, fijado con `packageManager` en `package.json`.
      `pnpm-lock.yaml` se mantiene aunque no haya dependencias reales.

## Fase 1 — Bugs y deuda actual ✅

### Bugs de transformación

- [x] Round-trip binario arreglado: `checker.isBinary` acepta espacios.
- [x] Binario/UTF-8 reales vía `TextEncoder`/`TextDecoder` (bytes UTF-8, no UTF-16).
- [x] `ASCIIToBase64`/`base64ToASCII` unicode-safe, ya no revientan con `€`/emoji.
- [x] `camelCase` corregido (`helloWorld`, no `HelloWorld`) + normalizador
      `toWords()` compartido (`src/js/modules/text.js`) que entiende espacios,
      `-`, `_` y límites de mayúsculas/acrónimos. Todos los naming reescritos sobre él.
- [x] Morse: unificado con el resto (lanza `FormatError` igual que binario/Base64).
- [x] `strTo` ya no revienta con modo desconocido: devuelve `{ ok:false, error:null }`.

### Deuda de código

- [x] Estado del transformer sigue en `window.transformerId` pero centralizado
      en `transformerStatus` de `app.js` (no se extrajo a módulo aparte — bajo
      riesgo, no bloqueaba nada más).
- [x] `console.log` de producción eliminados; `test.js` ya no se importa.
- [x] Errores estructurados: `strTo` devuelve `{ ok, value, error }`; la UI
      muestra `error` en `#formatAlert` (el `span[role=alert]` ahora sí se usa).
- [x] `transformerId` muerto en `initEvents` eliminado.
- [x] `MAP_UPSIDE_DOWN` sin usar en `converters.js` eliminado.
- [x] `createMenu`/`DOMParser` reemplazado por el nuevo `commandMenu.js`
      (construido con `document.createElement`, sin `innerHTML` de datos).

### HTML / accesibilidad

- [x] `aria-labelledby="input"` quitado de Reset/Copy; ahora usan su propio texto.
- [x] Output: `disabled` → `readonly` + `aria-live="polite"`.
- [x] `<title>` corregido a "String Transformer" (con sufijo SEO).
- [x] Botones no-submit dentro del `<form>` ahora son `type="button"`.
- [x] Bonus: `aria-describedby="formatAlert"` en el input para anunciar el error
      como descripción, no como nombre accesible.

### Dependencias / assets

- [x] Pico CSS v1.5.10 vendorizado en `src/css/vendor/pico.min.css` (pineado, sin CDN). **Sustituido** por el sistema de diseño LUZ (`src/css/vendor/luz/`) en el rediseño de la rama `feat/convertio-redesign`.
- [x] Favicon SVG propio (`favicon.svg`), sin dependencias externas.

## Fase 2 — Nuevas transformaciones ✅

De 22 transformers se pasó a **58**, organizados en 8 categorías (campo
`category` en cada entrada de `msg.js`, usado por el menú nuevo):

- **Naming Conventions** (+5): Title Case, Sentence case, dot.case, path/case, Random Case
- **Encoding** (+11): URL encode/decode, hex ↔ texto, Base64 URL-safe, Unicode
  escape/unescape, JSON escape/unescape, slugify
- **Ciphers & Codes** (+9): ROT13, Atbash, ROT47, texto ↔ alfabeto NATO,
  leetspeak, small caps, fullwidth, zalgo
- **Hashing** (+3, async vía `crypto.subtle`): SHA-1, SHA-256, SHA-512
- **Dev Tools** (+2): JWT decode (solo payload, sin verificar firma), Text Stats
- **Text Tools** (+6): quitar espacios/líneas vacías, ordenar, deduplicar,
  invertir orden de líneas

**Killer features:**

- [x] **Swap ⇄**: `src/js/data/opposites.js` centraliza los pares (incluye
      cifrados auto-inversos como ROT13/Atbash/ROT47) + botón en la UI.
- [x] **Auto-detección**: `src/js/modules/detect.js` sugiere modo (JWT, binario,
      Morse, Base64, hex, URL-encoded) con chip "Switch to X".
- [x] **Deep links**: `#camelCase` activa el modo al cargar; se sincroniza sin
      ensuciar el historial (`history.replaceState`). Reutilizado por las
      páginas SEO de la Fase 4.
- [ ] **Pipeline** (encadenar transformaciones) — no implementado, ver decisiones.

## Fase 3 — UX / UI ✅

- [x] Transformación en vivo: evento `input` + debounce 150 ms (antes `change`).
- [x] Menú nuevo: combobox accesible con buscador, categorías y atajo `Ctrl/Cmd+K`
      (`src/js/modules/commandMenu.js`), sigue el patrón ARIA de combobox+listbox.
- [x] Copy feedback ("Copied ✓" 2 s) + deep links con el modo en el hash.
- [x] Tema claro/oscuro con toggle, persistido en `localStorage`.
- [x] Layout 2 columnas input/output en desktop + contadores de caracteres.
- [x] Error de formato ahora vive en su propio `role="alert"`, no dentro del output.
- [x] **PWA**: `manifest.json` + `sw.js` (stale-while-revalidate) + registro en `index.js`.
- [ ] i18n ES/EN — no implementado, ver decisiones.

## Fase 4 — SEO ✅

- [x] **Página estática por transformer**: `scripts/build-seo-pages.mjs` (Node
      vanilla, cero dependencias) genera `t/<slug>/index.html` para las 58
      transformaciones a partir de `msg.js` — con H1, tabla de ejemplo
      **calculada en build ejecutando el transformer real** (no texto inventado),
      FAQ (reversibilidad real vía `opposites.js`, UTF-8, privacidad), JSON-LD
      (`SoftwareApplication` + `FAQPage`), canonical, y enlaces a relacionados
      por categoría. Cada página monta la app real (mismo JS/CSS) con el modo
      preseleccionado por hash.
- [x] Hub `t/index.html` con todas las categorías/páginas enlazadas + link desde
      el footer de la home.
- [x] `sitemap.xml` + `robots.txt` generados por el mismo script.
- [x] Meta description, Open Graph, Twitter Card, JSON-LD en la home también.
- [x] Favicon + `manifest.json`.
- [x] `t/`, `sitemap.xml`, `robots.txt` son build output (gitignored, regenerados
      en CI antes del deploy).
- [ ] `og:image` — no generado (necesita una imagen raster/diseño, no automatizable
      con las herramientas disponibles). Ver decisiones.
- [ ] Lighthouse 100 — no verificado en esta pasada (sin navegador headless a mano).
- [ ] i18n `/es/` con `hreflang` — depende de la i18n de Fase 3, no hecha.
- [ ] **SEO del repo GitHub** (description, topics, social preview) — requiere
      acción manual en GitHub Settings, no es código.

## Fase 5 — Distribución ✅ (parcial)

- [x] `package.json` con `type:module`, `exports` (`.` → `src/js/core.js`) y
      `bin` (`string-transformer` → `bin/cli.js`), listo para publicar.
- [x] Mini CLI vanilla (`bin/cli.js`): `string-transformer <mode> "texto"`,
      soporta stdin (`echo "x" | string-transformer sha256`) y `--list`.
- [x] API documentada en el README con ejemplo de import.
- [ ] `pnpm publish` real — acción manual del usuario (requiere su cuenta/login npm).

---

## Decisiones y pendientes reales

Cosas descartadas o pospuestas a propósito, con el motivo:

- **`Header-Case` y `aLtErNaTiNg case`** del plan original de Fase 2 no se
  añadieron: son literalmente el mismo resultado que `trainCase` y
  `spongebobCase` ya existentes — habría sido una feature duplicada.
- **César con desplazamiento configurable**: necesita un input numérico extra
  por transformer (la UI actual es un único textarea genérico). Se implementó
  en su lugar ROT13/ROT47 (desplazamientos fijos, sin UI nueva). Añadir un
  parámetro por-transformer es un cambio de arquitectura de UI, no una función suelta.
- **Pipeline (encadenar transformaciones)**: la killer feature más grande y la
  única que de verdad necesita una UI nueva (lista de pasos, reordenar,
  añadir/quitar). Se dejó fuera para no bajar la calidad del resto; es el
  candidato más claro para la siguiente sesión.
- **i18n ES/EN**: `msg.js` ya está centralizado y listo para un segundo idioma,
  pero añadir el selector + duplicar textos + `hreflang` es su propio bloque
  de trabajo, no se hizo en esta pasada.
- **`og:image`**: un JPG/PNG de marca necesita diseño real; no hay herramienta
  de generación de imágenes en este entorno. El resto de Open Graph sí está.
- **ESLint/Prettier**: no se añadieron para no meter devDependencies sin que el
  usuario las pidiera explícitamente; es una mejora de bajo riesgo para cuando
  se quiera.
- **SEO del propio repo de GitHub** (description, topics, social preview image,
  activar Pages con "GitHub Actions" como source): son clics en GitHub
  Settings, no cambios de código — quedan como tareas manuales para el usuario.
- **Lighthouse / verificación de performance real**: no se corrió un audit
  real (necesitaría Chrome headless); la app no tiene peticiones a CDN ni
  bloqueos obvios, pero no está medido.

---

## Próximos pasos sugeridos

1. Activar Pages → "GitHub Actions" como source en Settings (desbloquea el deploy).
2. Pipeline de transformaciones encadenadas (la killer feature que falta).
3. i18n ES/EN sobre `msg.js`.
4. `pnpm publish` cuando el usuario quiera distribuir el paquete.
5. Diseñar un `og:image` real y correr un audit de Lighthouse.
