# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Case, CharField, Min, Q, Value, When

# Custom ordering for priority and state
PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"]
STATE_ORDER = ["backlog", "unstarted", "started", "completed", "cancelled"]


def _order_by_custom_property(issue_queryset, order_by_param):
    """Mobelaris fork — Tier B: sort by a custom property value.

    `order_by_param` shape: `cp_<uuid>` or `-cp_<uuid>`.
    """
    from plane.db.models import CustomProperty

    desc = order_by_param.startswith("-")
    key = order_by_param.lstrip("-")
    prop_id = key[3:]
    try:
        prop = CustomProperty.objects.get(pk=prop_id, deleted_at__isnull=True)
    except CustomProperty.DoesNotExist:
        return issue_queryset.order_by("-created_at"), "-created_at"

    if prop.type in ("number", "currency", "rating"):
        field = "custom_values__value_number"
    elif prop.type == "date":
        field = "custom_values__value_date"
    elif prop.type in ("single_select", "multi_select"):
        field = "custom_values__value_options__display_order"
    else:
        field = "custom_values__value_text"

    annotated = issue_queryset.annotate(
        _cp_order_value=Min(
            field,
            filter=Q(custom_values__property_id=prop_id, custom_values__deleted_at__isnull=True),
        )
    )
    ordering = "-_cp_order_value" if desc else "_cp_order_value"
    return annotated.order_by(ordering, "-created_at"), ordering


def order_issue_queryset(issue_queryset, order_by_param="-created_at"):
    # Custom property ordering (Mobelaris fork — Tier B)
    if isinstance(order_by_param, str) and (
        order_by_param.startswith("cp_") or order_by_param.startswith("-cp_")
    ):
        return _order_by_custom_property(issue_queryset, order_by_param)
    # Priority Ordering
    if order_by_param == "priority" or order_by_param == "-priority":
        issue_queryset = issue_queryset.annotate(
            priority_order=Case(
                *[When(priority=p, then=Value(i)) for i, p in enumerate(PRIORITY_ORDER)],
                output_field=CharField(),
            )
        ).order_by("priority_order", "-created_at")
        order_by_param = "priority_order" if order_by_param.startswith("-") else "-priority_order"
    # State Ordering
    elif order_by_param in ["state__group", "-state__group"]:
        state_order = STATE_ORDER if order_by_param in ["state__name", "state__group"] else STATE_ORDER[::-1]
        issue_queryset = issue_queryset.annotate(
            state_order=Case(
                *[When(state__group=state_group, then=Value(i)) for i, state_group in enumerate(state_order)],
                default=Value(len(state_order)),
                output_field=CharField(),
            )
        ).order_by("state_order", "-created_at")
        order_by_param = "-state_order" if order_by_param.startswith("-") else "state_order"
    # assignee and label ordering
    elif order_by_param in [
        "labels__name",
        "assignees__first_name",
        "issue_module__module__name",
        "-labels__name",
        "-assignees__first_name",
        "-issue_module__module__name",
    ]:
        issue_queryset = issue_queryset.annotate(
            min_values=Min(order_by_param[1::] if order_by_param.startswith("-") else order_by_param)
        ).order_by(
            "-min_values" if order_by_param.startswith("-") else "min_values",
            "-created_at",
        )
        order_by_param = "-min_values" if order_by_param.startswith("-") else "min_values"
    else:
        # If the order_by_param is created_at, then don't add the -created_at
        if "created_at" in order_by_param:
            issue_queryset = issue_queryset.order_by(order_by_param)
        else:
            issue_queryset = issue_queryset.order_by(order_by_param, "-created_at")
        order_by_param = order_by_param
    return issue_queryset, order_by_param
