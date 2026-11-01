---
title: "Image Cache Manager InvalidDiskInfo Runbook"
service: "nova-compute"
category: "image-cache"
risk_level: "LOW"
---

# Image Cache Manager Troubleshooting Runbook

## Overview
Addresses periodic task errors in `oslo_service.periodic_task` during `ComputeManager._run_image_cache_manager_pass`.

## Diagnostic Analysis
- The periodic task logs `ERROR oslo_service.periodic_task ... InvalidDiskInfo: Disk info file is invalid`.
- This occurs when `qemu-img info` is invoked on an aged base image that was simultaneously being removed or recreated.
- This is a background hypervisor maintenance warning and does not compromise active running VM instances.

## Remediation Procedures

### Action 1: Verify Base Image Integrity
Inspect files in `/var/lib/nova/instances/_base`:
```bash
ls -lha /var/lib/nova/instances/_base/ && qemu-img info /var/lib/nova/instances/_base/<image-hash>
```
Risk Level: **LOW** (Read-only inspection).

### Action 2: Trigger Manual Image Cache Manager Pass
Trigger compute cache refresh:
```bash
nova-manage image_cache verify
```
Risk Level: **LOW** (Standard background pass).

