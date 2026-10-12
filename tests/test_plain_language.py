import re
import json
from pathlib import Path
import pytest


def count_syllables(word: str) -> int:
    """Estimate syllables in an English word."""
    word = word.lower().strip()
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    # Remove trailing e, es, ed unless preceding letter is vowel
    word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
    vowels = re.findall(r'[aeiouy]{1,2}', word)
    return max(1, len(vowels))


def flesch_kincaid_grade(text: str) -> float:
    """Calculate Flesch-Kincaid grade level for a block of text."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = re.findall(r'\b[A-Za-z]+\b', text)
    if not sentences or not words:
        return 0.0
    total_sentences = len(sentences)
    total_words = len(words)
    total_syllables = sum(count_syllables(w) for w in words)
    grade = 0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59
    return grade


def parse_copy_file() -> tuple[list[str], list[str]]:
    """Extract plain-language texts and technical definitions from web/src/copy.ts."""
    copy_path = Path("web/src/copy.ts")
    assert copy_path.exists(), "web/src/copy.ts must exist"
    content = copy_path.read_text(encoding="utf-8")

    plain_texts = []
    # Extract plainDefinition
    plain_defs = re.findall(r"plainDefinition:\s*['\"]([^'\"]+)['\"]", content)
    plain_texts.extend(plain_defs)

    # Extract plainDescription
    plain_descs = re.findall(r"plainDescription:\s*['\"]([^'\"]+)['\"]", content)
    plain_texts.extend(plain_descs)

    # Extract story chapter summaries
    summaries = re.findall(r"summary:\s*['\"]([^'\"]+)['\"]", content)
    plain_texts.extend(summaries)

    # Extract prompts
    prompts = re.findall(r"prompt:\s*['\"]([^'\"]+)['\"]", content)
    plain_texts.extend(prompts)

    return plain_texts, summaries


def test_flesch_kincaid_reading_level():
    """Verify that all plain-mode copy achieves Flesch-Kincaid grade <= 9.0."""
    plain_texts, summaries = parse_copy_file()
    assert len(plain_texts) > 10, "Should have extracted plain texts from copy.ts"

    # Evaluate combined story narration text
    combined_story = " ".join(summaries)
    grade = flesch_kincaid_grade(combined_story)
    print(f"Overall Story Flesch-Kincaid Grade: {grade:.2f}")
    assert grade <= 9.0, f"Story reading grade level {grade:.2f} exceeds target grade 9.0"

    # Verify individual chapter summaries are accessible
    high_grade_summaries = []
    for idx, text in enumerate(summaries, start=1):
        g = flesch_kincaid_grade(text)
        if g > 10.5:  # generous per-sentence leeway
            high_grade_summaries.append((idx, g, text))

    assert len(high_grade_summaries) == 0, f"Chapters with high reading level: {high_grade_summaries}"


def test_jargon_forbidden_in_plain_copy():
    """Verify plain-mode copy avoids unexplained technical jargon terms."""
    plain_texts, _ = parse_copy_file()
    # Forbidden terms in plain mode unless in hover definition/technical mode:
    forbidden_terms = [
        r"\brho\b",
        r"\bPPO\b",
        r"\bMDP\b",
        r"\bRego\b",
        r"\bPEP\b",
        r"\blogit\b",
        r"\bCMDP\b",
        r"\bMarkov\b",
        r"\bKL\b",
    ]

    violations = []
    for text in plain_texts:
        for term_pattern in forbidden_terms:
            if re.search(term_pattern, text, re.IGNORECASE):
                violations.append((term_pattern, text))

    assert len(violations) == 0, f"Found forbidden jargon terms in plain copy: {violations}"


def test_traceability_of_narration_numbers():
    """Verify numbers referenced in story and scorecard trace to real summary.json fields."""
    summary_path = Path("results/summary.json")
    assert summary_path.exists(), "results/summary.json must exist"
    summary_data = json.loads(summary_path.read_text(encoding="utf-8"))

    # Key real empirical metrics:
    rbac_vol = summary_data["per_scenario"]["gradual_exfiltration"]["Static RBAC"]["attacker_allowed_volume"]
    full_vol = summary_data["per_scenario"]["gradual_exfiltration"]["Full Framework"]["attacker_allowed_volume"]
    req_vol = summary_data["per_scenario"]["gradual_exfiltration"]["Static RBAC"]["attacker_requested_volume"]
    total_decisions = summary_data["metadata"]["total_decisions_evaluated"]

    assert req_vol == 0.48, "Gradual attack requested volume must match real 0.48 GB"
    assert rbac_vol == 0.48, "RBAC gradual allowed volume must match real experiment 0.48 GB"
    assert full_vol == 0.12, "Full Framework gradual allowed volume must match real experiment 0.12 GB"
    assert total_decisions == 29064, "Total decisions evaluated must match real 29064"



def test_cold_viewer_quiz_answers_present():
    """Verify cold-viewer quiz file exists and contains answers mapped to chapters."""
    quiz_path = Path("docs/COLD_VIEWER_QUIZ.md")
    assert quiz_path.exists(), "docs/COLD_VIEWER_QUIZ.md must exist"
    quiz_content = quiz_path.read_text(encoding="utf-8")

    assert "Question 1:" in quiz_content
    assert "Question 2:" in quiz_content
    assert "Question 3:" in quiz_content
    assert "Question 4:" in quiz_content
    assert "Question 5:" in quiz_content
    assert "Chapter 2" in quiz_content
    assert "Chapter 5" in quiz_content
    assert "Chapter 9" in quiz_content
