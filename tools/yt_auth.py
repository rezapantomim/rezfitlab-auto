"""One-time YouTube authorisation (run locally, by the channel owner).

1. Google Cloud Console -> new project -> enable "YouTube Data API v3".
2. OAuth consent screen: External, add your Google account as a test user, then press "PUBLISH APP" (In production).
   (In "Testing" mode the token expires after 7 days and uploads silently stop.)
3. Credentials -> Create OAuth client ID -> Desktop app -> download JSON as client_secret.json into this folder.
4. python tools/yt_auth.py   -> a browser opens, choose the Rez Fitlab channel, allow.
5. The script prints the JSON for the GitHub secret YT_TOKEN_JSON and saves it to token.json (git-ignored).
   Set it with:  gh secret set YT_TOKEN_JSON < token.json
"""
import json, pathlib
from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl']

flow = InstalledAppFlow.from_client_secrets_file(str(ROOT / 'client_secret.json'), SCOPES)
creds = flow.run_local_server(port=0, prompt='consent', access_type='offline')
tok = {'client_id': creds.client_id, 'client_secret': creds.client_secret, 'refresh_token': creds.refresh_token,
       'token_uri': creds.token_uri}
(ROOT / 'token.json').write_text(json.dumps(tok), encoding='utf8')
print('Saved token.json. Next: gh secret set YT_TOKEN_JSON < token.json   (then delete token.json)')
