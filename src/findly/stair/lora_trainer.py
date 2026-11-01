"""LoRA Fine-Tuning Module for STAIR Structure-Aware Retriever & Qwen Assistant.

Prepares instruction-tuning datasets mapping operational alerts/queries to
constrained hierarchy paths, and provides PEFT/LoRA training pipeline support.
"""

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class StairLoRAExample:
    """A training sample for fine-tuning STAIR hierarchy path routing."""
    query: str
    hierarchy_context: str
    target_path: str
    target_procedure: str
    instruction: str = "Given the operational infrastructure alert and the hierarchical Table of Contents, predict the exact leaf hierarchy path and retrieve the corresponding runbook procedure."

    def to_format(self) -> Dict[str, Any]:
        return {
            "instruction": self.instruction,
            "input": f"Alert / Query: {self.query}\nOperational Context:\n{self.hierarchy_context}",
            "output": f"Hierarchy Path: {self.target_path}\nRunbook Procedure:\n{self.target_procedure}",
        }


class StairLoRADatasetBuilder:
    """Constructs training and evaluation datasets for STAIR LoRA fine-tuning."""

    @staticmethod
    def generate_training_samples() -> List[StairLoRAExample]:
        """Generate curated operational query-to-path training examples from OpenStack telemetry."""
        samples = [
            StairLoRAExample(
                query="Instance 544fd51c-4edc-4780-baae-ba1d80a0acfc experienced 41.81s hypervisor spawn delay.",
                hierarchy_context="OpenStack > Nova Compute > Instance Lifecycle > Spawn & Build Latency Metrics",
                target_path="Nova Compute Spawn Latency Runbook > Remediation Procedures > Action 3: Restart Nova Compute Service",
                target_procedure="Inspect host CPU stolen time and restart nova-compute daemon if worker is unresponsive: systemctl restart nova-compute",
            ),
            StairLoRAExample(
                query="Compute host claims rejected due to memory limits for instance ae651dff-c7ad-43d6-ac96-bbcd820ccca8.",
                hierarchy_context="OpenStack > Nova Compute > Resource Management > Resource Claims & Allocation Limits",
                target_path="Hypervisor Resource Claims Runbook > Remediation Procedures > Action 2: Re-balance CPU and RAM Allocation Ratios",
                target_procedure="Check available RAM headroom using nova hypervisor-show and adjust memory overcommit ratios in nova.conf.",
            ),
            StairLoRAExample(
                query="Periodic background task failed with InvalidDiskInfo in image cache manager.",
                hierarchy_context="OpenStack > Nova Compute > Periodic Background Tasks > Periodic Task Failures & InvalidDiskInfo",
                target_path="Image Cache Manager Troubleshooting Runbook > Remediation Procedures > Action 1: Verify Base Image Integrity",
                target_procedure="Verify base files in /var/lib/nova/instances/_base/ using qemu-img info and run nova-manage image_cache verify.",
            ),
            StairLoRAExample(
                query="Keystone authentication token validation error in nova-api wsgi worker.",
                hierarchy_context="OpenStack > Nova API > Keystone Authentication Middleware > Authentication & Token Validation",
                target_path="Keystone Authentication Token Runbook > Remediation Procedures > Action 2: Flush Memcached Token Cache",
                target_procedure="Verify NTP time synchronization with chronyc tracking and flush expired tokens from memcached: echo 'flush_all' | nc localhost 11211.",
            ),
            StairLoRAExample(
                query="High hypervisor build duration of 51.59s on instance a445709b-6ad0-40ec-8860-bec60b6ca0c2.",
                hierarchy_context="OpenStack > Nova Compute > Instance Lifecycle > Spawn & Build Latency Metrics",
                target_path="Nova Compute Spawn Latency Runbook > Remediation Procedures > Action 4: Live Migrate Heavy Workloads",
                target_procedure="Live migrate heavy neighbor instances off the degraded compute node: nova live-migration --block-migrate <target-vm-uuid> <target-compute-host>.",
            ),
        ]
        return samples

    @classmethod
    def export_dataset(cls, output_path: str = "data/stair_lora_train.jsonl") -> int:
        """Export dataset to JSONL format for HuggingFace / LLaMA-Factory / PEFT fine-tuning."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        samples = cls.generate_training_samples()
        with open(path, "w", encoding="utf-8") as f:
            for s in samples:
                f.write(json.dumps(s.to_format()) + "\n")

        return len(samples)


def get_lora_config(base_model_name: str = "Qwen/Qwen2.5-1.5B-Instruct") -> Dict[str, Any]:
    """Return standard LoRA adapter hyperparameter configuration for Qwen 1.5B/3B."""
    return {
        "base_model": base_model_name,
        "r": 8,
        "lora_alpha": 16,
        "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        "lora_dropout": 0.05,
        "bias": "none",
        "task_type": "CAUSAL_LM",
        "learning_rate": 2e-4,
        "num_train_epochs": 3,
        "per_device_train_batch_size": 2,
        "gradient_accumulation_steps": 4,
        "warmup_ratio": 0.05,
        "fp16": True,
    }

