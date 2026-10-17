#!/usr/bin/env python3
"""Capture the read-only inspector export on loopback. No plugin state is modified."""
import argparse
import json
import socket
import time
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--device', help='Wait for a device name (case-insensitive)')
parser.add_argument('--timeout', type=float, default=50)
parser.add_argument('--output', type=Path, default=Path(__file__).parent / 'selected-device-parameters.json')
args = parser.parse_args()
parts = {}
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(('127.0.0.1', 19673))
    sock.settimeout(1)
    deadline = time.monotonic() + args.timeout
    while time.monotonic() < deadline:
        try:
            data, _ = sock.recvfrom(65535)
        except socket.timeout:
            continue
        try:
            packet = json.loads(data)
            key = (packet['revision'], packet['count'])
            parts.setdefault(key, {})[packet['part']] = packet['data']
            if len(parts[key]) != packet['count']:
                continue
            snapshot = json.loads(''.join(parts[key][i] for i in range(packet['count'])))
            if args.device and snapshot['device'].lower() != args.device.lower():
                continue
            args.output.write_text(json.dumps(snapshot, indent=2) + '\n')
            print(f"Captured {snapshot['device']}: {len(snapshot['parameters'])} parameters -> {args.output}")
            break
        except (ValueError, KeyError, TypeError):
            continue
    else:
        raise SystemExit('No matching parameter export received before timeout')
