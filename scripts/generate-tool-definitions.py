#!/usr/bin/env python3
"""Generate clean-room instruction/skill TypeScript modules from src-first registries."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INSTRUCTIONS_DIR = ROOT / ".github" / "instructions"
SKILLS_DIR = ROOT / ".github" / "skills"
DOCS_DIR = ROOT / "docs"
GENERATED_DIR = ROOT / "src" / "generated"
INSTRUCTION_SPECS_PATH = ROOT / "src" / "instructions" / "instruction-specs.ts"
SKILL_SPECS_PATH = ROOT / "src" / "skills" / "skill-specs.ts"
from skill_matrix_loader import build_matrix


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def read_json_object(path: Path) -> dict[str, object]:
    if not path.exists():
        return {}
    data = json.loads(read_text(path))
    if not isinstance(data, dict):
        raise RuntimeError(f"Expected JSON object in {path}")
    return data


def normalize_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    normalized: list[str] = []
    for item in value:
        text = str(item).strip().strip('"')
        if text:
            normalized.append(text)
    return normalized


DEFAULT_OUTPUT_CONTRACTS_BY_DOMAIN: dict[str, list[str]] = {
    "adapt": [
        "routing decision artifact",
        "configuration and telemetry summary",
        "next-action explanation",
        "validation or operator notes",
    ],
    "arch": [
        "architecture recommendation",
        "tradeoff summary",
        "system component framing",
        "risk and next-step guidance",
    ],
    "bench": [
        "benchmark analysis summary",
        "trend or regression findings",
        "comparison-ready evidence",
        "follow-up actions",
    ],
    "debug": [
        "structured response",
        "actionable steps",
        "context-aware recommendations",
        "clear handoff or validation guidance",
    ],
    "doc": [
        "documentation artifact",
        "audience-aware structure",
        "source-aware coverage",
        "publication or validation checklist",
    ],
    "eval": [
        "evaluation criteria",
        "scoring or benchmark framing",
        "comparison-ready output",
        "decision guidance",
    ],
    "flow": [
        "handoff-ready artifact",
        "phase sequencing guidance",
        "state transition notes",
        "validation or resume guidance",
    ],
    "gov": [
        "policy or compliance assessment",
        "risk classification",
        "required controls",
        "audit trail or remediation steps",
    ],
    "gr": [
        "physics metaphor output",
        "plain-language engineering translation",
        "confidence and limitation notes",
        "recommended engineering action",
    ],
    "lead": [
        "executive-ready guidance",
        "capability or roadmap framing",
        "decision rationale",
        "next-step recommendations",
    ],
    "orch": [
        "orchestration topology",
        "agent responsibility map",
        "control-loop or validation contract",
        "handoff guidance",
    ],
    "prompt": [
        "prompt asset",
        "explicit output contract",
        "failure handling",
        "worked example or usage guidance",
    ],
    "qm": [
        "physics metaphor output",
        "plain-language engineering translation",
        "confidence and limitation notes",
        "recommended engineering action",
    ],
    "qual": [
        "quality findings",
        "evidence-grounded issues",
        "prioritized fixes",
        "verification guidance",
    ],
    "req": [
        "structured requirements",
        "constraints or acceptance criteria",
        "scope boundaries",
        "prioritized next actions",
    ],
    "resil": [
        "failure mode analysis",
        "recovery strategy",
        "operational checks",
        "validation notes",
    ],
    "strat": [
        "prioritized plan",
        "tradeoff rationale",
        "sequencing guidance",
        "success metrics",
    ],
    "synth": [
        "structured synthesis",
        "comparison or recommendation artifact",
        "evidence summary",
        "confidence and next action",
    ],
}


def default_output_contract_for_skill(skill_id: str) -> list[str]:
    return DEFAULT_OUTPUT_CONTRACTS_BY_DOMAIN.get(
        skill_domain(skill_id),
        [
            "structured response",
            "context-aware recommendations",
            "explicit next steps",
            "validation guidance",
        ],
    )


def clear_generated() -> None:
    if GENERATED_DIR.exists():
        shutil.rmtree(GENERATED_DIR)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def parse_frontmatter(markdown: str) -> dict[str, str]:
    match = re.search(r"^---\s*\n(.*?)\n---", markdown, re.DOTALL)
    if not match:
        return {}

    fm_text = match.group(1)
    data: dict[str, str] = {}
    current_key: str | None = None
    buffer: list[str] = []

    def flush() -> None:
        nonlocal current_key, buffer
        if current_key is None:
            return
        value = "\n".join(buffer).strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        data[current_key] = value
        current_key = None
        buffer = []

    for raw_line in fm_text.splitlines():
        line = raw_line.rstrip("\r")
        key_match = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line)
        if key_match:
            flush()
            current_key = key_match.group(1)
            remainder = key_match.group(2)
            if remainder:
                buffer.append(remainder)
            continue
        if current_key is not None:
            buffer.append(line.strip())

    flush()
    return data


def strip_frontmatter(markdown: str) -> str:
    return re.sub(r"^---\s*\n.*?\n---\s*\n?", "", markdown, flags=re.DOTALL)


def extract_first_heading(markdown: str) -> str:
    match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else ""


def extract_section(markdown: str, heading: str) -> str:
    pattern = rf"## {re.escape(heading)}\s*\n(.*?)(?=\n## |\Z)"
    match = re.search(pattern, markdown, re.DOTALL)
    return match.group(1).strip() if match else ""


def extract_bullet_items(section: str) -> list[str]:
    items: list[str] = []
    for line in section.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            items.append(stripped[2:].strip())
    return items


def extract_quoted_or_bulleted_items(section: str, lead_in: str) -> list[str]:
    pattern = rf"{lead_in}(.*?)(?=\n[A-Z#]|\Z)"
    match = re.search(pattern, section, re.DOTALL)
    block = match.group(1) if match else ""
    return [item.strip('"') for item in extract_bullet_items(block)]


def mission_from_instruction(markdown: str) -> str:
    match = re.search(r"\*\*Mission\*\*:\s*(.+)$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else ""


def ts_object(value: object) -> str:
    json_text = json.dumps(value, indent=2, ensure_ascii=False)
    return re.sub(r'"([A-Za-z_][A-Za-z0-9_]*)":', r"\1:", json_text)


def safe_identifier(value: str) -> str:
    identifier = re.sub(r"[^A-Za-z0-9_]", "_", value)
    if identifier and identifier[0].isdigit():
        identifier = f"_{identifier}"
    return identifier


def skill_manifest_const_name(skill_id: str) -> str:
    return f"{safe_identifier(skill_id)}_manifest"


matrix = build_matrix(ROOT)
alias_map: dict[str, str] = matrix.get("skill_rename", {})
canonical_skill_ids = set(alias_map.values())
taxonomy_entries = [
    {"prefix": prefix, "domain": domain}
    for prefix, domain in matrix.get("_meta", {}).get("prefix_legend", {}).items()
]

# ---------------------------------------------------------------------------
# ADR-001 capability-handler phase ordering.
#
# Domains are grouped into phases based on handler implementation priority
# (Phase 1 = earliest / highest value).  Domains not listed explicitly fall
# into Phase 7.  This ordering drives the generated capability-handler-slots
# file that the runtime team consumes when promoting skills to real handlers.
# ---------------------------------------------------------------------------
_ADR001_DOMAIN_PHASES: dict[str, int] = {
    # Phase 1 — core technical skills (highest immediate value, well-understood IO)
    "req": 1,
    "debug": 1,
    "arch": 1,
    # Phase 2 — supporting skills with free/cheap model class
    "qual": 2,
    "doc": 2,
    "flow": 2,
    # Phase 3 — coordination and synthesis
    "orch": 3,
    "strat": 3,
    "synth": 3,
    # Phase 4 — evaluation and prompting
    "eval": 4,
    "prompt": 4,
    "bench": 4,
    # Phase 5 — enterprise and governance
    "lead": 5,
    "gov": 5,
    # Phase 6 — advanced adaptive and resilience
    "adapt": 6,
    "resil": 6,
    # Phase 7 — physics metaphor skills (exploratory; real handlers are optional)
    "qm": 7,
    "gr": 7,
}


def canonical_skill_id(skill_id: str) -> str:
    return alias_map.get(skill_id, skill_id)


def skill_domain(canonical_id: str) -> str:
    """Return the domain prefix for a canonical skill ID (e.g. 'req-analysis' → 'req').

    The domain is the first hyphen-delimited segment of the canonical ID.
    It corresponds directly to the ``prefix_legend`` keys in the matrix
    (minus the trailing hyphen) and drives model-class inference, handler
    dispatch, and the capability-handler phase scaffold.
    """
    return canonical_id.split("-")[0]


def extract_backticked_items(section: str) -> list[str]:
    return re.findall(r"`([^`]+)`", section)


def infer_instruction_model_class(instruction_id: str) -> str:
    if instruction_id in {"review", "evaluate"}:
        return "reviewer"
    if instruction_id in {
        "design",
        "implement",
        "orchestrate",
        "research",
        "plan",
        "enterprise",
        "govern",
        "resilience",
        "adapt",
        "physics-analysis",
    }:
        return "strong"
    if instruction_id in {"bootstrap", "onboard_project", "initial_instructions"}:
        return "free"
    return "cheap"


def infer_skill_model_class(skill_id: str) -> str:
    prefix = skill_domain(skill_id)
    if prefix in {"req", "doc", "flow"}:
        return "free"
    if prefix in {"arch", "gov", "lead", "qm", "gr", "orch", "strat"}:
        return "strong"
    return "cheap"


def schema_fields_for_instruction(instruction_id: str) -> list[dict[str, object]]:
    common = [
        {
            "name": "request",
            "type": "string",
            "description": "Primary task request for this workflow.",
            "required": True,
        },
        {
            "name": "context",
            "type": "string",
            "description": "Relevant background context for the workflow.",
        },
    ]
    special = {
        "bootstrap": [
            {
                "name": "scope",
                "type": "string",
                "description": "Known scope or uncertainty framing for the task.",
            },
            {
                "name": "constraints",
                "type": "array",
                "description": "Constraints already known at bootstrap time.",
                "itemsType": "string",
            },
        ],
        "implement": [
            {
                "name": "deliverable",
                "type": "string",
                "description": "Expected implementation deliverable.",
            },
            {
                "name": "successCriteria",
                "type": "string",
                "description": "Success criteria for the new feature or tool.",
            },
            {
                "name": "constraints",
                "type": "array",
                "description": "Technical or product constraints.",
                "itemsType": "string",
            },
        ],
        "review": [
            {
                "name": "artifact",
                "type": "string",
                "description": "Artifact, branch, or change set to review.",
            },
            {
                "name": "focusAreas",
                "type": "array",
                "description": "Specific areas to emphasize during review.",
                "itemsType": "string",
            },
            {
                "name": "severityThreshold",
                "type": "string",
                "description": "Minimum severity level to report.",
            },
        ],
        "testing": [
            {
                "name": "coverageGoal",
                "type": "string",
                "description": "Desired test coverage or risk surface target.",
            },
            {
                "name": "regressionRisk",
                "type": "string",
                "description": "Known regression area or risk class.",
            },
        ],
        "debug": [
            {
                "name": "failureMode",
                "type": "string",
                "description": "Observed failure or incorrect behavior.",
            },
            {
                "name": "reproduction",
                "type": "string",
                "description": "Reproduction details or minimal failing case.",
            },
        ],
        "document": [
            {
                "name": "audience",
                "type": "string",
                "description": "Intended documentation audience.",
            },
            {
                "name": "format",
                "type": "string",
                "description": "Requested documentation format.",
            },
        ],
        "prompt-engineering": [
            {
                "name": "promptTarget",
                "type": "string",
                "description": "Prompt or prompt family being changed.",
            },
            {
                "name": "benchmarkGoal",
                "type": "string",
                "description": "Desired prompt benchmark objective.",
            },
        ],
        "orchestrate": [
            {
                "name": "agentCount",
                "type": "string",
                "description": "Expected number of participating agents.",
            },
            {
                "name": "routingGoal",
                "type": "string",
                "description": "Primary orchestration or routing objective.",
            },
        ],
        "adapt": [
            {
                "name": "routingGoal",
                "type": "string",
                "description": "Adaptive routing objective or performance goal.",
            },
            {
                "name": "availableModels",
                "type": "array",
                "description": "Available models or lanes for adaptive execution.",
                "itemsType": "string",
            },
        ],
        "resilience": [
            {
                "name": "qualityFloor",
                "type": "string",
                "description": "Target minimum quality threshold.",
            },
            {
                "name": "latencyCeiling",
                "type": "string",
                "description": "Target latency ceiling.",
            },
            {
                "name": "costCeiling",
                "type": "string",
                "description": "Target cost ceiling.",
            },
        ],
        "govern": [
            {
                "name": "policyDomain",
                "type": "string",
                "description": "Policy or regulatory domain.",
            },
            {
                "name": "riskClass",
                "type": "string",
                "description": "Risk or sensitivity class.",
            },
        ],
        "evaluate": [
            {
                "name": "metricGoal",
                "type": "string",
                "description": "Primary metric or benchmark objective.",
            },
            {
                "name": "baseline",
                "type": "string",
                "description": "Baseline system or comparison point.",
            },
        ],
        "research": [
            {
                "name": "comparisonAxes",
                "type": "array",
                "description": "Axes for comparison or synthesis.",
                "itemsType": "string",
            },
            {
                "name": "decisionGoal",
                "type": "string",
                "description": "Decision this research should support.",
            },
        ],
        "plan": [
            {
                "name": "horizon",
                "type": "string",
                "description": "Planning horizon such as sprint, quarter, or year.",
            },
            {
                "name": "dependencies",
                "type": "array",
                "description": "Known dependencies that constrain sequencing.",
                "itemsType": "string",
            },
        ],
        "enterprise": [
            {
                "name": "audience",
                "type": "string",
                "description": "Target enterprise or leadership audience.",
            },
            {
                "name": "horizon",
                "type": "string",
                "description": "Transformation horizon or maturity target.",
            },
        ],
        "design": [
            {
                "name": "constraints",
                "type": "array",
                "description": "Architecture constraints and non-negotiables.",
                "itemsType": "string",
            },
            {
                "name": "successCriteria",
                "type": "string",
                "description": "What success looks like for the architecture.",
            },
        ],
        "refactor": [
            {
                "name": "targetArea",
                "type": "string",
                "description": "Module or surface to refactor.",
            },
            {
                "name": "riskTolerance",
                "type": "string",
                "description": "Allowed risk level for the refactor.",
            },
        ],
        "meta-routing": [
            {
                "name": "taskType",
                "type": "string",
                "description": "Task type or uncertainty about routing.",
            },
            {
                "name": "currentPhase",
                "type": "string",
                "description": "Current phase if routing an in-flight task.",
            },
        ],
        "physics-analysis": [
            {
                "name": "conventionalEvidence",
                "type": "string",
                "description": "Conventional analysis attempted before physics metaphors.",
            },
            {
                "name": "targetQuestion",
                "type": "string",
                "description": "Question the physics analysis should answer.",
            },
        ],
        "onboard_project": [
            {
                "name": "primaryGoal",
                "type": "string",
                "description": "Immediate goal after onboarding.",
            },
        ],
        "initial_instructions": [
            {
                "name": "situation",
                "type": "string",
                "description": "Context for applying the initial project principles.",
            },
        ],
    }
    physics_gated_instruction_ids = {
        "meta-routing",
        "plan",
        "review",
        "testing",
        "debug",
        "refactor",
        "evaluate",
        "enterprise",
        "prompt-engineering",
    }
    fields = common + special.get(
        instruction_id,
        [
            {
                "name": "constraints",
                "type": "array",
                "description": "Relevant constraints for the workflow.",
                "itemsType": "string",
            }
        ],
    )
    if instruction_id in physics_gated_instruction_ids:
        fields.append(
            {
                "name": "physicsAnalysisJustification",
                "type": "string",
                "description":
                    "Why conventional analysis is insufficient and a physics-inspired pass is justified.",
            }
        )
    return fields


def schema_object(fields: list[dict[str, object]]) -> dict[str, object]:
    properties: dict[str, object] = {}
    required: list[str] = []
    for field in fields:
        if field["type"] == "array":
            properties[field["name"]] = {
                "type": "array",
                "description": field["description"],
                "items": {
                    "type": field.get("itemsType", "string"),
                },
            }
        else:
            properties[field["name"]] = {
                "type": field["type"],
                "description": field["description"],
            }
        if field.get("required"):
            required.append(str(field["name"]))

    return {
        "type": "object",
        "properties": properties,
        "required": required,
    }


def _load_authoritative_workflow_contracts() -> dict[str, dict[str, object]]:
    workflow_spec_path = ROOT / "src" / "workflows" / "workflow-spec.ts"
    node_script = f"""
