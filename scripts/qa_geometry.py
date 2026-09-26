"""Photographic reconstruction geometry audit; inferred scale, not compliance checks."""
import json,pathlib,itertools
from shapely.geometry import Polygon
from shapely.ops import unary_union
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCALE=.14
levels={}
for f in sorted((ROOT/'src/data').glob('level[0-3].json')):
 d=json.loads(f.read_text());levels[d['level']]=d
report={'metric_warning':'All metric values use inferred 0.14 m/pixel calibration. Not surveyed or compliance evidence.','levels':{},'cross_floor':{}}
for n,d in levels.items():
 shapes={a['id']:Polygon(a['polygon']) for k in ['rooms','circulation','voids'] for a in d[k]}
 roomsh={a['id']:shapes[a['id']] for a in d['rooms']}
 invalid=[{'id':k,'valid':s.is_valid,'area_m2':round(s.area*SCALE*SCALE,3)} for k,s in shapes.items() if not s.is_valid or s.area<=0]
 overlaps=[]
 for (aid,a),(bid,b) in itertools.combinations(roomsh.items(),2):
  if a.is_valid and b.is_valid:
   area=a.intersection(b).area*SCALE*SCALE
   if area>.5:overlaps.append({'a':aid,'b':bid,'area_m2':round(area,2)})
 circs=[shapes[a['id']] for a in d['circulation'] if shapes[a['id']].is_valid]
 cu=unary_union(circs)
 circulation_components=len(cu.geoms) if cu.geom_type=='MultiPolygon' else 1
 walkable=unary_union(circs+[roomsh[r['id']] for r in d['rooms'] if r.get('category')=='commons' or r['id']=='co-lab'])
 # A five-photo-pixel wall/door tolerance joins schematic adjacent spaces; not proof of a doorway.
 walkable_joined=walkable.buffer(5)
 walk_components=len(walkable_joined.geoms) if walkable_joined.geom_type=='MultiPolygon' else 1
 # Tolerance is 0.7 m (five photo pixels), because wall thickness is schematic.
 gaps=[{'id':k,'gap_m':round(s.distance(cu)*SCALE,2)} for k,s in roomsh.items() if s.is_valid and not cu.is_empty and s.distance(cu)*SCALE>.7]
 rc=[]
 for k,s in roomsh.items():
  if s.is_valid:
   area=s.intersection(cu).area*SCALE*SCALE
   if area>.5:rc.append({'room':k,'area_m2':round(area,2)})
 report['levels'][n]={'room_count':len(d['rooms']),'invalid_or_zero_area':invalid,'room_overlaps_over_0_5_m2':overlaps,'circulation_component_count':circulation_components,'walkable_components_including_commons_at_0_7m_tolerance':walk_components,'rooms_farther_than_0_7m_from_circulation':gaps,'room_circulation_overlaps_over_0_5_m2':rc}
# Horizontal registration uses stair centroids, not the level-dependent labels.
sta=[]
for n,d in levels.items():
 for r in d['rooms']:
  if r.get('category')=='stair':
   for m,e in levels.items():
    if m<=n:continue
    key=r['name'].lower().replace(' lower landing','')
    for q in e['rooms']:
     if q.get('category')=='stair' and q['name'].lower().replace(' lower landing','')==key:
      a,b=Polygon(r['polygon']),Polygon(q['polygon'])
      sta.append({'name':r['name'],'levels':[n,m],'centroid_offset_m':round(a.centroid.distance(b.centroid)*SCALE,2),'overlap_fraction_of_smaller':round(a.intersection(b).area/min(a.area,b.area),3)})
report['cross_floor']['stair_alignment']=sta
if 0 in levels and 1 in levels:
 l0=unary_union([Polygon(r['polygon']) for r in levels[0]['rooms']]+[Polygon(r['polygon']) for r in levels[0]['circulation']])
 gym=unary_union([Polygon(r['polygon']) for r in levels[1]['rooms'] if r['id'].startswith('gym-') or 'change-' in r['id'] or r['id']=='stair-d']+[Polygon(r['polygon']) for r in levels[1]['circulation'] if 'gym' in r['id'] or r['id']=='south-cross'])
 report['cross_floor']['childcare_under_gym_suite']={'fraction_covered':round(l0.intersection(gym).area/l0.area,3),'uncovered_area_m2':round(l0.difference(gym).area*SCALE*SCALE,2),'note':'Gym suite includes storage/change/stair; gaps may be circulation or registration uncertainty.'}
 tall=[]
 for n,d in levels.items():
  if n<2:continue
  occupied=unary_union([Polygon(r['polygon']) for r in d['rooms']])
  voids=unary_union([Polygon(r['polygon']) for r in d['voids']])
  for r in levels[1]['rooms']:
   if r.get('height',3.85)>=8:
    shape=unary_union([Polygon(p) for p in r.get('heightFootprints',[r['polygon']])]);area=shape.intersection(occupied).area*SCALE*SCALE
    tall.append({'upper_level':n,'tall_room':r['id'],'upper_room_overlap_m2':round(area,2),'vertical_conflict':r.get('height',3.85)>d['elevation'] and area>.5,'void_coverage_fraction':round(shape.intersection(voids).area/shape.area,3)})
 report['cross_floor']['tall_space_conflicts']=tall
(ROOT/'verification').mkdir(exist_ok=True)
(ROOT/'verification/geometry.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
