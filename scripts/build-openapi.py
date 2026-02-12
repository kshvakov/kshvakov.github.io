#!/usr/bin/env python3
"""Generate openapi.json from kaiten-api.md endpoints."""
import re
import json

ENDPOINTS = """
DELETE /api/v1/blockers/{blocker_id}/categories/{category_uuid}
DELETE /api/v1/blockers/{blocker_id}/users/{user_id}
DELETE /api/v1/boards/{board_id}/columns/{id}
DELETE /api/v1/boards/{board_id}/lanes/{id}
DELETE /api/v1/card-types/{id}
DELETE /api/v1/cards/{card_id}
DELETE /api/v1/cards/{card_id}/blockers/{id}
DELETE /api/v1/cards/{card_id}/checklists/{checklist_id}/items/{id}
DELETE /api/v1/cards/{card_id}/checklists/{id}
DELETE /api/v1/cards/{card_id}/children/{id}
DELETE /api/v1/cards/{card_id}/comments/{comment_id}
DELETE /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values/{id}
DELETE /api/v1/cards/{card_id}/external-links/{id}
DELETE /api/v1/cards/{card_id}/files/{id}
DELETE /api/v1/cards/{card_id}/members/{id}
DELETE /api/v1/cards/{card_id}/sd-external-recipients/{email}
DELETE /api/v1/cards/{card_id}/tags/{tag_id}
DELETE /api/v1/cards/{card_id}/time-logs/{id}
DELETE /api/v1/checklists/{checklist_id}/items/{id}
DELETE /api/v1/columns/{column_id}/subcolumns/{id}
DELETE /api/v1/company/custom-properties/{id}
DELETE /api/v1/company/custom-properties/{property_id}/catalog-values/{id}
DELETE /api/v1/company/custom-properties/{property_id}/select-values/{id}
DELETE /api/v1/company/groups/{group_uid}/entities/{uid}
DELETE /api/v1/company/groups/{uid}
DELETE /api/v1/company/users/{id}
DELETE /api/v1/groups/{group_uid}/admins/{user_id}
DELETE /api/v1/groups/{group_uid}/users/{user_id}
DELETE /api/v1/spaces/{space_id}
DELETE /api/v1/spaces/{space_id}/automations/{automation_uid}
DELETE /api/v1/spaces/{space_id}/boards/{id}
DELETE /api/v1/spaces/{space_id}/users/{id}
DELETE /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}
DELETE /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items/{item_uid}
DELETE /api/v1/user-roles/{role_id}
GET /api/v1/Groups
GET /api/v1/Groups/{group_id}
GET /api/v1/Users
GET /api/v1/Users/{user_id}
GET /api/v1/blockers/{blocker_id}/users
GET /api/v1/boards/{board_id}/columns
GET /api/v1/boards/{board_id}/lanes
GET /api/v1/boards/{id}
GET /api/v1/card-types
GET /api/v1/card-types/{id}
GET /api/v1/cards
GET /api/v1/cards/{card_id}
GET /api/v1/cards/{card_id}/allowed-users
GET /api/v1/cards/{card_id}/baselines
GET /api/v1/cards/{card_id}/blockers
GET /api/v1/cards/{card_id}/checklists/{id}
GET /api/v1/cards/{card_id}/children
GET /api/v1/cards/{card_id}/comments
GET /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values
GET /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values
GET /api/v1/cards/{card_id}/external-links
GET /api/v1/cards/{card_id}/location-history
GET /api/v1/cards/{card_id}/members
GET /api/v1/cards/{card_id}/sla-rules-measurements
GET /api/v1/cards/{card_id}/tags
GET /api/v1/cards/{card_id}/time-logs
GET /api/v1/categories
GET /api/v1/checklists/{id}
GET /api/v1/columns/{column_id}/subcolumns
GET /api/v1/company/custom-properties
GET /api/v1/company/custom-properties/{id}
GET /api/v1/company/custom-properties/{property_id}/catalog-values
GET /api/v1/company/custom-properties/{property_id}/catalog-values/{id}
GET /api/v1/company/custom-properties/{property_id}/select-values
GET /api/v1/company/custom-properties/{property_id}/select-values/{id}
GET /api/v1/company/groups
GET /api/v1/company/groups/{group_uid}/entities
GET /api/v1/company/groups/{uid}
GET /api/v1/company/users
GET /api/v1/groups/{group_uid}/admins
GET /api/v1/groups/{group_uid}/users
GET /api/v1/service-desk/services
GET /api/v1/spaces
GET /api/v1/spaces/{space_id}
GET /api/v1/spaces/{space_id}/automations
GET /api/v1/spaces/{space_id}/boards
GET /api/v1/spaces/{space_id}/boards/{id}
GET /api/v1/spaces/{space_id}/users
GET /api/v1/spaces/{space_id}/users/{id}
GET /api/v1/spaces/{space_uid}/template-checklists
GET /api/v1/sprints
GET /api/v1/sprints/{id}
GET /api/v1/tags
GET /api/v1/time-logs
GET /api/v1/tree-entities
GET /api/v1/tree-entity-roles
GET /api/v1/user-roles
GET /api/v1/user-roles/{role_id}
GET /api/v1/users
GET /api/v1/users/current
GET /api/v1/users/current/blockers
PATCH /api/v1/Groups/{group_id}
PATCH /api/v1/Users/{user_id}
PATCH /api/v1/boards/{board_id}/columns/{id}
PATCH /api/v1/boards/{board_id}/lanes/{id}
PATCH /api/v1/card-types/{id}
PATCH /api/v1/cards
PATCH /api/v1/cards/{card_id}
PATCH /api/v1/cards/{card_id}/blockers/{id}
PATCH /api/v1/cards/{card_id}/checklists/{checklist_id}/items/{id}
PATCH /api/v1/cards/{card_id}/checklists/{id}
PATCH /api/v1/cards/{card_id}/comments/{comment_id}
PATCH /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values/{id}
PATCH /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values/{id}
PATCH /api/v1/cards/{card_id}/external-links/{id}
PATCH /api/v1/cards/{card_id}/files/{id}
PATCH /api/v1/cards/{card_id}/members/{id}
PATCH /api/v1/cards/{card_id}/time-logs/{id}
PATCH /api/v1/checklists/{checklist_id}/items/{id}
PATCH /api/v1/columns/{column_id}/subcolumns/{id}
PATCH /api/v1/company/custom-properties/{id}
PATCH /api/v1/company/custom-properties/{property_id}/catalog-values/{id}
PATCH /api/v1/company/custom-properties/{property_id}/select-values/{id}
PATCH /api/v1/company/groups/{group_uid}/entities/{uid}
PATCH /api/v1/company/groups/{uid}
PATCH /api/v1/company/users/{id}
PATCH /api/v1/spaces/{space_id}
PATCH /api/v1/spaces/{space_id}/automations/{automation_uid}
PATCH /api/v1/spaces/{space_id}/boards/{id}
PATCH /api/v1/spaces/{space_id}/users/{id}
PATCH /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}
PATCH /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items/{item_uid}
PATCH /api/v1/user-roles/{role_id}
PATCH /api/v1/users/{id}
POST /api/v1/Groups
POST /api/v1/Users
POST /api/v1/blockers/{blocker_id}/categories
POST /api/v1/blockers/{blocker_id}/users
POST /api/v1/boards/{board_id}/columns
POST /api/v1/boards/{board_id}/lanes
POST /api/v1/card-types
POST /api/v1/cards
POST /api/v1/cards/{card_id}/blockers
POST /api/v1/cards/{card_id}/checklists
POST /api/v1/cards/{card_id}/checklists/{checklist_id}/items
POST /api/v1/cards/{card_id}/children
POST /api/v1/cards/{card_id}/comments
POST /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values
POST /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values
POST /api/v1/cards/{card_id}/external-links
POST /api/v1/cards/{card_id}/members
POST /api/v1/cards/{card_id}/sd-external-recipients
POST /api/v1/cards/{card_id}/tags
POST /api/v1/cards/{card_id}/time-logs
POST /api/v1/checklists/{checklist_id}/items
POST /api/v1/columns/{column_id}/subcolumns
POST /api/v1/company/custom-properties
POST /api/v1/company/custom-properties/{property_id}/catalog-values
POST /api/v1/company/custom-properties/{property_id}/select-values
POST /api/v1/company/groups
POST /api/v1/company/groups/{group_uid}/entities
POST /api/v1/groups/{group_uid}/admins
POST /api/v1/groups/{group_uid}/users
POST /api/v1/spaces
POST /api/v1/spaces/{space_id}/automations
POST /api/v1/spaces/{space_id}/boards
POST /api/v1/spaces/{space_id}/users
POST /api/v1/spaces/{space_uid}/template-checklists
POST /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items
POST /api/v1/tags
POST /api/v1/user-roles
PUT /api/v1/cards/{card_id}/files
"""


