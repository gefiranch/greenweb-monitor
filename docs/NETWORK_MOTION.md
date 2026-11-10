# Living network globe and instrument cards

Retain the black/silver visual direction, hemisphere composition, headline gradient, spacious URL field and impact labels. Remove the example action and redundant privacy sentence from the form. Use the globe as the focal point: brighter continental dots, a clean atmospheric rim, travelling connection trails and responsive dot ripples on hover.

Palette: black #000000, graphite #121212, slate #667b98, ice #b8d4f7, silver #e8eff8. Keep existing system typography and centered hero, with left-aligned card copy. The feature artwork expresses its subject: a calibration dial, a data-layer assembly and a molecular orbit. Their hover motion changes rotation, illumination and construction rather than simply shifting the whole illustration.

Use native Canvas and inline SVG/CSS only. Keep the globe at 30 fps/DPR 1.5 with offscreen, hidden-tab and reduced-motion suspension. Card loops run only while hovered on a fine pointer; hidden tabs pause them. No extra media, framework or animation library.

Verified: 100 tests pass, production build and Worker artifact checks pass, and no whitespace errors. Browser QA confirmed the removed form elements, 360px layout without horizontal overflow, successful fixture analysis, the new globe, and sustained needle/layer/orbit animation transforms on hover. Google PageSpeed responses used in UI QA were synthetic; the live Google API was not verified. The existing offscreen/hidden/reduced-motion globe tests continue to pass.
