"""Optional Telegram report (free). Needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID; silently does nothing without them."""
import os, sys, requests


def send(text):
    tok, chat = os.environ.get('TELEGRAM_BOT_TOKEN'), os.environ.get('TELEGRAM_CHAT_ID')
    if not tok or not chat:
        return
    try:
        requests.post(f'https://api.telegram.org/bot{tok}/sendMessage', data={'chat_id': chat, 'text': text[:4000]}, timeout=20)
    except Exception as e:
        print('telegram failed:', e, file=sys.stderr)


if __name__ == '__main__':
    send(sys.stdin.read() if len(sys.argv) < 2 else ' '.join(sys.argv[1:]))
