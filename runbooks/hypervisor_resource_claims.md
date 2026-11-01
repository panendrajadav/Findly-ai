---
title: "Hypervisor Resource Claims & Allocation Runbook"
service: "nova-compute"
category: "resource-management"
risk_level: "MEDIUM"
---

# Hypervisor Resource Claims Runbook

## Overview
Deals with resource reservation bottlenecks in Nova Compute claims subsystem (`nova.compute.claims`).

## Diagnostic Workflow
1. Check claim attempt messages in `nova-compute.log`:
   `Attempting claim: memory [M] MB, disk [D] GB, vcpus [V] CPU`
2. Check memory limits and available headroom on hypervisor.
3. Review whether `Claim successful` was logged or if claim rejection aborted instance build.

## Remediation Procedures

### Action 1: Query Compute Resource Tracker
Inspect current allocation ratios across all aggregate compute hosts:
```bash
nova hypervisor-show <hypervisor-hostname>
```
Risk Level: **LOW** (Read-only query).

### Action 2: Re-balance CPU and RAM Allocation Ratios
Update compute host overcommit ratios in `/etc/nova/nova.conf`:
```bash
crudini --set /etc/nova/nova.conf DEFAULT cpu_allocation_ratio 4.0
systemctl reload nova-compute
```
Risk Level: **MEDIUM** (Modifies resource overcommit policy; requires operator review).

