"""Zero-Trust discrete-event simulator."""

from ztarb.simulator.models import EventOpportunity, SyntheticPrincipal, SyntheticResource
from ztarb.simulator.workload import WorkloadGenerator, get_all_resources
from ztarb.simulator.splits import generate_100_principals, get_principal_splits

__all__ = [
    "EventOpportunity",
    "SyntheticPrincipal",
    "SyntheticResource",
    "WorkloadGenerator",
    "get_all_resources",
    "generate_100_principals",
    "get_principal_splits",
]
