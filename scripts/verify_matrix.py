#!/usr/bin/env python3
import sys
from skill_matrix_loader import build_matrix

data = build_matrix()

all_skills = set(data['skill_rename'].values())

covered_in_matrix = set()
for instr, body in data['instruction_matrix'].items():
    if instr.startswith('_'):
        continue
    for s in body.get('skills', []):
        covered_in_matrix.add(s)

coverage_view = set(k for k in data['skill_to_instructions'] if k != '_note')

missing_from_matrix   = all_skills - covered_in_matrix
missing_from_coverage = all_skills - coverage_view
ghost_in_matrix       = covered_in_matrix - all_skills

print(f"Total renamed skills:              {len(all_skills)}")
print(f"Covered in instruction_matrix:     {len(covered_in_matrix)}")
print(f"Covered in skill_to_instructions:  {len(coverage_view)}")

instructions = [k for k in data['instruction_matrix'] if not k.startswith('_')]
expected_total_skills = data.get('_meta', {}).get('total_skills')
expected_total_instructions = data.get('_meta', {}).get('total_instructions')
print(f"Total instructions:                {len(instructions)}")
print()

ok = True
if expected_total_skills is not None and expected_total_skills != len(all_skills):
    ok = False
    print(
        f"META mismatch for total_skills: expected {expected_total_skills}, actual {len(all_skills)}"
    )

if expected_total_instructions is not None and expected_total_instructions != len(instructions):
    ok = False
    print(
        f"META mismatch for total_instructions: expected {expected_total_instructions}, actual {len(instructions)}"
    )

if missing_from_matrix:
    ok = False
    print("MISSING from instruction_matrix:")
    for s in sorted(missing_from_matrix):
        print(f"  - {s}")

if missing_from_coverage:
    ok = False
    print("MISSING from skill_to_instructions:")
    for s in sorted(missing_from_coverage):
        print(f"  - {s}")

if ghost_in_matrix:
    ok = False
    print("UNKNOWN skills in instruction_matrix (not in rename table):")
    for s in sorted(ghost_in_matrix):
        print(f"  - {s}")

if ok:
    print("ALL CLEAR: every skill covered, no orphans, no typos.")

sys.exit(0 if ok else 1)
