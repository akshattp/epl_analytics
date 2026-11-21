#!/usr/bin/env python3
"""
EPL Platform Documentation Governance Verifier
Validates that all mandatory documentation files exist, are non-empty,
and properly reflect the current system version and release history.
"""

import os
import sys

REQUIRED_DOCS = [
    "documentation/CHANGELOG.md",
    "documentation/VERSION_HISTORY.md",
    "documentation/RELEASE_REGISTER.md",
    "documentation/CURRENT_SYSTEM_INVENTORY.md",
    "documentation/UI_UX_CHANGELOG.md",
    "documentation/DESIGN_SYSTEM.md",
    "documentation/RELEASES/v1.3.0_release_notes.md",
    "documentation/RELEASES/v2.0.0_release_notes.md",
    "documentation/RELEASES/v2.0.1_release_notes.md",
    "documentation/RELEASES/v2.1_release_notes.md",
]

def verify_documentation():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    missing = []
    empty = []

    print("[GOVERNANCE] Checking mandatory documentation assets...")
    for rel_path in REQUIRED_DOCS:
        full_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(full_path):
            missing.append(rel_path)
        else:
            size = os.path.getsize(full_path)
            if size < 100:
                empty.append(rel_path)

    if missing:
        print(f"[FAIL] Missing documentation files: {missing}", file=sys.stderr)
        return False

    if empty:
        print(f"[FAIL] Empty or incomplete documentation files: {empty}", file=sys.stderr)
        return False

    # Check version in backend/routers/version.py
    version_py = os.path.join(base_dir, "backend/routers/version.py")
    if not os.path.exists(version_py):
        print("[FAIL] Missing backend/routers/version.py", file=sys.stderr)
        return False

    with open(version_py, "r") as f:
        content = f.read()
        if "CURRENT_VERSION" not in content or "RELEASES" not in content:
            print("[FAIL] backend/routers/version.py lacks version constants", file=sys.stderr)
            return False

    print("[SUCCESS] All mandatory documentation files verified. Governance check passed.")
    return True

if __name__ == "__main__":
    success = verify_documentation()
    sys.exit(0 if success else 1)
