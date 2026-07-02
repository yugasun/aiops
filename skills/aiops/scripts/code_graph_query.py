"""Code graph query module — reads graphify output and emits structured text.

Reads graphify-out/graph.json (structural data) and .scratch/graph/annotations.json
(semantic layer). Provides executable implementations of the 9 query subcommands
described in skills/code-graph/query-patterns.md.

Usage:
    python3 code_graph_query.py modules [--graph PATH] [--annotations PATH]
    python3 code_graph_query.py deps <node>
    python3 code_graph_query.py rdeps <node>
    python3 code_graph_query.py impact <file>
    python3 code_graph_query.py hotspot
    python3 code_graph_query.py god-nodes [--top N]
    python3 code_graph_query.py shallow
    python3 code_graph_query.py orphans
    python3 code_graph_query.py communities
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path


# ─── Data loading ────────────────────────────────────────────────────────────

DEFAULT_GRAPH = "graphify-out/graph.json"
DEFAULT_ANNOTATIONS = ".scratch/graph/annotations.json"


def load_graph(path: str | Path) -> dict:
    """Load graphify graph.json. Returns empty dict if not found."""
    p = Path(path)
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def load_annotations(path: str | Path) -> dict:
    """Load model annotations.json. Returns empty dict if not found."""
    p = Path(path)
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


# ─── Index building ─────────────────────────────────────────────────────────


def _build_indices(graph: dict) -> tuple[dict, dict, dict]:
    """Build node lookup, outgoing edges, and incoming edges from graph data.

    Returns (nodes_by_id, outgoing, incoming).
    """
    nodes_by_id: dict[str, dict] = {}
    outgoing: dict[str, list[dict]] = defaultdict(list)
    incoming: dict[str, list[dict]] = defaultdict(list)

    for node in graph.get("nodes", []):
        nodes_by_id[node["id"]] = node

    for link in graph.get("links", []):
        src = link.get("source", "")
        tgt = link.get("target", "")
        outgoing[src].append(link)
        incoming[tgt].append(link)

    return nodes_by_id, dict(outgoing), dict(incoming)


def _confidence_label(score: float) -> str:
    """Map confidence score to label."""
    if score >= 0.9:
        return "EXTRACTED"
    if score >= 0.4:
        return "INFERRED"
    return "AMBIGUOUS"


def _annotation_for(node_id: str, annotations: dict) -> dict:
    """Get annotation for a node, or empty defaults."""
    ann = annotations.get("annotations", {})
    return ann.get(node_id, {
        "purpose": "",
        "depth": "unknown",
        "tags": [],
        "complexity": "unknown",
        "is_test_file": False,
    })


# ─── Query: modules ─────────────────────────────────────────────────────────


def query_modules(graph: dict, annotations: dict) -> str:
    """List all nodes with purpose, depth, edge count, confidence."""
    nodes_by_id, outgoing, incoming = _build_indices(graph)
    if not nodes_by_id:
        return "No graph data found."

    community_labels = graph.get("graph", {}).get("community_labels", {})
    community_count = len(set(community_labels.keys()))
    rows = []

    sorted_nodes = sorted(
        nodes_by_id.values(),
        key=lambda n: n.get("in_degree", 0),
        reverse=True,
    )

    for node in sorted_nodes:
        nid = node["id"]
        ann = _annotation_for(nid, annotations)
        community = community_labels.get(
            str(node.get("community", "")),
            node.get("community_name", ""),
        )
        depth = ann.get("depth", "unknown")
        purpose = ann.get("purpose", node.get("description", ""))[:60]
        in_d = node.get("in_degree", 0)
        out_d = node.get("out_degree", 0)
        rows.append(
            f"| {nid} | {community} | {depth} | {purpose} | {in_d} | {out_d} |"
        )

    header = (
        f"## Modules ({len(nodes_by_id)} nodes · {community_count} communities)\n\n"
        "| Module | Community | Depth | Purpose | In | Out |\n"
        "|--------|-----------|-------|---------|----|-----|\n"
    )
    return header + "\n".join(rows)


# ─── Query: deps ────────────────────────────────────────────────────────────


def query_deps(node_id: str, graph: dict, annotations: dict) -> str:
    """Outgoing dependencies from a node."""
    _, outgoing, _ = _build_indices(graph)
    edges = outgoing.get(node_id, [])

    if not edges:
        return f"## Dependencies of {node_id}\n\nNo outgoing dependencies found."

    rows = []
    for link in sorted(edges, key=lambda e: e.get("confidence_score", 0), reverse=True):
        target = link.get("target", "")
        relation = link.get("relation", "UNKNOWN")
        score = link.get("confidence_score", 0)
        label = _confidence_label(score)
        rows.append(f"| {target} | {relation} | {score} {label} |")

    header = (
        f"## Dependencies of {node_id}\n\n"
        "| Dependency | Relation | Confidence |\n"
        "|------------|----------|------------|\n"
    )
    return header + "\n".join(rows)


# ─── Query: rdeps ───────────────────────────────────────────────────────────


def query_rdeps(node_id: str, graph: dict, annotations: dict) -> str:
    """Incoming dependencies (who depends on this node)."""
    _, _, incoming = _build_indices(graph)
    edges = incoming.get(node_id, [])

    if not edges:
        return f"## Dependents of {node_id}\n\nNo incoming dependencies found."

    rows = []
    for link in sorted(edges, key=lambda e: e.get("confidence_score", 0), reverse=True):
        source = link.get("source", "")
        relation = link.get("relation", "UNKNOWN")
        score = link.get("confidence_score", 0)
        label = _confidence_label(score)
        rows.append(f"| {source} | {relation} | {score} {label} |")

    header = (
        f"## Dependents of {node_id}\n\n"
        "| Dependent | Relation | Confidence |\n"
        "|-----------|----------|------------|\n"
    )
    return header + "\n".join(rows)


# ─── Query: impact ──────────────────────────────────────────────────────────


def query_impact(file_id: str, graph: dict, annotations: dict) -> str:
    """Change impact analysis — direct and transitive dependents."""
    nodes_by_id, _, incoming = _build_indices(graph)

    # Check pre-computed impact map
    impact_map = annotations.get("impact_map", {})
    precomputed = impact_map.get(file_id, {})

    if precomputed:
        direct = precomputed.get("direct", [])
        transitive = precomputed.get("transitive", [])
    else:
        # Compute from graph: BFS on incoming edges
        direct = []
        transitive = []
        visited = {file_id}

        # Direct dependents (1 hop)
        for link in incoming.get(file_id, []):
            src = link.get("source", "")
            if src not in visited:
                direct.append(src)
                visited.add(src)

        # Transitive (2+ hops)
        queue = list(direct)
        while queue:
            current = queue.pop(0)
            for link in incoming.get(current, []):
                src = link.get("source", "")
                if src not in visited:
                    transitive.append(src)
                    visited.add(src)
                    queue.append(src)

    community = nodes_by_id.get(file_id, {}).get("community_name", "")

    lines = [f"## Impact of changing {file_id}\n"]
    lines.append("### Direct impact")
    for dep in direct:
        lines.append(f"- {dep}")
    if not direct:
        lines.append("- (none)")

    lines.append("\n### Transitive impact")
    for dep in transitive:
        lines.append(f"- {dep}")
    if not transitive:
        lines.append("- (none)")

    if community:
        lines.append(f"\n### Community context")
        lines.append(f"- Part of \"{community}\" community")

    total = len(direct) + len(transitive)
    lines.append(f"\n### Risk assessment")
    lines.append(f"- {len(direct)} module(s) directly affected")
    lines.append(f"- {len(transitive)} module(s) transitively affected")

    return "\n".join(lines)


# ─── Query: hotspot ─────────────────────────────────────────────────────────


def query_hotspot(graph: dict, annotations: dict) -> str:
    """High-coupling + recently changed nodes."""
    nodes_by_id, _, _ = _build_indices(graph)
    hotspots = annotations.get("hotspots", [])

    if not hotspots:
        return "## Hotspots\n\nNo hotspot data in annotations. Run `/code-graph build` first."

    rows = []
    for hs in sorted(hotspots, key=lambda h: h.get("in_degree", 0), reverse=True):
        nid = hs.get("node_id", "")
        in_deg = hs.get("in_degree", 0)
        node = nodes_by_id.get(nid, {})
        community = node.get("community_name", "")
        commits = hs.get("recent_commits", 0)
        risk = "🔴 High" if in_deg > 10 or commits > 8 else "🟡 Medium"
        rows.append(
            f"| {nid} | {in_deg} | {community} | "
            f"{commits} commits (30d) | {risk} |"
        )

    header = (
        "## Hotspots\n\n"
        "| Module | In-degree | Community | Recent changes | Risk |\n"
        "|--------|-----------|-----------|----------------|------|\n"
    )
    return header + "\n".join(rows)


# ─── Query: god-nodes ───────────────────────────────────────────────────────


def query_god_nodes(graph: dict, annotations: dict, top_n: int = 10) -> str:
    """Top N nodes by total degree."""
    nodes_by_id, _, _ = _build_indices(graph)
    if not nodes_by_id:
        return "## God Nodes\n\nNo graph data found."

    sorted_nodes = sorted(
        nodes_by_id.values(),
        key=lambda n: n.get("degree", 0),
        reverse=True,
    )[:top_n]

    lines = [f"## God Nodes (top {top_n})\n"]
    for i, node in enumerate(sorted_nodes, 1):
        nid = node["id"]
        degree = node.get("degree", 0)
        community = node.get("community_name", "")
        desc = node.get("description", "")
        lines.append(f"{i}. **{nid}** — degree: {degree} — {desc} (community: {community})")

    return "\n".join(lines)


# ─── Query: shallow ─────────────────────────────────────────────────────────


def query_shallow(graph: dict, annotations: dict) -> str:
    """Nodes marked depth=shallow — deepening candidates."""
    nodes_by_id, _, _ = _build_indices(graph)
    ann_map = annotations.get("annotations", {})

    shallow_nodes = [
        (nid, data)
        for nid, data in ann_map.items()
        if data.get("depth") == "shallow"
    ]

    if not shallow_nodes:
        return "## Shallow Nodes\n\nNo shallow nodes in annotations."

    rows = []
    for nid, ann_data in sorted(shallow_nodes, key=lambda x: x[0]):
        node = nodes_by_id.get(nid, {})
        purpose = ann_data.get("purpose", "")
        community = node.get("community_name", "")
        rows.append(f"| {nid} | shallow | {purpose} | {community} |")

    header = (
        "## Shallow Nodes\n\n"
        "| Module | Depth | Purpose | Community |\n"
        "|--------|-------|---------|----------|\n"
    )
    return header + "\n".join(rows)


# ─── Query: orphans ─────────────────────────────────────────────────────────


def query_orphans(graph: dict, annotations: dict) -> str:
    """Nodes with zero incoming edges."""
    nodes_by_id, _, incoming = _build_indices(graph)
    if not nodes_by_id:
        return "## Orphan Nodes\n\nNo graph data found."

    orphans = []
    for nid, node in nodes_by_id.items():
        if nid not in incoming or len(incoming[nid]) == 0:
            orphans.append(node)

    if not orphans:
        return "## Orphan Nodes\n\nNo orphan nodes found."

    lines = [f"## Orphan Nodes ({len(orphans)} — nothing depends on them)\n"]
    for node in sorted(orphans, key=lambda n: n["id"]):
        nid = node["id"]
        ann = _annotation_for(nid, annotations)
        purpose = ann.get("purpose", node.get("description", ""))
        lines.append(f"- {nid} — {purpose}")

    return "\n".join(lines)


# ─── Query: communities ─────────────────────────────────────────────────────


def query_communities(graph: dict, annotations: dict) -> str:
    """Detected community clusters with cohesion."""
    nodes_by_id, _, _ = _build_indices(graph)
    community_labels = graph.get("graph", {}).get("community_labels", {})

    if not community_labels:
        return "## Communities\n\nNo community data in graph."

    # Group nodes by community
    communities: dict[str, list[str]] = defaultdict(list)
    for nid, node in nodes_by_id.items():
        cid = str(node.get("community", ""))
        communities[cid].append(nid)

    lines = [f"## Communities (Louvain clustering)\n"]
    for cid in sorted(communities.keys(), key=lambda x: len(communities[x]), reverse=True):
        label = community_labels.get(cid, f"Community {cid}")
        members = sorted(communities[cid])
        lines.append(f"### {label} ({len(members)} nodes)")
        for member in members:
            lines.append(f"- {member}")
        lines.append("")

    return "\n".join(lines)


# ─── CLI ─────────────────────────────────────────────────────────────────────


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Code graph query tool — reads graphify output"
    )
    parser.add_argument(
        "--graph", default=DEFAULT_GRAPH,
        help=f"Path to graph.json (default: {DEFAULT_GRAPH})",
    )
    parser.add_argument(
        "--annotations", default=DEFAULT_ANNOTATIONS,
        help=f"Path to annotations.json (default: {DEFAULT_ANNOTATIONS})",
    )

    sub = parser.add_subparsers(dest="command")

    sub.add_parser("modules", help="List all nodes")
    p_deps = sub.add_parser("deps", help="Outgoing dependencies")
    p_deps.add_argument("node", help="Node ID")
    p_rdeps = sub.add_parser("rdeps", help="Incoming dependencies")
    p_rdeps.add_argument("node", help="Node ID")
    p_impact = sub.add_parser("impact", help="Change impact analysis")
    p_impact.add_argument("file", help="File/node ID")
    sub.add_parser("hotspot", help="High-coupling + recently changed")
    p_god = sub.add_parser("god-nodes", help="Top nodes by degree")
    p_god.add_argument("--top", type=int, default=10, help="Number of nodes")
    sub.add_parser("shallow", help="Nodes marked depth=shallow")
    sub.add_parser("orphans", help="Nodes with zero incoming edges")
    sub.add_parser("communities", help="Detected community clusters")

    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    graph = load_graph(args.graph)
    ann = load_annotations(args.annotations)

    handlers = {
        "modules": lambda: query_modules(graph, ann),
        "deps": lambda: query_deps(args.node, graph, ann),
        "rdeps": lambda: query_rdeps(args.node, graph, ann),
        "impact": lambda: query_impact(args.file, graph, ann),
        "hotspot": lambda: query_hotspot(graph, ann),
        "god-nodes": lambda: query_god_nodes(graph, ann, args.top),
        "shallow": lambda: query_shallow(graph, ann),
        "orphans": lambda: query_orphans(graph, ann),
        "communities": lambda: query_communities(graph, ann),
    }

    result = handlers[args.command]()
    print(result)


if __name__ == "__main__":
    main()
