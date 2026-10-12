"""Training pipeline for MaskablePPO and Unmasked PPO controllers.

Citations:
- Eq. (9): Masked policy distribution
- Eq. (12)-(13): PPO objective and reward function
- Section 5: Table I hyperparameters, checkpoint selection gate, normalization fitting
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import yaml

from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.utils import get_action_masks
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback

from ztarb.env import ZeroTrustArbiterEnv
from ztarb.features import ObservationBuilder
from ztarb.simulator.splits import generate_100_principals, get_principal_splits
from ztarb.oracle import IndependentOracle
from ztarb.types import Action, Request


class TrainLogCallback(BaseCallback):
    """Callback streaming PPO training metrics to JSONL file."""

    def __init__(self, log_path: str = "results/train_log.jsonl"):
        super().__init__()
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        # Clear or initialize log file
        with open(self.log_path, "a", encoding="utf-8") as f:
            pass

    def _on_step(self) -> bool:
        return True

    def _on_rollout_end(self) -> None:
        logs = getattr(self.model, "logger", None)
        values = getattr(logs, "name_to_value", {}) if logs else {}

        record = {
            "timesteps": int(self.num_timesteps),
            "ep_rew_mean": round(float(values.get("rollout/ep_rew_mean", 0.0)), 3),
            "ep_len_mean": round(float(values.get("rollout/ep_len_mean", 0.0)), 1),
            "entropy_loss": round(float(values.get("train/entropy_loss", 0.0)), 4),
            "policy_loss": round(float(values.get("train/policy_gradient_loss", 0.0)), 4),
            "value_loss": round(float(values.get("train/value_loss", 0.0)), 4),
            "approx_kl": round(float(values.get("train/approx_kl", 0.0)), 4),
            "clip_fraction": round(float(values.get("train/clip_fraction", 0.0)), 4),
            "explained_variance": round(float(values.get("train/explained_variance", 0.0)), 4),
            "learning_rate": float(values.get("train/learning_rate", 3e-4)),
        }
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")


def mask_fn(env: ZeroTrustArbiterEnv) -> np.ndarray:
    return env.action_masks()


def collect_normalization_data(train_principals, n_episodes: int = 20) -> ObservationBuilder:
    """Collect sample observations on training split to fit normalization stats."""
    builder = ObservationBuilder(b_max=100.0)
    samples: List[np.ndarray] = []
    
    env = ZeroTrustArbiterEnv(principals=train_principals, seed=42)
    for ep in range(n_episodes):
        obs, _ = env.reset()
        samples.append(obs)
        done = False
        while not done:
            # Random action among mask
            mask = env.action_masks()
            valid_actions = np.where(mask)[0]
            act = int(np.random.choice(valid_actions))
            obs, _, term, trunc, _ = env.step(act)
            samples.append(obs)
            done = term or trunc

    builder.fit_normalizer(samples)
    return builder


def run_training(
    profile: str = "quick",
    smoke_steps: Optional[int] = None,
    output_dir: str = "checkpoints",
    config_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Train MaskablePPO and Unmasked PPO agents."""
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Load configuration
    cfg_file = config_path or f"configs/{profile}.yaml"
    with open(cfg_file, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    timesteps = smoke_steps if smoke_steps else cfg.get("total_timesteps", 100000)
    rl_cfg = cfg.get("rl", {})
    gate_cfg = cfg.get("deployment_gate", {})
    max_impact_ceiling = float(gate_cfg.get("max_attack_impact", 15.0))

    # Splits: 60 train, 20 val, 20 test
    all_principals = generate_100_principals()
    train_principals = all_principals[:60]
    val_principals = all_principals[60:80]

    print(f"=== Starting Training [{profile.upper()}] ===")
    print(f"Timesteps: {timesteps} | Train principals: {len(train_principals)} | Val: {len(val_principals)}")

    # 1. Fit Normalization Statistics on Training Split Only
    print("Fitting normalization statistics on training split...")
    norm_builder = collect_normalization_data(train_principals, n_episodes=15)
    norm_stats_path = out_dir / "norm_stats.json"
    norm_builder.save_stats(norm_stats_path)
    print(f"Saved normalization stats to {norm_stats_path}")

    # 2. Build Training Environment
    train_env = ZeroTrustArbiterEnv(
        principals=train_principals,
        scenario="benign",
        observation_builder=norm_builder,
        b_max=cfg["budget"]["B_max"],
        kappa=cfg["budget"]["kappa"],
        p_exp=cfg["budget"]["p"],
        eta=cfg["budget"]["eta"],
        w_u=cfg["rewards"]["w_u"],
        w_l=cfg["rewards"]["w_l"],
        w_f=cfg["rewards"]["w_f"],
        w_i=cfg["rewards"]["w_i"],
    )

    n_steps = min(int(rl_cfg.get("n_steps", 2048)), timesteps)
    batch_size = min(int(rl_cfg.get("batch_size", 64)), n_steps)

    policy_kwargs = dict(
        net_arch=dict(
            pi=rl_cfg.get("policy_arch", [64, 64]),
            vf=rl_cfg.get("value_arch", [64, 64]),
        )
    )

    # 3. Train Full Framework (MaskablePPO)
    print("\nTraining Full Framework (MaskablePPO)...")
    maskable_model = MaskablePPO(
        "MlpPolicy",
        train_env,
        learning_rate=float(rl_cfg.get("learning_rate", 3e-4)),
        n_steps=n_steps,
        batch_size=batch_size,
        n_epochs=int(rl_cfg.get("n_epochs", 10)),
        gamma=float(rl_cfg.get("gamma", 0.99)),
        gae_lambda=float(rl_cfg.get("gae_lambda", 0.95)),
        clip_range=float(rl_cfg.get("clip_range", 0.2)),
        ent_coef=float(rl_cfg.get("ent_coef", 0.01)),
        policy_kwargs=policy_kwargs,
        seed=42,
        verbose=0,
    )
    train_cb = TrainLogCallback()
    maskable_model.learn(total_timesteps=timesteps, callback=train_cb)
    maskable_path = out_dir / "full_framework.zip"
    maskable_model.save(str(maskable_path))
    print(f"Saved Full Framework model to {maskable_path}")

    # 4. Train Unmasked PPO Baseline (Simulator-only, no action masking)
    print("\nTraining Unmasked PPO Baseline...")
    unmasked_env = ZeroTrustArbiterEnv(
        principals=train_principals,
        scenario="benign",
        observation_builder=norm_builder,
        apply_shield=True,  # Shield intercepts invalid proposals at runtime
        b_max=cfg["budget"]["B_max"],
        kappa=cfg["budget"]["kappa"],
        p_exp=cfg["budget"]["p"],
        eta=cfg["budget"]["eta"],
    )
    unmasked_model = PPO(
        "MlpPolicy",
        unmasked_env,
        learning_rate=float(rl_cfg.get("learning_rate", 3e-4)),
        n_steps=n_steps,
        batch_size=batch_size,
        n_epochs=int(rl_cfg.get("n_epochs", 10)),
        gamma=float(rl_cfg.get("gamma", 0.99)),
        gae_lambda=float(rl_cfg.get("gae_lambda", 0.95)),
        clip_range=float(rl_cfg.get("clip_range", 0.2)),
        policy_kwargs=policy_kwargs,
        seed=42,
        verbose=0,
    )
    unmasked_model.learn(total_timesteps=timesteps)
    unmasked_path = out_dir / "unmasked_ppo.zip"
    unmasked_model.save(str(unmasked_path))
    print(f"Saved Unmasked PPO model to {unmasked_path}")

    # 5. Checkpoint Selection & Validation Deployment Gate
    print("\nEvaluating Checkpoint on Validation Partition (Deployment Gate)...")
    val_env = ZeroTrustArbiterEnv(
        principals=val_principals,
        scenario="gradual_exfiltration",
        observation_builder=norm_builder,
    )

    val_violations = 0
    val_total_impact = 0.0
    val_useful_work = 0.0
    val_decisions = []

    for ep in range(5):
        obs, _ = val_env.reset()
        done = False
        while not done:
            mask = val_env.action_masks()
            act, _ = maskable_model.predict(obs, action_masks=mask, deterministic=True)
            
            # Capture request and role BEFORE stepping environment
            req = val_env.current_req
            role = val_env.current_principal.role

            obs, rew, term, trunc, info = val_env.step(int(act))
            done = term or trunc

            # Independent Oracle check
            executed = Action(info["executed_action"])
            val_decisions.append((req, role, executed))

            val_useful_work += info["useful_work"]
            val_total_impact += info["attack_loss"]

    pvr = IndependentOracle.compute_pvr(val_decisions)
    passed_violations_gate = (pvr == 0.0)
    passed_impact_gate = (val_total_impact <= max_impact_ceiling)
    passed_gate = passed_violations_gate and passed_impact_gate

    status_str = "PASSED DEPLOYMENT GATE" if passed_gate else "FAILS DEPLOYMENT GATE"
    print(f"Validation Gate Result: {status_str}")
    print(f"  Policy Violations: {pvr * 100:.2f}% (Required: 0%)")
    print(f"  Realized Attack Impact: {val_total_impact:.2f} (Ceiling: {max_impact_ceiling:.2f})")
    print(f"  Useful Work Completed: {val_useful_work:.2f}")

    meta = {
        "profile": profile,
        "timesteps": timesteps,
        "pvr": pvr,
        "attack_impact": val_total_impact,
        "useful_work": val_useful_work,
        "deployment_gate_status": status_str,
    }
    with open(out_dir / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return meta


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ZT-Arbiter RL Controllers")
    parser.add_argument("--profile", choices=["quick", "paper"], default="quick")
    parser.add_argument("--smoke", type=int, default=None, help="Run smoke test with N steps")
    parser.add_argument("--output-dir", default="checkpoints")
    args = parser.parse_args()

    run_training(
        profile=args.profile,
        smoke_steps=args.smoke,
        output_dir=args.output_dir,
    )


if __name__ == "__main__":
    main()
