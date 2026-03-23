import json, urllib.request, sys
url='http://localhost:8001/run'
payload={'user_id':'test_user','query':'Explain recursion'}
req=urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print(resp.read().decode())
except Exception as e:
    print('Error:', e, file=sys.stderr)
