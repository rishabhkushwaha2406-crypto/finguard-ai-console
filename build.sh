#!/usr/bin/env bash
# Rebuilds index.html from the files in src/
cd "$(dirname "$0")/src"
(cat head.html engine.js bench.js ui.js home.js app_a.js bench_ui.js bench_graph.js app_b.js cases.js main.js; echo '</script></body></html>') > ../index.html
