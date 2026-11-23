# Social Network Connection and Recommendation Analysis

A full-stack academic project built with Python, Flask, HTML, CSS and JavaScript.

## Features
- Add users to an undirected social graph.
- Create friendships/connections.
- Visualize users and connections in an interactive SVG graph.
- BFS traversal (Breadth-First Search).
- DFS traversal (Depth-First Search).
- Shortest connection path using BFS.
- Find mutual friends between two users.
- Network statistics: users, connections, average degree and most connected user.

## Requirements
- Python 3.9 or newer
- pip

## Run on Windows (PowerShell)
```powershell
# 1. Open this folder in VS Code / terminal
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the application
python app.py
```
Open http://127.0.0.1:5000 in your browser.

If PowerShell blocks activation, run this in the current terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```
Alternatively, install without activating the environment:
```powershell
python -m pip install -r requirements.txt
python app.py
```

## Algorithms
- **BFS:** explores the graph level by level. In an unweighted graph, BFS finds a shortest path in terms of number of edges.
- **DFS:** explores one branch as deeply as possible before backtracking.
- **Mutual friends:** computes the intersection of the two users' adjacency sets.

For a graph with V vertices and E edges, BFS and DFS each run in O(V + E) time using an adjacency-list representation.

## Notes
The starter network is stored in memory and resets when the server restarts. This keeps the project simple for demonstration. A database can be added as an extension.