def path_to_openapi(api_path: str) -> str:
    """Convert /api/v1/xxx to /xxx."""
    if api_path.startswith("/api/v1/"):
        return api_path[len("/api/v1"):]
    return api_path


def method_to_summary(method: str, path: str) -> str:
    """Generate operation summary from method and path."""
    return f"{method} {path}"


def method_to_operation_id(method: str, path: str, op_path: str) -> str:
    """Generate unique operationId preserving path casing."""
    clean = re.sub(r"[{}]", "", op_path).replace("/", "_").strip("_")
    clean = re.sub(r"_+", "_", clean)
    return f"{method.lower()}_{clean}"[:80]


def make_operation(method: str, path: str) -> dict:
    op_path = path_to_openapi(path)
    params = re.findall(r"\{([^}]+)\}", op_path)
    op = {
        "summary": method_to_summary(method, path),
        "operationId": method_to_operation_id(method, path, op_path),
        "responses": {
            "200": {"description": "Success"},
            "400": {"description": "Validation error"},
            "401": {"description": "Invalid token"},
            "403": {"description": "Forbidden"},
        },
    }
    if params:
        def param_type(name: str) -> str:
            if "uid" in name or "email" in name or "uuid" in name:
                return "string"
            if any(x in name for x in ("_id", "id}", "Id")):
                return "integer"
            return "string"

        op["parameters"] = [
            {
                "name": p,
                "in": "path",
                "required": True,
                "schema": {"type": param_type(p)},
                "description": p.replace("_", " "),
            }
            for p in params
        ]
    if method in ("POST", "PATCH", "PUT"):
        op["requestBody"] = {
            "content": {"application/json": {"schema": {"type": "object"}}}
        }
    return op


def main():
    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "Kaiten API",
            "description": "Kaiten REST API v1. Full documentation: https://kshvakov.github.io/kaiten-api/",
            "version": "1.0.0",
        },
        "servers": [
            {"url": "https://{domain}.kaiten.ru/api/v1", "variables": {"domain": {"default": "your_domain"}}},
            {"url": "https://{domain}.kaiten.ru/api/latest", "variables": {"domain": {"default": "your_domain"}}},
        ],
        "security": [{"bearerAuth": []}],
        "components": {
            "securitySchemes": {
                "bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "token"}
            },
        },
        "paths": {},
    }

    for line in ENDPOINTS.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        parts = line.split(" ", 1)
        if len(parts) != 2:
            continue
        method, path = parts
        op_path = path_to_openapi(path)
        if op_path not in spec["paths"]:
            spec["paths"][op_path] = {}
        spec["paths"][op_path][method.lower()] = make_operation(method, path)

    out = "static/kaiten-api/openapi.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)
    print(f"Written {len(spec['paths'])} paths to {out}")


if __name__ == "__main__":
    main()
