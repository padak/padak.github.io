# Exports a Brain Bench case.json into plain text for reviewers:
#   player.txt   - everything a player sees (briefing, suspects, documents, form), no solution
#   solution.txt - the intended solution, for the Astra puzzle review only
# Usage: python3 export_player.py <case.json> <outdir>
import json, os, re, sys

def text(html):
    # Keep table cells and paragraphs readable after stripping tags.
    h = re.sub(r'<(br|/p|/li|/tr|/h\d)\s*/?>', '\n', html)
    h = h.replace('</td>', ' | ').replace('</th>', ' | ')
    h = re.sub(r'<[^>]+>', '', h)
    return re.sub(r'\n\s*\n+', '\n', h).strip()

case, outdir = sys.argv[1], sys.argv[2]
d = json.load(open(case, encoding='utf-8'))
os.makedirs(outdir, exist_ok=True)
out = [d['title'], text(d['briefing']),
       'PODEZŘELÍ: ' + '; '.join(f"{s['name']} ({s.get('age', '?')}), {s['role']}" for s in d['suspects'])]
for x in d['documents']:
    out.append(f"\n=== DOKUMENT {x['id']}: {x['title']} ===")
    if x.get('imageAlt'):
        out.append('[Obrázek: ' + x['imageAlt'] + (' Razítko: ' + x['imageStamp'] if x.get('imageStamp') else '') + ']')
    for g in x.get('gallery', []):
        out.append('[Obrázek: ' + g['alt'] + ']')
    out.append(text(x['html']))
    for flag in ('plan', 'map', 'bodymap', 'receiptSvg'):
        if x.get(flag):
            out.append(f'[Nákres ({flag}) podle textu dokumentu.]')
out.append('\n=== FORMULÁŘ OBVINĚNÍ ===')
for q in d['form']['questions']:
    out.append(q['label'] + ' Možnosti: ' + ', '.join(q['options']))
open(os.path.join(outdir, 'player.txt'), 'w', encoding='utf-8').write('\n'.join(out))
open(os.path.join(outdir, 'solution.txt'), 'w', encoding='utf-8').write(text(d['solutionText']))
print(len(d['documents']), 'documents,', len(' '.join(out).split()), 'words ->', outdir)
