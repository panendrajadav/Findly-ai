"""High-performance OpenStack Oslo log parser with schema normalization."""

import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Union

from findly.models import LogRecord

# Master regex for standard OpenStack Oslo logging with optional context block
LOG_LINE_RE = re.compile(
    r"^(?P<source>\S+)\s+"
    r"(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+"
    r"(?P<pid>\d+)\s+"
    r"(?P<level>[A-Z]+)\s+"
    r"(?P<module>\S+)"
    r"(?:\s+\[(?P<context>[^\]]*)\])?"
    r"(?:\s+(?P<msg>.*))?$"
)

# Extract UUIDs matching VM instance patterns
INSTANCE_UUID_RE = re.compile(
    r"(?:\[instance:\s*|/servers/|instance\s+)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
    re.IGNORECASE,
)


def extract_service_name(source_prefix: str) -> str:
    """Identify OpenStack service from log source prefix (e.g., nova-api, nova-compute)."""
    base = source_prefix.split(".")[0].lower()
    if "compute" in base:
        return "nova-compute"
    elif "api" in base:
        return "nova-api"
    elif "scheduler" in base:
        return "nova-scheduler"
    return base


def parse_context_block(
    context_str: Optional[str],
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parse Oslo request context tokens into (request_id, user_id, tenant_id).
    Typical context: [req-uuid user-uuid tenant-uuid - - -] or [-]
    """
    if not context_str or context_str.strip() == "-":
        return None, None, None

    tokens = context_str.strip().split()
    if not tokens:
        return None, None, None

    request_id = tokens[0] if tokens[0].startswith("req-") else None
    user_id = tokens[1] if len(tokens) > 1 and tokens[1] != "-" else None
    tenant_id = tokens[2] if len(tokens) > 2 and tokens[2] != "-" else None

    return request_id, user_id, tenant_id


def extract_instance_id(message: str) -> Optional[str]:
    """Extract VM instance UUID from log message payload."""
    match = INSTANCE_UUID_RE.search(message)
    if match:
        return match.group(1).lower()
    return None


def parse_log_line(
    line: str,
    line_number: int,
    source_filename: str,
) -> LogRecord:
    """Parse a single log line into a structured LogRecord."""
    raw_stripped = line.rstrip("\r\n")
    match = LOG_LINE_RE.match(raw_stripped)

    if match:
        gd = match.groupdict()
        source_prefix = gd["source"]
        timestamp_str = gd["ts"]
        pid = int(gd["pid"])
        level = gd["level"]
        module = gd["module"]
        context_str = gd.get("context")
        message = gd.get("msg") or ""

        try:
            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")
        except ValueError:
            # Fallback for unexpected timestamp format
            timestamp = datetime.fromisoformat(timestamp_str.replace(" ", "T"))

        service = extract_service_name(source_prefix)
        request_id, user_id, tenant_id = parse_context_block(context_str)
        instance_id = extract_instance_id(message)

        return LogRecord(
            source_file=source_filename,
            line_number=line_number,
            timestamp=timestamp,
            pid=pid,
            level=level,
            module=module,
            service=service,
            request_id=request_id,
            user_id=user_id,
            tenant_id=tenant_id,
            instance_id=instance_id,
            message=message,
            raw=raw_stripped,
        )

    # Fallback record for any malformed or unformatted line
    return LogRecord(
        source_file=source_filename,
        line_number=line_number,
        timestamp=datetime.min,
        pid=0,
        level="UNKNOWN",
        module="unknown",
        service="unknown",
        request_id=None,
        user_id=None,
        tenant_id=None,
        instance_id=None,
        message=raw_stripped,
        raw=raw_stripped,
    )


def stream_log_file(file_path: Union[str, Path]) -> Iterator[LogRecord]:
    """Stream parsed LogRecords from a file one line at a time."""
    path = Path(file_path)
    source_name = path.name

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for idx, line in enumerate(f, start=1):
            if line.strip():
                yield parse_log_line(line, idx, source_name)


def parse_log_file(
    file_path: Union[str, Path],
    max_lines: Optional[int] = None,
) -> List[LogRecord]:
    """Parse an entire log file into memory up to max_lines."""
    records = []
    for record in stream_log_file(file_path):
        records.append(record)
        if max_lines and len(records) >= max_lines:
            break
    return records


def load_dataset_logs(
    dataset_dir: Union[str, Path] = "dataset",
) -> Dict[str, List[LogRecord]]:
    """Load all three OpenStack log files into a dictionary keyed by file label."""
    base = Path(dataset_dir)
    target_files = {
        "abnormal": base / "openstack_abnormal.log",
        "normal1": base / "openstack_normal1.log",
        "normal2": base / "openstack_normal2.log",
    }

    results: Dict[str, List[LogRecord]] = {}
    for key, path in target_files.items():
        if path.exists():
            results[key] = parse_log_file(path)
        else:
            results[key] = []
    return results

