"""Build INSERT statements from a Base44 data export (entity -> rows JSON)."""
import json, sys, glob
data = json.load(open(sys.argv[1]))
schemas = {json.load(open(f))['name']: json.load(open(f)) for f in glob.glob('base44-reference/entities/*.jsonc')}
tables = json.load(open('src/api/entity-tables.json'))
META = ['id', 'created_date', 'updated_date', 'created_by']

def lit(v, jsonb):
    if v is None: return 'null'
    if jsonb: return "'" + json.dumps(v).replace("'", "''") + "'::jsonb"
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, (dict, list)): v = json.dumps(v)
    return "'" + str(v).replace("'", "''") + "'"

out = ['-- Base44 data export -> Supabase. Safe to re-run (skips existing ids).',
       'alter table public."site_settings" disable trigger set_meta;']
skipped = {}
for ent, rows in data.items():
    if ent not in tables or not rows: continue
    tbl = tables[ent]; props = schemas[ent]['properties']
    out.append(f'alter table public."{tbl}" disable trigger set_meta;')
    for r in rows:
        cols, vals = [], []
        for k, v in r.items():
            if k in META:
                cols.append(k); vals.append(lit(v, False))
            elif k in props:
                cols.append(f'"{k}"'); vals.append(lit(v, props[k].get('type') in ('array', 'object')))
            else:
                skipped.setdefault(ent, set()).add(k)
        out.append(f'insert into public."{tbl}" ({", ".join(cols)}) values ({", ".join(vals)}) on conflict (id) do nothing;')
    out.append(f'alter table public."{tbl}" enable trigger set_meta;')
out.append('alter table public."site_settings" enable trigger set_meta;')
open('supabase/data/base44-data.sql', 'w').write('\n'.join(out) + '\n')
print({k: sorted(v) for k, v in skipped.items()})