import {{ z }} from "zod";
import {{ pathToFileURL }} from "node:url";

const workflowSpecUrl = pathToFileURL({json.dumps(str(workflow_spec_path))}).href;
const {{ WORKFLOW_SPECS }} = await import(workflowSpecUrl);

const unwrapOptional = (schema) =>
\tschema instanceof z.ZodOptional ? schema.unwrap() : schema;

const resolveFieldContract = (schema) => {{
\tconst unwrapped = unwrapOptional(schema);
\tif (unwrapped instanceof z.ZodArray) {{
\t\treturn {{
\t\t\ttype: "array",
\t\t\titemsType:
\t\t\t\tunwrapped.element instanceof z.ZodString ? "string" : "unknown",
\t\t}};
\t}}
\tif (unwrapped instanceof z.ZodBoolean) {{
\t\treturn {{ type: "boolean" }};
\t}}
\tif (unwrapped instanceof z.ZodObject || unwrapped instanceof z.ZodRecord) {{
\t\treturn {{ type: "object" }};
\t}}
\treturn {{ type: "string" }};
}};

const contracts = Object.fromEntries(
\tWORKFLOW_SPECS.map((spec) => {{
\t\tconst shape = spec.inputSchema instanceof z.ZodObject ? spec.inputSchema.shape : {{}};
\t\tconst properties = Object.fromEntries(
\t\t\tObject.entries(shape).map(([key, schema]) => [key, resolveFieldContract(schema)]),
\t\t);
\t\tconst required = Object.entries(shape)
\t\t\t.filter(([, schema]) => !(schema instanceof z.ZodOptional))
\t\t\t.map(([key]) => key);
\t\treturn [
\t\t\tspec.key,
\t\t\t{{
\t\t\t\tinputSchema: {{
\t\t\t\t\ttype: "object",
\t\t\t\t\tproperties,
\t\t\t\t\trequired,
\t\t\t\t}},
\t\t\t\truntime: spec.runtime ? {{
\t\t\t\t\tinstructionId: spec.key,
\t\t\t\t\tsteps: spec.runtime.steps,
\t\t\t\t}} : null,
\t\t\t}},
\t\t];
\t}}),
);

