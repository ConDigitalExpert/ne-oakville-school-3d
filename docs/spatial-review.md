# Spatial geometry review

Run `PYTHONPATH=.python python3 scripts/qa_geometry.py` on MaxCompute11. Output: `verification/geometry.json`. The audit uses Shapely polygon intersections, unions and distances, not only JSON schema validation. All metric results use the inferred 0.14 m/pixel conversion and are not measured quantities.

## Corrections made to Levels 0 and 1

Embedded compressor, music-practice and childcare service spaces originally overlapped enclosing room solids. Their parent boundaries now contain explicit notches. Circulation floor polygons were clipped against enclosed rooms; the southwest corridor was retraced as the upper gym corridor, change-room connector and gym entry corridor. No L0/L1 room-room or room-circulation intersection exceeds 0.5 inferred square metres. All polygons have positive area and are valid.

Level 0 was translated by +1.145,+14.787 Photo 8 pixels to align its Stair D centroid with Level 1. About 95.4% of the childcare plan lies beneath the gym/change/storage/circulation suite. The residual footprint remains an unresolved photographic registration discrepancy. Registration changes do not establish exact outer walls or stair dimensions.

## Interpretation

Pure circulation polygons on Level 1 have two components. The cafeteria/commons is also traversable, so corridor-only connectivity is not a complete access model. The audit additionally counts components including commons with a five-pixel (0.7 inferred metre) wall/door tolerance. This is a geometric diagnostic, not evidence that a doorway exists. Distance to a corridor can be nonzero for rooms entered through a parent room: CPP sensory and support, workshop support, admin offices, toilets, and childcare support. Such distances are reported without declaring them circulation failures.

Stair centroid offsets are reported across floors, with overlap fractions. Landing extents differ in perspective and stair cut conventions, so differing centroids are not automatically defects. Level 0 Stair D is now aligned to Level 1; upper traces have smaller residual offsets.

## Upper floors

Initial QA found L2 learning commons / washroom overlap, Stair D / pump overlap, and L3 communication technology / LAN overlap; these were sent to the upper-floor owner. The machine-readable audit is refreshed after their changes and is the current result. L2 tall-space conflicts are tested against cafeteria, three gyms and drama; L3 overlap is listed but distinguished from a vertical conflict because its 8.4 m elevation is above the inferred 8.1 m tall-room ceiling. Gym/roof/void coverage is reported independently. Slight edge discrepancies reflect differing photo registration; cafeteria coverage is less certain and should not be represented as exact.

No egress, accessibility, code, BIM, structural, or dimensional compliance is certified.

## Final workshop interpretation
A cross-check of the upper plan distinguishes ordinary-height innovation beneath the Level 2 washroom core from the partially double-height transportation and construction rooms. Their heightFootprints follow the Level 2 north void intersections. Manufacturing is predominantly double-height. Geometry QA now evaluates those partial footprints rather than incorrectly treating each entire workshop as tall. The final residual vertical conflicts are approximately 2.05 inferred m² at cafeteria and 3.86 inferred m² at drama, both at Level 2 edges.
