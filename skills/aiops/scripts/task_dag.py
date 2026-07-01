"""Task dependency DAG — topological sort via Kahn's algorithm.

Pure Python, no external dependencies. Used by /to-issues for structured
task output and /aiops-implement for wave-based execution.
"""

from __future__ import annotations

from collections import deque


def topological_sort(tasks: list[dict]) -> list[list[str]]:
    """Sort tasks into execution waves using Kahn's algorithm.

    Each task dict must have:
      - "id": str
      - "blocked_by": list[str]  (task IDs this depends on)

    Returns a list of waves, where each wave is a list of task IDs
    that can execute in parallel.

    Raises ValueError on cyclic dependencies.

    >>> topological_sort([
    ...     {"id": "t1", "blocked_by": []},
    ...     {"id": "t2", "blocked_by": ["t1"]},
    ...     {"id": "t3", "blocked_by": ["t1"]},
    ...     {"id": "t4", "blocked_by": ["t2", "t3"]},
    ... ])
    [['t1'], ['t2', 't3'], ['t4']]
    """
    # Build adjacency and in-degree
    task_ids = {t["id"] for t in tasks}
    rdeps: dict[str, list[str]] = {tid: [] for tid in task_ids}
    in_degree: dict[str, int] = {tid: 0 for tid in task_ids}

    for t in tasks:
        tid = t["id"]
        blocked = [b for b in t.get("blocked_by", []) if b in task_ids]
        in_degree[tid] = len(blocked)
        for dep in blocked:
            rdeps[dep].append(tid)

    # Kahn's algorithm
    queue = deque(tid for tid, deg in in_degree.items() if deg == 0)
    waves: list[list[str]] = []
    visited = 0

    while queue:
        wave = sorted(queue)  # Sort for deterministic output
        waves.append(wave)
        next_queue: deque[str] = deque()
        for tid in wave:
            visited += 1
            for dependent in rdeps[tid]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    next_queue.append(dependent)
        queue = next_queue

    if visited < len(task_ids):
        remaining = task_ids - {tid for wave in waves for tid in wave}
        raise ValueError(f"Cyclic dependency detected among: {remaining}")

    return waves


def get_ready_tasks(
    tasks: list[dict], completed: set[str]
) -> list[str]:
    """Return task IDs whose dependencies are all satisfied.

    Excludes tasks already in the completed set.

    >>> get_ready_tasks(
    ...     [{"id": "t1", "blocked_by": []},
    ...      {"id": "t2", "blocked_by": ["t1"]}],
    ...     set(),
    ... )
    ['t1']
    >>> get_ready_tasks(
    ...     [{"id": "t1", "blocked_by": []},
    ...      {"id": "t2", "blocked_by": ["t1"]}],
    ...     {"t1"},
    ... )
    ['t2']
    """
    ready = []
    for t in tasks:
        tid = t["id"]
        if tid in completed:
            continue
        blocked = set(t.get("blocked_by", []))
        if blocked.issubset(completed):
            ready.append(tid)
    return sorted(ready)


if __name__ == "__main__":
    import doctest
    doctest.testmod(verbose=True)
