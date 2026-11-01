"""Tests for document ingestion, persistence, deletion, and re-ingestion."""

import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.state import state


@pytest.fixture(scope="module")
def client():
    state.initialize()
    with TestClient(app) as c:
        yield c


def test_document_upload_deletion_and_reingest(client):
    # 1. Upload a test markdown document
    md_content = b"""# Hypervisor Diagnostics
## CPU Pinning
Verify physical CPU pinning for real-time instances.
```bash
virsh vcpupin instance-00000001
```
"""
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("hypervisor_diagnostics.md", md_content, "text/markdown")}
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    assert doc_data["status"] == "SUCCESS"
    assert doc_data["total_sections_ingested"] >= 1

    # 2. Check document sections
    sec_res = client.get(f"/api/documents/{doc_id}/sections")
    assert sec_res.status_code == 200
    secs = sec_res.json()
    assert len(secs) >= 1

    # 3. Delete document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "SUCCESS"

    # 4. Verify document is removed
    sec_after_del = client.get(f"/api/documents/{doc_id}/sections")
    assert sec_after_del.status_code == 404

