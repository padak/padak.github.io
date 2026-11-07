# Guards case wording during visual redesigns: snapshot the plain text of every document, then check it.
# Usage: python3 doctext.py snapshot <case.json> <snapshot.json>
#        python3 doctext.py check    <case.json> <snapshot.json>   (exit 1 and list documents whose text changed)
import json, re, sys

def plain(case):
    d = json.load(open(case, encoding='utf-8'))
    return {x['id']: ' '.join(re.sub(r'<[^>]+>', ' ', x['html']).split()) for x in d['documents']}

mode, case, snap = sys.argv[1:4]
if mode == 'snapshot':
    json.dump(plain(case), open(snap, 'w', encoding='utf-8'), ensure_ascii=False)
    print('saved', snap)
else:
    before, now = json.load(open(snap, encoding='utf-8')), plain(case)
    changed = sorted(k for k in set(before) | set(now) if before.get(k) != now.get(k))
    print('changed documents:', changed or 'none')
    sys.exit(1 if changed else 0)
