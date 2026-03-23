import json, urllib.request, sys
url='http://127.0.0.1:8000/run'
# Pre-set a question in profile by calling a query first
req1 = urllib.request.Request(url, data=json.dumps({'user_id':'test_user','query':'Explain loops'}).encode(), headers={'Content-Type':'application/json'}, method='POST')
urllib.request.urlopen(req1).read()

# Now answer the question
payload={'user_id':'test_user','query':'answer: correct'}
req=urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print('Status:', resp.status)
        print('Response:', resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print('Content:', e.read().decode())
except Exception as e:
    print('Error:', e, file=sys.stderr)
