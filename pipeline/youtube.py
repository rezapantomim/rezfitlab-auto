"""YouTube Data API v3: scheduled upload, thumbnail, playlist, comment. Free quota (10 000 units/day, an upload costs 1600).

Credentials: env YT_TOKEN_JSON = {"client_id","client_secret","refresh_token","token_uri"} made once by tools/yt_auth.py.
The Google Cloud OAuth app must be in "In production" mode, otherwise the refresh token dies after 7 days.
"""
import datetime as dt, json, os
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from .common import CFG

SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl']


def client():
    creds = Credentials.from_authorized_user_info(json.loads(os.environ['YT_TOKEN_JSON']), SCOPES)
    creds.refresh(Request())
    yt = build('youtube', 'v3', credentials=creds, cache_discovery=False)
    me = yt.channels().list(part='snippet', mine=True).execute()['items'][0]['snippet']
    want = CFG['channel']['handle'].lower()
    if (me.get('customUrl') or '').lower() != want:
        raise SystemExit(f'Token belongs to {me.get("customUrl")} / {me.get("title")}, not {want} -> refusing to upload')
    return yt


def upload(yt, video, ep, title, description, tags):
    publish = dt.datetime.fromisoformat(ep['publish_at'].replace('Z', '+00:00'))
    status = {'selfDeclaredMadeForKids': False, 'containsSyntheticMedia': bool(CFG.get('ai_disclosure', True)), 'embeddable': True}
    if publish > dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=20):
        status.update(privacyStatus='private', publishAt=ep['publish_at'])
    else:
        status.update(privacyStatus='public')            # we are late -> publish right away
    body = {'snippet': {'title': title[:100], 'description': description[:4900], 'tags': tags, 'categoryId': CFG['channel']['category_id'],
                        'defaultLanguage': 'tr', 'defaultAudioLanguage': 'tr'}, 'status': status}
    req = yt.videos().insert(part='snippet,status', body=body, media_body=MediaFileUpload(str(video), chunksize=8 * 1024 * 1024, resumable=True))
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    return resp['id']


def set_thumb(yt, vid, jpg):
    try:
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(jpg), mimetype='image/jpeg')).execute(); return True
    except Exception as e:                               # needs a phone-verified channel
        print('thumbnail not set:', e); return False


def playlist_id(yt, title):
    page = None
    while True:
        r = yt.playlists().list(part='snippet', mine=True, maxResults=50, pageToken=page).execute()
        for p in r['items']:
            if p['snippet']['title'] == title:
                return p['id']
        page = r.get('nextPageToken')
        if not page:
            break
    r = yt.playlists().insert(part='snippet,status', body={'snippet': {'title': title, 'defaultLanguage': 'tr'},
                                                           'status': {'privacyStatus': 'public'}}).execute()
    return r['id']


def add_to_playlist(yt, vid, key):
    title = CFG['channel']['playlists'].get(key)
    if title:
        yt.playlistItems().insert(part='snippet', body={'snippet': {'playlistId': playlist_id(yt, title),
                                                                    'resourceId': {'kind': 'youtube#video', 'videoId': vid}}}).execute()


def comment(yt, vid, text):
    """Top-level comment from the channel. Only works once the video is public (pinning is not possible through the API)."""
    yt.commentThreads().insert(part='snippet', body={'snippet': {'videoId': vid, 'topLevelComment': {'snippet': {'textOriginal': text}}}}).execute()


def is_public(yt, vid):
    r = yt.videos().list(part='status', id=vid).execute()['items']
    return bool(r) and r[0]['status']['privacyStatus'] == 'public'
