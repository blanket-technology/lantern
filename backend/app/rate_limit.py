"""Small in-memory sliding-window limiter.

Good enough for a single backend instance. If you scale to several replicas,
move this to Redis (e.g. a sorted set per key) so limits are shared.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, status


class SlidingWindowLimiter:
    def __init__(self, max_calls: int, window_seconds: float):
        self.max_calls = max_calls
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.max_calls:
            retry = int(self.window - (now - hits[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"You're sending messages very quickly. Try again in {retry} seconds.",
                headers={"Retry-After": str(retry)},
            )
        hits.append(now)


message_limiter = SlidingWindowLimiter(max_calls=20, window_seconds=60)
auth_limiter = SlidingWindowLimiter(max_calls=10, window_seconds=60)
