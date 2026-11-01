"""Automated tests for OpenStack log parsing and field extraction."""

import pytest
from datetime import datetime
from findly.parser import parse_log_line, extract_service_name, parse_context_block, extract_instance_id


def test_parse_api_line():
    line = 'nova-api.log.2017-05-14_21:27:04 2017-05-14 19:39:01.445 25746 INFO nova.osapi_compute.wsgi.server [req-5a2050e7-b381-4ae9-92d2-8b08e9f9f4c0 113d3a99c3da401fbd62cc2caa5b96d2 54fadb412c4e40cdbaed9335e4c35a9e - - -] 10.11.10.1 "GET /v2/54fadb412c4e40cdbaed9335e4c35a9e/servers/detail HTTP/1.1" status: 200 len: 1583 time: 0.1919448'
    rec = parse_log_line(line, 1, "openstack_abnormal.log")

    assert rec.source_file == "openstack_abnormal.log"
    assert rec.line_number == 1
    assert rec.service == "nova-api"
    assert rec.timestamp == datetime(2017, 5, 14, 19, 39, 1, 445000)
    assert rec.pid == 25746
    assert rec.level == "INFO"
    assert rec.module == "nova.osapi_compute.wsgi.server"
    assert rec.request_id == "req-5a2050e7-b381-4ae9-92d2-8b08e9f9f4c0"
    assert rec.user_id == "113d3a99c3da401fbd62cc2caa5b96d2"
    assert rec.tenant_id == "54fadb412c4e40cdbaed9335e4c35a9e"
    assert "status: 200" in rec.message


def test_parse_compute_instance_line():
    line = 'nova-compute.log.2017-05-14_21:27:09 2017-05-14 19:39:03.166 2931 INFO nova.compute.manager [-] [instance: 2b590f10-49fd-4ec9-ae41-19596c2f4b25] VM Stopped (Lifecycle Event)'
    rec = parse_log_line(line, 5, "openstack_abnormal.log")

    assert rec.service == "nova-compute"
    assert rec.pid == 2931
    assert rec.level == "INFO"
    assert rec.module == "nova.compute.manager"
    assert rec.request_id is None
    assert rec.instance_id == "2b590f10-49fd-4ec9-ae41-19596c2f4b25"
    assert "VM Stopped" in rec.message


def test_parse_traceback_line_without_context():
    # In OpenStack, traceback continuation lines repeat the header prefix but omit context brackets
    line = 'nova-compute.log.1.2017-05-16_13:55:31 2017-05-16 03:19:45.356 2931 ERROR oslo_service.periodic_task Traceback (most recent call last):'
    rec = parse_log_line(line, 27180, "openstack_normal1.log")

    assert rec.service == "nova-compute"
    assert rec.level == "ERROR"
    assert rec.module == "oslo_service.periodic_task"
    assert rec.request_id is None
    assert "Traceback (most recent call last):" in rec.message


def test_parse_malformed_fallback():
    line = "Random unformatted garbage log text without timestamp or headers"
    rec = parse_log_line(line, 999, "unknown.log")

    assert rec.source_file == "unknown.log"
    assert rec.level == "UNKNOWN"
    assert rec.message == line


def test_extract_service_name():
    assert extract_service_name("nova-compute.log.2017-05-14") == "nova-compute"
    assert extract_service_name("nova-api.log.1") == "nova-api"
    assert extract_service_name("nova-scheduler.log") == "nova-scheduler"
    assert extract_service_name("custom-service.log") == "custom-service"


def test_extract_instance_id_various_formats():
    assert extract_instance_id("[instance: 544fd51c-4edc-4780-baae-ba1d80a0acfc] Claim successful") == "544fd51c-4edc-4780-baae-ba1d80a0acfc"
    assert extract_instance_id('GET /v2/tenant/servers/ae651dff-c7ad-43d6-ac96-bbcd820ccca8 HTTP/1.1') == "ae651dff-c7ad-43d6-ac96-bbcd820ccca8"
    assert extract_instance_id("Creating event for instance a445709b-6ad0-40ec-8860-bec60b6ca0c2") == "a445709b-6ad0-40ec-8860-bec60b6ca0c2"
    assert extract_instance_id("No instance mentioned here") is None

