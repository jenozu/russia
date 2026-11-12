#!/usr/bin/env python3
"""Build dist/: exactly the files a web server may serve (never the repo root, which holds backend code and docs)."""
import shutil
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, '-W', 'ignore', str(root / 'scripts' / 'build_standalone.py')], cwd=root, check=True)
dist = root / 'dist'
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()
shutil.copyfile(root / 'standalone.html', dist / 'index.html')
for name in ('standalone.html', 'manifest.json', 'service-worker.js'):
    shutil.copyfile(root / name, dist / name)
print('dist/:', ', '.join(sorted(p.name for p in dist.iterdir())))
