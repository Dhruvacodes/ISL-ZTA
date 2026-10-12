package ztarb.access

import future.keywords

default permit_allow = false
default permit_mfa = false
default permit_restrict = false
default permit_deny = true
default permit_quarantine = false

# Role entitlement check
role_has_resource if {
    some res in data.roles[input.role].allowed_resources
    res == input.resource
}

role_has_operation if {
    some op in data.roles[input.role].allowed_operations
    op == input.operation
}

posture_acceptable if {
    input.device_posture >= data.roles[input.role].min_device_posture
}

resource_mfa_satisfied if {
    data.resources[input.resource].require_mfa == false
}

resource_mfa_satisfied if {
    data.resources[input.resource].require_mfa == true
    input.mfa_passed == true
}

# 1. ALLOW action permission
permit_allow if {
    role_has_resource
    role_has_operation
    posture_acceptable
    resource_mfa_satisfied
}

# 2. MFA action permission (challenge)
# CRITICAL: MFA can ONLY be offered if the principal's role is entitled to the resource.
# MFA can NEVER make an unauthorized resource accessible.
permit_mfa if {
    role_has_resource
    role_has_operation
    input.mfa_passed == false
}

# 3. RESTRICT action permission
permit_restrict if {
    role_has_resource
    data.resources[input.resource].allow_restrict == true
    input.operation == "read"
}

# 4. DENY action permission (always true at platform level)
permit_deny if true

# 5. QUARANTINE action permission (requires quarantine capability)
permit_quarantine if {
    input.quarantine_capable == true
    # Permitted when severe anomalies or unauthorized probes occur
    input.auth_failures_session >= 3
}

permit_quarantine if {
    input.quarantine_capable == true
    not role_has_resource
}

permit_quarantine if {
    input.quarantine_capable == true
    input.device_posture < 0.35
}

# Output mask vector m_t for [ALLOW, MFA, RESTRICT, DENY, QUARANTINE]
# Eq. (8): m_t(a) = 1[P_v(q, x, h, a) = permit]
mask := [
    permit_allow_val,
    permit_mfa_val,
    permit_restrict_val,
    permit_deny_val,
    permit_quarantine_val
]

default permit_allow_val = 0
permit_allow_val = 1 if permit_allow

default permit_mfa_val = 0
permit_mfa_val = 1 if permit_mfa

default permit_restrict_val = 0
permit_restrict_val = 1 if permit_restrict

default permit_deny_val = 1
permit_deny_val = 1 if permit_deny

default permit_quarantine_val = 0
permit_quarantine_val = 1 if permit_quarantine
