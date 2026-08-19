#!/usr/bin/env python3
"""Render a production Digital Asset Links document from a real SHA-256 certificate fingerprint.

This tool prints JSON to stdout. It never writes signing material and never guesses a fingerprint.
"""
from __future__ import annotations

import argparse
import json
import re

PACKAGE_ID = "com.qiblalabs.qiblaastro"


def normalize_fingerprint(value: str) -> str:
    cleaned = re.sub(r"[^0-9A-Fa-f]", "", value)
    if len(cleaned) != 64:
        raise argparse.ArgumentTypeError(
            "SHA-256 fingerprint must contain exactly 64 hexadecimal characters"
        )
    if not re.fullmatch(r"[0-9A-Fa-f]{64}", cleaned):
        raise argparse.ArgumentTypeError("SHA-256 fingerprint contains non-hex characters")
    upper = cleaned.upper()
    return ":".join(upper[i:i+2] for i in range(0, 64, 2))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render QiblaAstro ELITE .well-known/assetlinks.json from a real signing certificate SHA-256"
    )
    parser.add_argument(
        "fingerprint",
        type=normalize_fingerprint,
        help="Real SHA-256 certificate fingerprint (colon-separated or plain hex)",
    )
    parser.add_argument(
        "--additional-fingerprint",
        action="append",
        default=[],
        type=normalize_fingerprint,
        help="Optional additional real certificate fingerprint, e.g. a local test signing certificate",
    )
    args = parser.parse_args()

    fingerprints = []
    for fp in [args.fingerprint, *args.additional_fingerprint]:
        if fp not in fingerprints:
            fingerprints.append(fp)

    document = [
        {
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": PACKAGE_ID,
                "sha256_cert_fingerprints": fingerprints,
            },
        }
    ]
    print(json.dumps(document, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
