import threading
import webbrowser

from app.config import ConfigError, get_config
from app.server import app

HOST = "127.0.0.1"
PORT = 5000


def main():
    try:
        get_config()
    except ConfigError as exc:
        print(f"\nConfig problem: {exc}\n")
        return

    url = f"http://{HOST}:{PORT}/"
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    print(f"Embedding Lab running at {url}  (Ctrl+C to stop)")
    app.run(host=HOST, port=PORT, debug=False)


if __name__ == "__main__":
    main()
