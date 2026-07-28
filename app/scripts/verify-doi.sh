#!/usr/bin/env bash
#
# Verify one DOI before it goes into a claim file.
#
#   ./scripts/verify-doi.sh 10.1136/bjsports-2017-097608
#
# Resolves the DOI against CrossRef (hard rule: a DOI that does not resolve does
# not go in a claim file), then asks Europe PMC whether open-access full text
# exists. That second answer decides how much you can honestly extract: with full
# text you can read n, effect size and confidence intervals out of the results
# section; without it you are limited to the abstract and the fields you could not
# read stay null.
#
# This talks to the registries directly on purpose. Search engines and chat
# assistants are fine for *finding* a paper and useless for *quoting* one — they
# paraphrase, merge studies, and state sample sizes that appear nowhere in the
# source. Nothing here summarises anything.
set -uo pipefail

DOI="${1:-}"
if [ -z "$DOI" ]; then
  echo "usage: $0 <doi>    e.g. $0 10.1136/bjsports-2017-097608" >&2
  exit 2
fi
DOI="${DOI#https://doi.org/}"
DOI="${DOI#doi:}"

echo "=== CrossRef: does it resolve? ==="
curl -s --max-time 25 "https://api.crossref.org/works/${DOI}" | python3 -c "
import json, sys
try:
    m = json.load(sys.stdin)['message']
except Exception:
    print('  DID NOT RESOLVE — do not put this DOI in a claim file'); sys.exit(1)
authors = ', '.join(f\"{a.get('family','?')} {a.get('given','')[:1]}\" for a in m.get('author', [])[:8])
print('  title   :', (m.get('title') or ['?'])[0])
print('  authors :', authors or '(none listed)')
print('  journal :', (m.get('container-title') or ['?'])[0])
print('  crossref year:', (m.get('published', {}).get('date-parts') or [[None]])[0][0],
      ' <- online-first date; use the JOURNAL ISSUE year in the claim (see schema.md)')
" || exit 1

echo
echo "=== Europe PMC: can I read past the abstract? ==="
curl -s --max-time 25 -G "https://www.ebi.ac.uk/europepmc/webservices/rest/search" \
  --data-urlencode "query=DOI:${DOI}" \
  --data-urlencode "format=json" \
  --data-urlencode "resultType=core" | python3 -c "
import json, sys
r = json.load(sys.stdin).get('resultList', {}).get('result', [])
if not r:
    print('  not indexed in Europe PMC — abstract only, via PubMed'); sys.exit(0)
x = r[0]
pmid, pmcid = x.get('pmid'), x.get('pmcid')
print('  pmid :', pmid, '| pmcid:', pmcid or '-', '| open access:', x.get('isOpenAccess'))
if pmcid and x.get('inEPMC') == 'Y':
    print('  FULL TEXT available:')
    print(f'    curl -s https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML')
else:
    print('  FULL TEXT not available — extract from the abstract and leave')
    print('  everything you could not read as null. Do not fill it from elsewhere.')
if pmid:
    print('  abstract:')
    print(f'    curl -s -G https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi \\\\')
    print(f'      --data-urlencode db=pubmed --data-urlencode rettype=abstract \\\\')
    print(f'      --data-urlencode retmode=text --data-urlencode id={pmid}')
"
