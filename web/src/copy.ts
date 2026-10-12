export type LanguageMode = 'plain' | 'technical';

export interface TermDefinition {
  plain: string;
  technical: string;
  plainDefinition: string;
  technicalDefinition: string;
  equation?: string;
  codeRef?: string;
}

export const VOCABULARY: Record<string, TermDefinition> = {
  riskScore: {
    plain: 'Suspicion level',
    technical: 'Risk score rho',
    plainDefinition: 'How unusual or risky this specific request seems, calculated from recent activity and data sensitivity.',
    technicalDefinition: 'Composite dynamic risk scalar in [0, 1] incorporating anomaly scores, resource criticality, and identity confidence.',
    equation: 'rho in [0, 1]',
    codeRef: 'src/ztarb/simulator/risk.py',
  },
  budget: {
    plain: 'Daily exposure allowance',
    technical: 'Budget B_t',
    plainDefinition: 'A running allowance of sensitive data an employee can access each day. It drains as data is viewed and refills slowly over time.',
    technicalDefinition: 'Scalar token state tracking cumulative risk-weighted exposure capacity for principal i at discrete step t.',
    equation: 'B_t in [0, B_max]',
    codeRef: 'src/ztarb/budget/store.py',
  },
  charge: {
    plain: 'Cost of this request',
    technical: 'Charge c_t(a)',
    plainDefinition: 'How much exposure allowance this specific request costs, which grows steeply when suspicion is high.',
    technicalDefinition: 'Superlinear exposure charge function penalizing high volume and elevated risk.',
    equation: 'c_t(a) = kappa * v_t * sigma_j * rho_t^p',
    codeRef: 'src/ztarb/budget/calculator.py',
  },
  refill: {
    plain: 'Allowance refills slowly over time',
    technical: 'Refill rate eta',
    plainDefinition: 'The steady rate at which an employee recovers their daily exposure allowance, like recharging a battery.',
    technicalDefinition: 'Continuous refill parameter replenishing budget tokens per unit time up to capacity B_max.',
    equation: 'B_{t+1} = min(B_max, B_t + eta * Delta t - c_t)',
    codeRef: 'src/ztarb/budget/store.py',
  },
  actionMask: {
    plain: 'What company rules allow',
    technical: 'Action mask',
    plainDefinition: 'The list of actions company policy permits right now. The AI is only allowed to pick from this list.',
    technicalDefinition: 'Binary indicator vector over discrete actions enforcing hard administrative policy invariants.',
    equation: 'm_t in {0, 1}^5',
    codeRef: 'src/ztarb/policy/engine.py',
  },
  rlProposal: {
    plain: "The AI's suggestion",
    technical: 'RL proposal',
    plainDefinition: 'What the machine learning model recommends doing in order to protect data without disrupting legitimate work.',
    technicalDefinition: 'Action sample from categorical policy distribution parameterized by deep neural network.',
    equation: 'a_tilde_t ~ pi_theta(a | s_t)',
    codeRef: 'src/ztarb/train.py',
  },
  shield: {
    plain: 'Safety check',
    technical: 'Deterministic shield',
    plainDefinition: 'A strict rule engine that inspects the AI proposal. It immediately overrules the AI if an action would break company rules or exceed the allowance.',
    technicalDefinition: 'Formal supervisory filter projecting proposed action into feasible safe action set.',
    equation: 'a_t = argmin_{a in F_t} d(a, a_tilde_t)',
    codeRef: 'src/ztarb/shield/supervisor.py',
  },
  executedAction: {
    plain: 'What actually happened',
    technical: 'Executed action a_t',
    plainDefinition: 'The final decision applied to the employee request after the safety check verified it.',
    technicalDefinition: 'Safe action dispatched to Policy Enforcement Point for execution and ledger recording.',
    equation: 'a_t in F_t subseteq M_t',
    codeRef: 'src/ztarb/shield/pep.py',
  },
  ALLOW: {
    plain: 'Let through',
    technical: 'ALLOW',
    plainDefinition: 'Grant immediate access to the requested data because suspicion is low and allowance is available.',
    technicalDefinition: 'Action 0: Unrestricted authorization passing request directly to upstream resource.',
    equation: 'a = 0',
    codeRef: 'src/ztarb/simulator/models.py',
  },
  MFA: {
    plain: 'Ask to prove identity',
    technical: 'MFA',
    plainDefinition: 'Prompt the user with a two-factor security check to ensure their account has not been hijacked.',
    technicalDefinition: 'Action 1: Step-up authentication challenge requiring multi-factor cryptographic response.',
    equation: 'a = 1',
    codeRef: 'src/ztarb/simulator/models.py',
  },
  RESTRICT: {
    plain: 'Let through, but limited',
    technical: 'RESTRICT',
    plainDefinition: 'Allow the user to see a limited preview or smaller amount of data to keep work moving while containing risk.',
    technicalDefinition: 'Action 2: Rate-limited, redacted, or sandboxed authorization containing blast radius.',
    equation: 'a = 2',
    codeRef: 'src/ztarb/simulator/models.py',
  },
  DENY: {
    plain: 'Block',
    technical: 'DENY',
    plainDefinition: 'Stop the request completely because it breaks policy or suspicion is too high.',
    technicalDefinition: 'Action 3: Immediate authorization rejection closing connection without state change.',
    equation: 'a = 3',
    codeRef: 'src/ztarb/simulator/models.py',
  },
  QUARANTINE: {
    plain: 'Lock account and alert security',
    technical: 'QUARANTINE',
    plainDefinition: 'Freeze the user account and alert the security operations team because severe suspicious behavior was detected.',
    technicalDefinition: 'Action 4: Revocation of active bearer tokens, session isolation, and SIEM security alert trigger.',
    equation: 'a = 4',
    codeRef: 'src/ztarb/simulator/models.py',
  },
  pep: {
    plain: 'Gatekeeper',
    technical: 'PEP (Policy Enforcement Point)',
    plainDefinition: 'The network component that intercepts traffic and applies the final decision.',
    technicalDefinition: 'Distributed gateway intercepting request tokens and enforcing cryptographic arbitration verdicts.',
    equation: 'PEP(request, a_t)',
    codeRef: 'src/ztarb/shield/pep.py',
  },
  auditLog: {
    plain: 'Tamper-proof record of every decision',
    technical: 'Cryptographic hash chain audit log',
    plainDefinition: 'A digital ledger where each decision is cryptographically linked to the previous one, making any modification immediately obvious.',
    technicalDefinition: 'Append-only SHA-256 hash linked ledger with state anchor persistence.',
    equation: 'h_k = SHA256(h_{k-1} || payload_k)',
    codeRef: 'src/ztarb/audit/chain.py',
  },
  policyViolation: {
    plain: 'A decision that broke company rules',
    technical: 'Policy violation',
    plainDefinition: 'An illegal access decision, such as giving an employee access without required verification.',
    technicalDefinition: 'Safety invariant failure where executed action a_t does not belong to feasible set F_t.',
    equation: 'a_t not in F_t',
    codeRef: 'src/ztarb/shield/supervisor.py',
  },
  attackSuccessRate: {
    plain: 'How often the attacker got what they wanted',
    technical: 'Attack success rate (ASR)',
    plainDefinition: 'The percentage of malicious attempts that succeeded in downloading unauthorized sensitive data.',
    technicalDefinition: 'Empirical fraction of adversarial episodes where target exfiltration volume was satisfied.',
    equation: 'ASR = N_breach / N_total',
    codeRef: 'src/ztarb/eval/metrics.py',
  },
};

