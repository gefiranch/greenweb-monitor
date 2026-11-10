# Footprint and clearer sustained motion

Replace the leaf with two flat footprint silhouettes in the existing silver/slate palette. Keep the cards plain. Preserve all form, globe, navigation, and API behavior.

On hover, give a short entry response, then a clearly visible but restrained continuous motion: a wider dial sweep, layered vertical drift, and alternating foot lifts. Use nested SVG transforms, native CSS easing, fine-pointer/reduced-motion gates, and the existing hidden-tab pause. No runtime dependencies or extra JavaScript animation loops.

## Verification

Desktop browser review confirms the new filled footprints and alternating lifts, reaching approximately 10 SVG units of movement. Leaving the card stops both foot animations. Dial sweep is now +12/-10 degrees; layer movement is 7 SVG units, with staggered timing. Motion remains limited to hover on fine pointers without reduced-motion preference, and pauses in hidden tabs.

93 existing tests, production build, ESM validation, integrated artifact checks, and whitespace checks passed. API tests use synthetic PageSpeed responses and real CO2.js; this UI revision does not verify or change the external API key. No dependencies added.
