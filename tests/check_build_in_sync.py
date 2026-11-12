"""Fail if the committed standalone.html differs from what build_standalone.py generates."""
import subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / "standalone.html"
before = target.read_bytes()
subprocess.run([sys.executable, "-W", "ignore", str(root / "scripts" / "build_standalone.py")], cwd=root, check=True, stdout=subprocess.DEVNULL)
after = target.read_bytes()
if before != after:
    target.write_bytes(before)
    sys.exit("standalone.html is out of date: run scripts/build_standalone.py and commit the result")
print("standalone.html matches build_standalone.py")
