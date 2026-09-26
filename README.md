# NE Oakville school — interactive reconstruction

[Open the viewer](https://condigitalexpert.github.io/ne-oakville-school-3d/) · [Accuracy and QA/QC](https://condigitalexpert.github.io/ne-oakville-school-3d/QA-QC.html)

An independent four-level reconstruction of NE Oakville #1 High School, 4020 Sixth Line, from ten photographs of seven architectural presentation boards. Drawings: sn/architects / Halton District School Board.

208 room/support polygons, room evidence, floor cutaways, exploded floors, sectioning, dynamic estimated north, camera views, source overlays, site context and downloadable building/campus GLBs.

**Dimensions are inferred.** The photographs do not establish exact scale, heights, grading, or hidden detail. See the QA report for unresolved cross-floor edge discrepancies and childcare registration limits. This is not an official BIM or as-built model.

## Files
- src/data/level*.json: semantic room polygons in the common Photo 8 frame.
- src/data/envelope.json: enclosure derived from occupied and tall-space footprints.
- src/data/site.json, childcare-site.json: inferred campus and play areas.
- public/references/: original source photographs and source manifest.
- public/model/: downloadable GLBs, semantic data, and verification JSON.
- docs/: published static viewer plus modeling records.
- scripts/: geometry, browser, packaging and publishing workflows.

## Run
Node 22 is supported. Three.js is the sole production dependency (3D rendering and GLB export); Vite and Playwright are development tools.

    npm ci
    npm run dev
    npm run build

The production build is static, uses relative paths and runs on GitHub Pages without a backend.
Geometry validation requires Python with Shapely:

    python3 scripts/qa_geometry.py

Browser validation uses Playwright Chromium:

    QA_URL=http://localhost:4173 node scripts/test-viewer.mjs

All reconstruction files, dependency installation, builds, geometry analysis, browser tests and publishing commands were performed on Velocity (max-compute-11). Original photographs were transferred from the user's attachments; the local computer provided connection and display only.
