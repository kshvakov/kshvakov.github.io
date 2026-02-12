---
title: "Kaiten API Documentation"
description: "Полная документация Kaiten REST API v1: эндпоинты, аутентификация, карточки, доски, пространства, пользователи, автоматизации, вебхуки."
date: 2026-02-12
lastmod: 2026-02-12
toc: true
api_docs: true
---

# Kaiten API Documentation

> Extracted from [developers.kaiten.ru](https://developers.kaiten.ru) on 2026-02-12

## General Information

| Parameter | Value |
|---|---|
| API Version | JSON API v1 |
| Base URL | `https://<your_domain>.kaiten.ru/api/v1` |
| Latest API URL | `https://<your_domain>.kaiten.ru/api/latest` |
| Authentication | `Authorization: Bearer <token>` |
| Content Type | `application/json` |
| Rate Limit | 5 requests per second |

### Rate Limit Headers

| Header | Description |
|---|---|
| `X-RateLimit-Remaining` | Remaining number of requests until limit |
| `X-RateLimit-Reset` | UTC epoch when the limit will be reset |

If the limit is reached, Kaiten returns HTTP `429`.

### Backward Compatibility

The API includes a `broken_api` parameter:
- **Default (true until 2026-04-01):** Returns user UID as strings for custom properties
- **New behavior (false):** Returns user ID as integers
- **Recommendation:** Use `broken_api=false` for new integrations

---

## Spaces & Boards

### Spaces

#### Create new space

`POST /api/v1/spaces`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Space id |
| `uid` | string | Space uid |
| `title` | string | Space title |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Space archived flag |
| `access` | string | Space access |
| `for_everyone_access_role_id` | string | Role id for everyone access |
| `entity_type` | string | Entity type |
| `path` | string | Inner path to entity |
| `sort_order` | number | Space sort order |
| `parent_entity_uid` | null \| string | Parent entity uid |
| `company_id` | integer | Company id |
| `allowed_card_type_ids` | null \| array | Allowed card types for this space |
| `external_id` | null \| string | External id |
| `settings` | object | Space settings |
| - `timeline` | object | Space timeline settings |
| - - `startHour` | integer | Start hour |
| - - `endHour` | integer | End work hour |
| - - `workDays` | array | Work days |
| - - `planningUnits` | enum | 1 - hours, 2 - days |
| - - `calculateResourcesBy` | enum | 1 - fixed resources, 2 - fixed duration, 3 - fixed duration and duration |
| `users` | array of objects | Space users |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `activated` | boolean | User activated flag |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `virtual` | boolean | Is user virtual |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| - `access_mod` | string | Access modifier with inheritable access modifiers |
| - `own_access_mod` | string | Own access modifier |
| - `own_role_ids` | array | User role ids |
| - `user_id` | integer | User id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden

---

#### Retrieve list of spaces

`GET /api/v1/spaces`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Space id |
| `uid` | string | Space uid |
| `title` | string | Space title |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Space archived flag |
| `access` | string | Space access |
| `for_everyone_access_role_id` | string | Role id for everyone access |
| `entity_type` | string | Entity type |
| `path` | string | Inner path to entity |
| `sort_order` | number | Space sort order |
| `parent_entity_uid` | null \| string | Parent entity uid |
| `company_id` | integer | Company id |
| `allowed_card_type_ids` | null \| array | Allowed card types for this space |
| `external_id` | null \| string | External id |
| `settings` | object | Space settings |
| - `timeline` | object | Space timeline settings |
| - - `startHour` | integer | Start hour |
| - - `endHour` | integer | End work hour |
| - - `workDays` | array | Work days |
| - - `planningUnits` | enum | 1 - hours, 2 - days |
| - - `calculateResourcesBy` | enum | 1 - fixed resources, 2 - fixed duration, 3 - fixed duration and duration |
| `boards` | array of objects | Space boards |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | Board id |
| - `title` | string | Board title |
| - `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| - `default_card_type_id` | integer | Default card type for new cards on board |
| - `description` | string | Board description |
| - `external_id` | null \| string | External id |
| - `email_key` | string | Email key |
| - `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| - `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| - `default_tags` | null \| string | Default tags |
| - `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| - `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| - `automove_cards` | boolean | Automatically move cards depending on their children state |
| - `hide_done_policies` | boolean | Hide done checklist policies |
| - `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| - `auto_assign_enabled` | boolean | Automatically assign user to card who moves card if he(she) is not card member |
| - `card_properties` | array of objects | Properties of the board cards suggested for filling  |
| - `space_id` | integer | Space id |
| - `board_id` | integer | Board id |
| - `top` | integer | Y coordinate of the board on space |
| - `left` | integer | X coordinate of the board on space |
| - `sort_order` | number | Position |
| - `type` | integer | 1 - place on space with coordinates (top, left), 5 - attach to space as sidebar |
| `entity_uid` | string | Entity uid |
| `user_id` | integer | User id |
| `access_mod` | string | User access modifier |

- **401** (error) - Invalid token

---

#### Retrieve space

`GET /api/v1/spaces/{space_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Space id |
| `uid` | string | Space uid |
| `title` | string | Space title |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Space archived flag |
| `access` | string | Space access |
| `for_everyone_access_role_id` | string | Role id for everyone access |
| `entity_type` | string | Entity type |
| `path` | string | Inner path to entity |
| `sort_order` | number | Space sort order |
| `parent_entity_uid` | null \| string | Parent entity uid |
| `company_id` | integer | Company id |
| `allowed_card_type_ids` | null \| array | Allowed card types for this space |
| `external_id` | null \| string | External id |
| `settings` | object | Space settings |
| - `timeline` | object | Space timeline settings |
| - - `startHour` | integer | Start hour |
| - - `endHour` | integer | End work hour |
| - - `workDays` | array | Work days |
| - - `planningUnits` | enum | 1 - hours, 2 - days |
| - - `calculateResourcesBy` | enum | 1 - fixed resources, 2 - fixed duration, 3 - fixed duration and duration |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update space

`PATCH /api/v1/spaces/{space_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Space id |
| `uid` | string | Space uid |
| `title` | string | Space title |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Space archived flag |
| `access` | string | Space access |
| `for_everyone_access_role_id` | string | Role id for everyone access |
| `entity_type` | string | Entity type |
| `path` | string | Inner path to entity |
| `sort_order` | number | Space sort order |
| `parent_entity_uid` | null \| string | Parent entity uid |
| `company_id` | integer | Company id |
| `allowed_card_type_ids` | null \| array | Allowed card types for this space |
| `external_id` | null \| string | External id |
| `settings` | null \| object | Space settings |
| - `timeline` | object | Space timeline settings |
| - - `startHour` | integer | Start hour |
| - - `endHour` | integer | End work hour |
| - - `workDays` | array | Work days |
| - - `planningUnits` | enum | 1 - hours, 2 - days |
| - - `calculateResourcesBy` | enum | 1 - fixed resources, 2 - fixed duration, 3 - fixed duration and duration |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Remove space

`DELETE /api/v1/spaces/{space_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted space id |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

### Space Boards

#### Create new board

`POST /api/v1/spaces/{space_id}/boards`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Board  id |
| `title` | string | Board title |
| `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| `external_id` | null \| string | External id |
| `default_card_type_id` | integer | Default card type for new cards on board |
| `description` | string | Board description |
| `email_key` | string | Email key |
| `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| `default_tags` | null \| string | Default tags |
| `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| `hide_done_policies` | boolean | Hide done checklist policies |
| `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| `automove_cards` | boolean | Automatically move cards depending on their children state |
| `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `key` | string | Property key |
| - `laneIds` | array | Array of lane ids to which the rule will be applied. Empty array for all lanes |
| - `required` | boolean | Is rule required |
| - `columnsIds` | array | Array of columns ids to which the rule will be applied. Empty array for all columns |
| - `cardTypeIds` | array | Array of card types ids to which the rule will be applied. empty array for all card types |
| `columns` | array of objects | Board columns |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `lanes` | array of objects | Board lanes |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `top` | integer | Y coordinate of the board on space |
| `left` | integer | X coordinate of the board on space |
| `sort_order` | number | Position |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of boards

`GET /api/v1/spaces/{space_id}/boards`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Board  id |
| `title` | string | Board title |
| `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| `external_id` | null \| string | External id |
| `default_card_type_id` | integer | Default card type for new cards on board |
| `description` | string | Board description |
| `email_key` | string | Email key |
| `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| `default_tags` | null \| string | Default tags |
| `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| `hide_done_policies` | boolean | Hide done checklist policies |
| `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| `automove_cards` | boolean | Automatically move cards depending on their children state |
| `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `key` | string | Property key |
| - `laneIds` | array | Array of lane ids to which the rule will be applied. Empty array for all lanes |
| - `required` | boolean | Is rule required |
| - `columnsIds` | array | Array of columns ids to which the rule will be applied. Empty array for all columns |
| - `cardTypeIds` | array | Array of card types ids to which the rule will be applied. empty array for all card types |
| `columns` | array of objects | Board columns |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `lanes` | array of objects | Board lanes |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `top` | integer | Y coordinate of the board on space |
| `left` | integer | X coordinate of the board on space |
| `sort_order` | number | Position |
| `type` | integer | 1 - place on space with coordinates (top, left), 5 - attach to space as sidebar |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get board

`GET /api/v1/spaces/{space_id}/boards/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Board  id |
| `title` | string | Board title |
| `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| `external_id` | null \| string | External id |
| `default_card_type_id` | integer | Default card type for new cards on board |
| `description` | string | Board description |
| `email_key` | string | Email key |
| `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| `default_tags` | null \| string | Default tags |
| `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| `hide_done_policies` | boolean | Hide done checklist policies |
| `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| `automove_cards` | boolean | Automatically move cards depending on their children state |
| `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `key` | string | Property key |
| - `laneIds` | array | Array of lane ids to which the rule will be applied. Empty array for all lanes |
| - `required` | boolean | Is rule required |
| - `columnsIds` | array | Array of columns ids to which the rule will be applied. Empty array for all columns |
| - `cardTypeIds` | array | Array of card types ids to which the rule will be applied. empty array for all card types |
| `columns` | array of objects | Board columns |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `lanes` | array of objects | Board lanes |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | integer | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `cards` | array of objects | Board cards |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| `top` | integer | Y coordinate of the board on space |
| `left` | integer | X coordinate of the board on space |
| `sort_order` | number | Position |
| `space_id` | integer | Board spaceId |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update board

`PATCH /api/v1/spaces/{space_id}/boards/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Board  id |
| `title` | string | Board title |
| `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| `external_id` | null \| string | External id |
| `default_card_type_id` | integer | Default card type for new cards on board |
| `description` | string | Board description |
| `email_key` | string | Email key |
| `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| `default_tags` | null \| string | Default tags |
| `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| `hide_done_policies` | boolean | Hide done checklist policies |
| `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| `automove_cards` | boolean | Automatically move cards depending on their children state |
| `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `key` | string | Property key |
| - `laneIds` | array | Array of lane ids to which the rule will be applied. Empty array for all lanes |
| - `required` | boolean | Is rule required |
| - `columnsIds` | array | Array of columns ids to which the rule will be applied. Empty array for all columns |
| - `cardTypeIds` | array | Array of card types ids to which the rule will be applied. empty array for all card types |
| `columns` | array of objects | Board columns |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `lanes` | array of objects | Board lanes |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `top` | integer | Y coordinate of the board on space |
| `left` | integer | X coordinate of the board on space |
| `sort_order` | number | Position |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove board

`DELETE /api/v1/spaces/{space_id}/boards/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted board id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Columns

#### Create new column

`POST /api/v1/boards/{board_id}/columns`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | null | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of columns

`GET /api/v1/boards/{board_id}/columns`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | null | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |
| `pause_sla` | boolean | Indicates whether the SLA timer should be paused in this column |
| `subcolumns` | array of objects | Column subcolumns |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `wip_limit` | integer | Recommended limit for column |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| - `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| - `external_id` | null \| string | External id |
| - `default_tags` | string | Default tags |
| - `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| - `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| - `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update column

`PATCH /api/v1/boards/{board_id}/columns/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | null | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove column

`DELETE /api/v1/boards/{board_id}/columns/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted column id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Subcolumn

#### Create new subcolumn

`POST /api/v1/columns/{column_id}/subcolumns`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `column_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | integer | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N months |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of subcolumns

`GET /api/v1/columns/{column_id}/subcolumns`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `column_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | integer | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N months |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update subcolumn

`PATCH /api/v1/columns/{column_id}/subcolumns/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `column_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Column id |
| `title` | string | Column title |
| `sort_order` | number | Position |
| `col_count` | integer | Width |
| `wip_limit` | integer | Recommended limit for column |
| `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board_id` | integer | Board id |
| `column_id` | integer | Parent column id |
| `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| `card_hide_after_days` | null \| integer | Hide cards not moved for the last N months |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove subcolumn

`DELETE /api/v1/columns/{column_id}/subcolumns/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `column_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted subcolumn id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Lanes

#### Create new lane

`POST /api/v1/boards/{board_id}/lanes`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Lane id |
| `title` | string | Lane title |
| `sort_order` | number | Position |
| `row_count` | integer | Height |
| `wip_limit` | integer | Recommended limit for column |
| `board_id` | integer | Board id |
| `default_card_type_id` | null \| integer | Default card type for new cards in lane |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `condition` | enum | 1 - live, 2 - archived, 3 - deleted |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of lanes

`GET /api/v1/boards/{board_id}/lanes`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | 1 - live, 2 - archived, 3 - deleted | Lane id |
| `title` | string | Lane title |
| `sort_order` | number | Position |
| `row_count` | integer | Height |
| `wip_limit` | integer | Recommended limit for column |
| `board_id` | integer | Board id |
| `default_card_type_id` | null \| integer | Default card type for new cards in lane |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `condition` | enum | 1 - live, 2 - archived, 3 - deleted |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update lane

`PATCH /api/v1/boards/{board_id}/lanes/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Lane id |
| `title` | string | Lane title |
| `sort_order` | number | Position |
| `row_count` | integer | Height |
| `wip_limit` | integer | Recommended limit for column |
| `board_id` | integer | Board id |
| `default_card_type_id` | null \| integer | Default card type for new cards in lane |
| `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| `external_id` | null \| string | External id |
| `default_tags` | string | Default tags |
| `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| `condition` | enum | 1 - live, 2 - archived, 3 - deleted |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove lane

`DELETE /api/v1/boards/{board_id}/lanes/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `board_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted lane id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Space users

#### Invite user to space

`POST /api/v1/spaces/{space_id}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `user` | object | User info |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `activated` | boolean | User activated flag |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `virtual` | boolean | Is user virtual |
| `access_record` | object | Access record data |
| - `access_mod` | string | Access modifier with inheritable access modifiers |
| - `entity_uid` | string | Entity uid |
| - `user_id` | integer | User id |
| - `own_role_ids` | array | User role ids |
| - `own_access_mod` | string | Own access modifier |
| `message` | string | Success message |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of users

`GET /api/v1/spaces/{space_id}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `access_mod` | string | Access modifier with inheritable access modifiers |
| `own_access_mod` | string | Own access modifier |
| `own_role_ids` | array | User role ids |
| `current` | boolean | flag indicating that this is the user on whose behalf the request was made |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get user

`GET /api/v1/spaces/{space_id}/users/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `entity_uid` | string | Entity uid |
| `user_id` | integer | User id |
| `access_mod` | string | Access modifier with inheritable access modifiers |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Change user role and notification settings

`PATCH /api/v1/spaces/{space_id}/users/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `entity_uid` | string | Entity uid |
| `access_mod` | string | Access modifier with inheritable access modifiers |
| `own_access_mod` | string | Own access modifier |
| `own_role_ids` | array | User role ids |
| `id` | integer | User id |
| `user_id` | integer | User id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove user from space

`DELETE /api/v1/spaces/{space_id}/users/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `user_id` | integer | User id |
| `entity_uid` | string | Entity uid |
| `access_mod` | string | Access modifier with inheritable access modifiers |
| `own_access_mod` | string | Own access modifier |
| `own_role_ids` | null | User role ids |

- **401** (error) - Invalid token

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found
- **409** (error) - Conflict

---

### Space template checklist

#### Create new space template checklist

`POST /api/v1/spaces/{space_uid}/template-checklists`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Template checklist UID |
| `name` | string | Name |
| `sort_order` | number | Position |
| `space_uid` | string | Space UID |
| `created` | string | Create timestamp |
| `updated` | string | Last update timestamp |

- **401** (error) - Invalid token

---

#### Get list of space template checklists

`GET /api/v1/spaces/{space_uid}/template-checklists`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Template checklist UID |
| `name` | string | Name |
| `sort_order` | number | Position |
| `space_uid` | string | Space UID |
| `created` | string | Create timestamp |
| `updated` | string | Last update timestamp |
| `items` | array | Template checklist items |
| - `uid` | string | Template checklist item UID |
| - `text` | text | Text |
| - `sort_order` | number | Position |
| - `user_id` | integer | Author id |
| - `created` | string | Create timestamp |
| - `updated` | string | Last update timestamp |

- **401** (error) - Invalid token

---

#### Update space template checklist

`PATCH /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |
| `template_checklist_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Template checklist UID |
| `name` | string | Name |
| `sort_order` | number | Position |
| `space_uid` | string | Space UID |
| `created` | string | Create timestamp |
| `updated` | string | Last update timestamp |

- **401** (error) - Invalid token

---

#### Remove space template checklist

`DELETE /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |
| `template_checklist_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Deleted template checklist UID |

- **401** (error) - Invalid token

---

### Space template checklist Items

#### Create new space template checklist item

`POST /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |
| `template_checklist_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Item UID |
| `text` | string | Text |
| `sort_order` | number | Position |
| `user_id` | number | Author ID |
| `created` | string | Create timestamp |
| `updated` | string | Last update timestamp |

- **401** (error) - Invalid token

---

#### Update space template checklist item

`PATCH /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items/{item_uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |
| `template_checklist_uid` | string | Yes |  |
| `item_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Item UID |
| `text` | string | Text |
| `sort_order` | number | Position |
| `user_id` | number | Author ID |
| `created` | string | Create timestamp |
| `updated` | string | Last update timestamp |

- **401** (error) - Invalid token

---

#### Remove space template checklist item

`DELETE /api/v1/spaces/{space_uid}/template-checklists/{template_checklist_uid}/items/{item_uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_uid` | string | Yes |  |
| `template_checklist_uid` | string | Yes |  |
| `item_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Deleted template checklist item uid |

- **401** (error) - Invalid token

---

### Boards

#### Get board

`GET /api/v1/boards/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Board id |
| `title` | string | Board title |
| `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| `external_id` | null \| string | External id |
| `default_card_type_id` | integer | Default card type for new cards on board |
| `description` | string | Board description |
| `email_key` | string | Email key |
| `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| `default_tags` | null \| string | Default tags |
| `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| `hide_done_policies` | boolean | Hide done checklist policies |
| `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| `automove_cards` | boolean | Automatically move cards depending on their children state |
| `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `key` | string | Property key |
| - `laneIds` | array | Array of lane ids to which the rule will be applied. Empty array for all lanes |
| - `required` | boolean | Is rule required |
| - `columnsIds` | array | Array of columns ids to which the rule will be applied. Empty array for all columns |
| - `cardTypeIds` | array | Array of card types ids to which the rule will be applied. empty array for all card types |
| `columns` | array of objects | Board columns |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `lanes` | array of objects | Board lanes |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `cards` | array of objects | Board cards |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

## Cards

### Cards

#### Create new card

`POST /api/v1/cards`

Creates a new Card.
To create a card at the beginning of the cell send position: 1 and position: 2 to place the card in the end.

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `sort_order` | number | Position |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `calculated_planned_start` | null \| string | Calculated planned start |
| `calculated_planned_end` | null \| string | Calculated planned end |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `type` | object | Card type info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card type id |
| - `name` | string | Card type name |
| - `color` | integer | Color number |
| - `letter` | string | Card type letter |
| - `description_template` | null \| string | Card type escription_template |
| - `company_id` | integer | Company id |
| - `properties` | null \| object | Card type properties(preset and custom) |
| `external_links` | array | Card external links |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | External link id |
| - `url` | string | External link url |
| - `description` | string | External link description |
| - `card_id` | integer | External link card id |
| - `external_link_id` | integer | External link id |
| `files` | array | Card files |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `card_cover` | boolean | Flag indicating that image used as card cover |
| - `author_id` | integer | Author id |
| - `card_id` | integer | Card id |
| - `comment_id` | integer | Comment id |
| - `deleted` | boolean | Deleted flag |
| - `external` | boolean | External flag |
| - `id` | integer | File id |
| - `mh_markup_id` | string |  |
| - `mh_secret` | string |  |
| - `name` | string | File name |
| - `size` | integer | File size |
| - `sort_order` | number | Position |
| - `type` | enum | 1 - attachment, 2 - googleDrive, 3 - dropBox, 4 - box, 5 -oneDrive, 6 - yandex disc, 7 - comment email, 8 - commentAttachment |
| - `url` | string | Uploaded url |
| - `author` | object | Author info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| `checklists` | array | Card checklists |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Card checklist id |
| - `name` | string | Checklist name |
| - `policy_id` | null \| integer | Template checklist id |
| - `items` | array | Checklist items |
| `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card list

`GET /api/v1/cards`

Get Card list filtered by query parameters. The result of the request is displayed page by page (see details in the constraints of the parameters).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description. Present only if query parameter 'additional_card_fields' in the request contains 'description' field option |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `sort_order` | number | Position |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `calculated_planned_start` | null \| string | Calculated planned start |
| `calculated_planned_end` | null \| string | Calculated planned end |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `parents_ids` | null \| array | Array of card parent ids |
| `children_ids` | null \| array | Array of card children ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `type` | object | Card type info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card type id |
| - `name` | string | Card type name |
| - `color` | integer | Color number |
| - `letter` | string | Card type letter |
| - `description_template` | null \| string | Card type escription_template |
| - `company_id` | integer | Company id |
| - `properties` | null \| object | Card type properties(preset and custom) |
| `board` | object | Card board info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | Board id |
| - `title` | string | Board title |
| - `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| - `external_id` | null \| string | External id |
| - `default_card_type_id` | integer | Default card type for new cards on board |
| - `description` | string | Board description |
| - `email_key` | string | Email key |
| - `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| - `default_tags` | null \| string | Default tags |
| - `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| - `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| - `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| - `hide_done_policies` | boolean | Hide done checklist policies |
| - `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| - `automove_cards` | boolean | Automatically move cards depending on their children state |
| - `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| - `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `columns` | array of objects | Board columns |
| - `lanes` | array of objects | Board lanes |
| - `cards` | array of objects | Board cards |
| `members` | array | Card members |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| - `type` | integer | 1 - member, 2- responsible |
| `column` | object | Card column |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `wip_limit` | integer | Recommended limit for column |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| - `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| - `external_id` | null \| string | External id |
| - `default_tags` | string | Default tags |
| - `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| - `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| - `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |
| `lane` | object | Card lane info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `row_count` | integer | Height |
| - `wip_limit` | integer | Recommended limit for column |
| - `board_id` | integer | Board id |
| - `default_card_type_id` | null \| integer | Default card type for new cards in lane |
| - `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| - `external_id` | null \| string | External id |
| - `default_tags` | string | Default tags |
| - `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| `children` | array of objects | Card childrens |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Children card id |
| - `title` | string | Card title |
| - `description` | null \| string | Card description |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `service_id` | integer | Service id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `counters_recalculated_at` | string | Date of recalculating counters |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `board` | object | Board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `column` | object | Column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `lane` | object | Lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `card_id` | integer | Parent card id |
| - `depends_on_card_id` | integer | Children card id |
| `parents` | array | Card parents |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Children card id |
| - `title` | string | Card title |
| - `description` | null \| string | Card description |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `service_id` | integer | Service id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `counters_recalculated_at` | string | Date of recalculating counters |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `board` | object | Board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `column` | object | Column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `lane` | object | Lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `card_id` | integer | Parent card id |
| - `depends_on_card_id` | integer | Children card id |
| `path_data` | object | Card path info (space, board, column, lane, etc) |
| - `space` | object | Card path space |
| - `board` | object | Card path board |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `column` | object | Card column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `lane` | object | Card lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `subcolumn` | object | Card subcolumn info |
| `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Retrieve card

`GET /api/v1/cards/{card_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `sort_order` | number | Position |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgress, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `calculated_planned_start` | null \| string | Calculated planned start |
| `calculated_planned_end` | null \| string | Calculated planned end |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `parents_ids` | null \| array | Array of card parent ids |
| `children_ids` | null \| array | Array of card children ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `import_id` | null \| integer | Import id |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `checklists` | array | Card checklists |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Card checklist id |
| - `name` | string | Checklist name |
| - `policy_id` | null \| integer | Template checklist id |
| - `items` | array | Checklist items |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `type` | object | Card type info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card type id |
| - `name` | string | Card type name |
| - `color` | integer | Color number |
| - `letter` | string | Card type letter |
| - `description_template` | null \| string | Card type escription_template |
| - `company_id` | integer | Company id |
| - `properties` | null \| object | Card type properties(preset and custom) |
| `board` | object | Card board info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | Board id |
| - `title` | string | Board title |
| - `cell_wip_limits` |  null | array | JSON containing wip limits rules for cells |
| - `external_id` | null \| string | External id |
| - `default_card_type_id` | integer | Default card type for new cards on board |
| - `description` | string | Board description |
| - `email_key` | string | Email key |
| - `move_parents_to_done` | boolean | Automatically move parent cards to done when their children cards on this board is done |
| - `default_tags` | null \| string | Default tags |
| - `first_image_is_cover` | boolean | Automatically mark first uploaded card's image as card's cover |
| - `reset_lane_spent_time` | boolean | Reset lane spent time when card changed lane |
| - `backward_moves_enabled` | boolean | Allow automatic backward movement for summary boards |
| - `hide_done_policies` | boolean | Hide done checklist policies |
| - `hide_done_policies_in_done_column` | boolean | Hide done checklist policies only in done column |
| - `automove_cards` | boolean | Automatically move cards depending on their children state |
| - `auto_assign_enabled` | boolean | Automatically assign a user to the card when he/she moves the card if the user is not a member of the card |
| - `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| - `columns` | array of objects | Board columns |
| - `lanes` | array of objects | Board lanes |
| - `cards` | array of objects | Board cards |
| `blockers` | array of objects | Card blocks |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `members` | array | Card members |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| - `type` | integer | 1 - member, 2- responsible |
| `slas` | array of objects | SLAs attached to the card  |
| - `created` | string | SLA creation date |
| - `updated` | string | SLA last update date |
| - `id` | string | SLA identifier |
| - `company_id` | integer | Company identifier |
| - `updater_id` | integer | User ID who last updated the SLA |
| - `name` | string | SLA name |
| - `status` | string | SLA status |
| - `notification_settings` | object || null | Notification settings |
| - `rules` | array | SLA rules |
| - `card_id` | integer | Card identifier |
| - `sla_id` | string | SLA identifier |
| `column` | object | Card column |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `wip_limit` | integer | Recommended limit for column |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `archive_after_days` | integer | Specify amont of days after which cards will be automatically archived. Works only for columns with type **done** |
| - `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| - `external_id` | null \| string | External id |
| - `default_tags` | string | Default tags |
| - `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| - `months_to_hide_cards` | null \| integer | [Deprecated] Hide cards not moved for the last N months |
| - `card_hide_after_days` | null \| integer | Hide cards not moved for the last N days |
| `lane` | object | Card lane info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `row_count` | integer | Height |
| - `wip_limit` | integer | Recommended limit for column |
| - `board_id` | integer | Board id |
| - `default_card_type_id` | null \| integer | Default card type for new cards in lane |
| - `wip_limit_type` | enum | 1 – card's count, 2 – card's size |
| - `external_id` | null \| string | External id |
| - `default_tags` | string | Default tags |
| - `last_moved_warning_after_days` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_hours` | integer | Warning appears on stale cards |
| - `last_moved_warning_after_minutes` | integer | Warning appears on stale cards |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| `blocked_at` | string | Date of card block |
| `blocker_id` | integer | User id who blocked card |
| `blocker` | object | Info of user who blocked card |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `block_reason` | string | Block reason |
| `children` | array of objects | Card childrens |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Children card id |
| - `title` | string | Card title |
| - `description` | null \| string | Card description |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `service_id` | integer | Service id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `counters_recalculated_at` | string | Date of recalculating counters |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `board` | object | Board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `column` | object | Column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `lane` | object | Lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `card_id` | integer | Parent card id |
| - `depends_on_card_id` | integer | Children card id |
| `parents` | array | Card parents |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Children card id |
| - `title` | string | Card title |
| - `description` | null \| string | Card description |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `service_id` | integer | Service id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `counters_recalculated_at` | string | Date of recalculating counters |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `board` | object | Board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `column` | object | Column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `lane` | object | Lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `card_id` | integer | Parent card id |
| - `depends_on_card_id` | integer | Children card id |
| `external_links` | array | Card external links |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | number | External link id |
| - `url` | string | External link url |
| - `description` | string | External link description |
| - `card_id` | External link card id |  |
| - `external_link_id` | integer | External link id |
| `files` | array | Card files |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `card_cover` | boolean | Flag indicating that image used as card cover |
| - `author_id` | integer | Author id |
| - `card_id` | integer | Card id |
| - `comment_id` | integer | Comment id |
| - `deleted` | boolean | Deleted flag |
| - `external` | boolean | External flag |
| - `id` | integer | File id |
| - `mh_markup_id` | string |  |
| - `mh_secret` | string |  |
| - `name` | string | File name |
| - `size` | integer | File size |
| - `sort_order` | number | Position |
| - `type` | enum | 1 - attachment, 2 - googleDrive, 3 - dropBox, 4 - box, 5 -oneDrive, 6 - yandex disc, 7 - comment email, 8 - commentAttachment |
| - `url` | string | Uploaded url |
| - `author` | object | Author info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| `tags` | array | Card tags |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card tag id |
| - `name` | string | Card tag name |
| - `company_id` | integer | Company id |
| - `color` | integer | Card tag color number |
| `cardRole` | integer | User card role who made the request. 1-reader, 2-writer, 3-admin |
| `email` | string | Card email for email comment |
| `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Update card

`PATCH /api/v1/cards/{card_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `sort_order` | number | Position |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `calculated_planned_start` | null \| string | Calculated planned start |
| `calculated_planned_end` | null \| string | Calculated planned end |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `parents_ids` | null \| array | Array of card parent ids |
| `children_ids` | null \| array | Array of card children ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| number | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `import_id` | null \| integer | Import id |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `members` | array of objects | Card members |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| - `type` | integer | 1 - member, 2- responsible |
| `tags` | array | Card tags |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card tag id |
| - `name` | string | Card tag name |
| - `company_id` | integer | Company id |
| - `color` | integer | Card tag color number |
| `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Batch update for cards

`PATCH /api/v1/cards`

Update multiple cards by criteria. Runs in the background and returns a job ID.

**Responses:**

- **202** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (UUID) of the background job |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Delete card

`DELETE /api/v1/cards/{card_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `sort_order` | number | Position |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 3 - deleted |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `calculated_planned_start` | null \| string | Calculated planned start |
| `calculated_planned_end` | null \| string | Calculated planned end |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `parents_ids` | null \| array | Array of card parent ids |
| `children_ids` | null \| array | Array of card children ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `import_id` | null \| integer | Import id |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `members` | array | Card members |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| - `type` | integer | 1 - member, 2- responsible |
| `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card location history

`GET /api/v1/cards/{card_id}/location-history`

Get card location history

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Movement event id |
| `card_id` | integer | Card id |
| `board_id` | integer | Id of board card was moved to |
| `column_id` | integer | Id of column the card was moved to |
| `subcolumn_id` | integer \| null | Id of subcolumn the card was moved to |
| `lane_id` | integer | Id of lane the card was moved to |
| `sprint_id` | integer \| null | Sprint id |
| `author_id` | integer | Id of used that performed the movement/state changing action with card |
| `author` | object | User who has moved the card, author of the action |
| - `id` | integer | User id |
| - `uid` | string | User id in uid format |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `activated` | boolean | User activated flag |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `virtual` | boolean | Whether the user is virtual |
| - `email_blocked` | string \| null | If blocked, email block timestamp |
| - `email_blocked_reason` | null \| string | Reason of blocking |
| `condition` | integer | Condition of the movement event (1 - Active, 2 - Archived, 3 - Deleted) |
| `changed` | string | Movement or state modification event timestamp |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Retrieve card baselines

`GET /api/v1/cards/{card_id}/baselines`

Get all unarchived baselines of unarchived projects for this card

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Card id |
| `project_id` | string | Project uid |
| `baseline_id` | string | Baseline uid |
| `planned_start` | string | Baseline start time |
| `planned_end` | string || null | Baseline end time |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

## Card Components

### Card blockers

#### Block card

`POST /api/v1/cards/{card_id}/blockers`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `broken_api` | boolean | No | Backward compatibility flag for user custom properties format. When true (default until 2026-04-01), returns user uid (string). When false, returns user id (integer). Use broken_api=false for new integrations. |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Blocker id |
| `reason` | string | Block reason |
| `card_id` | integer | Blocked card id |
| `blocker_id` | integer | User id who blocked card |
| `blocker_card_id` | string | Id of blocking card |
| `blocker_card_title` | null || string | Title of blocking card |
| `released` | boolean | Is block released |
| `released_by_id` | integer | Id of user who released block |
| `due_date` | null \| string | Block deadline |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `blocked_card` | object | Blocked card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |
| `blocker` | object | Info of user who blocked card |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `card` | object | Blocking card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card blockers list

`GET /api/v1/cards/{card_id}/blockers`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `broken_api` | boolean | No | Backward compatibility flag for user custom properties format. When true (default until 2026-04-01), returns user uid (string). When false, returns user id (integer). Use broken_api=false for new integrations. |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Blocker id |
| `reason` | string | Block reason |
| `card_id` | integer | Blocked card id |
| `blocker_id` | integer | User id who blocked card |
| `blocker_card_id` | string | Id of blocking card |
| `blocker_card_title` | null || string | Title of blocking card |
| `released` | boolean | Is block released |
| `released_by_id` | integer | Id of user who released block |
| `due_date` | null \| string | Block deadline |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `blocked_card` | object | Blocked card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |
| `blocker` | object | Info of user who blocked card |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `card` | object | Blocking card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update card blockers

`PATCH /api/v1/cards/{card_id}/blockers/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Blocker id |
| `reason` | string | Block reason |
| `card_id` | integer | Blocked card id |
| `blocker_id` | integer | User id who blocked card |
| `blocker_card_id` | string | Id of blocking card |
| `blocker_card_title` | null || string | Title of blocking card |
| `released` | boolean | Is block released |
| `released_by_id` | integer | Id of user who released block |
| `due_date` | null \| string | Block deadline |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Delete card blockers

`DELETE /api/v1/cards/{card_id}/blockers/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Blocker id |
| `reason` | string | Block reason |
| `card_id` | integer | Blocked card id |
| `blocker_id` | integer | User id who blocked card |
| `blocker_card_id` | string | Id of blocking card |
| `blocker_card_title` | null || string | Title of blocking card |
| `released` | boolean | Is block released |
| `released_by_id` | integer | Id of user who released block |
| `due_date` | null \| string | Block deadline |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `blocked_card` | object | Blocked card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |
| `blocker` | object | Info of user who blocked card |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `card` | object | Blocking card info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card tags

#### Add tag

`POST /api/v1/cards/{card_id}/tags`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Archived flag |
| `id` | integer | Card tag id |
| `name` | string | Card tag name |
| `company_id` | integer | Company id |
| `color` | integer | Card tag color number |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Rertrieve list of tags

`GET /api/v1/cards/{card_id}/tags`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Card tag id |
| `name` | string | Card tag name |
| `color` | integer | Card tag color number |
| `card_id` | integer | Card id |
| `tag_id` | integer | Card tag id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove tag from card

`DELETE /api/v1/cards/{card_id}/tags/{tag_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `tag_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card tag id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card comments

#### Add comment

`POST /api/v1/cards/{card_id}/comments`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Comment id |
| `uid` | integer | Comment uid |
| `text` | string | Comment text |
| `type` | enum | 1-markdown, 2-html |
| `edited` | boolean | Is comment edited |
| `card_id` | integer | Card id |
| `author_id` | integer | Author id |
| `email_addresses_to` | string | Mail addresses to send comment |
| `internal` | boolean | Internal flag |
| `deleted` | boolean | Deleted flag |
| `sd_external_recipients_cc` | string | Service desk external recipients |
| `sd_description` | boolean | Flag indicating that the comment is used as a request description when the card is a service desk request |
| `notification_sent` | string | Notification_sent date |
| `attacments` | array of objects | Comment attacments |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `card_cover` | boolean | Flag indicating that image used as card cover |
| - `author_id` | integer | Author id |
| - `card_id` | integer | Card id |
| - `comment_id` | integer | Comment id |
| - `deleted` | boolean | Deleted flag |
| - `external` | boolean | External flag |
| - `id` | integer | File id |
| - `name` | string | File name |
| - `size` | integer | File size |
| - `sort_order` | number | Position |
| - `type` | enum | 1 - attachment, 2 - googleDrive, 3 - dropBox, 4 - box, 5 -oneDrive, 6 - yandex disc, 7 - comment email, 8 - commentAttachment |
| - `url` | string | Uploaded url |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card comments

`GET /api/v1/cards/{card_id}/comments`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Comment id |
| `uid` | integer | Comment uid |
| `text` | string | Comment text |
| `type` | enum | 1-markdown, 2-html |
| `edited` | boolean | Is comment edited |
| `card_id` | integer | Card id |
| `author_id` | integer | Author id |
| `email_addresses_to` | string | Mail addresses to send comment |
| `internal` | boolean | Internal flag |
| `deleted` | boolean | Deleted flag |
| `sd_external_recipients_cc` | null |string | Service desk external recipients |
| `sd_description` | boolean | Flag indicating that the comment is used as a request description when the card is a service desk request |
| `notification_sent` | null \| string | Notification sent date |
| `author` | object | Author info |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `activated` | boolean | User activated flag |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update comment

`PATCH /api/v1/cards/{card_id}/comments/{comment_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `comment_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Comment id |
| `uid` | integer | Comment uid |
| `text` | string | Comment text |
| `type` | enum | 1-markdown, 2-html |
| `edited` | boolean | Is comment edited |
| `card_id` | integer | Card id |
| `author_id` | integer | Author id |
| `email_addresses_to` | string | Mail addresses to send comment |
| `internal` | boolean | Internal flag |
| `deleted` | boolean | Deleted flag |
| `sd_external_recipients_cc` | string | Service desk external recipients |
| `sd_description` | boolean | Flag indicating that the comment is used as a request description when the card is a service desk request |
| `notification_sent` | string | Notification_sent date |
| `attacments` | array of objects | Comment attacments |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `card_cover` | boolean | Flag indicating that image used as card cover |
| - `author_id` | integer | Author id |
| - `card_id` | integer | Card id |
| - `comment_id` | integer | Comment id |
| - `deleted` | boolean | Deleted flag |
| - `external` | boolean | External flag |
| - `id` | integer | File id |
| - `name` | string | File name |
| - `size` | integer | File size |
| - `sort_order` | number | Position |
| - `type` | enum | 1 - attachment, 2 - googleDrive, 3 - dropBox, 4 - box, 5 -oneDrive, 6 - yandex disc, 7 - comment email, 8 - commentAttachment |
| - `url` | string | Uploaded url |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove comment

`DELETE /api/v1/cards/{card_id}/comments/{comment_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `comment_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted comment id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card external links

#### Add external link

`POST /api/v1/cards/{card_id}/external-links`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `url` | string | Url |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card external link id |
| `description` | string | Card external link description |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card external links

`GET /api/v1/cards/{card_id}/external-links`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `url` | string | Url |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card external link id |
| `description` | string | Card external link description |
| `card_id` | integer | Card id |
| `external_link_id` | integer | Card external link id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update external link

`PATCH /api/v1/cards/{card_id}/external-links/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `url` | string | Url |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card external link id |
| `description` | string | Card external link description |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove external link

`DELETE /api/v1/cards/{card_id}/external-links/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card external link id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card children

#### Add children

`POST /api/v1/cards/{card_id}/children`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `broken_api` | boolean | No | Backward compatibility flag for user custom properties format. When true (default until 2026-04-01), returns user uid (string). When false, returns user id (integer). Use broken_api=false for new integrations. |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Children card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `type` | object | Card type info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card type id |
| - `name` | string | Card type name |
| - `color` | integer | Color number |
| - `letter` | string | Card type letter |
| - `description_template` | null \| string | Card type escription_template |
| - `company_id` | integer | Company id |
| - `properties` | null \| object | Card type properties(preset and custom) |
| `has_access_to_space` | boolean | Flag indicating that user who made request has aceess to space |
| `path_data` | object | Card path info (space, board, column, lane, etc) |
| - `lane` | object | Card lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `board` | object | Card board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `space` | object | Card space info |
| - `column` | object | Card column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `subcolumn` | object | Card subcolumn info |
| `space_id` | integer | Space id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card children list

`GET /api/v1/cards/{card_id}/children`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `broken_api` | boolean | No | Backward compatibility flag for user custom properties format. When true (default until 2026-04-01), returns user uid (string). When false, returns user id (integer). Use broken_api=false for new integrations. |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Children card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `size` | number | Children cards size sum |
| - `time_spent_sum` | integer | Children cards spent time sum |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `id_{propertyId}` | string \| integer | null \| object | Card custom property. Format id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | List of shared card fields. Format fieldName: value |
| - `share_due_date` | string \| null | Share due date timestamp |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `estimate_workload` | number | Estimate_workload |
| `owner` | object | Card owner info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `username` | string | Username for mentions and login |
| - `email` | string | User email |
| - `activated` | boolean | User activated flag |
| - `avatar_initials_url` | string | Default user avatar url |
| - `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| - `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `type` | object | Card type info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `archived` | boolean | Archived flag |
| - `id` | integer | Card type id |
| - `name` | string | Card type name |
| - `color` | integer | Color number |
| - `letter` | string | Card type letter |
| - `description_template` | null \| string | Card type escription_template |
| - `company_id` | integer | Company id |
| - `properties` | null \| object | Card type properties(preset and custom) |
| `board` | object | Board info |
| - `id` | integer | Board id |
| - `title` | string | Board title |
| - `external_id` | null \| string | External id |
| - `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| `column` | object | Column info |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `parent` | null \| object | Parent column |
| `lane` | object | Lane info |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived |
| - `external_id` | null \| string | External id |
| `card_id` | integer | Parent card id |
| `depends_on_card_id` | integer | Children card id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove children

`DELETE /api/v1/cards/{card_id}/children/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card children id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card Members

#### Add member to card

`POST /api/v1/cards/{card_id}/members`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `type` | integer | 1 - member |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve list of card members

`GET /api/v1/cards/{card_id}/members`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Virtual user flag |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `type` | enum | 1 - member, 2 - responsible |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Update member role

`PATCH /api/v1/cards/{card_id}/members/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `type` | integer | 2 - responsible |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove member from card

`DELETE /api/v1/cards/{card_id}/members/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Removed user id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card time logs

#### Add time log

`POST /api/v1/cards/{card_id}/time-logs`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card time log id |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `role_id` | integer | Role id, predefined role is: -1 - Employee |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `time_spent` | integer | Minutes to log |
| `for_date` | string | Log date |
| `comment` | null \| string | Time log comment |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get time logs

`GET /api/v1/cards/{card_id}/time-logs`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card time log id |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `role_id` | integer | Role id, predefined role is: -1 - Employee |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `time_spent` | integer | Minutes to log |
| `for_date` | string | Log date |
| `comment` | null \| string | Time log comment |
| `role` | object | Role info |
| - `created` | string | Create date |
| - `updated` | string | Last update timestamp |
| - `id` | integer | Role id |
| - `name` | string | Role name |
| - `company_id` | null \| integer | Role company id |
| `user` | object | User info |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `activated` | boolean | User activated flag |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| `author` | object | Author info |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `activated` | boolean | User activated flag |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update log record

`PATCH /api/v1/cards/{card_id}/time-logs/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card time log id |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `role_id` | integer | Role id, predefined role is: -1 - Employee |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `time_spent` | integer | Minutes to log |
| `for_date` | string | Log date |
| `comment` | null \| string | Time log comment |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove time log

`DELETE /api/v1/cards/{card_id}/time-logs/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted time log id |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card checklists

#### Add checklist to card

`POST /api/v1/cards/{card_id}/checklists`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist id |
| `name` | string | Checklist name |
| `policy_id` | null \| integer | Template checklist id |
| `checklist_id` | string | Card checklist id |
| `sort_order` | number | Position |
| `deleted` | boolean | Flag indicating that checklist deleted  |
| `items` | array | Checklist items |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Card checklist item id |
| - `text` | string | Checklist item text |
| - `sort_order` | number | Position |
| - `checked` | boolean | Flag indicating that checklist item checked |
| - `checker_id` | null \| integer | User id who checked checklist item |
| - `user_id` | index | Current user id |
| - `checked_at` | null \| string | Date of check |
| - `responsible_id` | null \| integer | User id who is responsible for checklist item |
| - `deleted` | boolean | Flag indicating that checklist item deleted |
| - `due_date` | null \| string | checklist item deadline |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Retrieve card checklist

`GET /api/v1/cards/{card_id}/checklists/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist id |
| `name` | string | Checklist name |
| `policy_id` | null \| integer | Template checklist id |
| `items` | array | Checklist items |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Card checklist item id |
| - `text` | string | Checklist item text |
| - `sort_order` | number | Position |
| - `checked` | boolean | Flag indicating that checklist item checked |
| - `checker_id` | null \| integer | User id who checked checklist item |
| - `user_id` | index | Current user id |
| - `checked_at` | null \| string | Date of check |
| - `responsible_id` | null \| integer | User id who is responsible for checklist item |
| - `deleted` | boolean | Flag indicating that checklist item deleted |
| - `due_date` | null \| string | checklist item deadline |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update checklist

`PATCH /api/v1/cards/{card_id}/checklists/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist id |
| `name` | string | Checklist name |
| `policy_id` | null \| integer | Template checklist id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove checklist from card

`DELETE /api/v1/cards/{card_id}/checklists/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card checklist id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card Checklist items

#### Add item to checklist

`POST /api/v1/cards/{card_id}/checklists/{checklist_id}/items`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `checklist_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist item id |
| `text` | string | Checklist item text |
| `sort_order` | number | Position |
| `checked` | boolean | Flag indicating that checklist item checked |
| `checker_id` | null \| integer | User id who checked checklist item |
| `user_id` | index | Current user id |
| `checked_at` | null \| string | Date of check |
| `responsible_id` | null \| integer | User id who is responsible for checklist item |
| `deleted` | boolean | Flag indicating that checklist item deleted |
| `due_date` | null \| string | checklist item deadline |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update checklist item

`PATCH /api/v1/cards/{card_id}/checklists/{checklist_id}/items/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `checklist_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist item id |
| `text` | string | Checklist item text |
| `sort_order` | number | Position |
| `checked` | boolean | Flag indicating that checklist item checked |
| `checker_id` | null \| integer | User id who checked checklist item |
| `user_id` | index | Current user id |
| `checked_at` | null \| string | Date of check |
| `responsible_id` | null \| integer | User id who is responsible for checklist item |
| `deleted` | boolean | Flag indicating that checklist item deleted |
| `due_date` | null \| string | checklist item deadline |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove checklist item

`DELETE /api/v1/cards/{card_id}/checklists/{checklist_id}/items/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `checklist_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card checklist item |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card types

#### Create new card type

`POST /api/v1/card-types`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `company_id` | integer | Company id |
| `letter` | string | Card type letter |
| `name` | string | Card type name |
| `color` | integer | Color number |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card type id |
| `description_template` | null \| string | Card type escription_template |
| `properties` | null \| object | Card type properties(preset and custom). Will be removed after 31.01.2026. |
| - `id_{propertyId}` | boolean | Custom property required flag |
| - `size` | boolean | Size required flag |
| - `tags` | boolean | Tags required flag |
| - `due_date` | boolean | Due date required flag |
| - `timeline` | boolean | Timeline required flag |
| - `description` | boolean | Description required flag |
| `card_properties` | array | Array of card properties that will be suggested for filling in cards of this type |
| - `regular_property` | string \| null | Key of the regular property (size, due_date, tags, timeline, description) or null for custom property |
| - `property_uid` | string \| null | UID of the custom property or null for regular property |
| - `sort_order` | number | Order of the property in the card |
| - `required` | boolean | If true, this property will be required to fill in the card |
| `suggest_fields` | boolean | If true, cards of this type will be offered to display additional fields based on statistics |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Get list of card types

`GET /api/v1/card-types`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `company_id` | integer | Company id |
| `letter` | string | Card type letter |
| `name` | string | Card type name |
| `color` | integer | Color number |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card type id |
| `archived` | boolean | Archived flag |
| `properties` | null \| object | Card type properties(preset and custom). Will be removed after 31.01.2026. |
| - `id_{propertyId}` | boolean | Custom property required flag |
| - `size` | boolean | Size required flag |
| - `tags` | boolean | Tags required flag |
| - `due_date` | boolean | Due date required flag |
| - `timeline` | boolean | Timeline required flag |
| - `description` | boolean | Description required flag |
| `card_properties` | array | Array of card properties that will be suggested for filling in cards of this type |
| - `regular_property` | string \| null | Key of the regular property (size, due_date, tags, timeline, description) or null for custom property |
| - `property_uid` | string \| null | UID of the custom property or null for regular property |
| - `sort_order` | number | Order of the property in the card |
| - `required` | boolean | If true, this property will be required to fill in the card |
| `suggest_fields` | boolean | If true, cards of this type will be offered to display additional fields based on statistics |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Get card type

`GET /api/v1/card-types/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `company_id` | integer | Company id |
| `letter` | string | Card type letter |
| `name` | string | Card type name |
| `color` | integer | Color number |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card type id |
| `description_template` | null \| string | Card type escription_template |
| `archived` | boolean | Archived flag |
| `properties` | null \| object | Card type properties(preset and custom). Will be removed after 31.01.2026. |
| - `id_{propertyId}` | boolean | Custom property required flag |
| - `size` | boolean | Size required flag |
| - `tags` | boolean | Tags required flag |
| - `due_date` | boolean | Due date required flag |
| - `timeline` | boolean | Timeline required flag |
| - `description` | boolean | Description required flag |
| `card_properties` | array | Array of card properties that will be suggested for filling in cards of this type |
| - `regular_property` | string \| null | Key of the regular property (size, due_date, tags, timeline, description) or null for custom property |
| - `property_uid` | string \| null | UID of the custom property or null for regular property |
| - `sort_order` | number | Order of the property in the card |
| - `required` | boolean | If true, this property will be required to fill in the card |
| `suggest_fields` | boolean | If true, cards of this type will be offered to display additional fields based on statistics |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update card type

`PATCH /api/v1/card-types/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `company_id` | integer | Company id |
| `letter` | string | Card type letter |
| `name` | string | Card type name |
| `color` | integer | Color number |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card type id |
| `description_template` | null \| string | Card type escription_template |
| `properties` | null \| object | Card type properties(preset and custom). Will be removed after 31.01.2026. |
| - `id_{propertyId}` | boolean | Custom property required flag |
| - `size` | boolean | Size required flag |
| - `tags` | boolean | Tags required flag |
| - `due_date` | boolean | Due date required flag |
| - `timeline` | boolean | Timeline required flag |
| - `description` | boolean | Description required flag |
| `card_properties` | array | Array of card properties that will be suggested for filling in cards of this type |
| - `regular_property` | string \| null | Key of the regular property (size, due_date, tags, timeline, description) or null for custom property |
| - `property_uid` | string \| null | UID of the custom property or null for regular property |
| - `sort_order` | number | Order of the property in the card |
| - `required` | boolean | If true, this property will be required to fill in the card |
| `suggest_fields` | boolean | If true, cards of this type will be offered to display additional fields based on statistics |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove card type

`DELETE /api/v1/card-types/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `company_id` | integer | Company id |
| `letter` | string | Card type letter |
| `name` | string | Card type name |
| `color` | integer | Color number |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card type id |
| `description_template` | null \| string | Card type escription_template |
| `properties` | null \| object | Card type properties(preset and custom). Will be removed after 31.01.2026. |
| - `id_{propertyId}` | boolean | Custom property required flag |
| - `size` | boolean | Size required flag |
| - `tags` | boolean | Tags required flag |
| - `due_date` | boolean | Due date required flag |
| - `timeline` | boolean | Timeline required flag |
| - `description` | boolean | Description required flag |
| `card_properties` | array | Array of card properties that will be suggested for filling in cards of this type |
| - `regular_property` | string \| null | Key of the regular property (size, due_date, tags, timeline, description) or null for custom property |
| - `property_uid` | string \| null | UID of the custom property or null for regular property |
| - `sort_order` | number | Order of the property in the card |
| - `required` | boolean | If true, this property will be required to fill in the card |
| `suggest_fields` | boolean | If true, cards of this type will be offered to display additional fields based on statistics |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card files

#### Attach file to card

`PUT /api/v1/cards/{card_id}/files`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `card_cover` | boolean | Flag indicating that image used as card cover |
| `author_id` | integer | Author id |
| `card_id` | integer | Card id |
| `comment_id` | integer | Comment id |
| `deleted` | boolean | Deleted flag |
| `external` | boolean | External flag |
| `id` | integer | File id |
| `name` | string | File name |
| `size` | integer | File size |
| `sort_order` | number | Position |
| `type` | enum | 1 - attachment, 2 - googleDrive, 3 - dropBox, 4 - box, 5 -oneDrive, 6 - yandex disc, 7 - comment email, 8 - commentAttachment |
| `url` | string | Uploaded url |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found
- **503** (error) - Service Unavailable 

---

#### Update file

`PATCH /api/v1/cards/{card_id}/files/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)
- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Detach file from card

`DELETE /api/v1/cards/{card_id}/files/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Delete file id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Card allowed users

#### Retrieve users list

`GET /api/v1/cards/{card_id}/allowed-users`

Returns a list of users with access to card

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not Found

---

### Card SLA

#### Retrieve card SLA measurements

`GET /api/v1/cards/{card_id}/sla-rules-measurements`

Returns SLA rule timing metrics for card

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `calendars` | array of objects | Calendar objects used for SLA calculations (optional) |
| - `id` | string | Unique identifier of the calendar |
| - `timezone` | string | Timezone used for calculations |
| - `holidays` | array of objects | List of holidays |
| - `work_days` | array of objects | List of working days configuration |
| `rulesTimeData` | array of objects | sla rules data |
| - `rule_id` | string | Unique identifier of the SLA rule |
| - `card_id` | integer | Card id for SLA measurements |
| - `actual_time` | integer | Actual work time spent in seconds, calculated considering working hours |
| - `started` | boolean | Indicates if time tracking for this rule has started |
| - `completed` | boolean | Indicates if time tracking for this rule is completed |
| - `last_calculated_at` | string | Timestamp of the last calculation |
| - `is_last_calculated_at_work_time` | boolean | Indicates if the last calculation was during working hours |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not Found

---

### Card blocker categories

#### Add blocker category

`POST /api/v1/blockers/{blocker_id}/categories`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `blocker_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Blocker identifier |
| `name` | string | Blocker category name |
| `color` | integer | Blocker category color |

- **401** (error) - Invalid token

---

#### Retrieve list of categories

`GET /api/v1/categories`

Returns a list of blocker categories

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Blocker category identifier |
| `name` | string | Blocker category name |
| `color` | integer | Blocker category color |

- **401** (error) - Invalid token

---

#### Remove category

`DELETE /api/v1/blockers/{blocker_id}/categories/{category_uuid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `blocker_id` | integer | Yes |  |
| `category_uuid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Blocker category identifier |

- **401** (error) - Invalid token

---

### Card blocker users

#### Add user to the card blocker

`POST /api/v1/blockers/{blocker_id}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `blocker_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `uid` | string | User id in uid format |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Whether the user is virtual |
| `email_blocked` | string \| null | If blocked, email block timestamp |
| `email_blocked_reason` | null \| string | Reason of blocking |
| `delete_requested_at` | null \| string | Delete date |

- **401** (error) - Invalid token

---

#### Retrieve list of users

`GET /api/v1/blockers/{blocker_id}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `blocker_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Whether the user is virtual |
| `email_blocked` | string \| null | If blocked, email block timestamp |
| `email_blocked_reason` | null \| string | Reason of blocking |
| `delete_requested_at` | null \| string | Delete date |
| `show_tour` | boolean | Whether to show tour to user |
| `chat_enabled` | boolean | Chat enabled flag |
| `sd_telegram_id` | null \| string | Telegram ID |
| `news_subscription` | boolean | News subscription status |
| `uid` | string | User unique identifier |
| `delete_confirmation_sent_at` | null \| string | Delete confirmation sent timestamp |
| `eula_accepted_at` | null \| string | EULA acceptance timestamp |
| `terms_of_service_accepted_at` | null \| string | Terms of service acceptance timestamp |
| `privacy_policy_accepted_at` | null \| string | Privacy policy acceptance timestamp |
| `block_uid` | string | Block unique identifier |
| `user_uid` | string | User unique identifier (duplicate) |

- **401** (error) - Invalid token

---

#### Retrieve blockers cards list on current user

`GET /api/v1/users/current/blockers`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `blocked_cards` | Array of objects | Retrieve cards with blockers |
| - `card_id` | Integer | Card identifier |
| - `card_title` | String | Card title |
| - `blocked_by` | Object | Blocker information |
| - `block_reason` | string \| null | Block reason |
| - `categories` | Array of objects | Blocker categories information |
| - `block_created` | integer | When block was created |
| - `updated` | string | Last update timestamp |
| - `released` | boolean | Release information |
| `summary` | Object |  |
| - `total_blocked` | integer | Quantity of blocked cards |
| - `blocked_by_user` | string | User name |
| - `cards_without_reason` | integer | Quantity of blocked cards without reason |

- **401** (error) - Invalid token

---

#### Remove user

`DELETE /api/v1/blockers/{blocker_id}/users/{user_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `blocker_id` | integer | Yes |  |
| `user_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User identifier |

- **401** (error) - Invalid token

---

### Card service desk external recipients

#### Add new recipient

`POST /api/v1/cards/{card_id}/sd-external-recipients`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `card_id` | integer | Card id |
| `user_id` | null \| integer | Recipient id |
| `email` | string | Recipient email |
| `unsubscribed` | boolean | Is unsubscribed from service desk request |
| `updater_id` | integer | Updater id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove recipient

`DELETE /api/v1/cards/{card_id}/sd-external-recipients/{email}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `email` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `card_id` | integer | Card id |
| `user_id` | null \| integer | Recipient id |
| `email` | string | Recipient email |
| `unsubscribed` | boolean | Is unsubscribed from service desk request |
| `updater_id` | integer | Updater id |
| `company_id` | integer | Company id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

## Users & Access

### Users

#### Get users

`GET /api/v1/Users`

**Responses:**

- **200** (success)

---

#### Get user

`GET /api/v1/Users/{user_id}`

**Responses:**

- **200** (success)

---

#### Add user

`POST /api/v1/Users`

**Responses:**

- **201** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error. User with added email already has access.

---

#### Update user

`PATCH /api/v1/Users/{user_id}`

Fields available for updating - active, name.

**Responses:**

- **200** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error.

---

### Groups

#### Get groups

`GET /api/v1/Groups`

**Responses:**

- **200** (success)

---

#### Get group

`GET /api/v1/Groups/{group_id}`

**Responses:**

- **200** (success)

---

#### Add group

`POST /api/v1/Groups`

**Responses:**

- **200** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error. Group with this name exists already.

---

#### Update group

`PATCH /api/v1/Groups/{group_id}`

Fields available for updating: displayName, members.

**Responses:**

- **200** (success)
- **400** (error) - Validation error

---

### Users

#### Retrieve list of users

`GET /api/v1/users`

Get users list filtered by query parameters. The main difference between this route and https://developers.kaiten.ru/company-users/get-list-of-users is that it does not require access to the members admin section, and if there is no access, it returns only users from shared spaces. The result of the request is displayed page by page (see details in the constraints of the parameters).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `company_id` | integer | Company id |
| `user_id` | integer | User id |
| `default_space_id` | null \| integer | Default space |
| `permissions` | integer | User company permissions |
| `role` | enum | User role: 1 - owner, 2 - user, 3 - deactivated |
| `email_frequency` | enum | 1 - never, 2 – instantly |
| `email_settings` | object | Email settings |
| - `deadlines` | boolean | Daily due dates digest flag |
| - `subject_by` | enum | Subject. 1-id and title, 2-action |
| `slack_id` | null || integer | User slack id |
| `slack_settings` | null || object | Slack settings |
| `notification_settings` | null || object | Notification settings |
| - `card_add` | array | Notification enabled on card add |
| - `card_move` | array | Notification enabled on card move |
| - `card_unblock` | array | Notification enabled on card unblock |
| - `card_block_add` | array | Notification enabled on card add block |
| - `card_member_add` | array | Notification enabled on card add member |
| - `card_comment_add` | array | Notification enabled on card add comment |
| - `due_date_reminder` | array | Notification enabled on due date remind |
| - `card_member_remove` | array | Notification enabled on card remove member |
| - `card_comment_mention` | array | Notification enabled on mention in card comment |
| - `card_due_data_change` | array | Notification enabled on card due date change |
| - `card_description_change` | array | Notification enabled on card description change |
| - `card_member_become_responsible` | array | Notification enabled on card change set responsible |
| - `checklist_item_responsible_add` | array | Notification enabled on card set responsible for checklist item |
| `notification_enabled_channels` | array | List of enabled channels for notifications |
| `slack_private_channel_id` | null \| integer | User slack private channel id |
| `telegram_sd_bot_enabled` | boolean | Telegram bot enable flag |
| `invite_last_sent_at` | string | Last invite date |
| `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `external` | boolean | Is user external |
| `last_request_date` | null \| string | Date of last request |
| `last_request_method` | null \| string | Type of last request |
| `include_inactive` | boolean | Includes in the list of deactivated users |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

#### Retrieve current user

`GET /api/v1/users/current`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `company_id` | integer | Company id |
| `telegram_id` | integer | Telegram id |
| `telegram_settings` | object | Telegram settings |
| `user_id` | integer | User id |
| `default_space_id` | null \| integer | Default space |
| `permissions` | integer | User company permissions |
| `role` | enum | User role: 1 - owner, 2 - user, 3 - deactivated |
| `email_frequency` | enum | 1 - never, 2 – instantly |
| `email_settings` | object | Email settings |
| - `deadlines` | boolean | Daily due dates digest flag |
| - `subject_by` | enum | Subject. 1-id and title, 2-action |
| `slack_id` | null || integer | User slack id |
| `slack_settings` | null || object | Slack settings |
| `notification_settings` | null || object | Notification settings |
| - `card_add` | array | Notification enabled on card add |
| - `card_move` | array | Notification enabled on card move |
| - `card_unblock` | array | Notification enabled on card unblock |
| - `card_block_add` | array | Notification enabled on card add block |
| - `card_member_add` | array | Notification enabled on card add member |
| - `card_comment_add` | array | Notification enabled on card add comment |
| - `due_date_reminder` | array | Notification enabled on due date remind |
| - `card_member_remove` | array | Notification enabled on card remove member |
| - `card_comment_mention` | array | Notification enabled on mention in card comment |
| - `card_due_data_change` | array | Notification enabled on card due date change |
| - `card_description_change` | array | Notification enabled on card description change |
| - `card_member_become_responsible` | array | Notification enabled on card change set responsible |
| - `checklist_item_responsible_add` | array | Notification enabled on card set responsible for checklist item |
| `notification_enabled_channels` | array | List of enabled channels for notifications |
| `slack_private_channel_id` | null \| integer | User slack private channel id |
| `telegram_sd_bot_enabled` | boolean | Telegram bot enable flag |
| `invite_last_sent_at` | string | Last invite date |
| `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `external` | boolean | Is user external |
| `last_request_date` | null \| string | Date of last request |
| `last_request_method` | null \| string | Type of last request |
| `has_password` | boolean | Has user password flag |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update user

`PATCH /api/v1/users/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `activated` | boolean | User activated flag |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `sd_telegram_id` | integer | Service desk telegram id |
| `timezone` | string | Time zone |
| `news_subscription` | boolean | news subscription flag |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `default_space_id` | null \| integer | Default space |
| `email_frequency` | enum | 1 - never, 2 – instantly |
| `email_settings` | object | Email settings |
| - `deadlines` | boolean | Daily due dates digest flag |
| - `subject_by` | enum | Subject. 1-id and title, 2-action |
| `work_time_settings` | object | Work time settings |
| - `work_days` | array | Work days |
| - `hours_count` | integer | Work time hours count |
| `telegram_id` | integer | Telegram id |
| `telegram_settings` | object | Telegram settings |
| `has_password` | boolean | Has user password flag |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

### Group users `BETA`

#### Add user to group

`POST /api/v1/groups/{group_uid}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get list of group users

`GET /api/v1/groups/{group_uid}/users`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |
| `delete_confirmation_sent_at` | null \| string | Timestamp of sending confirmation of deletion |
| `sd_telegram_id` | integer | Service desk telegram id |
| `news_subscription` | boolean | news subscription flag |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Remove user from group

`DELETE /api/v1/groups/{group_uid}/users/{user_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |
| `user_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbiden
- **404** (error) - Not found

---

### Group admins `BETA`

#### Add admin to group

`POST /api/v1/groups/{group_uid}/admins`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get list of group admins

`GET /api/v1/groups/{group_uid}/admins`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |
| `delete_confirmation_sent_at` | null \| string | Timestamp of sending confirmation of deletion |
| `sd_telegram_id` | integer | Service desk telegram id |
| `news_subscription` | boolean | news subscription flag |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Remove admin from group

`DELETE /api/v1/groups/{group_uid}/admins/{user_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |
| `user_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | User id |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar |
| `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbiden
- **404** (error) - Not found

---

### User Roles

#### Create user role

`POST /api/v1/user-roles`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Role name |
| `company_id` | integer | Company Id |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Role id |
| `uid` | string | Role uid |

- **400** (error) - Validation error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

#### Get list of user roles

`GET /api/v1/user-roles`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Role name |
| `company_id` | integer | Company Id |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Role id |
| `uid` | string | Role uid |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

#### Get user role

`GET /api/v1/user-roles/{role_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `role_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Role name |
| `company_id` | integer | Company Id |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Role id |
| `uid` | string | Role uid |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update user role

`PATCH /api/v1/user-roles/{role_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `role_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Role name |
| `company_id` | integer | Company Id |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Role id |
| `uid` | string | Role uid |

- **400** (error) - Validation error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Remove user role

`DELETE /api/v1/user-roles/{role_id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `role_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Role name |
| `company_id` | integer | Company Id |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Role id |
| `uid` | string | Role uid |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

### Company users

#### Get list of users

`GET /api/v1/company/users`

Get Company Users list filtered by query parameters. To use this route you need access to the Administrative section "Members"


**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Id |
| `uid` | string | Uid |
| `full_name` | string | User full name |
| `email` | string | User email |
| `avatar_initials_url` | string | Default user avatar url |
| `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | null \| string | Email blocked timestamp |
| `email_blocked_reason` | null \| string | Email blocked reason |
| `delete_requested_at` | null \| string | Timestamp of delete request |
| `permissions` | integer | User company permissions(with inherited permissions through groups) |
| `own_permissions` | integer | User personal company permissions |
| `user_id` | integer | User id |
| `company_id` | integer | Company id |
| `default_space_id` | null \| integer | Default space |
| `role` | enum | User role: 1 - owner, 2 - user, 3 - deactivated |
| `email_frequency` | enum | 1 - never, 2 – instantly |
| `email_settings` | object | Email settings |
| - `deadlines` | boolean | Daily due dates digest flag |
| - `subject_by` | enum | Subject. 1-id and title, 2-action |
| `slack_id` | null || integer | User slack id |
| `slack_settings` | null || object | Slack settings |
| `notification_settings` | object | Notification settings |
| - `card_add` | array | Notification enabled on card add |
| - `card_move` | array | Notification enabled on card move |
| - `card_unblock` | array | Notification enabled on card unblock |
| - `card_block_add` | array | Notification enabled on card add block |
| - `card_member_add` | array | Notification enabled on card add member |
| - `card_comment_add` | array | Notification enabled on card add comment |
| - `due_date_reminder` | array | Notification enabled on due date remind |
| - `card_member_remove` | array | Notification enabled on card remove member |
| - `card_comment_mention` | array | Notification enabled on mention in card comment |
| - `card_due_data_change` | array | Notification enabled on card due date change |
| - `card_description_change` | array | Notification enabled on card description change |
| - `card_member_become_responsible` | array | Notification enabled on card change set responsible |
| - `checklist_item_responsible_add` | array | Notification enabled on card set responsible for checklist item |
| `notification_enabled_channels` | array | List of enabled channels for notifications |
| `slack_private_channel_id` | null \| integer | User slack private channel id |
| `telegram_sd_bot_enabled` | boolean | Telegram bot enable flag |
| `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `invite_last_sent_at` | string | Last invite date |
| `external` | boolean | Is user external |
| `last_request_date` | null \| string | Date of last request |
| `last_request_method` | null \| string | Type of last request |
| `work_time_settings` | object | Work time settings |
| - `work_days` | array | Work days |
| - `hours_count` | integer | Work time hours count |
| `personal_settings` | object | Personal settings |
| - `current_card_view_id` | string | current card view uid |
| `locked` | boolean | Is user locked for update |
| `take_licence` | boolean | Flag indicating whether the user holds the company's license |
| `spaces` | array of objects | Spaces where the user is invited |
| - `id` | integer | Space id |
| - `uid` | string | Space uid |
| - `title` | string | Space title |
| - `external_id` | null \| string | External id |
| - `company_id` | integer | Company id |
| - `path` | string | Inner path to entity |
| - `sort_order` | number | Space sort order |
| - `parent_entity_uid` | null \| string | Parent entity uid |
| - `archived` | boolean | Space archived flag |
| - `access` | string | Space access |
| - `for_everyone_access_role_id` | string | Role id for everyone access |
| - `entity_uid` | string | Entity uid |
| - `user_id` | integer | User id |
| - `access_mod` | string | User Access modifier |
| - `role` | string | User Space Role: 1- commentator, 2 -writer, 3-admin |
| `groups` | object | User groups |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Group id |
| - `uid` | string | Group uid |
| - `name` | string | Group name |
| - `permissions` | integer | Group permissions |
| - `company_id` | integer | Company id |
| - `add_to_cards_and_spaces_enabled` | boolean | Should add cards and spaces |
| - `user_id` | integer | User id |
| - `group_id` | integer | group id |
| - `spaces` | array of objects | Group spaces |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update user

`PATCH /api/v1/company/users/{id}`

To use this route you need access to the Administrative section "Members"

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Id |
| `uid` | string | Uid |
| `full_name` | string | User full name |
| `email` | string | User email |
| `username` | string | Username for mentions and login |
| `avatar_initials_url` | string | Default user avatar url |
| `avatar_uploaded_url` | string \| null | User uploaded avatar url |
| `initials` | string | User initials |
| `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| `lng` | string | Language |
| `timezone` | string | Time zone |
| `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `activated` | boolean | User activated flag |
| `ui_version` | enum | 1 - old ui. 2 - new ui |
| `virtual` | boolean | Is user virtual |
| `email_blocked` | string | Email blocked timestamp |
| `email_blocked_reason` | string | Email blocked reason |
| `delete_requested_at` | string | Timestamp of delete request |
| `user_id` | integer | User id |
| `company_id` | integer | Company id |
| `default_space_id` | null \| integer | Default space |
| `role` | enum | User role: 1 - owner, 2 - user, 3 - deactivated |
| `permissions` | integer | User company permissions |
| `apps_permissions` | string | 0 - no access, 1 - full access (service desk denied), 2 - guest access (service desk denied), 4 - service desk only, 5 - full access + service desk, 6 - guest access + service desk |
| `email_frequency` | enum | 1 - never, 2 – instantly |
| `email_settings` | object | Email settings |
| - `deadlines` | boolean | Daily due dates digest flag |
| - `subject_by` | enum | Subject. 1-id and title, 2-action |
| `slack_id` | null || integer | User slack id |
| `slack_settings` | null || object | Slack settings |
| `slack_private_channel_id` | null \| integer | User slack private channel id |
| `telegram_sd_bot_enabled` | boolean | Telegram bot enable flag |
| `external` | boolean | Is user external |
| `notification_settings` | object | Notification settings |
| - `card_add` | array | Notification enabled on card add |
| - `card_move` | array | Notification enabled on card move |
| - `card_unblock` | array | Notification enabled on card unblock |
| - `card_block_add` | array | Notification enabled on card add block |
| - `card_member_add` | array | Notification enabled on card add member |
| - `card_comment_add` | array | Notification enabled on card add comment |
| - `due_date_reminder` | array | Notification enabled on due date remind |
| - `card_member_remove` | array | Notification enabled on card remove member |
| - `card_comment_mention` | array | Notification enabled on mention in card comment |
| - `card_due_data_change` | array | Notification enabled on card due date change |
| - `card_description_change` | array | Notification enabled on card description change |
| - `card_member_become_responsible` | array | Notification enabled on card change set responsible |
| - `checklist_item_responsible_add` | array | Notification enabled on card set responsible for checklist item |
| `work_time_settings` | object | Work time settings |
| - `work_days` | array | Work days |
| - `hours_count` | integer | Work time hours count |
| `invite_last_sent_at` | string | Last invite date |
| `last_request_date` | null \| string | Date of last request |
| `last_request_method` | null \| string | Type of last request |
| `notification_enabled_channels` | array | List of enabled channels for notifications |
| `personal_settings` | object | Personal settings |
| - `current_card_view_id` | string | current card view uid |
| `locked` | boolean | Is user locked for update |
| `temporarily_inactive` | boolean | Temporarily inactive: user is still in company, but can't sign in and doesn't need a license |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove virtual user

`DELETE /api/v1/company/users/{id}`

To use this route you need access to the Administrative section "Resource planning"

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted user id |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Groups `BETA`

#### Create group

`POST /api/v1/company/groups`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Group name |
| `permissions` | integer | Group permissions |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Group id |
| `uid` | string | Group uid |
| `add_to_cards_and_spaces_enabled` | boolean | Ability to add all users of the group to cards, placed in group spaces. Ability to filter logs by group in «Timesheets» |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of groups

`GET /api/v1/company/groups`

Get groups list filtered by query params. The result of the request is displayed page by page if limit or offset presented and with_tree_entities is false (see details in the constraints of the parameters).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Group name |
| `permissions` | integer | Group permissions |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Group id |
| `uid` | string | Group uid |
| `add_to_cards_and_spaces_enabled` | boolean | Ability to add all users of the group to cards, placed in group spaces. Ability to filter logs by group in «Timesheets» |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get group

`GET /api/v1/company/groups/{uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Group name |
| `permissions` | integer | Group permissions |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Group id |
| `uid` | string | Group uid |
| `add_to_cards_and_spaces_enabled` | boolean | Ability to add all users of the group to cards, placed in group spaces. Ability to filter logs by group in «Timesheets» |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update group

`PATCH /api/v1/company/groups/{uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Group name |
| `permissions` | integer | Group permissions |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Group id |
| `uid` | string | Group uid |
| `add_to_cards_and_spaces_enabled` | boolean | Ability to add all users of the group to cards, placed in group spaces. Ability to filter logs by group in «Timesheets» |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove Group

`DELETE /api/v1/company/groups/{uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Group name |
| `permissions` | integer | Group permissions |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Group id |
| `uid` | string | Group uid |
| `add_to_cards_and_spaces_enabled` | boolean | Ability to add all users of the group to cards, placed in group spaces. Ability to filter logs by group in «Timesheets» |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Group Entities `BETA`

#### Add entity

`POST /api/v1/company/groups/{group_uid}/entities`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `group_id` | integer | Group id |
| `entity_uid` | string | Entity uid |
| `access_mod` | string \| null | Access modifier with inheritable access modifiers |
| `own_access_mod` | string| null | Own access modifier |
| `role_ids` | array of strings | Entity roles ids with inherited roles |
| `own_role_ids` | array of strings | Entity role ids |
| `role_permissions` | object |  Group entity permissions |
| - `root` | object | Permissions for menu root |
| - `space` | object | Permissions for space |
| - `document` | object | Permissions for documents |
| - `document_group` | object | Permissions for folders |
| - `story_map` | object | Permissions for story maps |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of group entities

`GET /api/v1/company/groups/{group_uid}/entities`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Entity uid |
| `path` | string | Inner path to entity |
| `title` | string | Entity title |
| `own_role_ids` | array of strings | Entity roles ids |
| `entity_type` | string | Entity type.
"space" - Space,
"document" - Document
"document_group" - Folder
"story_map" - Story map |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update group entity

`PATCH /api/v1/company/groups/{group_uid}/entities/{uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |
| `uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `group_id` | integer | Group id |
| `entity_uid` | string | Entity uid |
| `access_mod` | string \| null | Access modifier with inheritable access modifiers |
| `own_access_mod` | string| null | Own access modifier |
| `role_ids` | array of strings | Entity roles ids with inherited roles |
| `own_role_ids` | array of strings | Entity roles ids |
| `role_permissions` | object |  Group entity permissions |
| - `root` | object | Permissions for menu root |
| - `space` | object | Permissions for space |
| - `document` | object | Permissions for documents |
| - `document_group` | object | Permissions for folders |
| - `story_map` | object | Permissions for story maps |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove entity

`DELETE /api/v1/company/groups/{group_uid}/entities/{uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `group_uid` | string | Yes |  |
| `uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `group_id` | integer | Group id |
| `entity_uid` | string | Entity uid |
| `access_mod` | string \| null | Access modifier with inheritable access modifiers |
| `own_access_mod` | string| null | Own access modifier |
| `role_ids` | array of strings | Entity roles ids with inherited roles |
| `own_role_ids` | array of strings| null | Entity roles ids |
| `role_permissions` | null | Group entity permissions |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Tree entity roles `BETA`

#### Get list of tree entity roles

`GET /api/v1/tree-entity-roles`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | string | Role uid |
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `name` | string | Role name |
| `sort_order` | number | Role sort order |
| `new_permissions_default_value` | boolean | When changing the permissions structure, grant rights to new actions by default |
| `role_permissions` | object |  Group entity permissions |
| - `root` | object | Permissions for menu root |
| - `space` | object | Permissions for space |
| - `document` | object | Permissions for documents |
| - `document_group` | object | Permissions for folders |
| - `story_map` | object | Permissions for story maps |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

## Custom Properties

### Custom properties

#### Create new property

`POST /api/v1/company/custom-properties`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Custom property name |
| `type` | string | Custom property type |
| `show_on_facade` | string | Should show property on card's facade |
| `multiline` | string | Should render multiline text field |
| `fields_settings` | null \| object | Field settings for catalog type |
| - `{custom_properties_catalog_fiels_uid}` | object | Field settings |
| `author_id` | integer | Author_id |
| `company_id` | integer | Company_id |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Custom property id |
| `condition` | string | Custom property condition |
| `colorful` | boolean | Used for select properties. Determines should select color when creating new select value. |
| `multi_select` | boolean | Used for select properties. Determines is select property used as multi select |
| `values_creatable_by_users` | boolean | Used for select properties. Determines if users with writer role are able to create new select property values. |
| `data` | null \| object | Additional custom property data |
| `values_type` | null \| string | Type of values |
| `vote_variant` | null \| string | Type of vote or collective vote custom properties |
| `protected` | boolean | Protected flag |
| `color` | null \| integer | Color of catalog custom property |
| `external_id` | null \| string | External id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden

---

#### Get list of properties

`GET /api/v1/company/custom-properties`

Get custom property list. The result of the request is displayed page by page if limit and offset presented.

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Custom property name |
| `type` | string | Custom property type |
| `show_on_facade` | string | Should show property on card's facade |
| `multiline` | string | Should render multiline text field |
| `fields_settings` | null \| object | Field settings for catalog type |
| - `{custom_properties_catalog_fiels_uid}` | object | Field settings |
| `author_id` | integer | Author_id |
| `company_id` | integer | Company_id |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Custom property id |
| `condition` | string | Custom property condition |
| `colorful` | boolean | Used for select properties. Determines should select color when creating new select value. |
| `multi_select` | boolean | Used for select properties. Determines is select property used as multi select |
| `values_creatable_by_users` | boolean | Used for select properties. Determines if users with writer role are able to create new select property values. |
| `data` | null \| object | Additional custom property data |
| `values_type` | null \| string | Type of values |
| `vote_variant` | null \| string | Type of vote or collective vote custom properties |
| `protected` | boolean | Protected flag |
| `color` | null \| integer | Color of catalog custom property |
| `external_id` | null \| string | External id |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

#### Get property

`GET /api/v1/company/custom-properties/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Custom property name |
| `type` | string | Custom property type |
| `show_on_facade` | string | Should show property on card's facade |
| `multiline` | string | Should render multiline text field |
| `fields_settings` | null \| object | Field settings for catalog type |
| - `{custom_properties_catalog_fiels_uid}` | object | Field settings |
| `author_id` | integer | Author_id |
| `company_id` | integer | Company_id |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Custom property id |
| `condition` | string | Custom property condition |
| `colorful` | boolean | Used for select properties. Determines should select color when creating new select value. |
| `multi_select` | boolean | Used for select properties. Determines is select property used as multi select |
| `values_creatable_by_users` | boolean | Used for select properties. Determines if users with writer role are able to create new select property values. |
| `data` | null \| object | Additional custom property data |
| `values_type` | null \| string | Type of values |
| `vote_variant` | null \| string | Type of vote or collective vote custom properties |
| `protected` | boolean | Protected flag |
| `color` | null \| integer | Color of catalog custom property |
| `external_id` | null \| string | External id |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update property

`PATCH /api/v1/company/custom-properties/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Custom property name |
| `type` | string | Custom property type |
| `show_on_facade` | string | Should show property on card's facade |
| `multiline` | string | Should render multiline text field |
| `fields_settings` | null \| object | Field settings for catalog type |
| - `{custom_properties_catalog_fiels_uid}` | object | Field settings |
| `author_id` | integer | Author_id |
| `company_id` | integer | Company_id |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Custom property id |
| `condition` | string | Custom property condition |
| `colorful` | boolean | Used for select properties. Determines should select color when creating new select value. |
| `multi_select` | boolean | Used for select properties. Determines is select property used as multi select |
| `values_creatable_by_users` | boolean | Used for select properties. Determines if users with writer role are able to create new select property values. |
| `data` | null \| object | Additional custom property data |
| `values_type` | null \| string | Type of values |
| `vote_variant` | null \| string | Type of vote or collective vote custom properties |
| `protected` | boolean | Protected flag |
| `color` | null \| integer | Color of catalog custom property |
| `external_id` | null \| string | External id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove property

`DELETE /api/v1/company/custom-properties/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string | Custom property name |
| `type` | string | Custom property type |
| `show_on_facade` | string | Should show property on card's facade |
| `multiline` | string | Should render multiline text field |
| `fields_settings` | null \| object | Field settings for catalog type |
| - `{custom_properties_catalog_fiels_uid}` | object | Field settings |
| `author_id` | integer | Author_id |
| `company_id` | integer | Company_id |
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Custom property id |
| `condition` | string | Custom property condition |
| `colorful` | boolean | Used for select properties. Determines should select color when creating new select value. |
| `multi_select` | boolean | Used for select properties. Determines is select property used as multi select |
| `values_creatable_by_users` | boolean | Used for select properties. Determines if users with writer role are able to create new select property values. |
| `data` | null \| object | Additional custom property data |
| `values_type` | null \| string | Type of values |
| `vote_variant` | null \| string | Type of vote or collective vote custom properties |
| `protected` | boolean | Protected flag |
| `color` | null \| integer | Color of catalog custom property |
| `external_id` | null \| string | External id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Custom property select values

#### Create new select value

`POST /api/v1/company/custom-properties/{property_id}/select-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Select option id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Select option value |
| `color` | integer | Color number |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `condition` | enum | Custom property select value condition |
| `sort_order` | number | Position |
| `external_id` | null \| string | External id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |


---

#### Get list of select values

`GET /api/v1/company/custom-properties/{property_id}/select-values`

Get custom property select values list. The result of the request is displayed page by page if v2_select_search is true (see details in the constraints of the parameters).

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Select option id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Select option value |
| `color` | integer | Color number |
| `condition` | string | Custom property select value condition |
| `sort_order` | number | Position |
| `external_id` | null \| string | External id |
| `updated` | string | Last update timestamp |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |


---

#### Get select value

`GET /api/v1/company/custom-properties/{property_id}/select-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Select option id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Select option value |
| `color` | integer | Color number |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `condition` | string | Custom property select value condition |
| `sort_order` | number | Position |
| `external_id` | null \| string | External id |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |


---

#### Update select value

`PATCH /api/v1/company/custom-properties/{property_id}/select-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Select option id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Select option value |
| `color` | integer | Color number |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `condition` | string | Custom property select value condition |
| `sort_order` | number | Position |
| `external_id` | null \| string | External id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |


---

#### Remove property

`DELETE /api/v1/company/custom-properties/{property_id}/select-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Create date |
| `updated` | string | Last update timestamp |
| `id` | integer | Select option id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Select option value |
| `color` | integer | Color number |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `sort_order` | number | Position |
| `external_id` | null \| string | External id |
| `condition` | string | Custom property select value condition |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Custom property catalog values

#### Create new catalog value

`POST /api/v1/company/custom-properties/{property_id}/catalog-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Catalog option id |
| `custom_property_id` | integer | Custom property id |
| `value` | object | Custom property catalog value |
| - `{custom_property_catalog_value_field_uid}` | string | Catalog value. Example: "78a2a419-059e-482c-9d30-fe8b94c7ef6a": "1"  |
| `name` | string | Custom property catalog value name |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `condition` | string | Custom property catalog value condition |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **404** (error) - Not found

---

#### Get list of catalog values

`GET /api/v1/company/custom-properties/{property_id}/catalog-values`

Get list of custom property catalog values. The result of the request is displayed page by page if limit presented.

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Catalog option id |
| `custom_property_id` | integer | Custom property id |
| `value` | object | Custom property catalog value |
| - `{custom_property_catalog_value_field_uid}` | string | Catalog value. Example: "78a2a419-059e-482c-9d30-fe8b94c7ef6a": "1"  |
| `name` | string | Custom property catalog value name |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `condition` | string | Custom property catalog value condition |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Get catalog value

`GET /api/v1/company/custom-properties/{property_id}/catalog-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Catalog option id |
| `custom_property_id` | integer | Custom property id |
| `value` | object | Custom property catalog value |
| - `{custom_property_catalog_value_field_uid}` | string | Catalog value. Example: "78a2a419-059e-482c-9d30-fe8b94c7ef6a": "1"  |
| `name` | string | Custom property catalog value name |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `condition` | string | Custom property catalog value condition |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update catalog value

`PATCH /api/v1/company/custom-properties/{property_id}/catalog-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Catalog option id |
| `custom_property_id` | integer | Custom property id |
| `value` | object | Custom property catalog value |
| - `{custom_property_catalog_value_field_uid}` | string | Catalog value. Example: "78a2a419-059e-482c-9d30-fe8b94c7ef6a": "1"  |
| `name` | string | Custom property catalog value name |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `condition` | string | Custom property catalog value condition |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove property

`DELETE /api/v1/company/custom-properties/{property_id}/catalog-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Catalog option id |
| `custom_property_id` | integer | Custom property id |
| `value` | object | Custom property catalog value |
| - `{custom_property_catalog_value_field_uid}` | string | Catalog value. Example: "78a2a419-059e-482c-9d30-fe8b94c7ef6a": "1"  |
| `name` | string | Custom property catalog value name |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `condition` | string | Custom property catalog value condition |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Custom property collective score values

#### Create new score value

`POST /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Collective score id |
| `value` | string | Collective score value |
| `custom_property_id` | integer | Custom property id |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `company_id` | integer | Company id |
| `card_id` | integer | Card id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Get list of score values

`GET /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Collective score id |
| `custom_property_id` | integer | Custom property id |
| `value` | string | Collective score value |
| `card_id` | integer | Card id |
| `author_id` | integer | Author id |
| `author` | object | Author info |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update score value

`PATCH /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-score-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Collective score id |
| `value` | string | Collective score value |
| `custom_property_id` | integer | Custom property id |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `company_id` | integer | Company id |
| `card_id` | integer | Card id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **402** (error) - feature is not supported by tariff

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Custom property collective vote values

#### Create new vote value

`POST /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Collective score id |
| `number_vote` | integer | Value of card collective vote of type scale or rating |
| `emoji_vote` | string | Value of card collective vote of type emoji_setg |
| `custom_property_id` | integer | Custom property id |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `card_id` | integer | Card id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **404** (error) - Not found

---

#### Get list of vote values

`GET /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Collective score id |
| `custom_property_id` | integer | Custom property id |
| `number_vote` | integer | Value of card collective vote of type scale or rating |
| `emoji_vote` | string | Value of card collective vote of type emoji_setg |
| `card_id` | integer | Card id |
| `author_id` | integer | Author id |
| `author` | object | Author info |

- **401** (error) - Invalid token
- **403** (error) - Forbiden
- **404** (error) - Not found

---

#### Update vote value

`PATCH /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Collective score id |
| `number_vote` | integer | Value of card collective vote of type scale or rating |
| `emoji_vote` | string | Value of card collective vote of type emoji_setg |
| `custom_property_id` | integer | Custom property id |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `card_id` | integer | Card id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **404** (error) - Not found

---

#### Remove vote value

`DELETE /api/v1/cards/{card_id}/custom-properties/{property_id}/collective-vote-values/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `card_id` | integer | Yes |  |
| `property_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Collective score id |
| `number_vote` | integer | Value of card collective vote of type scale or rating |
| `emoji_vote` | string | Value of card collective vote of type emoji_setg |
| `custom_property_id` | integer | Custom property id |
| `author_id` | integer | Author id |
| `company_id` | integer | Company id |
| `card_id` | integer | Card id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

## Time Tracking

### Timesheet

#### Get list

`GET /api/v1/time-logs`

Get time logs list filtered by query parameters. The result of the request is displayed page by page (see details in the constraints of the parameters)

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card time log id |
| `card_id` | integer | Card id |
| `user_id` | integer | User id |
| `role_id` | integer | Role id, predefined role is: -1 - Employee |
| `author_id` | integer | Author id |
| `updater_id` | integer | Last updater id |
| `time_spent` | integer | Minutes to log |
| `for_date` | string | Log date |
| `comment` | null \| string | Time log comment |
| `role` | object | Company user role info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `id` | integer | Role id |
| - `name` | string | Role name |
| - `company_id` | null \| integer | Company id |
| `user` | object | User info |
| - `id` | integer | User id |
| - `full_name` | string | User full name |
| - `email` | string | User email |
| - `username` | string | Username for mentions and login |
| - `avatar_initials_url` | string | Default user avatar |
| - `avatar_uploaded_url` | null \| string | User uploaded avatar url |
| - `initials` | string | User initials |
| - `avatar_type` | enum | 1 – gravatar, 2 – initials, 3 - uploaded |
| - `lng` | string | Language |
| - `timezone` | string | Time zone |
| - `theme` | enum | light - light color theme, dark - dark color theme, auto - color theme based on OS settings |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `activated` | boolean | User activated flag |
| - `ui_version` | enum | 1 - old ui. 2 - new ui |
| `card` | object | Card info |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

### Sprints

#### Get sprint summary

`GET /api/v1/sprints/{id}`

Returns a detailed summary of a sprint, including cards, their relationships, paths, updates, and custom properties. Requires user to have access to relevant space.

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `created` | string | Sprint creation timestamp |
| `updated` | string | Sprint last update timestamp |
| `archived` | boolean | Sprint archived flag |
| `id` | integer | Sprint ID |
| `uid` | string | Sprint UID |
| `board_id` | integer | Board ID the sprint belongs to |
| `title` | string | Sprint title |
| `goal` | string | Sprint goal |
| `active` | boolean | Sprint active status |
| `committed` | integer | Number of committed cards |
| `children_committed` | integer | Number of committed child cards |
| `velocity` | number | Sprint velocity |
| `velocity_details` | object | Velocity by members |
| - `by_members` | array |  |
| `children_velocity` | number | Velocity of child cards |
| `children_velocity_details` | object |  |
| - `by_members` | array |  |
| `creator_id` | integer |  |
| `updater_id` | integer |  |
| `start_date` | string |  |
| `finish_date` | string |  |
| `actual_finish_date` | string |  |
| `cards` | array of objects | List of cards in the sprint |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `archived` | boolean | Card archived flag |
| - `id` | integer | Card id |
| - `title` | string | Card title |
| - `asap` | boolean | Card asap flag |
| - `due_date` | null \| string | Card deadline |
| - `sort_order` | number | Position |
| - `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| - `state` | enum | 1-queued, 2-inProgresss, 3-done |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| - `parents_count` | integer | Card parents count |
| - `children_count` | integer | Card children count |
| - `children_done` | integer | Card children done count |
| - `has_blocked_children` | boolean | Flag indicating that card has blocked children |
| - `goals_total` | integer | Card goals count |
| - `goals_done` | integer | Number of card done goals |
| - `time_spent_sum` | integer | Amount of time spent(in minutes) |
| - `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| - `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| - `calculated_planned_start` | null \| string | Calculated planned start |
| - `calculated_planned_end` | null \| string | Calculated planned end |
| - `blocking_card` | boolean | Is card blocking another card |
| - `blocked` | boolean | Is card blocked |
| - `size` | null \| number | Numerical part of size |
| - `size_unit` | null \| string | Text part of size |
| - `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| - `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| - `board_id` | integer | Board id |
| - `column_id` | integer | Column id |
| - `lane_id` | integer | Lane id |
| - `owner_id` | integer | Card owner id |
| - `type_id` | integer | Card type id |
| - `version` | integer | Card version |
| - `updater_id` | integer | User id who last updated card |
| - `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| - `completed_at` | null \| string | Date when card moved to done type column |
| - `last_moved_at` | null \| string | Date when card last moved |
| - `lane_changed_at` | null \| string | Date when card changed lane |
| - `column_changed_at` | null \| string | Date when card changed column |
| - `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| - `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| - `sprint_id` | integer | Sprint id |
| - `external_id` | null \| string | External id |
| - `comments_total` | integer | Total card comments |
| - `comment_last_added_at` | null \| string | Date when last comment added |
| - `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| - `planned_start` | null \| string | Card timeline planned start |
| - `planned_end` | null \| string | Card timeline planned end |
| - `service_id` | integer | Service id |
| - `sd_new_comment` | boolean | Has unseen service desk request author comments |
| - `public` | boolean | Is card public |
| - `share_settings` | null \| object | Public share settings |
| - `share_id` | null \| string | Public share id |
| - `external_user_emails` | null \| string | External users emails |
| - `description_filled` | boolean | Flag indicating that card has description |
| - `estimate_workload` | number | Estimate_workload |
| - `owner` | object | Card owner info |
| - - `id` | integer | User id |
| - - `uid` | string | User uid |
| - - `full_name` | string | User full name |
| - - `email` | string | User email |
| - - `username` | string | Username |
| - - `avatar_initials_url` | string | Default user avatar |
| - - `avatar_uploaded_url` | null \| string | Uploaded avatar url |
| - - `initials` | string | User initials |
| - - `avatar_type` | enum | 1 - gravatar, 2 - initials, 3 - uploaded |
| - - `lng` | string | Language |
| - - `timezone` | string | Time zone |
| - - `theme` | enum | light, dark, auto |
| - - `created` | string | Create date |
| - - `updated` | string | Last update timestamp |
| - - `activated` | boolean | User activated flag |
| - - `ui_version` | enum | 1 - old ui, 2 - new ui |
| - - `virtual` | boolean | Is user virtual |
| - - `email_blocked` | null \| string | Email blocked status |
| - - `email_blocked_reason` | null \| string | Email blocked reason |
| - - `delete_requested_at` | null \| string | Delete request date |
| - `type` | object | Card type info |
| - - `id` | integer | Card type id |
| - - `uid` | string | Card type uid |
| - - `name` | string | Card type name |
| - - `color` | integer | Color number |
| - - `letter` | string | Card type letter |
| - - `company_id` | null \| integer | Company id |
| - - `archived` | boolean | Archived flag |
| - - `properties` | null \| object | Card type properties |
| - - `suggest_fields` | boolean | Suggest fields flag |
| - - `author_uid` | null \| string | Author uid |
| - - `description_template` | null \| string | Description template |
| - `source` | enum | null \| app, api, email, telegram, slack, webhook, import, schedule, automation |
| `cardUpdates` | array of objects | Card versions and states over time |
| - `id` | integer |  |
| - `sprint_id` | integer |  |
| - `created` | string |  |
| - `updated` | string |  |
| - `size` | number \| null |  |
| - `size_unit` | string \| null |  |
| - `size_text` | string \| null |  |
| - `properties` | object \| null |  |
| - `tag_ids` | array \| null |  |
| - `description` | string \| null |  |
| - `board_id` | integer |  |
| - `column_id` | integer |  |
| - `lane_id` | integer |  |
| - `condition` | integer |  |
| - `state` | integer |  |
| - `archived` | boolean |  |
| - `version` | integer |  |
| `customProperties` | array of objects | List of custom properties used in sprint cards |

- **401** (error) - Invalid token
- **403** (error) - User does not have access to view this sprint
- **404** (error) - Sprint not found

---

#### Get sprints list

`GET /api/v1/sprints`

Returns a list of sprints for the company. The result of the request is displayed page by page (see details in the constraints of the parameters). Supports filtering by active status. Requires user to have access to company entities tree (companyPermissions.entitiesTree).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Sprint ID |
| `uid` | string | Sprint UID |
| `board_id` | integer | Board ID the sprint belongs to |
| `title` | string | Sprint title |
| `goal` | string | Sprint goal |
| `active` | boolean | Sprint active status |
| `committed` | integer | Number of committed cards |
| `children_committed` | integer | Number of committed child cards |
| `velocity` | number | Sprint velocity |
| `velocity_details` | object | Velocity by members |
| - `by_members` | array |  |
| `children_velocity` | number | Velocity of child cards |
| `children_velocity_details` | object | Velocity details of child cards |
| - `by_members` | array |  |
| `creator_id` | integer | User ID who created the sprint |
| `updater_id` | integer | User ID who last updated the sprint |
| `start_date` | string | Sprint start date |
| `finish_date` | string | Sprint planned finish date |
| `actual_finish_date` | string \| null | Sprint actual finish date |
| `created` | string | Sprint creation timestamp |
| `updated` | string | Sprint last update timestamp |
| `archived` | boolean | Sprint archived flag |

- **401** (error) - Invalid token
- **403** (error) - User does not have access to company entities tree

---

## Service Desk

### Service desk services

#### Retrieve services list

`GET /api/v1/service-desk/services`

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Service id |
| `name` | string | Service name |
| `fields_settings` | null \| object | Service fields |
| - `commentDescription` | object | Comment setting |
| - `size` | object | Size field setting |
| - `dueDate` | object | Due date Comment setting |
| - `id_{custom_property_id}` | object | Custpom property field setting |
| `archived` | boolean | Archived flag |
| `lng` | string | Language |
| `email_settings` | integer | Bitmap of email settings |
| `type_id` | null \| integer | Request (card) type ID |
| `email_key` | integer | Email key |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `display_status` | string | Request's status display type |
| `template_description` | string | Template request description |
| `settings` | object | Service settings |
| - `allowed_email_masks` | array | Allowed email masks |
| `allow_to_add_external_recipients` | boolean | Allow to add external recipients |
| `column` | object | Column info |
| - `id` | integer | Column id |
| - `title` | string | Column title |
| - `sort_order` | number | Position |
| - `col_count` | integer | Width |
| - `type` | enum | 1 - queue, 2 – in progress, 3 – done |
| - `board_id` | integer | Board id |
| - `column_id` | null | Parent column id |
| - `external_id` | null \| string | External id |
| - `rules` | integer | Bit mask for column rules. Rules: 1 - checklists must be checked, 2 - display FIFO order |
| `board` | object | Board info |
| - `id` | integer | Board id |
| - `title` | string | Board title |
| - `external_id` | null \| string | External id |
| - `card_properties` | null \| array of objects | Properties of the board cards suggested for filling  |
| `lane` | object | Lane info |
| - `id` | integer | Lane id |
| - `title` | string | Lane title |
| - `sort_order` | number | Position |
| - `board_id` | integer | Board id |
| - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - `external_id` | null \| string | External id |
| `voteCustomProperty` | object | Vote custom property info |
| - `updated` | string | Last update timestamp |
| - `created` | string | Create date |
| - `service_id` | integer | Service id |
| - `custom_property_id` | integer | Custom property id |
| - `author_id` | integer | Author id |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

## Automations & Groups

### Automations

#### Create automation

`POST /api/v1/spaces/{space_id}/automations`

Create automation

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string \| null | AutomationName |
| `sort_order` | number | Automation sort order |
| `space_uid` | string | Space uid |
| `updater_id` | integer | User id, who created automation |
| `company_id` | integer | Company id |
| `created` | string | Created timestamp |
| `updated` | string | Updated timestamp |
| `id` | string | Automation uid |
| `status` | enum | active, disabled, removed, broken |
| `type` | enum | on_action - event automatation, on_date - due date automation |
| `trigger` | object | Automation trigger data |
| - `type` | enum | Trigger types: 
 'card_moved_in_path' - Card moved
 'card_created' - Card created, 
 'comment_posted' - Comment is posted to a card, 
 'card_user_added' - Card member added, 
 'responsible_added' - Card responsible member added, 
 'card_type_changed' - Card type is changed, 
 'card_state_changed' - Card state is changed, 
 'custom_property_changed' - Property is changed, 
 'due_date_changed' - Due date is changed, 
 'checklist_item_checked' - Checklist item is checked, 
 'checklists_completed' - All checklists in a card are completed, 
 'child_cards_state_changed' - Child cards state is changed,
 'tag_added' - Tag added,
 'tag_removed' - Tag removed, 
 'blocked' - Card is blocked, 
 'unblocked' - Card is unblocked, 
 'blocker_added' - Blocker is added to a card,
 'due_date_on_date' - Card has a due date, 
 'checklist_item_due_date_on_date'- Checklist item has a due date, 
 'custom_property_date_on_date' - A field with the «Date» type has a date, 
 'all_conditions_met' - All automation conditions are met |
| - `hasToFireOnCardCreation` | boolean | Should it fire on сard creation |
| - `data` | object | Trigger data |
| `actions` | array of objects | Automation actions |
| - `type` | enum | Action types: 
 'add_assignee' - Make responsible,
 'remove_assignee' - Remove responsible,
 'add_card_users' - Add card members,
 'remove_card_users' - Remove card members,
 'add_user_groups'- Add user groups in card, 
 'add_tag' - Add tags, 
 'remove_tags' - Remove tags, 
 'add_property' - Add property, 
 'property_add_to_child_card' - Add property to child cards, 
 'add_size'- Add size,  
 'add_timeline'- Add Timeline, 
  'change_asap'- Change ASAP, 
 'add_due_date' - Set due date,
 'remove_due_date' - Remove due date,
 'move_to_path' - Move card to, 
 'move_on_board' - Move a card within the board,
 'archive' - Archive card, 
 'add_child_card' - Create child card, 
 'add_parent_card' - Create parent card, 
 'connect_parent_card' - Add parent card, 
 'complete_checklists' - Complete all checklists in card, 
 'sort_cards'- Sort cards, 
 'add_comment' - Add comment, 
 'card_add_sla' - Add SLA, 
 'card_remove_sla' - Remove SLA |
| - `created` | string | Action create timestamp |
| - `data` | object | Action data |
| `conditions` | object | Automation conditions |
| - `clause` | string | Condition clause. Can be either "and" "or" |
| - `created` | string | Condition created timestamp. ISO 8601 format |
| - `conditions` | array of objects | Array of condition groups |

- **400** (error) - Invalid token
- **402** (error) - feature is not supported by tariff
- **403** (error) - Forbidden
- **404** (error) - Not Found

---

#### Get list of automations

`GET /api/v1/spaces/{space_id}/automations`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string \| null | AutomationName |
| `sort_order` | number | Automation sort order |
| `space_uid` | string | Space uid |
| `updater_id` | integer | User id, who created automation |
| `company_id` | integer | Company id |
| `created` | string | Created timestamp |
| `updated` | string | Updated timestamp |
| `id` | string | Automation uid |
| `status` | enum | active, disabled, removed, broken |
| `type` | enum | on_action - event automatation, on_date - due date automation |
| `trigger` | object | Automation trigger data |
| - `type` | enum | Trigger types: 
 'card_moved_in_path' - Card moved
 'card_created' - Card created, 
 'comment_posted' - Comment is posted to a card, 
 'card_user_added' - Card member added, 
 'responsible_added' - Card responsible member added, 
 'card_type_changed' - Card type is changed, 
 'card_state_changed' - Card state is changed, 
 'custom_property_changed' - Property is changed, 
 'due_date_changed' - Due date is changed, 
 'checklist_item_checked' - Checklist item is checked, 
 'checklists_completed' - All checklists in a card are completed, 
 'child_cards_state_changed' - Child cards state is changed,
 'tag_added' - Tag added,
 'tag_removed' - Tag removed, 
 'blocked' - Card is blocked, 
 'unblocked' - Card is unblocked, 
 'blocker_added' - Blocker is added to a card,
 'due_date_on_date' - Card has a due date, 
 'checklist_item_due_date_on_date'- Checklist item has a due date, 
 'custom_property_date_on_date' - A field with the «Date» type has a date, 
 'all_conditions_met' - All automation conditions are met |
| - `hasToFireOnCardCreation` | boolean | Should it fire on сard creation |
| - `data` | object | Trigger data |
| `actions` | array of objects | Automation actions |
| - `type` | enum | Action types: 
 'add_assignee' - Make responsible,
 'remove_assignee' - Remove responsible,
 'add_card_users' - Add card members,
 'remove_card_users' - Remove card members,
 'add_user_groups'- Add user groups in card, 
 'add_tag' - Add tags, 
 'remove_tags' - Remove tags, 
 'add_property' - Add property, 
 'property_add_to_child_card' - Add property to child cards, 
 'add_size'- Add size, 
 'add_timeline'- Add Timeline, 
 'change_asap'- Change ASAP, 
 'add_due_date' - Set due date,
 'remove_due_date' - Remove due date,
 'move_to_path' - Move card to, 
 'move_on_board' - Move a card within the board,
 'archive' - Archive card, 
 'add_child_card' - Create child card, 
 'add_parent_card' - Create parent card, 
 'connect_parent_card' - Add parent card, 
 'complete_checklists' - Complete all checklists in card, 
 'sort_cards'- Sort cards, 
 'add_comment' - Add comment, 
 'card_add_sla' - Add SLA, 
 'card_remove_sla' - Remove SLA |
| - `created` | string | Action create timestamp |
| - `data` | object | Action data |
| `conditions` | object | Automation conditions |
| - `clause` | string | Condition clause. Can be either "and" "or" |
| - `created` | string | Condition created timestamp. ISO 8601 format |
| - `conditions` | array of objects | Array of condition groups |

- **403** (error) - Forbidden
- **404** (error) - Not Found

---

#### Update automation

`PATCH /api/v1/spaces/{space_id}/automations/{automation_uid}`

Update automation

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `automation_uid` | string | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `name` | string \| null | AutomationName |
| `sort_order` | number | Automation sort order |
| `space_uid` | string | Space uid |
| `updater_id` | integer | User id, who created automation |
| `company_id` | integer | Company id |
| `created` | string | Created timestamp |
| `updated` | string | Updated timestamp |
| `id` | string | Automation uid |
| `status` | enum | active, disabled, removed, broken |
| `type` | enum | on_action - event automatation, on_date - due date automation |
| `trigger` | object | Automation trigger data |
| - `type` | enum | Trigger types: 
 'card_moved_in_path' - Card moved
 'card_created' - Card created, 
 'comment_posted' - Comment is posted to a card, 
 'card_user_added' - Card member added, 
 'responsible_added' - Card responsible member added, 
 'card_type_changed' - Card type is changed, 
 'card_state_changed' - Card state is changed, 
 'custom_property_changed' - Property is changed, 
 'due_date_changed' - Due date is changed, 
 'checklist_item_checked' - Checklist item is checked, 
 'checklists_completed' - All checklists in a card are completed, 
 'child_cards_state_changed' - Child cards state is changed,
 'tag_added' - Tag added,
 'tag_removed' - Tag removed, 
 'blocked' - Card is blocked, 
 'unblocked' - Card is unblocked, 
 'blocker_added' - Blocker is added to a card,
 'due_date_on_date' - Card has a due date, 
 'checklist_item_due_date_on_date'- Checklist item has a due date, 
 'custom_property_date_on_date' - A field with the «Date» type has a date, 
 'all_conditions_met' - All automation conditions are met |
| - `hasToFireOnCardCreation` | boolean | Should it fire on сard creation |
| - `data` | object | Trigger data |
| `actions` | array of objects | Automation actions |
| - `type` | enum | Action types: 
 'add_assignee' - Make responsible,
 'remove_assignee' - Remove responsible,
 'add_card_users' - Add card members,
 'remove_card_users' - Remove card members,
 'add_user_groups'- Add user groups in card, 
 'add_tag' - Add tags, 
 'remove_tags' - Remove tags, 
 'add_property' - Add property, 
 'property_add_to_child_card' - Add property to child cards, 
 'add_size'- Add size, 
 'add_timeline'- Add Timeline, 
 'change_asap'- Change ASAP, 
 'add_due_date' - Set due date,
 'remove_due_date' - Remove due date,
 'move_to_path' - Move card to, 
 'move_on_board' - Move a card within the board,
 'archive' - Archive card, 
 'add_child_card' - Create child card, 
 'add_parent_card' - Create parent card, 
 'connect_parent_card' - Add parent card, 
 'complete_checklists' - Complete all checklists in card, 
 'sort_cards'- Sort cards, 
 'add_comment' - Add comment, 
 'card_add_sla' - Add SLA, 
 'card_remove_sla' - Remove SLA |
| - `created` | string | Action create timestamp |
| - `data` | object | Action data |
| `conditions` | object | Automation conditions |
| - `clause` | string | Condition clause. Can be either "and" "or" |
| - `created` | string | Condition created timestamp. ISO 8601 format |
| - `conditions` | array of objects | Array of condition groups |

- **400** (error) - Invalid token
- **402** (error) - feature is not supported by tariff
- **403** (error) - Forbidden
- **404** (error) - Not Found

---

#### Delete automation

`DELETE /api/v1/spaces/{space_id}/automations/{automation_uid}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `space_id` | integer | Yes |  |
| `automation_uid` | string | Yes |  |

**Responses:**

- **200** (success)
- **403** (error) - Forbidden
- **404** (error) - Not Found

---

### Tree entities `BETA`

#### Get list of entities

`GET /api/v1/tree-entities`

Get tree entities list filtered by query parameters. The result of the request is displayed page by page (see details in the constraints of the parameters).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `uid` | string | Entity uid |
| `title` | string | Entity title |
| `sort_order` | number | Entity sort order |
| `archived` | boolean | Archived flag |
| `access` | string | Entity access |
| `for_everyone_access_role_id` | string | Role id for when access is for_everyone |
| `entity_type` | string | Entity type |
| `path` | string | Inner path to entity |
| `parent_entity_uid` | string | Parent entity uid |

- **401** (error) - Invalid token
- **403** (error) - Forbiden

---

## Other

### Tags

#### Add tag

`POST /api/v1/tags`

Get tags list. The result of the request is displayed page by page (see details in the constraints of the parameters).

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Tag id |
| `name` | string | Tag name |
| `company_id` | integer | Company id |
| `color` | integer | Color number |
| `archived` | boolean | Archived flag |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

#### Retrieve list of tags

`GET /api/v1/tags`

Get tags list filtered by query parameters. The result of the request is displayed page by page (see details in the constraints of the parameters)

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Tag id |
| `name` | string | Tag name |
| `company_id` | integer | Company id |
| `color` | integer | Color number |
| `archived` | boolean | Archived flag |

- **401** (error) - Invalid token
- **403** (error) - Forbidden

---

### Checklists

#### Retrieve cards with checklist

`GET /api/v1/checklists/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `archived` | boolean | Card archived flag |
| `id` | integer | Card id |
| `title` | string | Card title |
| `description` | null \| string | Card description |
| `asap` | boolean | Card asap flag |
| `due_date` | null \| string | Card deadline |
| `fifo_order` | integer | Number of card in the cell when fifo rule applied to cards column |
| `state` | enum | 1-queued, 2-inProgresss, 3-done |
| `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| `expires_later` | boolean | Fixed deadline or not. Date dependant flag in terms of Kanban |
| `parents_count` | integer | Card parents count |
| `children_count` | integer | Card children count |
| `children_done` | integer | Card children done count |
| `goals_total` | integer | Card goals count |
| `goals_done` | integer | Number of card done goals |
| `time_spent_sum` | integer | Amount of time spent(in minutes) |
| `time_blocked_sum` | integer | Amount of blocked time(in minutes) |
| `children_number_properties_sum` | null \| object | Sum according to numerical data of child cards |
| `parent_checklist_ids` | null \| array | Array of card parent checklist ids |
| `parents_ids` | null \| array | Array of card parent ids |
| `children_ids` | null \| array | Array of card children ids |
| `blocking_card` | boolean | Is card blocking another card |
| `blocked` | boolean | Is card blocked |
| `size` | null \| number | Numerical part of size |
| `size_unit` | null \| string | Text part of size |
| `size_text` | null \| string | Size. Example of acceptable values: '1', '23.45', '.5', 'S', '3 M', 'L', 'XL', etc... |
| `due_date_time_present` | boolean | Flag indicating that deadline is specified up to hours and minutes |
| `board_id` | integer | Board id |
| `column_id` | integer | Column id |
| `lane_id` | integer | Lane id |
| `owner_id` | integer | Card owner id |
| `type_id` | integer | Card type id |
| `version` | integer | Card version |
| `updater_id` | integer | User id who last updated card |
| `completed_on_time` | null \| boolean | Flag indicating that card completed on time when due date present |
| `completed_at` | null \| string | Date when card moved to done type column |
| `last_moved_at` | null \| string | Date when card last moved |
| `lane_changed_at` | null \| string | Date when card changed lane |
| `column_changed_at` | null \| string | Date when card changed column |
| `first_moved_to_in_progress_at` | null \| string | Date when card first moved to inProgress type column |
| `last_moved_to_done_at` | null \| string | Date when card last moved to done type column |
| `sprint_id` | integer | Sprint id |
| `external_id` | null \| string | External id |
| `service_id` | integer | Service id |
| `comments_total` | integer | Total card comments |
| `comment_last_added_at` | null \| string | Date when last comment added |
| `properties` | null \| object | Card custom properties. Format: id_{propertyId}:value |
| `planned_start` | null \| string | Card timeline planned start |
| `planned_end` | null \| string | Card timeline planned end |
| `counters_recalculated_at` | string | Date of recalculating counters |
| `sd_new_comment` | boolean | Has unseen service desk request author comments |
| `import_id` | null \| integer | Import id |
| `public` | boolean | Is card public |
| `share_settings` | null \| object | Public share settings |
| - `fields` | object | Visible card fields |
| - `share_due_date` | string | Share until |
| - `open_unauthorized_allowed` | boolean | Allow to open unauthorized to view the card in the read only mode |
| `share_id` | null \| string | Public share id |
| `external_user_emails` | null \| string | External users emails |
| `description_filled` | boolean | Flag indicating that card has description |
| `tags_ids` | array | Array of card tags ids |
| `has_access_to_space` | boolean | Flag indicating that user who made request has aceess to space |
| `path_data` | object | Card path info (space, board, column, lane, etc) |
| - `lane` | object | Card lane info |
| - - `id` | integer | Lane id |
| - - `uid` | string | Lane uid |
| - - `title` | string | Lane title |
| - - `sort_order` | number | Position |
| - - `board_id` | integer | Board id |
| - - `condition` | enum | 1 - live, 2 - archived, 3 - deleted |
| - - `external_id` | null \| string | External id |
| - - `default_card_type_id` | null \| integer | Default card type id |
| - `board` | object | Card board info |
| - - `id` | integer | Board id |
| - - `uid` | string | Board uid |
| - - `title` | string | Board title |
| - - `external_id` | null \| string | External id |
| - - `card_properties` | null \| array | Board card properties |
| - - `settings` | null \| object | Board settings |
| - `space` | object | Card space info |
| - `column` | object | Card column info |
| - - `id` | integer | Column id |
| - - `uid` | string | Column uid |
| - - `title` | string | Column title |
| - - `sort_order` | number | Position |
| - - `col_count` | integer | Width |
| - - `type` | enum | 1 - queue, 2 - in progress, 3 - done |
| - - `board_id` | integer | Board id |
| - - `column_id` | null \| integer | Parent column id |
| - - `external_id` | null \| string | External id |
| - - `rules` | integer | Column rules bitmask |
| - - `pause_sla` | boolean | Pause SLA timer in this column |
| - `subcolumn` | object | Card subcolumn info |
| `space_id` | integer | Space id |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

### Checklist items

#### Add item to checklist

`POST /api/v1/checklists/{checklist_id}/items`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `checklist_id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist item id |
| `text` | string | Checklist item text |
| `sort_order` | number | Position |
| `checked` | boolean | Flag indicating that checklist item checked |
| `checker_id` | null \| integer | User id who checked checklist item |
| `user_id` | index | Current user id |
| `checked_at` | null \| string | Date of check |
| `responsible_id` | null \| integer | User id who is responsible for checklist item |
| `deleted` | boolean | Flag indicating that checklist item deleted |
| `due_date` | null \| string | checklist item deadline |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Update checklist item

`PATCH /api/v1/checklists/{checklist_id}/items/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `checklist_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `updated` | string | Last update timestamp |
| `created` | string | Create date |
| `id` | integer | Card checklist item id |
| `text` | string | Checklist item text |
| `sort_order` | number | Position |
| `checked` | boolean | Flag indicating that checklist item checked |
| `checker_id` | null \| integer | User id who checked checklist item |
| `user_id` | integer | Current user id |
| `checked_at` | null \| string | Date of check |
| `responsible_id` | null \| integer | User id who is responsible for checklist item |
| `deleted` | boolean | Flag indicating that checklist item deleted |
| `due_date` | null \| string | checklist item deadline |

- **400** (error) - validation Error

  Response body:

| Name | Type | Description |
|---|---|---|
| `message` | string | Error message |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

#### Remove checklist item

`DELETE /api/v1/checklists/{checklist_id}/items/{id}`

**Path Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `checklist_id` | integer | Yes |  |
| `id` | integer | Yes |  |

**Responses:**

- **200** (success)

  Response body:

| Name | Type | Description |
|---|---|---|
| `id` | integer | Deleted card checklist item |

- **401** (error) - Invalid token
- **403** (error) - Forbidden
- **404** (error) - Not found

---

## Webhooks

Kaiten supports webhooks for real-time notifications about events.

Webhook URL: `POST https://<your_domain>.kaiten.ru/api/latest/webhooks`

### Webhook: Card

| Event | Description |
|---|---|
| `card:add` | Card was created. |
| `card:update` | Card was updated. |

### Webhook: Block

| Event | Description |
|---|---|
| `block:add` | Card was blocked. |
| `block:update` | Card’s block was updated. |

### Webhook: Comment

| Event | Description |
|---|---|
| `comment:add` | Comment was added to a card. |
| `comment:update` | Card comment was updated. |
| `comment:remove` | Card comment was removed. |

### Webhook: Timelog

| Event | Description |
|---|---|
| `timelog:add` | Time Log was added to card. |
| `timelog:update` | Card Time Log was updated. |
| `timelog:remove` | Card Time Log was removed. |

### Webhook: Tag

| Event | Description |
|---|---|
| `tag:add` | Tag was added. |
| `tag:update` | Tag was updated. |
| `tag:remove` | Cag was removed. |

### Webhook: Board

| Event | Description |
|---|---|
| `board:add` | Board was added. |
| `board:update` | Board was updated. |

### Webhook: File

| Event | Description |
|---|---|
| `file:add` | File was added. |
| `file:update` | File was updated. |
| `file:remove` | File was removed. |

### Webhook: Space

| Event | Description |
|---|---|
| `space:update` | Space was updated. |

### Webhook: Card Members

| Event | Description |
|---|---|
| `card_member:add` | Card_member was added. |
| `card_member:update` | Card_member was updated. Called only when the card member is assigned as the responsible. |
| `card_member:remove` | Card_member was removed. |

## Import API Schemas

Schemas used for the Kaiten Import API.

### Schema: Metadata file

To perform the import, you need to have a meta-data.json file, which serves as the entry file. This JSON file should contain the entities to be imported and the relative paths to separate JSON files for each entity.

| Property | Type | Description |
|---|---|---|
| `entities` | array | An array of entities to be mapped |
| `entities_paths_map` | object | Paths to JSON files which should be the source of import |

### Schema: Boards data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier of the board. |
| `title` | string | Name of the board. |
| `author_id` | string \| number \| null | Unique identifier of author of board. |
| `created` | any | Date of creation of board. |
| `space_id` | any | Unique space identifier for the board. |

### Schema: Cards data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier of card. |
| `column_id` | string \| number | Unique identifier of column in board. |
| `type_name` | string \| null | Type name of card. |
| `title` | string | Title of card. |
| `archived` | boolean | Archived status of card. |
| `blocked_by_card_ids` | any | IDs of cards which are blocking current card. |
| `blocks_card_ids` | any | IDs of cards which are blocked because of current card. |
| `related_card_ids` | any | IDs of cards which are related to current card. |
| `checklists` | any | The checklists of card. |
| `child_card_ids` | any | IDs of child cards. |
| `created` | any | Date of creation of card. |
| `description` | any | The description content of card. |
| `description_type` | any | Defines the type of description. |
| `due_date` | any | Due date of card. |
| `asap` | boolean | ASAP marker |
| `size_text` | any | Card size. |
| `estimate_workload` | any | Estimated time. |
| `history` | any | Defines the card actions history. |
| `links` | any | Defines the links attached to card. |
| `member_ids` | any | IDs of card members. |
| `owner_id` | string \| number \| null | Unique identifier of owner of card. |
| `parent_card_ids` | any | IDs of parent cards. |
| `planned_end` | any | Planned end date of card. |
| `planned_start` | any | Planned start date of card. |
| `planned_predecessors` | any | Planned predecessors cards. |
| `properties` | any | Array of custom properties of card. |
| `responsible_id` | string \| number \| null | Unique identifier of responsible of card. |
| `tags` | any | Defines the tags of card. |
| `key` | any | Unique key identifier for the card. |

### Schema: Card tracking timer data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier for the timer. |
| `author_id` | string \| number | Unique user identifier. |
| `card_id` | string \| number | Unique identifier of card. |
| `started_at` | string | Start date of the timer. |
| `finished_at` | string | Finish date of the timer. |
| `comment` | any | Comment for the timer. |

### Schema: Columns data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier of column in board. |
| `title` | string | Name of column. |
| `board_id` | string \| number | Unique identifier of board. |
| `created` | string \| null | Date of creation of column. |
| `type` | any | Sets up column type. Available values are queued (1), in progress (2), done (3). |
| `sort_order` | number \| null | Order sequence number. |

### Schema: Comments data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier of comment. |
| `card_id` | string \| number | Unique identifier of card under which the comment is written. |
| `text` | string | The main content of the comment, supporting both Markdown and HTML formats. |
| `author_id` | string \| number \| null | Unique identifier of comment author. |
| `author_name` | string \| null | Full name of comment author. |
| `created` | any | Date of creation of comment. |
| `parent_id` | string \| number \| null | ID of parent comment. |
| `type` | any | Specifies the format of the comment content. Accepted values are 'html' and 'markdown'. |

### Schema: Custom fields data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier of custom field |
| `type` | string | Defines the allowed types of custom field |
| `name` | string | Defines the name of custom field |
| `catalog_fields` | array | Field settings for the 'catalog' custom field type. |
| `data` | any | Contains additional data for the 'vote' and 'collective_vote' fields |
| `options` | array | Defines the available options for selected or catalog custom field types |
| `score_variant` | string | Specifies the variant of the score. |
| `vote_variant` | string | Specifies the variant of the vote. |

### Schema: Files data

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier for the card file. |
| `card_id` | string | Unique identifier of card. |
| `name` | string | Name of card file. |
| `author_id` | string \| number \| null | Unique identifier of author of file. |
| `created` | any | Date of upload of card file |
| `custom_field_id` | string \| number \| null | ID of linked custom field |
| `external` | boolean \| null | Boolean value which specifying if the storage is external or not |
| `external_type` | any | String which represents external storage type |
| `external_url` | any | URL of external storage file |
| `path` | string \| null | Relative path to the file |
| `size` | number \| null | Size of card file |

### Schema: Properties mapping

properties_mapping is an object that links the IDs of imported custom fields with existing fields in the Kaiten system.If you want to use an existing custom field rather than creating a new one, add it to properties_mapping. For example, if a field with ID 1 is specified in the card, and a similar field already exists in the system with a different internal ID (e.g., ID 15), the system will create a duplicate field unless properties_mapping is used. However, by specifying the mapping 1: 15 in properties_mapping, the system will simply use the existing field and avoid creating a duplicate.

| Property | Type | Description |
|---|---|---|
| `[external_id]` | integer | Kaiten local internal id to attach to external_id |

### Schema: Users data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique identifier for the user. |
| `email` | string | Email address of the user. Must be valid. |
| `full_name` | string \| null | Full name of the user. |

### Schema: Spaces data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique space identifier. |
| `title` | string | Name of the space. |
| `created` | any | Date of creation of space. |
| `parent_entity_id` | any | Identifier of parent entity. |
| `sort_order` | any | The positive numeric value which defines the sort order |
| `key` | any | Unique string identifier for the space. |
| `last_sequence_number` | any | Last sequence number used for card keys. |

### Schema: Folders data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique folder identifier. |
| `title` | string | Name of the folder. |
| `created` | any | Date of creation of folder. |
| `parent_entity_id` | any | Identifier of parent entity. |
| `sort_order` | any | The positive numeric value which defines the sort order |
| `key` | any | Unique string identifier for the folder. |
| `last_sequence_number` | any | Last sequence number used for card keys. |

### Schema: Documents data

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique document identifier. |
| `title` | string | Name of the document. |
| `created` | any | Date of creation of document. |
| `parent_entity_id` | any | Identifier of parent entity. |
| `path` | string \| null | Path to content of the document. |
| `sort_order` | any | The positive numeric value which defines the sort order |
| `type` | any | Specifies the format of the document content file. Accepted values are 'html' and 'markdown'. |

### Schema: Document files

| Property | Type | Description |
|---|---|---|
| `id` | string \| number | Unique document file identifier. |
| `document_id` | string \| number | Unique document identifier. |
| `path` | string | Path to the file. |
| `name` | string \| null | Name of the file. |

## SCIM API

SCIM (System for Cross-domain Identity Management) endpoints for user provisioning.

Base URL: `https://<your_domain>.kaiten.ru/api/latest/scim`

### SCIM: Users

#### Get users

`GET /api/v1/Users`

**Responses:**

- **200** (success)

#### Get user

`GET /api/v1/Users/{user_id}`

**Responses:**

- **200** (success)

#### Add user

`POST /api/v1/Users`

**Responses:**

- **201** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error. User with added email already has access.

#### Update user

`PATCH /api/v1/Users/{user_id}`

Fields available for updating - active, name.

**Responses:**

- **200** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error.


### SCIM: Groups

#### Get groups

`GET /api/v1/Groups`

**Responses:**

- **200** (success)

#### Get group

`GET /api/v1/Groups/{group_id}`

**Responses:**

- **200** (success)

#### Add group

`POST /api/v1/Groups`

**Responses:**

- **200** (success)
- **400** (error) - Validation error
- **409** (error) - Duplication Error. Group with this name exists already.

#### Update group

`PATCH /api/v1/Groups/{group_id}`

Fields available for updating: displayName, members.

**Responses:**

- **200** (success)
- **400** (error) - Validation error


## Appendix: Colors

Available colors for cards and card types:

| ID | Code | Name |
|---|---|---|
| 1 | `red` | red |
| 2 | `pink` | pink |
| 3 | `purple` | purple |
| 4 | `deepPurple` | deep purple |
| 5 | `indigo` | indigo |
| 6 | `blue` | blue |
| 7 | `lightBlue` | light blue |
| 8 | `cyan` | cyan |
| 9 | `teal` | teal |
| 10 | `green` | green |
| 11 | `lightGreen` | light green |
| 12 | `lime` | lime |
| 13 | `orange` | orange |
| 14 | `deepOrange` | deep orange |
| 15 | `brown` | brown |
| 16 | `blueGrey` | blue grey |
| 17 | `yellow` | yellow |

