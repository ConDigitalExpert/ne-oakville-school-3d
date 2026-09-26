import json
from pathlib import Path
from shapely.geometry import Polygon
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1]
levels=[json.loads((root/f"src/data/level{i}.json").read_text()) for i in range(4)]
def polys(g):
 if g.is_empty:return []
 if g.geom_type=="Polygon":return [g]
 return [p for q in g.geoms for p in polys(q)]
def coords(p):
 return {"outer":[[round(x,3),round(y,3)] for x,y in list(p.exterior.coords)[:-1]],"holes":[[[round(x,3),round(y,3)] for x,y in list(r.coords)[:-1]] for r in p.interiors]}
northvoid=unary_union([Polygon(r["polygon"]) for r in levels[2]["voids"] if Polygon(r["polygon"]).centroid.y<280])
for r in levels[1]["rooms"]:
 if r["id"]=="innovation":
  r["height"]=3.85;r["notes"]+=" L2 washrooms lie above innovation; ordinary height is inferred."
 if r["id"] in ["transportation","manufacturing","construction"]:
  g=Polygon(r["polygon"]).intersection(northvoid)
  r["height"]=8.1;r["heightFootprints"]=[coords(p)["outer"] for p in polys(g)]
  r["notes"]+=" Partial double height: only the area below the L2 north void is tall; L2 support strip retained above the remaining footprint."
(root/"src/data/level1.json").write_text(json.dumps(levels[1],indent=2))
envelopes=[]
for i,d in enumerate(levels):
 footprints=[Polygon(r["polygon"]) for r in d["rooms"]+d["circulation"]]
 if i==2:
  for r in levels[1]["rooms"]:
   if r.get("height",3.85)>4.2:
    footprints.extend([Polygon(p) for p in r.get("heightFootprints",[r["polygon"]])])
 # close small trace-wall gaps; this is enclosure synthesis not a new occupied floor.
 geom=unary_union(footprints).buffer(2.3,join_style=2).buffer(-2.3,join_style=2)
 envelopes.append(geom)
stories=[];roofs=[]
for i,g in enumerate(envelopes):
 stories.append({"level":i,"base":levels[i]["elevation"],"height":4.2,"polygons":[coords(p) for p in polys(g)]})
 above=envelopes[i+1] if i<3 else Polygon()
 roof=g.difference(above.buffer(2))
 roofs.append({"level":i,"elevation":levels[i]["elevation"]+4.13,"polygons":[coords(p) for p in polys(roof) if p.area>25]})
(root/"src/data/envelope.json").write_text(json.dumps({"stories":stories,"roofs":roofs,"notes":"Enclosure synthesized from traced room footprints; wall-gap closure 2.3 assumed image pixels. Heights/material details inferred."},indent=2))
print("Envelope prepared:", [(s["level"],len(s["polygons"])) for s in stories])
