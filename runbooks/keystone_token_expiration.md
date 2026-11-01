---
title: "Keystone Authentication Token Failure Runbook"
service: "nova-api"
category: "authentication"
risk_level: "MEDIUM"
---

# Keystone Authentication Token Runbook

## Overview
Deals with authentication token validation errors occurring in `keystonemiddleware.auth_token` within `nova-api.log`.

## Diagnostic Analysis
- Logs indicate `ERROR keystonemiddleware.auth_token` during token verification.
- Root cause: Expired Keystone token cache, clock skew between API worker and Keystone controller, or memcached token cache eviction.

## Remediation Procedures

### Action 1: Check NTP Time Synchronization
Ensure time sync is consistent across OpenStack controller nodes:
```bash
chronyc tracking && chronyc sources
```
Risk Level: **LOW** (Safe status check).

### Action 2: Flush Memcached Token Cache
Flush expired token cache:
```bash
echo "flush_all" | nc localhost 11211
```
Risk Level: **MEDIUM** (Forces all API clients to re-authenticate; requires approval).