export interface ScenarioCopy {
  id: string;
  plainName: string;
  technicalName: string;
  plainDescription: string;
  technicalDescription: string;
  attackerGoal: string;
}

export const SCENARIOS: Record<string, ScenarioCopy> = {
  gradual_exfiltration: {
    id: 'gradual_exfiltration',
    plainName: 'Someone steals a password and copies data slowly',
    technicalName: 'Gradual Exfiltration (Low-and-Slow)',
    plainDescription: 'An intruder with a stolen password downloads customer records a little at a time over several hours so no single download looks alarming.',
    technicalDescription: 'Low-and-slow insider evasion pacing requests below single-request risk thresholds.',
    attackerGoal: '0.48 GB of confidential customer records',
  },
  adaptive_pacing: {
    id: 'adaptive_pacing',
    plainName: 'Cleverly spaced downloads',
    technicalName: 'Adaptive Pacing Attack',
    plainDescription: 'An attacker deliberately waits between downloads to sneak past standard alarm systems.',
    technicalDescription: 'Adversary introduces dynamic jitter delays between calls to avoid burst detection triggers.',
    attackerGoal: '0.56 GB of sensitive intellectual property',
  },
  session_resets: {
    id: 'session_resets',
    plainName: 'Stolen password reset attempts',
    technicalName: 'Session Reset Evasion',
    plainDescription: 'An intruder resets connection tokens repeatedly, hoping the security system forgets their recent actions.',
    technicalDescription: 'Adversary cycles session identifiers to reset stateless connection trackers.',
    attackerGoal: '1.44 GB across multiple rotated sessions',
  },
  burst_access: {
    id: 'burst_access',
    plainName: 'A sudden huge download',
    technicalName: 'Burst Access Exfiltration',
    plainDescription: 'A stolen account tries to bulk download large database archives in just a few seconds.',
    technicalDescription: 'High-frequency batch exfiltration testing burst-rate containment.',
    attackerGoal: '2.80 GB in rapid succession',
  },
  repeated_auth_failures: {
    id: 'repeated_auth_failures',
    plainName: 'Someone keeps guessing passwords',
    technicalName: 'Repeated Authentication Failures',
    plainDescription: 'An attacker fails password checks several times before trying to view customer files.',
    technicalDescription: 'Brute-force credential spray triggering authentication failure counters.',
    attackerGoal: '0.14 GB following failed login attempts',
  },
  benign: {
    id: 'benign',
    plainName: 'A normal workday',
    technicalName: 'Benign Enterprise Workload',
    plainDescription: 'Regular employees doing their normal finance and engineering tasks without any malicious intent.',
    technicalDescription: 'Distribution-faithful enterprise baseline of authorized operational requests.',
    attackerGoal: '0.00 GB (No attack present)',
  },
};