process.stdout.write(JSON.stringify(contracts));
"""
    try:
        completed = subprocess.run(
            [
                "node",
                "--experimental-strip-types",
                "--input-type=module",
                "-e",
                node_script,
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as error:
        raise RuntimeError(
            "Authoritative workflow contract validation requires Node.js to be installed."
        ) from error
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            "Unable to load authoritative workflow contracts from "
            f"{workflow_spec_path}: {error.stderr.strip() or error.stdout.strip()}"
        ) from error

    contracts = json.loads(completed.stdout)
    if not isinstance(contracts, dict):
        raise RuntimeError("Expected authoritative workflow contracts to be a JSON object.")

    return contracts


def _load_instruction_specs_from_src() -> list[dict[str, object]]:
    node_script = f"""
import {{ pathToFileURL }} from "node:url";

const instructionSpecsUrl = pathToFileURL({json.dumps(str(INSTRUCTION_SPECS_PATH))}).href;
const {{ INSTRUCTION_SPECS }} = await import(instructionSpecsUrl);

process.stdout.write(JSON.stringify(INSTRUCTION_SPECS));
"""
    try:
        completed = subprocess.run(
            [
                "node",
                "--experimental-strip-types",
                "--input-type=module",
                "-e",
                node_script,
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as error:
        raise RuntimeError(
            "Loading instruction specs from src requires Node.js to be installed."
        ) from error
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            "Unable to load canonical instruction specs from "
            f"{INSTRUCTION_SPECS_PATH}: {error.stderr.strip() or error.stdout.strip()}"
        ) from error

    specs = json.loads(completed.stdout)
    if not isinstance(specs, list):
        raise RuntimeError("Expected canonical instruction specs to be a JSON array.")

    normalized_specs: list[dict[str, object]] = []
    required_fields = {
        "id",
        "toolName",
        "displayName",
        "description",
        "mission",
        "chainTo",
        "preferredModelClass",
        "public",
        "surface",
        "sourcePath",
    }
    for spec in specs:
        if not isinstance(spec, dict):
            raise RuntimeError("Instruction specs must be objects.")
        missing_fields = required_fields - set(spec.keys())
        if missing_fields:
            raise RuntimeError(
                "Instruction spec is missing required fields: "
                f"{sorted(missing_fields)}"
            )
        normalized_specs.append(spec)

    return normalized_specs


def _load_skill_specs_from_src() -> list[dict[str, object]]:
    node_script = f"""
import {{ pathToFileURL }} from "node:url";

const skillSpecsUrl = pathToFileURL({json.dumps(str(SKILL_SPECS_PATH))}).href;
const {{ SKILL_SPECS }} = await import(skillSpecsUrl);

