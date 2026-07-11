import secrets
import string


def generate_meeting_code() -> str:
    # Zoom-like: 3-4-3 grouped lowercase letters, e.g. "abc-defg-hij"
    def group(n):
        return "".join(secrets.choice(string.ascii_lowercase) for _ in range(n))
    return f"{group(3)}-{group(4)}-{group(3)}"