export interface ControllerCopy {
  id: string;
  plainName: string;
  technicalName: string;
  plainDescription: string;
  technicalDescription: string;
  badge: string;
}

export const CONTROLLERS: Record<string, ControllerCopy> = {
  'Full Framework': {
    id: 'Full Framework',
    plainName: 'Our System (AI + Safety Check)',
    technicalName: 'MaskablePPO + Shield (Full Framework)',
    plainDescription: 'Combines an AI that picks the gentlest safe response with a strict safety check and daily exposure allowance.',
    technicalDescription: 'Constrained policy optimization with action masking and deterministic budget shielding.',
    badge: 'Proposed',
  },
  'Deterministic Budget': {
    id: 'Deterministic Budget',
    plainName: 'Fixed Allowance Rule',
    technicalName: 'Deterministic Budget Baseline',
    plainDescription: 'Uses the daily exposure allowance, but follows fixed mathematical thresholds without any learning.',
    technicalDescription: 'Static heuristic mapping risk and budget state to discrete actions.',
    badge: 'Baseline',
  },
  'Risk Threshold': {
    id: 'Risk Threshold',
    plainName: 'Simple Suspicion Filter',
    technicalName: 'Risk-Threshold Controller',
    plainDescription: 'Inspects each request in isolation based on suspicion, with no memory of past requests or allowances.',
    technicalDescription: 'Stateless thresholding on instantaneous risk score rho_t.',
    badge: 'Baseline',
  },
  'Static RBAC': {
    id: 'Static RBAC',
    plainName: 'Traditional Access Control',
    technicalName: 'Static RBAC Baseline',
    plainDescription: 'Checks only whether the employee has permission on paper. If the account is allowed access, every request succeeds.',
    technicalDescription: 'Static role-based access control with static permission tables.',
    badge: 'Traditional',
  },
  'Unmasked PPO (with shield)': {
    id: 'Unmasked PPO (with shield)',
    plainName: 'AI without Rule Guidance (Safety Check On)',
    technicalName: 'Unmasked PPO (with shield)',
    plainDescription: 'An AI trained without rule boundaries, but protected by the final safety check.',
    technicalDescription: 'Unconstrained PPO agent evaluated with deterministic safety shield active.',
    badge: 'Ablation',
  },
  'Unmasked PPO (no shield)': {
    id: 'Unmasked PPO (no shield)',
    plainName: 'Unguarded AI (No Safety Check)',
    technicalName: 'Unmasked PPO (no shield)',
    plainDescription: 'An unprotected AI with no safety check, showing how standard machine learning can break company rules.',
    technicalDescription: 'Raw neural network policy executing unverified actions directly.',
    badge: 'Ablation',
  },
};

