from flask import Flask, render_template, request, jsonify
from collections import deque
from threading import Lock

app = Flask(__name__)
lock = Lock()

# In-memory undirected graph: user -> set of friends
graph = {
    "Alice": {"Bob", "Charlie"},
    "Bob": {"Alice", "David", "Eve"},
    "Charlie": {"Alice", "Eve"},
    "David": {"Bob", "Frank"},
    "Eve": {"Bob", "Charlie", "Frank"},
    "Frank": {"David", "Eve"},
}

def ensure_user(name):
    name = name.strip()
    if not name:
        raise ValueError("User name cannot be empty.")
    if len(name) > 24:
        raise ValueError("User name must be 24 characters or fewer.")
    return name

def bfs(start, target=None):
    if start not in graph:
        return []
    visited, order = {start}, []
    queue = deque([start])
    parent = {start: None}
    while queue:
        node = queue.popleft()
        order.append(node)
        if target is not None and node == target:
            path, cur = [], target
            while cur is not None:
                path.append(cur)
                cur = parent[cur]
            return list(reversed(path))
        for neighbor in sorted(graph[node]):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = node
                queue.append(neighbor)
    return order if target is None else []

def dfs(start):
    if start not in graph:
        return []
    visited, order = set(), []
    def visit(node):
        visited.add(node)
        order.append(node)
        for neighbor in sorted(graph[node]):
            if neighbor not in visited:
                visit(neighbor)
    visit(start)
    return order

def mutual_friends(user1, user2):
    if user1 not in graph or user2 not in graph:
        return []
    return sorted(graph[user1] & graph[user2])

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/graph")
def get_graph():
    with lock:
        nodes = [{"id": name} for name in sorted(graph)]
        edges = [{"source": a, "target": b}
                 for a in sorted(graph)
                 for b in sorted(graph[a]) if a < b]
    return jsonify({"nodes": nodes, "edges": edges})

@app.post("/api/users")
def add_user():
    data = request.get_json(silent=True) or {}
    try:
        name = ensure_user(str(data.get("name", "")))
        with lock:
            if name in graph:
                return jsonify({"error": "This user already exists."}), 409
            graph[name] = set()
        return jsonify({"message": f"{name} added successfully."})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

@app.post("/api/connections")
def add_connection():
    data = request.get_json(silent=True) or {}
    a, b = str(data.get("user1", "")).strip(), str(data.get("user2", "")).strip()
    with lock:
        if a not in graph or b not in graph:
            return jsonify({"error": "Both users must exist first."}), 404
        if a == b:
            return jsonify({"error": "A user cannot connect to themselves."}), 400
        if b in graph[a]:
            return jsonify({"error": "These users are already connected."}), 409
        graph[a].add(b)
        graph[b].add(a)
    return jsonify({"message": f"Connection added between {a} and {b}."})

@app.post("/api/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    start = str(data.get("start", "")).strip()
    target = str(data.get("target", "")).strip()
    with lock:
        if start not in graph:
            return jsonify({"error": "Select a valid starting user."}), 400
        if action == "bfs":
            result = bfs(start)
            return jsonify({"title": "BFS traversal", "result": result,
                            "description": "Breadth-First Search explores users level by level."})
        if action == "dfs":
            result = dfs(start)
            return jsonify({"title": "DFS traversal", "result": result,
                            "description": "Depth-First Search explores one branch before backtracking."})
        if action == "shortest":
            if target not in graph:
                return jsonify({"error": "Select a valid destination user."}), 400
            path = bfs(start, target)
            if not path:
                return jsonify({"error": "No connection path exists between these users."}), 404
            return jsonify({"title": "Shortest connection path", "result": path,
                            "description": f"{len(path)-1} connection(s) between {start} and {target}."})
        if action == "mutual":
            if target not in graph:
                return jsonify({"error": "Select another valid user."}), 400
            result = mutual_friends(start, target)
            return jsonify({"title": "Mutual friends", "result": result,
                            "description": "Users connected to both selected users."})
    return jsonify({"error": "Unknown analysis operation."}), 400

@app.get("/api/stats")
def stats():
    with lock:
        users = len(graph)
        connections = sum(len(v) for v in graph.values()) // 2
        most_connected = max(graph, key=lambda x: len(graph[x])) if graph else None
        return jsonify({"users": users, "connections": connections,
                        "most_connected": most_connected,
                        "average_degree": round((2 * connections / users), 2) if users else 0})

if __name__ == "__main__":
    app.run(debug=True)
