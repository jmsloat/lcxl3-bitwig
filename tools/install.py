#!/usr/bin/env python3
"""Install the controller with a backup, preserving its existing UUID and port assignments."""
import argparse
import datetime
import shutil
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = 'LCXL3 Device Profiles.control.js'
LEGACY = 'LCXL3 Iroko.control.js'
IDENTITY = '9a5a363a-6c13-488f-b340-ab237bd79da3'

def install(destination):
    destination = destination.expanduser().resolve()
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError('Install outside the source repository')
    sources = [ROOT / ENTRY, *sorted((ROOT / 'lib').glob('*.js')), *sorted((ROOT / 'profiles').glob('*.js'))]
    for source in sources:
        if not source.is_file():
            raise FileNotFoundError(source)
    for name in [ENTRY, LEGACY]:
        existing = destination / name
        if existing.exists() and IDENTITY not in existing.read_text():
            raise ValueError(f'Refusing to replace a different controller: {existing}')
    if destination.exists():
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        backup = destination.parent.parent / 'Controller Script Backups' / f'{destination.name}-{stamp}-{uuid.uuid4().hex[:6]}'
        shutil.copytree(destination, backup)
        print(f'Backup: {backup}')
    destination.mkdir(parents=True, exist_ok=True)
    # Dependencies first, entry point last. Never leave two entry points with one UUID.
    for source in sources[1:]:
        target = destination / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    staged = destination / (ENTRY + '.tmp')
    shutil.copy2(ROOT / ENTRY, staged)
    (destination / LEGACY).unlink(missing_ok=True)
    staged.replace(destination / ENTRY)
    print(f'Installed: {destination / ENTRY}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path, default=Path.home() / 'Bitwig Studio' / 'Controller Scripts' / 'LCXL3 Effects')
    install(parser.parse_args().destination)