export interface StoryChapter {
  id: number;
  chapterNumber: number;
  title: string;
  plainTitle: string;
  technicalTitle: string;
  summary: string;
  prompt: string;
  speakerNotes: string;
  visualType: 'normal_flow' | 'the_problem' | 'allowance_bar' | 'ai_choices' | 'safety_shield' | 'head_to_head' | 'user_impact' | 'audit_chain' | 'limitations' | 'takeaway';
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    chapterNumber: 1,
    title: 'A Normal Day',
    plainTitle: 'A normal day at work',
    technicalTitle: 'Benign Baseline Workload Distribution',
    summary: 'Priya is a finance analyst. She needs customer files to do her job. Most requests are let through right away. Sometimes she must prove her identity. Work moves fast and smooth.',
    prompt: 'Notice how legitimate requests are allowed through with minimal interruption.',
    speakerNotes: "Here is Priya, a legitimate finance analyst. She accesses customer databases every day for quarterly reports. In normal operation, our system lets her work uninterrupted.",
    visualType: 'normal_flow',
  },
  {
    id: 2,
    chapterNumber: 2,
    title: 'The Problem',
    plainTitle: 'The stolen password problem',
    technicalTitle: 'Static RBAC Insider Threat Vulnerability',
    summary: 'An intruder stole Priya\'s password. They copy small files over many hours. Old security checks each request alone. It sees a valid password and lets every request through. The data quietly walks out the door.',
    prompt: 'Watch the red leak meter fill up even though every request is approved.',
    speakerNotes: "Now imagine an intruder steals Priya's password. Traditional security checks each request one by one. Because Priya has permission, every request is approved. 100% of the data leaks out quietly.",
    visualType: 'the_problem',
  },
  {
    id: 3,
    chapterNumber: 3,
    title: 'Idea 1: An Exposure Allowance',
    plainTitle: 'Does an exposure allowance help?',
    technicalTitle: 'Stateful Exposure Budgeting (Eq. 4-6)',
    summary: 'Our system gives each user a daily data allowance. Each sensitive file spends part of this limit. Risky files cost more. The allowance fills back up slowly over time, like a battery.',
    prompt: 'Watch the allowance bar drain as sensitive files are accessed.',
    speakerNotes: "Our first idea is a daily exposure allowance. Instead of granting unlimited access, each sensitive request spends allowance. Suspicious requests cost more. As the intruder pulls data, the allowance drains.",
    visualType: 'allowance_bar',
  },
  {
    id: 4,
    chapterNumber: 4,
    title: 'Idea 2: An AI Picks the Gentlest Response',
    plainTitle: 'An AI chooses the gentlest safe response',
    technicalTitle: 'Constrained Reinforcement Learning Policy',
    summary: 'An AI looks at each request. It picks the gentlest safe action from five choices. It can ask the user to prove their identity. It can also share a small preview. This keeps work moving while staying safe.',
    prompt: 'See the five options: Let through, Ask to prove identity, Limited, Block, and Lock account.',
    speakerNotes: "Instead of a blunt yes-or-no switch, an AI chooses from five graduated actions. When suspicion rises slightly, it asks the user to prove their identity or gives a limited preview so real work isn't halted.",
    visualType: 'ai_choices',
  },
  {
    id: 5,
    chapterNumber: 5,
    title: 'Idea 3: A Safety Check That Cannot Be Fooled',
    plainTitle: 'A safety check that protects company rules',
    technicalTitle: 'Deterministic Safety Shield Invariant',
    summary: 'An AI can still make errors. Our system adds a strict rule check on top. If the AI suggests an action that breaks company rules, the safety check overrules it at once. The AI can never grant extra access.',
    prompt: 'Watch the safety check flash red and overrule the AI suggestion.',
    speakerNotes: "Can we trust an AI with corporate access? No. That is why our deterministic safety check inspects every suggestion. If the AI tries to grant unauthorized access, the safety check overrules it immediately.",
    visualType: 'safety_shield',
  },
  {
    id: 6,
    chapterNumber: 6,
    title: 'Head-to-Head Comparison',
    plainTitle: 'Comparing security systems head-to-head',
    technicalTitle: 'Multi-Controller Empirical Benchmark Replay',
    summary: 'We ran the same slow attack against all systems. Old security leaked all files. Our system cut stolen data down to a quarter. It also had zero rule violations.',
    prompt: 'Compare the final stolen data bars across each system.',
    speakerNotes: "Here is the head-to-head proof. Under the same stealthy attack, traditional security leaked 100% of target files. Our system cut data loss to 25% while maintaining zero policy violations.",
    visualType: 'head_to_head',
  },
  {
    id: 7,
    chapterNumber: 7,
    title: 'Did Normal Users Suffer?',
    plainTitle: 'Measuring the impact on normal employees',
    technicalTitle: 'Utility and Friction Accounting ($U_t, F_t$)',
    summary: 'Security should not stop good work. Real employees finished all their normal tasks. They only saw a few quick identity checks on top-secret files. No good work was blocked.',
    prompt: 'See how legitimate work completions remain high across all systems.',
    speakerNotes: "Did this strict defense hurt real users? No. Legitimate work completion remained at 3.25 units, identical to traditional security, with only minimal identity prompts on critical databases.",
    visualType: 'user_impact',
  },
  {
    id: 8,
    chapterNumber: 8,
    title: 'Can We Trust the Record?',
    plainTitle: 'A tamper-proof record of every decision',
    technicalTitle: 'Cryptographic Hash-Linked Audit Trail',
    summary: 'Every choice is locked in a secure chain of records. If an attacker tries to change past logs, the chain breaks at once. It points to the exact record that was altered.',
    prompt: 'Click "Alter one entry" to watch the chain detect tampering in real time.',
    speakerNotes: "Can an attacker erase their tracks? Every decision is saved in a tamper-proof cryptographic ledger. If someone modifies a single byte in the history, the chain breaks and highlights the exact tampered entry.",
    visualType: 'audit_chain',
  },
  {
    id: 9,
    chapterNumber: 9,
    title: 'Where It Struggles',
    plainTitle: 'Where the system struggles (honest findings)',
    technicalTitle: 'Architectural Boundaries and Limitations',
    summary: 'Our system is not magic. In sudden huge downloads, a fixed rule stops attacks just as well as the AI. Also, very slow attacks can still leak data over months. Allowances track single users, not fifty accounts at once.',
    prompt: 'Notice where the deterministic rule matched the AI and where slow attacks require lower refill rates.',
    speakerNotes: "Here is where the system falls short. In sudden burst attacks, a simple fixed rule is just as fast as an AI. And if an attacker works slower than the allowance refill rate, they can still leak data over months.",
    visualType: 'limitations',
  },
  {
    id: 10,
    chapterNumber: 10,
    title: 'The Takeaway',
    plainTitle: 'What we learned and what comes next',
    technicalTitle: 'Conclusion and Research Implications',
    summary: 'Daily allowances catch slow theft that old systems miss. An AI reduces friction for good users. A strict safety check prevents rule breaks. All tests ran on a benchmark simulator.',
    prompt: 'Choose whether to try the live simulator yourself or explore the technical underpinnings.',
    speakerNotes: "In summary: exposure allowances catch slow theft, AI minimizes user friction, and strict safety checks prevent AI errors. You can now try the simulator yourself or inspect the code under the hood.",
    visualType: 'takeaway',
  },
];

export const COLD_VIEWER_QUIZ = [
  {
    question: '1. What is the main security problem this system solves?',
    answer: 'Traditional security checks each request on its own. When a password is stolen, an intruder can slowly copy data without any single request appearing abnormal.',
    chapterRef: 2,
  },
  {
    question: '2. What does the exposure allowance do?',
    answer: 'It acts like a daily spending limit for sensitive data. Each request drains the allowance based on data volume and suspicion, refilling slowly over time.',
    chapterRef: 3,
  },
  {
    question: '3. Who can overrule the AI?',
    answer: 'A deterministic safety check inspects every AI suggestion and immediately overrules any action that breaks company rules or exceeds the allowance.',
    chapterRef: 5,
  },
  {
    question: '4. Did the system ever break company rules during tests?',
    answer: 'Zero times. With the safety check enabled, the system achieved a 0.00% policy violation rate across all 29,064 evaluated decisions.',
    chapterRef: 6,
  },
  {
    question: '5. Where does the system struggle or fall short?',
    answer: 'In sudden burst attacks, a simple fixed rule performs just as well as the AI. In addition, attacks spaced slower than the allowance refill rate can evade containment.',
    chapterRef: 9,
  },
];
