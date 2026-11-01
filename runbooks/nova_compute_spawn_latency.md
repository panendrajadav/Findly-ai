---
title: "Nova Compute Spawn Latency Runbook"
service: "nova-compute"
category: "performance"
risk_level: "HIGH"
---

# Nova Compute Spawn Latency Runbook

## Overview
This operational runbook provides diagnostic workflows and remediation procedures for OpenStack Nova Compute hypervisor provisioning latency anomalies. Standard baseline spawn times range between 18.0s and 22.0s (mean 19.79s ± 0.65s). Spawn times exceeding 25.0 seconds indicate severe hypervisor bottleneck, disk I/O starvation, or interface attachment hangs.

## Telemetry Diagnosis & Anomaly Verification
1. Inspect the VM instance provisioning timeline in `nova-compute.log`.
2. Check the duration logged in:
   `Took [X] seconds to spawn the instance on the hypervisor`
3. Compare the measured latency against the 19.8s normal baseline.
4. Verify whether memory, vCPU, and disk claims succeeded prior to spawning.
5. Confirm if Neutron external event `network-vif-plugged` was received by Nova API in a timely manner.

## Root Cause Analysis
- **Hypervisor Resource Starvation**: High host CPU stolen time or noisy neighbor VMs pinning physical cores.
- **Base Image Fetch Latency**: Slow download of backing QCOW2 image from Glance into `/var/lib/nova/instances/_base`.
- **Libvirt Domain XML Generation Delay**: Delays while configuring hypervisor tap devices or CPU topology.

## Remediation Procedures

### Action 1: Audit Compute Node Load (Safe)
Execute non-disruptive inspection on the target hypervisor host:
```bash
uptime && free -m && iostat -xz 1 5
```
Risk Level: **LOW** (Safe, read-only inspection).

### Action 2: Clean Orphaned Stale Instance Files
Remove lingering failed instance staging directories ending in `_del`:
```bash
find /var/lib/nova/instances/ -maxdepth 1 -name "*_del" -type d -exec rm -rf {} +
```
Risk Level: **MEDIUM** (Requires operator review before deletion).

### Action 3: Restart Nova Compute Service
If the hypervisor worker thread is stuck in an un-interruptible I/O wait state:
```bash
systemctl restart nova-compute
```
Risk Level: **HIGH** (Restarts local compute daemon; requires explicit operator approval).

### Action 4: Live Migrate Heavy Workloads
Migrate noisy neighbor instances off the degraded compute node:
```bash
nova live-migration --block-migrate <target-vm-uuid> <target-compute-host>
```
Risk Level: **HIGH** (Live migration impacts network throughput and hypervisor state; requires approval).