process.stdout.write(JSON.stringify(SKILL_SPECS));
"""
    try:
        completed = subprocess.run(
            [
                "node",
                "--experimental-strip-types",
                "--input-type=module",
                "-e",
                node_script,
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as error:
        raise RuntimeError(
            "Loading skill specs from src requires Node.js to be installed."
        ) from error
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            "Unable to load canonical skill specs from "
            f"{SKILL_SPECS_PATH}: {error.stderr.strip() or error.stdout.strip()}"
        ) from error

    specs = json.loads(completed.stdout)
    if not isinstance(specs, list):
        raise RuntimeError("Expected canonical skill specs to be a JSON array.")

    normalized_specs: list[dict[str, object]] = []
    required_fields = {
        "id",
        "canonicalId",
        "domain",
        "displayName",
        "description",
        "sourcePath",
        "purpose",
        "triggerPhrases",
        "antiTriggerPhrases",
        "usageSteps",
        "intakeQuestions",
        "relatedSkills",
        "outputContract",
        "recommendationHints",
        "preferredModelClass",
        "legacyIds",
    }
    for spec in specs:
        if not isinstance(spec, dict):
            raise RuntimeError("Skill specs must be objects.")
        missing_fields = required_fields - set(spec.keys())
        if missing_fields:
            raise RuntimeError(
                "Skill spec is missing required fields: "
                f"{sorted(missing_fields)}"
            )
        normalized_specs.append(spec)

    return normalized_specs


def _normalize_schema_contract(schema: dict[str, object]) -> dict[str, object]:
    raw_properties = schema.get("properties", {})
    properties: dict[str, object] = {}
    if isinstance(raw_properties, dict):
        for key, value in raw_properties.items():
            if not isinstance(value, dict):
                continue
            normalized_property = {"type": value.get("type", "string")}
            if value.get("type") == "array":
                items = value.get("items", {})
                items_type = (
                    items.get("type", "string")
                    if isinstance(items, dict)
                    else value.get("itemsType", "string")
                )
                normalized_property["itemsType"] = items_type
            properties[str(key)] = normalized_property

    required = schema.get("required", [])
    required_keys = [str(item) for item in required] if isinstance(required, list) else []
    return {
        "type": "object",
        "properties": properties,
        "required": sorted(required_keys),
    }


def _validate_authoritative_workflow_contracts(
    instruction_manifests: list[dict[str, object]],
    authoritative_contracts: dict[str, dict[str, object]],
) -> None:
    for manifest in instruction_manifests:
        instruction_id = str(manifest["id"])
        authoritative_contract = authoritative_contracts.get(instruction_id)
        if not authoritative_contract:
            continue

        generated_schema = _normalize_schema_contract(
            dict(manifest.get("inputSchema", {}))
        )
        authoritative_schema = _normalize_schema_contract(
            dict(authoritative_contract.get("inputSchema", {}))
        )
        if generated_schema != authoritative_schema:
            raise RuntimeError(
                "Authoritative workflow contract drift for "
                f"{instruction_id}: generated input schema "
                f"{generated_schema} does not match workflow spec "
                f"{authoritative_schema}."
            )


def _apply_authoritative_workflow_runtimes(
    instruction_manifests: list[dict[str, object]],
    authoritative_contracts: dict[str, dict[str, object]],
) -> None:
    for manifest in instruction_manifests:
        instruction_id = str(manifest["id"])
        authoritative_contract = authoritative_contracts.get(instruction_id)
        authoritative_runtime = (
            authoritative_contract.get("runtime") if authoritative_contract else None
        )
        if not isinstance(authoritative_runtime, dict):
            continue

        manifest["workflow"] = {
            "instructionId": authoritative_runtime["instructionId"],
            "steps": authoritative_runtime["steps"],
        }


def extract_phase_tokens(
    text: str,
    known_skill_ids: set[str],
    known_instruction_ids: set[str],
) -> list[str]:
    known_ids = sorted(
        known_skill_ids | known_instruction_ids,
        key=lambda item: (-len(item), item),
    )
    if not known_ids:
        return []

    pattern = "|".join(re.escape(item) for item in known_ids)
    return [
        match.group(0)
        for match in re.finditer(
            rf"(?<![a-z0-9-])(?:{pattern})(?![a-z0-9-])",
            text,
        )
    ]


def _resolve_phase_token(
    token: str,
    known_skill_ids: set[str],
    known_instruction_ids: set[str],
    preferred_skill_ids: set[str],
) -> tuple[tuple[str, str], dict[str, object]] | None:
    """Disambiguate a single phase token as a skill or instruction reference.

    Disambiguation rules (applied in priority order):
    1. Preferred skill — canonical form is in both known_skill_ids AND preferred_skill_ids.
       Always wins over any same-named instruction to honour the Skills Invoked section.
    2. Unambiguous skill — canonical form is in known_skill_ids AND the raw token is NOT
       also a known instruction ID.  Safe to treat as skill with no conflict.
    3. Known instruction ID — raw token matches an instruction slug directly.
    4. Fallback skill — canonical form is in known_skill_ids even though the raw token
       shares a name with an instruction (e.g. "design" → canonical skill vs instruction).

    Returns a ``(dedup_key, step_dict)`` pair, or ``None`` if the token is not
    resolvable against either known set.
    """
    canonical = canonical_skill_id(token)

    # Rules 1 & 2: skill wins when it's preferred or there's no instruction conflict
    if canonical in known_skill_ids and (
        canonical in preferred_skill_ids or token not in known_instruction_ids
    ):
        return ("skill", canonical), {
            "kind": "invokeSkill",
            "label": canonical,
            "skillId": canonical,
        }

    # Rule 3: unambiguous instruction reference
    if token in known_instruction_ids:
        return ("instruction", token), {
            "kind": "invokeInstruction",
            "label": token,
            "instructionId": token,
        }

    # Rule 4: fallback — canonical skill even when the raw token is also an instruction ID
    if canonical in known_skill_ids:
        return ("skill", canonical), {
            "kind": "invokeSkill",
            "label": canonical,
            "skillId": canonical,
        }

    return None


def parse_phase_sequence(
    markdown: str,
    known_instruction_ids: set[str],
    known_skill_ids: set[str],
    preferred_skill_ids: set[str],
) -> list[dict[str, object]]:
    """Parse the ``## Phase Sequence`` fenced block into a list of workflow steps.

    Each numbered line ``N. LABEL → token-list`` produces one step.  When the
    right-hand side resolves to a single ref it emits that step directly; multiple
    refs become a ``parallel`` step.  Lines with no resolvable refs become ``note``
    steps so no phase is silently dropped.

    When *any* preferred skill is matched in a phase, non-preferred entries are
    filtered out — this enforces the ``## Skills Invoked`` contract over generic
    token matches.
    """
    block_match = re.search(r"## Phase Sequence\s*\n\s*```(.*?)```", markdown, re.DOTALL)
    block = block_match.group(1) if block_match else ""
    lines = [line.rstrip() for line in block.splitlines() if line.strip()]

    # Re-join continuation lines so each phase is a single string.
    phases: list[str] = []
    current = ""
    for line in lines:
        stripped = line.strip()
        if re.match(r"^\d+\.", stripped):
            if current:
                phases.append(current)
            current = stripped
        else:
            current = f"{current} {stripped}".strip()
    if current:
        phases.append(current)

    steps: list[dict[str, object]] = []
    for phase in phases:
        match = re.match(r"^\d+\.\s*([^→]+?)\s*→\s*(.+)$", phase)
        if not match:
            steps.append({"kind": "note", "label": phase, "note": phase})
            continue

        label = re.sub(r"\s+", " ", match.group(1).strip())
        right = match.group(2).strip()
        tokens = extract_phase_tokens(right, known_skill_ids, known_instruction_ids)

        resolved_steps: list[dict[str, object]] = []
        seen_keys: set[tuple[str, str]] = set()
        matched_preferred_skill = False

        for token in tokens:
            result = _resolve_phase_token(
                token, known_skill_ids, known_instruction_ids, preferred_skill_ids
            )
            if result is None:
                continue
            dedup_key, step = result
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)
            if step.get("kind") == "invokeSkill" and step.get("skillId") in preferred_skill_ids:
                matched_preferred_skill = True
            resolved_steps.append(step)

        # Preferred-skill contract: if any preferred skill matched, drop all non-preferred
        # entries so the Skills Invoked section is the authoritative source of truth.
        if matched_preferred_skill:
            resolved_steps = [
                step
                for step in resolved_steps
                if step["kind"] == "invokeSkill" and step["skillId"] in preferred_skill_ids
            ]

        if not resolved_steps:
            steps.append({"kind": "note", "label": label, "note": right})
        elif len(resolved_steps) == 1:
            resolved_step = dict(resolved_steps[0])
            resolved_step["label"] = label
            steps.append(resolved_step)
        else:
            steps.append({"kind": "parallel", "label": label, "steps": resolved_steps})

    return steps


def parse_chain_to(markdown: str, known_instruction_ids: set[str]) -> list[str]:
    section = extract_section(markdown, "Chain To")
    tokens = re.findall(r"`([^`]+)`", section)
    return [token for token in tokens if token in known_instruction_ids]


def parse_skill(
    markdown: str,
    folder_name: str,
    known_skill_ids: set[str],
) -> dict[str, object]:
    frontmatter = parse_frontmatter(markdown)
    body = strip_frontmatter(markdown)
    title = extract_first_heading(body)
    canonical_id = canonical_skill_id(folder_name)
    when_to_trigger = extract_section(body, "When to Trigger")
    usage = extract_section(body, "Usage")
    related = extract_section(body, "Related Skills")
    purpose = re.sub(r"\s+", " ", extract_section(body, "Purpose")).strip()
    tool_config = read_json_object(
        SKILLS_DIR / folder_name / "tools" / f"{folder_name}.json"
    )

    trigger_phrases = extract_quoted_or_bulleted_items(
        when_to_trigger,
        r"Activate this skill when the user asks:",
    )
    anti_trigger_phrases = extract_quoted_or_bulleted_items(
        when_to_trigger,
        r"Do \*\*not\*\* trigger when:",
    )
    usage_steps = extract_bullet_items(usage)
    related_skills = [
        canonical_skill_id(token)
        for token in extract_backticked_items(related)
        if canonical_skill_id(token) in known_skill_ids
    ]
    tool_trigger_phrases = normalize_string_list(tool_config.get("trigger_phrases"))
    tool_anti_triggers = normalize_string_list(tool_config.get("trigger_exclusions"))
    intake_questions = normalize_string_list(tool_config.get("intake_questions"))
    output_contract = normalize_string_list(tool_config.get("output_contract"))
    tool_related_skills = [
        canonical_skill_id(token)
        for token in normalize_string_list(tool_config.get("related_skills"))
        if canonical_skill_id(token) in known_skill_ids
    ]

    if tool_trigger_phrases:
        trigger_phrases = tool_trigger_phrases
    if tool_anti_triggers:
        anti_trigger_phrases = tool_anti_triggers
    if tool_related_skills:
        related_skills = tool_related_skills
    if intake_questions:
        usage_steps = intake_questions
    if not output_contract:
        output_contract = default_output_contract_for_skill(canonical_id)

    display_name = (
        title or str(frontmatter.get("name", canonical_id)).strip().strip('"')
    )
    description = re.sub(
        r"\s+",
        " ",
        str(frontmatter.get("description", f"Skill {canonical_id}")).strip(),
    )

    return {
        "id": canonical_id,
        "canonicalId": canonical_id,
        "domain": skill_domain(canonical_id),
        "displayName": display_name,
        "description": description,
        "sourcePath": f"src/skills/skill-specs.ts#{canonical_id}",
        "purpose": purpose,
        "triggerPhrases": trigger_phrases,
        "antiTriggerPhrases": anti_trigger_phrases,
        "usageSteps": usage_steps,
        "intakeQuestions": intake_questions or usage_steps,
        "relatedSkills": related_skills,
        "outputContract": output_contract,
        "recommendationHints": (trigger_phrases + usage_steps)[:6],
        "preferredModelClass": infer_skill_model_class(canonical_id),
    }


def skill_module_import_path(manifest: dict[str, object]) -> str | None:
    skill_id = str(manifest["id"])
    domain = str(manifest["domain"])
    promoted_path = ROOT / "src" / "skills" / domain / f"{skill_id}.ts"
    if promoted_path.exists():
        return f"../../skills/{domain}/{skill_id}.js"
    return None


def parse_instruction(
    markdown: str,
    slug: str,
    known_instruction_ids: set[str],
    known_skill_ids: set[str],
    matrix_entry: dict[str, object] | None = None,
) -> dict[str, object]:
    """Parse one instruction markdown file into a manifest dict.

    ``matrix_entry`` is the corresponding entry from ``instruction_matrix`` in
    the matrix JSON.  When present its ``_mission`` value is used as the
    authoritative mission string; the markdown ``**Mission**:`` line is treated
    as a secondary source and a warning is emitted when the two diverge
    (normalised for whitespace / punctuation).  This makes the matrix the
    single source of truth for the public tool contract while keeping the
    markdown readable on its own.
    """
    frontmatter = parse_frontmatter(markdown)
    body = strip_frontmatter(markdown)
    title = extract_first_heading(body)
    display_name = (
        str(frontmatter.get("name", title or slug)).strip().strip('"') or slug
    )
    description = re.sub(
        r"\s+",
        " ",
        str(frontmatter.get("description", display_name)).strip(),
    )
    invoked_skill_list = list(
        dict.fromkeys(
            canonical_skill_id(token)
            for token in extract_backticked_items(extract_section(body, "Skills Invoked"))
            if canonical_skill_id(token) in known_skill_ids
        )
    )
    invoked_skills = set(invoked_skill_list)
    workflow_steps = parse_phase_sequence(
        body,
        known_instruction_ids,
        known_skill_ids,
        invoked_skills,
    )
    if not workflow_steps and invoked_skill_list:
        workflow_steps = [
            {
                "kind": "invokeSkill",
                "label": skill_id,
                "skillId": skill_id,
            }
            for skill_id in invoked_skill_list
        ]

    # Mission: matrix _mission is authoritative; markdown is the fallback.
    matrix_mission = str(matrix_entry.get("_mission", "")).strip() if matrix_entry else ""
    markdown_mission = mission_from_instruction(body)
    if matrix_mission:
        mission = matrix_mission
        if markdown_mission and not _missions_equivalent(matrix_mission, markdown_mission):
            print(
                f"  Warning: mission mismatch for '{slug}':\n"
                f"    matrix:   {matrix_mission[:120]}\n"
                f"    markdown: {markdown_mission[:120]}"
            )
    else:
        mission = markdown_mission

    return {
        "id": slug,
        "toolName": slug,
        "displayName": display_name,
        "description": description,
        "sourcePath": f"src/instructions/instruction-specs.ts#{slug}",
        "mission": mission,
        "inputSchema": schema_object(schema_fields_for_instruction(slug)),
        "workflow": {
            "instructionId": slug,
            "steps": workflow_steps + [{"kind": "finalize", "label": "Finalize"}],
        },
        "chainTo": parse_chain_to(body, known_instruction_ids),
        "preferredModelClass": infer_instruction_model_class(slug),
    }


def build_instruction_manifest_from_spec(
    spec: dict[str, object],
    authoritative_contracts: dict[str, dict[str, object]],
) -> dict[str, object]:
    instruction_id = str(spec["id"])
    authoritative_contract = authoritative_contracts.get(instruction_id, {})
    authoritative_runtime = authoritative_contract.get("runtime")
    workflow = (
        {
            "instructionId": authoritative_runtime["instructionId"],
            "steps": authoritative_runtime["steps"],
        }
        if isinstance(authoritative_runtime, dict)
        else {
            "instructionId": instruction_id,
            "steps": [{"kind": "finalize", "label": "Finalize"}],
        }
    )

    return {
        "id": instruction_id,
        "toolName": str(spec["toolName"]),
        "aliases": [str(item) for item in spec.get("aliases", [])],
        "displayName": str(spec["displayName"]),
        "description": str(spec["description"]),
        "sourcePath": str(spec["sourcePath"]),
        "mission": str(spec["mission"]),
        "inputSchema": schema_object(schema_fields_for_instruction(instruction_id)),
        "workflow": workflow,
        "chainTo": [str(item) for item in spec.get("chainTo", [])],
        "preferredModelClass": str(spec["preferredModelClass"]),
        "autoChainOnCompletion": bool(spec.get("autoChainOnCompletion", False)),
        "requiredPreconditions": [
            str(item) for item in spec.get("requiredPreconditions", [])
        ],
        "reactivationPolicy": str(spec.get("reactivationPolicy", "once")),
    }


def build_skill_manifest_from_spec(spec: dict[str, object]) -> dict[str, object]:
    output_contract = [str(item) for item in spec.get("outputContract", [])]
    if not output_contract:
        output_contract = default_output_contract_for_skill(str(spec["canonicalId"]))
    return {
        "id": str(spec["id"]),
        "canonicalId": str(spec["canonicalId"]),
        "domain": str(spec["domain"]),
        "displayName": str(spec["displayName"]),
        "description": str(spec["description"]),
        "sourcePath": str(spec["sourcePath"]),
        "purpose": str(spec["purpose"]),
        "triggerPhrases": [str(item) for item in spec.get("triggerPhrases", [])],
        "antiTriggerPhrases": [
            str(item) for item in spec.get("antiTriggerPhrases", [])
        ],
        "usageSteps": [str(item) for item in spec.get("usageSteps", [])],
        "intakeQuestions": [str(item) for item in spec.get("intakeQuestions", [])],
        "relatedSkills": [str(item) for item in spec.get("relatedSkills", [])],
        "outputContract": output_contract,
        "recommendationHints": [
            str(item) for item in spec.get("recommendationHints", [])
        ],
        "preferredModelClass": str(spec["preferredModelClass"]),
    }


def _missions_equivalent(a: str, b: str) -> bool:
    """Return True if two mission strings are substantively equivalent.

    Normalises away:
    - trailing punctuation and supplementary clauses ("Produces a ..." etc.)
    - leading topic preamble in matrix entries ("Architecture and system design: ...")
    - capitalisation and whitespace

    The matrix pattern is typically "Topic prefix: core action chain" while the
    markdown pattern is "Core action chain. Optional elaboration sentence."
    Both normalise to the core action chain for comparison purposes.
    """
    import unicodedata

    def normalise(s: str) -> str:
        s = unicodedata.normalize("NFKC", s)
        # Strip supplementary sentences (everything after the first full stop
        # that follows at least 20 chars of content).
        s = re.sub(r"(?<=\w{20})\.\s+.*$", "", s, flags=re.DOTALL)
        # Strip trailing punctuation
        s = re.sub(r"[.!?:,;]+$", "", s.strip().lower())
        # Strip matrix-style topic prefix ("architecture and system design: ")
        s = re.sub(r"^[^:→]{5,40}:\s+", "", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    na, nb = normalise(a), normalise(b)
    # Equivalent if identical after normalisation, or one is a leading
    # substring of the other (matrix is often a shorter summary).
    return na == nb or nb.startswith(na) or na.startswith(nb)


def write_skill_modules(skill_manifests: list[dict[str, object]]) -> None:
    manifest_const_names = {
        str(manifest["id"]): skill_manifest_const_name(str(manifest["id"]))
        for manifest in skill_manifests
    }
    write_text(
        GENERATED_DIR / "manifests" / "skill-manifests.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                'import type { SkillManifestEntry } from "../../contracts/generated.js";',
                "",
            ]
            + [
                f'export const {manifest_const_names[str(manifest["id"])]}: SkillManifestEntry = {ts_object(manifest)};'
                for manifest in skill_manifests
            ]
            + [
                "",
                "export const SKILL_MANIFESTS: SkillManifestEntry[] = [",
            ]
            + [
                f"\t{manifest_const_names[str(manifest['id'])]},"
                for manifest in skill_manifests
            ]
            + [
                "];",
                "",
                "export const SKILL_MANIFESTS_BY_ID: ReadonlyMap<string, SkillManifestEntry> = new Map(",
                '\tSKILL_MANIFESTS.map((manifest) => [manifest.id, manifest] as const),',
                ");",
                "",
                "export function getSkillManifest(skillId: string): SkillManifestEntry {",
                "\tconst manifest = SKILL_MANIFESTS_BY_ID.get(skillId);",
                "\tif (!manifest) {",
                '\t\tthrow new Error(`Unknown skill manifest: ${skillId}`);',
                "\t}",
                "\treturn manifest;",
                "}",
                "",
            ]
        ),
    )

    promoted_manifests = [
        manifest
        for manifest in skill_manifests
        if skill_module_import_path(manifest) is not None
    ]
    generated_manifests = [
        manifest
        for manifest in skill_manifests
        if skill_module_import_path(manifest) is None
    ]

    write_text(
        GENERATED_DIR / "registry" / "hidden-skills.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                'import type { SkillModule } from "../../contracts/runtime.js";',
            ]
            + [
                f'import {{ skillModule as {safe_identifier(str(manifest["id"]))}_module }} from "{skill_module_import_path(manifest)}";'
                for manifest in promoted_manifests
            ]
            + (
                ['import { createSkillModule } from "../../skills/create-skill-module.js";']
                if generated_manifests
                else []
            )
            + [
                (
                    "import { "
                    + ", ".join(
                        manifest_const_names[str(manifest["id"])]
                        for manifest in generated_manifests
                    )
                    + ' } from "../manifests/skill-manifests.js";'
                )
                for _ in [generated_manifests]
                if generated_manifests
            ]
            + [
                "",
            ]
            + [
                f"const {safe_identifier(str(manifest['id']))}_module = createSkillModule({manifest_const_names[str(manifest['id'])]});"
                for manifest in generated_manifests
            ]
            + [
                "",
                "export const HIDDEN_SKILL_MODULES: SkillModule[] = [",
            ]
            + [
                f"\t{safe_identifier(str(manifest['id']))}_module,"
                for manifest in skill_manifests
            ]
            + [
                "];",
                "",
            ]
        ),
    )


def write_instruction_modules(instruction_manifests: list[dict[str, object]]) -> None:
    """Write one TypeScript module per instruction and the shared manifest list.

    NOTE: public-tools.ts is intentionally NOT written here — it contains only
    the matrix-selected subset of instructions.  Call write_public_tool_registry
    separately with the filtered list.
    """
    for manifest in instruction_manifests:
        instruction_id = str(manifest["id"])
        write_text(
            GENERATED_DIR / "instructions" / f"{instruction_id}.ts",
            "\n".join(
                [
                    "// AUTO-GENERATED — do not edit manually.",
                    "",
                    'import type { InstructionManifestEntry } from "../../contracts/generated.js";',
                    'import { createInstructionModule } from "../../instructions/create-instruction-module.js";',
                    "",
                    f"export const instructionManifest: InstructionManifestEntry = {ts_object(manifest)};",
                    "",
                    "export const instructionModule = createInstructionModule(instructionManifest);",
                    "",
                ]
            ),
        )

    write_text(
        GENERATED_DIR / "manifests" / "instruction-manifests.ts",
        "\n".join(
            ["// AUTO-GENERATED — do not edit manually.", ""]
            + [
                f'import {{ instructionManifest as {safe_identifier(str(manifest["id"]))}_manifest }} from "../instructions/{manifest["id"]}.js";'
                for manifest in instruction_manifests
            ]
            + [
                "",
                "export const INSTRUCTION_MANIFESTS = [",
            ]
            + [
                f"\t{safe_identifier(str(manifest['id']))}_manifest,"
                for manifest in instruction_manifests
            ]
            + [
                "];",
                "",
            ]
        ),
    )


def write_public_tool_registry(
    workflow_public_instruction_manifests: list[dict[str, object]],
    discovery_public_instruction_manifests: list[dict[str, object]],
) -> None:
    public_instruction_manifests = (
        workflow_public_instruction_manifests + discovery_public_instruction_manifests
    )
    write_text(
        GENERATED_DIR / "registry" / "public-tools.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                'import type { InstructionModule } from "../../contracts/runtime.js";',
            ]
            + [
                f'import {{ instructionModule as {safe_identifier(str(manifest["id"]))}_module }} from "../instructions/{manifest["id"]}.js";'
                for manifest in public_instruction_manifests
            ]
            + [
                "",
                "export const WORKFLOW_PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [",
            ]
            + [
                f"\t{safe_identifier(str(manifest['id']))}_module,"
                for manifest in workflow_public_instruction_manifests
            ]
            + [
                "];",
                "",
                "export const DISCOVERY_PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [",
            ]
            + [
                f"\t{safe_identifier(str(manifest['id']))}_module,"
                for manifest in discovery_public_instruction_manifests
            ]
            + [
                "];",
                "",
                "export const PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [",
                "\t...WORKFLOW_PUBLIC_INSTRUCTION_MODULES,",
                "\t...DISCOVERY_PUBLIC_INSTRUCTION_MODULES,",
                "];",
                "",
            ]
        ),
    )


def write_instruction_validators() -> None:
    write_text(
        GENERATED_DIR / "validators" / "instruction-validators.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                'import { buildToolValidators } from "../../tools/shared/tool-validators.js";',
                'import { PUBLIC_INSTRUCTION_MODULES } from "../registry/public-tools.js";',
                "",
                "// Register validators under toolName, id, and all aliases for each instruction",
                "const validatorEntries = [];",
                "for (const module of PUBLIC_INSTRUCTION_MODULES) {",
                "  const manifest = module.manifest;",
                "  // Always register under toolName",
                "  validatorEntries.push({ name: manifest.toolName, inputSchema: manifest.inputSchema });",
                "  // Always register under id (if different)",
                "  if (manifest.id && manifest.id !== manifest.toolName) {",
                "    validatorEntries.push({ name: manifest.id, inputSchema: manifest.inputSchema });",
                "  }",
                "  // Register under all aliases (if present)",
                "  if (Array.isArray(manifest.aliases)) {",
                "    for (const alias of manifest.aliases) {",
                "      if (alias && alias !== manifest.toolName && alias !== manifest.id) {",
                "        validatorEntries.push({ name: alias, inputSchema: manifest.inputSchema });",
                "      }",
                "    }",
                "  }",
                "}",
                "",
                "export const INSTRUCTION_VALIDATORS = buildToolValidators(validatorEntries);",
                "",
            ]
        ),
    )


def write_domain_registry(skill_manifests: list[dict[str, object]]) -> None:
    """Generate ``src/generated/registry/skills-by-domain.ts``.

    Produces a map of domain → sorted skill-ID list derived from the canonical
    skill manifest set.  This is the generated ground-truth for the domain
    topology and is consumed by:

    - ``DefaultSkillResolver`` registrations that match by domain predicate
      (``m => m.domain === "req"`` instead of ``m.id.startsWith("req-")``)
    - Phase 1+ capability handler implementations that need the full skill-ID
      list for a domain without maintaining it by hand
    - Test infrastructure that asserts handler coverage per domain
    """
    from collections import defaultdict

    by_domain: dict[str, list[str]] = defaultdict(list)
    for manifest in skill_manifests:
        by_domain[str(manifest["domain"])].append(str(manifest["id"]))

    # Sort within each domain for stable output; sort domains alphabetically.
    sorted_map = {
        domain: sorted(ids) for domain, ids in sorted(by_domain.items())
    }

    write_text(
        GENERATED_DIR / "registry" / "skills-by-domain.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                "/**",
                " * Domain-grouped skill registry.",
                " *",
                " * Keys are canonical domain prefixes (e.g. \"req\", \"arch\", \"qm\").",
                " * Values are the sorted canonical skill IDs for that domain.",
                " *",
                " * Use this map in DefaultSkillResolver to register domain-level handlers:",
                " *   resolver.register(m => m.domain === 'req', reqHandler)",
                " * or in tests to assert handler coverage for a given domain.",
                " */",
                f"export const SKILLS_BY_DOMAIN: Readonly<Record<string, readonly string[]>> = {ts_object(sorted_map)};",
                "",
            ]
        ),
    )


def write_capability_handler_slots(skill_manifests: list[dict[str, object]]) -> None:
    """Generate ``src/generated/graph/capability-handler-slots.ts``.

    Produces the ADR-001 capability-handler phase manifest: a typed array that
    lists every domain in phase-priority order with its skill IDs and model class.

    This file is the machine-readable transition plan.  When implementing Phase 1
    handlers (req, debug, arch), import ``CAPABILITY_HANDLER_SLOTS``, filter by
    ``phase === 1``, and iterate over ``skillIds`` to know exactly which skills
    need a real handler.  The fallback (``metadataSkillHandler``) remains active
    for all domains not yet promoted.

    Phase ordering follows _ADR001_DOMAIN_PHASES defined at module level.
    Domains absent from the phase table receive phase 7 (lowest priority).
    """
    from collections import defaultdict

    # Build domain → manifest fields needed for the slot entry.
    by_domain: dict[str, list[str]] = defaultdict(list)
    domain_model_class: dict[str, str] = {}
    for manifest in skill_manifests:
        d = str(manifest["domain"])
        by_domain[d].append(str(manifest["id"]))
        domain_model_class[d] = str(manifest["preferredModelClass"])

    slots = []
    for domain in sorted(
        by_domain.keys(),
        key=lambda d: (_ADR001_DOMAIN_PHASES.get(d, 7), d),
    ):
        slots.append({
            "domain": domain,
            "phase": _ADR001_DOMAIN_PHASES.get(domain, 7),
            "skillIds": sorted(by_domain[domain]),
            "modelClass": domain_model_class[domain],
        })

    write_text(
        GENERATED_DIR / "graph" / "capability-handler-slots.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                "/**",
                " * ADR-001 capability-handler phase manifest.",
                " *",
                " * Lists every skill domain in phase-priority order.  Use this to",
                " * drive handler implementation without maintaining skill-ID lists",
                " * by hand.",
                " *",
                " * Migration path (from contracts/runtime.ts):",
                " *   Phase 1 — req, debug, arch (core technical, high value)",
                " *   Phase 2 — qual, doc, flow (supporting, free/cheap model)",
                " *   Phase 3 — orch, strat, synth (coordination)",
                " *   Phase 4 — eval, prompt, bench (evaluation)",
                " *   Phase 5 — lead, gov (enterprise/governance)",
                " *   Phase 6 — adapt, resil (advanced adaptive)",
                " *   Phase 7 — qm, gr (physics metaphors, exploratory)",
                " */",
                "export interface CapabilityHandlerSlot {",
                "\t/** Canonical domain prefix, e.g. \"req\" */",
                "\tdomain: string;",
                "\t/** ADR-001 implementation phase (1 = highest priority) */",
                "\tphase: number;",
                "\t/** Canonical skill IDs in this domain */",
                "\tskillIds: readonly string[];",
                "\t/** Recommended model class for handlers in this domain */",
                "\tmodelClass: string;",
                "}",
                "",
                f"export const CAPABILITY_HANDLER_SLOTS: readonly CapabilityHandlerSlot[] = {ts_object(slots)};",
                "",
            ]
        ),
    )


def write_graph_files(instruction_manifests: list[dict[str, object]]) -> None:
    alias_entries = [
        {"legacyId": legacy_id, "canonicalId": canonical_id}
        for legacy_id, canonical_id in alias_map.items()
    ]

    instruction_skill_edges: list[dict[str, str]] = []
    for manifest in instruction_manifests:
        instruction_id = str(manifest["id"])
        for step in manifest["workflow"]["steps"]:
            if step["kind"] == "invokeSkill":
                instruction_skill_edges.append(
                    {"instructionId": instruction_id, "skillId": step["skillId"]}
                )
            elif step["kind"] == "parallel":
                for child in step["steps"]:
                    if child["kind"] == "invokeSkill":
                        instruction_skill_edges.append(
                            {"instructionId": instruction_id, "skillId": child["skillId"]}
                        )

    write_text(
        GENERATED_DIR / "graph" / "aliases.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                f"export const ALIAS_ENTRIES = {ts_object(alias_entries)};",
                "",
            ]
        ),
    )

    write_text(
        GENERATED_DIR / "graph" / "taxonomy.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                f"export const TAXONOMY_ENTRIES = {ts_object(taxonomy_entries)};",
                "",
            ]
        ),
    )

    write_text(
        GENERATED_DIR / "graph" / "instruction-skill-edges.ts",
        "\n".join(
            [
                "// AUTO-GENERATED — do not edit manually.",
                "",
                f"export const INSTRUCTION_SKILL_EDGES = {ts_object(instruction_skill_edges)};",
                "",
            ]
        ),
    )


def format_generated_files() -> None:
    biome_binary = ROOT / "node_modules" / ".bin" / ("biome.cmd" if os.name == "nt" else "biome")
    try:
        command = (
            [str(biome_binary), "check", "--write", "src/generated"]
            if biome_binary.exists()
            else ["npm", "exec", "--", "biome", "check", "--write", "src/generated"]
        )
        subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as error:
        print(f"Warning: unable to format generated files automatically: {error}")


def select_public_instructions(
    instruction_manifests: list[dict[str, object]],
    instruction_matrix: dict[str, object],
) -> list[dict[str, object]]:
    """Return only the manifests whose IDs are listed as public in the matrix.

    An instruction is public when its key appears in ``instruction_matrix`` and
    does not start with ``_`` (underscore-prefixed keys are metadata entries).
    This is the single authoritative rule for what surfaces as an MCP public tool.
    """
    public_ids = {
        key for key in instruction_matrix if not key.startswith("_")
    }
    return [m for m in instruction_manifests if str(m["id"]) in public_ids]


def _validate_generation_invariants(
    public_instruction_manifests: list[dict[str, object]],
    instruction_matrix: dict[str, object],
) -> None:
    """Assert that the public tool registry is consistent with the matrix.

    Raises ``RuntimeError`` if the matrix references an instruction that was not
    found in the canonical ``src`` instruction registry. This catches typos in the
    matrix or missing instruction specs before any generated output is committed.
    """
    matrix_public_ids = {
        key for key in instruction_matrix if not key.startswith("_")
    }
    generated_ids = {str(m["id"]) for m in public_instruction_manifests}
    missing = matrix_public_ids - generated_ids
    if missing:
        raise RuntimeError(
            f"Matrix lists public instructions with no corresponding "
            f"src instruction spec entry: {sorted(missing)}"
        )


def main() -> None:
    authoritative_contracts = _load_authoritative_workflow_contracts()
    instruction_specs = _load_instruction_specs_from_src()
    skill_specs = _load_skill_specs_from_src()
    instruction_manifests = [
        build_instruction_manifest_from_spec(spec, authoritative_contracts)
        for spec in instruction_specs
    ]
    public_instruction_manifests = [
        manifest
        for manifest, spec in zip(instruction_manifests, instruction_specs, strict=True)
        if bool(spec.get("public"))
    ]
    workflow_public_instruction_manifests = [
        manifest
        for manifest, spec in zip(instruction_manifests, instruction_specs, strict=True)
        if bool(spec.get("public")) and str(spec.get("surface")) == "workflow"
    ]
    discovery_public_instruction_manifests = [
        manifest
        for manifest, spec in zip(instruction_manifests, instruction_specs, strict=True)
        if bool(spec.get("public")) and str(spec.get("surface")) == "discovery"
    ]
    _validate_authoritative_workflow_contracts(
        instruction_manifests,
        authoritative_contracts,
    )


    skill_manifests = [build_skill_manifest_from_spec(spec) for spec in skill_specs]

    clear_generated()
    write_instruction_modules(instruction_manifests)
    write_public_tool_registry(
        workflow_public_instruction_manifests,
        discovery_public_instruction_manifests,
    )
    write_instruction_validators()
    write_skill_modules(skill_manifests)
    write_domain_registry(skill_manifests)
    write_capability_handler_slots(skill_manifests)
    write_graph_files(instruction_manifests)
    format_generated_files()

    print(
        f"Generated {len(instruction_manifests)} instruction modules "
        f"({len(public_instruction_manifests)} public) "
        f"and {len(skill_manifests)} skill modules "
        f"across {len(set(str(m['domain']) for m in skill_manifests))} domains."
    )


if __name__ == "__main__":
    main()
