"use client";

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";

type Step = "conditions" | "actions" | "review";
type MatchMode = "all" | "any";
type ActionKind = "email" | "web" | "sms" | "ticket";
type ConditionValue = string | string[];

type Condition = {
  id: string;
  field: string;
  operator: string;
  value: ConditionValue;
};

type RuleAction = {
  id: string;
  kind: ActionKind;
  recipient: string;
  template: string;
  message?: string;
};

type ActionConfiguration = {
  escalationTo: string;
  priority: string;
  dispositionType: string;
  emailCredential: string;
  ticketTemplate: string;
  tagCondition: string;
  tags: string;
  smsAssigneeTemplate: string;
  smsCreatorTemplate: string;
  smsTeamLeaderTemplate: string;
  smsManagerTemplate: string;
  smsCreatorParentTemplate: string;
  smsCreatorManagerTemplate: string;
  emailAssigneeTemplate: string;
  emailCreatorTemplate: string;
  emailTeamLeaderTemplate: string;
  emailManagerTemplate: string;
  emailCreatorParentTemplate: string;
  emailCreatorManagerTemplate: string;
  notifyAssignee: boolean;
  notifyCreator: boolean;
  notifyTeamLeader: boolean;
  notifyManager: boolean;
  customerSmsTemplate: string;
  customerEmailTemplate: string;
  customPhoneNumbers: string;
  customSmsTemplate: string;
  customEmailAddresses: string;
  customEmailTemplate: string;
};

type RuleDraft = {
  name: string;
  active: boolean;
  delay: number;
  delayUnit: "minutes" | "hours" | "days";
  event: "resolution" | "creation" | "status-change";
  folders: string[];
  includeSubfolders: boolean;
  matchMode: MatchMode;
  conditions: Condition[];
  frequency: "once-per-ticket" | "once-per-cycle" | "every-match";
  actions: RuleAction[];
  actionConfiguration: ActionConfiguration;
};

type TicketFieldConfig = {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  selection?: "single" | "multiple";
  maxSelections?: number;
};

type DialogName = "action" | "test" | "discard" | "save" | null;

const NAVIGATION = [
  ["Dashboard", "▦"], ["Lead", "⌁"], ["Orders", "◫"], ["Customers", "♟"],
  ["Tickets", "▰"], ["Configuration", "⚙"], ["Add-ons", "↗"], ["Reports", "▤"],
];

const MAX_SUB_STATUS_SELECTIONS = 30;
const SUB_STATUS_OPTIONS = [
  "Closed", "Unattended", "Replied", "Customer Replied", "Unanswered", "Answered",
  "Internal team", "Pending data", "Data pending from client", "Awaiting response",
  "Escalated", "Resolved", "Open", "In progress", "On hold", "Waiting for customer",
  "Waiting for agent", "Follow-up required", "Callback requested", "Duplicate", "Spam",
  "Cancelled", "Reopened", "Auto-closed", "Transferred", "Assigned", "Unassigned",
  "Pending approval", "Approved", "Rejected", "Payment pending", "Refund initiated",
  "Refund completed", "SLA breached", "Technical review", "Quality review",
];

const FIELD_OPTIONS = [
  { id: "status", label: "Status", values: ["Complete", "Pending", "Reopened", "In progress"] },
  { id: "subStatus", label: "Sub-Status", values: SUB_STATUS_OPTIONS },
  { id: "assignment", label: "Un-Assigned Ticket", values: ["No", "Yes"] },
  { id: "priority", label: "Ticket Priority", values: ["Low", "Medium", "High", "Critical"] },
  { id: "queue", label: "Queue", values: ["WhatsApp Support", "Billing", "Escalations", "General"] },
  { id: "ticketType", label: "Type Of Ticket", values: ["Question", "Incident", "Complaint", "Request"] },
  { id: "conversation", label: "Last Conversation Type", values: ["Customer reply", "Agent reply", "System message"] },
  { id: "rating", label: "Ticket Rating", values: ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"] },
  { id: "excludeQueue", label: "Exclude Queue Keys", values: ["Spam", "Internal", "Bot", "Test"] },
  { id: "tagCondition", label: "Match Tags Condition", values: ["Match any tag", "Match all tags", "Exclude tags"] },
  { id: "tags", label: "Match Tags", values: ["VIP", "Refund", "Repeat contact", "At risk"] },
  { id: "classification", label: "Customer Classification", values: ["Standard", "Premium", "Enterprise"] },
  { id: "designation", label: "Designation Type", values: ["Agent", "Senior agent", "Team lead", "Manager"] },
];

const TICKET_FIELDS: TicketFieldConfig[] = [
  { id: "status", label: "Status", placeholder: "Select Status", required: true },
  { id: "subStatus", label: "Sub-Status", placeholder: "Select Sub-Status", required: true, selection: "multiple", maxSelections: MAX_SUB_STATUS_SELECTIONS },
  { id: "priority", label: "Priority", placeholder: "Select Priority" },
  { id: "queue", label: "Queue", placeholder: "Select Queue" },
  { id: "assignment", label: "Un-Assigned Ticket", placeholder: "Select Un-Assigned Ticket" },
  { id: "ticketType", label: "Type Of Ticket", placeholder: "Select Type Of Ticket" },
  { id: "conversation", label: "Last Conversation Type", placeholder: "Select Last Conversation Type" },
  { id: "rating", label: "Ticket Rating", placeholder: "Select Ticket Rating" },
  { id: "excludeQueue", label: "Exclude Queue Keys", placeholder: "Select Exclude Queue Keys" },
  { id: "tagCondition", label: "Match Tags Condition", placeholder: "Select Match Tags Condition" },
  { id: "tags", label: "Match Tags", placeholder: "Select Match Tags" },
  { id: "classification", label: "Customer Classification", placeholder: "Select Customer Classification" },
  { id: "designation", label: "Designation Type", placeholder: "Select Designation Type" },
];
const TICKET_FIELD_ORDER = new Map(TICKET_FIELDS.map((field, index) => [field.id, index]));

const FOLDER_OPTIONS = [
  { group: "Main folders", items: ["Whats app", "AI coding agent delete", "AI coding agent test", "Amazon Auto LOB", "Batch_new", "Call", "Call Tickets", "Chat", "Complaints", "Demo folder", "Dennisligo", "DM_Paper"] },
  { group: "Messaging", items: ["Instagram", "Facebook Messenger", "Live chat"] },
  { group: "Customer support", items: ["General Support", "Billing", "Returns", "Escalations"] },
  { group: "Regional teams", items: ["India", "Middle East", "South-East Asia"] },
];

const TEMPLATE_OPTIONS: Record<ActionKind, string[]> = {
  email: ["Resolution follow-up #7259", "Assignee escalation", "Creator follow-up", "Manager escalation"],
  web: ["Ticket needs attention", "Resolution follow-up", "Escalation assigned"],
  sms: ["Short resolution update", "Escalation alert", "Customer follow-up"],
  ticket: ["Set priority to High", "Move to escalation queue", "Add follow-up tag"],
};

const RECIPIENTS = ["Assignee", "Creator", "Team leader", "Manager", "Customer", "Custom recipient"];
const LEGACY_RULE_STORAGE_KEY = "kapture:rule:5545:v1";
const RULE_STORAGE_KEY = "kapture:rule:5545:v2";

const INITIAL_ACTION_CONFIGURATION: ActionConfiguration = {
  escalationTo: "",
  priority: "",
  dispositionType: "",
  emailCredential: "",
  ticketTemplate: "",
  tagCondition: "",
  tags: "",
  smsAssigneeTemplate: "",
  smsCreatorTemplate: "",
  smsTeamLeaderTemplate: "",
  smsManagerTemplate: "",
  smsCreatorParentTemplate: "",
  smsCreatorManagerTemplate: "",
  emailAssigneeTemplate: "Test Queue",
  emailCreatorTemplate: "",
  emailTeamLeaderTemplate: "",
  emailManagerTemplate: "",
  emailCreatorParentTemplate: "",
  emailCreatorManagerTemplate: "",
  notifyAssignee: true,
  notifyCreator: true,
  notifyTeamLeader: false,
  notifyManager: false,
  customerSmsTemplate: "",
  customerEmailTemplate: "",
  customPhoneNumbers: "",
  customSmsTemplate: "",
  customEmailAddresses: "",
  customEmailTemplate: "",
};

const INITIAL_RULE: RuleDraft = {
  name: "WhatsApp resolution follow-up",
  active: true,
  delay: 5,
  delayUnit: "minutes",
  event: "resolution",
  folders: ["Whats app"],
  includeSubfolders: false,
  matchMode: "all",
  frequency: "once-per-ticket",
  conditions: [
    { id: "condition-status", field: "status", operator: "is", value: "Complete" },
    { id: "condition-substatus", field: "subStatus", operator: "isAnyOf", value: ["Closed"] },
    { id: "condition-assignment", field: "assignment", operator: "is", value: "No" },
  ],
  actions: [
    { id: "action-email", kind: "email", recipient: "Assignee", template: "Resolution follow-up #7259" },
    { id: "action-web-assignee", kind: "web", recipient: "Assignee", template: "Ticket needs attention" },
    { id: "action-web-creator", kind: "web", recipient: "Creator", template: "Resolution follow-up" },
  ],
  actionConfiguration: INITIAL_ACTION_CONFIGURATION,
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fieldFor = (id: string) => FIELD_OPTIONS.find((field) => field.id === id) ?? FIELD_OPTIONS[0];
const operatorLabel = (operator: string) => ({ is: "is", isAnyOf: "is any of", isNot: "is not", contains: "contains", excludes: "does not contain" }[operator] ?? operator);

function valuesOf(condition?: Condition) {
  if (!condition) return [];
  return Array.isArray(condition.value) ? condition.value : condition.value ? [condition.value] : [];
}

function conditionValueLabel(condition: Condition, limit = Number.POSITIVE_INFINITY) {
  const values = valuesOf(condition);
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} +${values.length - limit} more`;
}

function SummaryConditionGroup({ condition }: { condition: Condition }) {
  const [valuesExpanded, setValuesExpanded] = useState(false);
  const values = valuesOf(condition);
  const field = fieldFor(condition.field).label;
  const operator = operatorLabel(condition.operator);
  const fullLabel = `${field} ${operator} ${values.join(", ")}`;
  const hiddenCount = Math.max(0, values.length - 2);
  const visibleValues = valuesExpanded ? values : values.slice(0, 2);

  return <div className="summary-condition-group" title={fullLabel}>
    <div className="summary-condition-heading" aria-hidden="true"><strong>{field}</strong><small>{operator}</small></div>
    <div className="summary-condition-values">
      {visibleValues.map((value) => <span className="summary-value-pill" aria-hidden="true" key={value}>{value}</span>)}
      {!valuesExpanded && hiddenCount > 0 && <button className="summary-values-disclosure" type="button" aria-expanded="false" aria-label={`Show ${hiddenCount} more ${field} values`} onClick={() => setValuesExpanded(true)}>+{hiddenCount} more <span aria-hidden="true">↓</span></button>}
      {valuesExpanded && hiddenCount > 0 && <button className="summary-values-disclosure" type="button" aria-expanded="true" aria-label={`Show fewer ${field} values`} onClick={() => setValuesExpanded(false)}>Show fewer <span aria-hidden="true">↑</span></button>}
    </div>
    <span className="sr-only">{fullLabel}</span>
  </div>;
}

function actionTitle(action: RuleAction) {
  if (action.kind === "ticket") return "Update ticket";
  return `${action.kind === "web" ? "Web notification" : action.kind.toUpperCase()} → ${action.recipient}`;
}

function actionDescription(action: RuleAction) {
  return action.kind === "ticket" ? action.template : `Template: ${action.template}`;
}

function SubStatusMultiSelect({ id, options, selected, maxSelections, onToggle, onClear }: {
  id: string;
  options: string[];
  selected: string[];
  maxSelections: number;
  onToggle: (option: string) => void;
  onClear: () => void;
}) {
  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;
  const helpId = `${instanceId}-help`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const filteredOptions = useMemo(() => options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase())), [options, query]);
  const visibleSelections = selected.slice(0, 2);
  const hiddenSelectionCount = Math.max(0, selected.length - visibleSelections.length);
  const atLimit = selected.length >= maxSelections;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !rootRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
      inputRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openListbox() {
    setOpen(true);
    setActiveIndex((current) => current >= 0 && current < filteredOptions.length ? current : filteredOptions.length ? 0 : -1);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function toggleOption(option: string) {
    const removing = selected.includes(option);
    if (!removing && atLimit) {
      setAnnouncement(`Maximum ${maxSelections} selected. Remove a sub-status before adding another.`);
      return;
    }
    onToggle(option);
    const nextCount = removing ? selected.length - 1 : selected.length + 1;
    setAnnouncement(`${option} ${removing ? "removed" : "selected"}. ${nextCount} of ${maxSelections} selected.`);
    setQuery("");
    setActiveIndex(options.indexOf(option));
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(event.key === "ArrowDown" ? 0 : Math.max(0, filteredOptions.length - 1));
        return;
      }
      setActiveIndex((current) => {
        if (!filteredOptions.length) return -1;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (Math.max(current, 0) + direction + filteredOptions.length) % filteredOptions.length;
      });
      return;
    }
    if (open && event.key === "Home") {
      event.preventDefault();
      setActiveIndex(filteredOptions.length ? 0 : -1);
      return;
    }
    if (open && event.key === "End") {
      event.preventDefault();
      setActiveIndex(filteredOptions.length ? filteredOptions.length - 1 : -1);
      return;
    }
    if (open && event.key === "Enter" && activeIndex >= 0 && filteredOptions[activeIndex]) {
      event.preventDefault();
      toggleOption(filteredOptions[activeIndex]);
    }
  }

  return (
    <div className={`tagged-select multi-select ${open ? "open" : ""}`} ref={rootRef}>
      <div className="tagged-select-control">
        {visibleSelections.map((selection) => <span className="selected-value-chip" key={selection}><span className="selected-value-chip-label">{selection}</span><button type="button" aria-label={`Remove ${selection} from Sub-Status`} onClick={() => toggleOption(selection)}>×</button></span>)}
        {hiddenSelectionCount > 0 && <button className="selection-count-chip" type="button" aria-label={`Show ${hiddenSelectionCount} more selected sub-statuses`} onClick={openListbox}>+{hiddenSelectionCount} more</button>}
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-describedby={helpId}
          aria-required="true"
          aria-invalid={!selected.length}
          autoComplete="off"
          value={query}
          placeholder={selected.length ? "" : "Select Sub-Status"}
          onClick={openListbox}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            const nextQuery = event.target.value.trim().toLowerCase();
            setActiveIndex(options.some((option) => option.toLowerCase().includes(nextQuery)) ? 0 : -1);
          }}
          onKeyDown={handleInputKeyDown}
        />
        {selected.length > 0 && <button className="multi-select-clear" type="button" aria-label="Clear all selected Sub-Statuses" onClick={() => { onClear(); setAnnouncement("All Sub-Status selections cleared."); window.requestAnimationFrame(() => inputRef.current?.focus()); }}>×</button>}
        <button className="multi-select-toggle" type="button" aria-label={`${open ? "Close" : "Open"} Sub-Status options`} aria-expanded={open} aria-controls={listboxId} onMouseDown={(event) => event.preventDefault()} onClick={() => open ? (setOpen(false), setQuery(""), setActiveIndex(-1)) : openListbox()}><span aria-hidden="true">{open ? "⌃" : "⌄"}</span></button>
      </div>
      <span className="sr-only" id={helpId}>Choose up to {maxSelections} sub-statuses.</span>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
      {open && <div className="multi-select-popover">
        <div className="multi-select-meta"><span>{selected.length} of {maxSelections} selected</span>{atLimit && <strong>Maximum reached</strong>}</div>
        <ul id={listboxId} role="listbox" aria-label="Sub-Status options" aria-multiselectable="true">
          {filteredOptions.map((option, index) => {
            const isSelected = selected.includes(option);
            const isDisabled = atLimit && !isSelected;
            return <li
              id={`${listboxId}-option-${index}`}
              key={option}
              role="option"
              aria-selected={isSelected}
              aria-disabled={isDisabled || undefined}
              tabIndex={-1}
              className={`${isSelected ? "selected" : ""} ${activeIndex === index ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActiveIndex(index)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleOption(option); } }}
              onClick={() => toggleOption(option)}
            ><span>{option}</span>{isSelected && <b aria-hidden="true">✓</b>}</li>;
          })}
          {!filteredOptions.length && <li className="multi-select-empty">No matching sub-statuses</li>}
        </ul>
      </div>}
    </div>
  );
}

const ESCALATION_RECIPIENT_OPTIONS = ["Assignee", "Creator", "Team Leader", "Manager"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const DISPOSITION_OPTIONS = ["Resolved", "Closed", "Pending", "Escalated"];
const EMAIL_CREDENTIAL_OPTIONS = ["Support mailbox", "Escalation mailbox", "Customer care mailbox"];
const ACTION_TEMPLATE_VALUES = ["Test Queue", "Resolution follow-up", "Escalation alert"];
const TAG_CONDITION_OPTIONS = ["Match any tag", "Match all tags", "Remove selected tags"];
const TAG_OPTIONS = ["VIP", "Escalated", "Follow-up", "At risk"];

function ActionConfigSelect({ id, label, value, placeholder, options, clearable = false, onChange }: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  clearable?: boolean;
  onChange: (value: string) => void;
}) {
  return <div className="action-config-field"><label htmlFor={id}>{label}</label><div className={`action-config-select ${clearable ? "clearable" : ""} ${value ? "" : "is-placeholder"}`}><select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{clearable && <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange("")} disabled={!value}>×</button>}<span aria-hidden="true">⌄</span></div></div>;
}

function ActionConfigInput({ id, label, value, placeholder, onChange }: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return <div className="action-config-field"><label htmlFor={id}>{label}</label><input id={id} name={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
}

function ActionConfigurationEditor({ value, onChange, headingRef }: {
  value: ActionConfiguration;
  onChange: <Key extends keyof ActionConfiguration>(key: Key, nextValue: ActionConfiguration[Key]) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const select = (key: keyof ActionConfiguration) => (nextValue: string) => onChange(key, nextValue);
  const toggle = (key: keyof ActionConfiguration) => (event: React.ChangeEvent<HTMLInputElement>) => onChange(key, event.target.checked);

  return <section className="action-config-surface" aria-label="Escalation action settings">
    <section className="action-config-card" aria-labelledby="ticket-actions-heading">
      <h3 id="ticket-actions-heading" ref={headingRef} tabIndex={-1}>Ticket Actions</h3>
      <div className="action-config-grid three-columns">
        <ActionConfigSelect id="action-escalate-to" label="Escalate To" value={value.escalationTo} placeholder="Select Escalate To" options={ESCALATION_RECIPIENT_OPTIONS} onChange={select("escalationTo")} />
        <ActionConfigSelect id="action-priority" label="Priority" value={value.priority} placeholder="Select Priority" options={PRIORITY_OPTIONS} onChange={select("priority")} />
        <ActionConfigSelect id="action-disposition-type" label="Disposition Type" value={value.dispositionType} placeholder="Select Disposition Type" options={DISPOSITION_OPTIONS} onChange={select("dispositionType")} />
        <ActionConfigSelect id="action-email-credential" label="Email Credential" value={value.emailCredential} placeholder="Select Email Credential" options={EMAIL_CREDENTIAL_OPTIONS} onChange={select("emailCredential")} />
        <ActionConfigSelect id="action-ticket-template" label="Ticket Template" value={value.ticketTemplate} placeholder="Select Ticket Template" options={ACTION_TEMPLATE_VALUES} clearable onChange={select("ticketTemplate")} />
        <ActionConfigSelect id="action-tag-condition" label="Tag Condition" value={value.tagCondition} placeholder="Select Tag Condition" options={TAG_CONDITION_OPTIONS} onChange={select("tagCondition")} />
        <ActionConfigSelect id="action-tags" label="Tags" value={value.tags} placeholder="Select Tags" options={TAG_OPTIONS} onChange={select("tags")} />
      </div>
    </section>

    <section className="action-config-card" aria-labelledby="internal-sms-heading">
      <h3 id="internal-sms-heading">Internal SMS escalation</h3>
      <div className="action-config-grid three-columns">
        <ActionConfigSelect id="sms-assignee-template" label="Assignee Template" value={value.smsAssigneeTemplate} placeholder="Select Assignee Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsAssigneeTemplate")} />
        <ActionConfigSelect id="sms-creator-template" label="Creator Template" value={value.smsCreatorTemplate} placeholder="Select Creator Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsCreatorTemplate")} />
        <ActionConfigSelect id="sms-team-leader-template" label="Team Leader Template" value={value.smsTeamLeaderTemplate} placeholder="Select Team Leader Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsTeamLeaderTemplate")} />
        <ActionConfigSelect id="sms-manager-template" label="Manager Template" value={value.smsManagerTemplate} placeholder="Select Manager Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsManagerTemplate")} />
        <ActionConfigSelect id="sms-creator-parent-template" label="Creator Parent Template" value={value.smsCreatorParentTemplate} placeholder="Select Creator Parent Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsCreatorParentTemplate")} />
        <ActionConfigSelect id="sms-creator-manager-template" label="Creator Manager Template" value={value.smsCreatorManagerTemplate} placeholder="Select Creator Manager Template" options={ACTION_TEMPLATE_VALUES} onChange={select("smsCreatorManagerTemplate")} />
      </div>
    </section>

    <section className="action-config-card" aria-labelledby="internal-email-heading">
      <h3 id="internal-email-heading">Internal email escalation</h3>
      <div className="action-config-grid three-columns">
        <ActionConfigSelect id="email-assignee-template" label="Assignee Template" value={value.emailAssigneeTemplate} placeholder="Select Assignee Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailAssigneeTemplate")} />
        <ActionConfigSelect id="email-creator-template" label="Creator Template" value={value.emailCreatorTemplate} placeholder="Select Creator Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailCreatorTemplate")} />
        <ActionConfigSelect id="email-team-leader-template" label="Team Leader Template" value={value.emailTeamLeaderTemplate} placeholder="Select Team Leader Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailTeamLeaderTemplate")} />
        <ActionConfigSelect id="email-manager-template" label="Manager Template" value={value.emailManagerTemplate} placeholder="Select Manager Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailManagerTemplate")} />
        <ActionConfigSelect id="email-creator-parent-template" label="Creator Parent Template" value={value.emailCreatorParentTemplate} placeholder="Select Creator Parent Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailCreatorParentTemplate")} />
        <ActionConfigSelect id="email-creator-manager-template" label="Creator Manager Template" value={value.emailCreatorManagerTemplate} placeholder="Select Creator Manager Template" options={ACTION_TEMPLATE_VALUES} onChange={select("emailCreatorManagerTemplate")} />
      </div>
    </section>

    <section className="action-config-card" aria-labelledby="internal-web-heading">
      <h3 id="internal-web-heading">Internal web notification</h3>
      <div className="action-notification-grid">
        {([['notifyAssignee', 'To Assignee'], ['notifyCreator', 'To Creator'], ['notifyTeamLeader', 'To Team Leader'], ['notifyManager', 'To Manager']] as const).map(([key, label]) => <label className="action-switch" key={key}><input type="checkbox" checked={value[key]} onChange={toggle(key)} /><span className="action-switch-track" aria-hidden="true" /><span>{label}</span></label>)}
      </div>
    </section>

    <section className="action-config-card" aria-labelledby="customer-sms-heading">
      <h3 id="customer-sms-heading">Customer SMS escalation</h3>
      <div className="action-config-grid"><ActionConfigSelect id="customer-sms-template" label="Customer SMS Template" value={value.customerSmsTemplate} placeholder="Select Customer SMS Template" options={ACTION_TEMPLATE_VALUES} onChange={select("customerSmsTemplate")} /></div>
    </section>

    <section className="action-config-card" aria-labelledby="customer-email-heading">
      <h3 id="customer-email-heading">Customer email escalation</h3>
      <div className="action-config-grid"><ActionConfigSelect id="customer-email-template" label="Customer Email Template" value={value.customerEmailTemplate} placeholder="Select Customer Email Template" options={ACTION_TEMPLATE_VALUES} onChange={select("customerEmailTemplate")} /></div>
    </section>

    <section className="action-config-card" aria-labelledby="custom-sms-heading">
      <h3 id="custom-sms-heading">Custom SMS escalation</h3>
      <div className="action-config-grid two-columns">
        <ActionConfigInput id="custom-phone-numbers" label="Custom Phone Numbers" value={value.customPhoneNumbers} placeholder="Enter Custom Phone Numbers" onChange={select("customPhoneNumbers")} />
        <ActionConfigSelect id="custom-sms-template" label="Custom SMS Template" value={value.customSmsTemplate} placeholder="Select Custom SMS Template" options={ACTION_TEMPLATE_VALUES} onChange={select("customSmsTemplate")} />
      </div>
    </section>

    <section className="action-config-card" aria-labelledby="custom-email-heading">
      <h3 id="custom-email-heading">Custom email escalation</h3>
      <div className="action-config-grid two-columns">
        <ActionConfigInput id="custom-email-addresses" label="Custom Email Addresses" value={value.customEmailAddresses} placeholder="Enter Custom Email Addresses" onChange={select("customEmailAddresses")} />
        <ActionConfigSelect id="custom-email-template" label="Custom Email Template" value={value.customEmailTemplate} placeholder="Select Custom Email Template" options={ACTION_TEMPLATE_VALUES} onChange={select("customEmailTemplate")} />
      </div>
    </section>
  </section>;
}

function Modal({ title, description, onClose, children, wide = false }: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    first?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const firstControl = focusable[0];
      const lastControl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop">
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialogRef}>
        <div className="modal-header">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionEditor({ initial, onCancel, onSave }: {
  initial: RuleAction;
  onCancel: () => void;
  onSave: (action: RuleAction) => void;
}) {
  const [form, setForm] = useState(initial);
  const templates = TEMPLATE_OPTIONS[form.kind];

  function updateKind(kind: ActionKind) {
    setForm({ ...form, kind, recipient: kind === "ticket" ? "Ticket" : "Assignee", template: TEMPLATE_OPTIONS[kind][0] });
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="modal-body form-grid">
        <label className="field full"><span>Action type</span><select value={form.kind} onChange={(event) => updateKind(event.target.value as ActionKind)}><option value="email">Email</option><option value="web">Web notification</option><option value="sms">SMS</option><option value="ticket">Update ticket</option></select></label>
        {form.kind !== "ticket" && <label className="field"><span>Recipient</span><select value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })}>{RECIPIENTS.map((recipient) => <option key={recipient}>{recipient}</option>)}</select></label>}
        <label className={`field ${form.kind === "ticket" ? "full" : ""}`}><span>{form.kind === "ticket" ? "Ticket change" : "Template"}</span><select value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })}>{templates.map((template) => <option key={template}>{template}</option>)}</select></label>
        {form.kind === "web" && <label className="field full"><span>Notification preview</span><textarea rows={3} value={form.message ?? "This ticket needs your attention."} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>}
        {form.recipient === "Custom recipient" && <label className="field full"><span>Recipient address or phone number</span><input placeholder="Enter an email address or phone number" required /></label>}
      </div>
      <div className="modal-actions"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button className="primary-button" type="submit">Save action</button></div>
    </form>
  );
}

function TestRule({ draft, onClose, onComplete }: { draft: RuleDraft; onClose: () => void; onComplete: () => void }) {
  const [ticketId, setTicketId] = useState("KT-583104");
  const [scenario, setScenario] = useState("match");
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");

  function runTest(event: React.FormEvent) {
    event.preventDefault();
    setStatus("running");
    window.setTimeout(() => { setStatus("done"); onComplete(); }, 850);
  }

  return (
    <form onSubmit={runTest}>
      <div className="modal-body">
        <div className="simulation-note"><strong>Simulation only</strong><span>No messages will be sent and no ticket will be changed.</span></div>
        <div className="form-grid">
          <label className="field"><span>Sample ticket ID</span><input value={ticketId} onChange={(event) => setTicketId(event.target.value)} required /></label>
          <label className="field"><span>Test scenario</span><select value={scenario} onChange={(event) => { setScenario(event.target.value); setStatus("idle"); }}><option value="match">Ticket matches the rule</option><option value="miss">Ticket does not match</option></select></label>
        </div>
        {status === "running" && <div className="test-running" role="status"><span className="spinner" /> Evaluating the rule…</div>}
        {status === "done" && <div className={`test-result ${scenario === "match" ? "success" : "neutral"}`} role="status">
          <div className="result-heading"><span>{scenario === "match" ? "✓" : "—"}</span><div><strong>{scenario === "match" ? `Ticket ${ticketId} matches` : `Ticket ${ticketId} does not match`}</strong><p>{scenario === "match" ? `${draft.actions.length} actions would run after the configured delay.` : "No actions would run for this ticket."}</p></div></div>
          <ul>{draft.conditions.map((condition, index) => <li key={condition.id}><span>{scenario === "miss" && index === 1 ? "×" : "✓"}</span>{fieldFor(condition.field).label} {operatorLabel(condition.operator)} {conditionValueLabel(condition, 5)}</li>)}</ul>
        </div>}
      </div>
      <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Close</button><button className="primary-button" type="submit" disabled={status === "running"}>{status === "running" ? "Testing…" : status === "done" ? "Run again" : "Run test"}</button></div>
    </form>
  );
}

export default function Home() {
  const [draft, setDraft] = useState<RuleDraft>(INITIAL_RULE);
  const [baseline, setBaseline] = useState<RuleDraft>(INITIAL_RULE);
  const [step, setStep] = useState<Step>("conditions");
  const [dialog, setDialog] = useState<DialogName>(null);
  const [editingAction, setEditingAction] = useState<RuleAction | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [folderBrowserOpen, setFolderBrowserOpen] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [folderHelpVisible, setFolderHelpVisible] = useState(true);
  const [ticketFieldsOpen, setTicketFieldsOpen] = useState(true);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [summaryConditionsExpanded, setSummaryConditionsExpanded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [lastTestFingerprint, setLastTestFingerprint] = useState<string | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const folderDisclosureRef = useRef<HTMLButtonElement>(null);
  const folderBrowserRef = useRef<HTMLDivElement>(null);
  const firstStepRender = useRef(true);
  const undoRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(RULE_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_RULE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as RuleDraft;
          const normalized = {
            ...parsed,
            folders: parsed.folders.map((folder) => folder === "WhatsApp" ? "Whats app" : folder),
            includeSubfolders: false,
            actionConfiguration: { ...INITIAL_ACTION_CONFIGURATION, ...(parsed.actionConfiguration ?? {}) },
            conditions: parsed.conditions.map((condition) => {
              if (condition.field === "subStatus") {
                const persistedValues = valuesOf(condition);
                const selected = SUB_STATUS_OPTIONS.filter((option) => persistedValues.includes(option)).slice(0, MAX_SUB_STATUS_SELECTIONS);
                return { ...condition, operator: "isAnyOf", value: selected.length ? selected : ["Closed"] };
              }
              const scalarValue = Array.isArray(condition.value) ? condition.value[0] ?? "" : condition.value;
              return condition.field === "assignment" && scalarValue === "Assigned" ? { ...condition, value: "No" } : { ...condition, value: scalarValue };
            }),
          };
          setDraft(normalized);
          setBaseline(normalized);
        }
      } catch {
        setToast("The saved prototype state could not be loaded; the sample rule is shown instead.");
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const fingerprint = JSON.stringify(draft);
  const isDirty = fingerprint !== JSON.stringify(baseline);
  const testIsStale = Boolean(lastTestFingerprint && lastTestFingerprint !== fingerprint);
  const orderedSummaryConditions = useMemo(() => [...draft.conditions].sort((first, second) => (TICKET_FIELD_ORDER.get(first.field) ?? Number.MAX_SAFE_INTEGER) - (TICKET_FIELD_ORDER.get(second.field) ?? Number.MAX_SAFE_INTEGER)), [draft.conditions]);
  const visibleSummaryConditions = summaryConditionsExpanded ? orderedSummaryConditions : orderedSummaryConditions.slice(0, 3);

  useEffect(() => {
    if (!isDirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [isDirty]);

  useEffect(() => {
    if (firstStepRender.current) { firstStepRender.current = false; return; }
    const heading = stepHeadingRef.current;
    if (!heading) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  useEffect(() => {
    if (!toast || undoAvailable) return;
    const timeout = window.setTimeout(() => {
      setToast(null);
      undoRef.current = null;
      setUndoAvailable(false);
    }, 3200);
    return () => window.clearTimeout(timeout);
  }, [toast, undoAvailable]);

  useEffect(() => {
    if (!folderBrowserOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !folderBrowserRef.current?.contains(document.activeElement)) return;
      setFolderBrowserOpen(false);
      setFolderSearch("");
      setShowAllFolders(false);
      folderDisclosureRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [folderBrowserOpen]);

  const issues = useMemo(() => {
    const next: string[] = [];
    if (!draft.name.trim()) next.push("Add a rule name.");
    if (draft.delay < 0 || draft.delay > 10080) next.push("Use a delay between 0 and 10,080 minutes.");
    if (!draft.folders.length) next.push("Select at least one folder.");
    if (!draft.conditions.length) next.push("Add at least one condition.");
    if (draft.conditions.some((condition) => !valuesOf(condition).length)) next.push("Complete every condition.");
    if (!valuesOf(draft.conditions.find((condition) => condition.field === "status")).length) next.push("Select a Status.");
    if (!valuesOf(draft.conditions.find((condition) => condition.field === "subStatus")).length) next.push("Select at least one Sub-Status.");
    if (!draft.actions.length) next.push("Add at least one action.");
    return next;
  }, [draft]);

  const filteredFolders = FOLDER_OPTIONS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.toLowerCase().includes(folderSearch.toLowerCase())),
  })).filter((group) => group.items.length);
  const visibleFolderGroups = folderSearch || showAllFolders ? filteredFolders : filteredFolders.slice(0, 1).map((group) => ({ ...group, items: group.items.slice(0, 10) }));
  const visibleFolderCount = visibleFolderGroups.reduce((count, group) => count + group.items.length, 0);

  const patchDraft = (patch: Partial<RuleDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveStatus("idle");
  };

  const updateActionConfiguration = <Key extends keyof ActionConfiguration>(key: Key, value: ActionConfiguration[Key]) => {
    setDraft((current) => ({ ...current, actionConfiguration: { ...current.actionConfiguration, [key]: value } }));
    setSaveStatus("idle");
  };

  function setCurrentStep(nextStep: Step) {
    setStep(nextStep);
  }

  function setTicketField(field: string, value: string) {
    const existing = draft.conditions.find((condition) => condition.field === field);
    if (!value) {
      patchDraft({ conditions: draft.conditions.filter((condition) => condition.field !== field) });
      return;
    }
    if (existing) {
      patchDraft({ conditions: draft.conditions.map((condition) => condition.field === field ? { ...condition, value } : condition) });
      return;
    }
    patchDraft({ conditions: [...draft.conditions, { id: makeId("condition"), field, operator: "is", value }] });
  }

  function toggleTicketFieldValue(field: string, option: string, maxSelections: number) {
    setDraft((current) => {
      const existing = current.conditions.find((condition) => condition.field === field);
      const selected = valuesOf(existing);
      const nextSet = new Set(selected);
      if (nextSet.has(option)) nextSet.delete(option);
      else if (nextSet.size < maxSelections) nextSet.add(option);
      const nextValues = fieldFor(field).values.filter((value) => nextSet.has(value)).slice(0, maxSelections);
      if (!nextValues.length) return { ...current, conditions: current.conditions.filter((condition) => condition.field !== field) };
      if (existing) return { ...current, conditions: current.conditions.map((condition) => condition.field === field ? { ...condition, operator: "isAnyOf", value: nextValues } : condition) };
      return { ...current, conditions: [...current.conditions, { id: makeId("condition"), field, operator: "isAnyOf", value: nextValues }] };
    });
    setSaveStatus("idle");
  }

  function clearTicketFieldValues(field: string) {
    setDraft((current) => ({ ...current, conditions: current.conditions.filter((condition) => condition.field !== field) }));
    setSaveStatus("idle");
  }

  function toggleFolder(folder: string) {
    const selected = draft.folders.includes(folder);
    const folders = selected ? draft.folders.filter((item) => item !== folder) : [...draft.folders, folder];
    patchDraft({ folders });
  }

  function saveAction(action: RuleAction) {
    const exists = draft.actions.some((item) => item.id === action.id);
    patchDraft({ actions: exists ? draft.actions.map((item) => item.id === action.id ? action : item) : [...draft.actions, action] });
    setDialog(null);
    setEditingAction(null);
    setToast(exists ? "Action updated." : "Action added.");
  }

  function discardChanges() {
    setDraft(baseline);
    setStep("conditions");
    setDialog(null);
    setToast("Unsaved changes discarded.");
  }

  function requestExit() {
    if (isDirty) setDialog("discard");
    else setToast("There are no unsaved changes.");
  }

  function saveChanges() {
    const snapshot = draft;
    setDialog(null);
    setSaveStatus("saving");
    window.setTimeout(() => {
      try {
        window.localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(snapshot));
        setBaseline(snapshot);
        setSaveStatus("saved");
        setToast("Rule changes saved locally.");
      } catch {
        setSaveStatus("error");
        setToast("The rule could not be saved. Please try again.");
      }
    }, 900);
  }

  const eventLabel = draft.event === "resolution" ? "ticket resolution" : draft.event === "creation" ? "ticket creation" : "status change";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to rule editor</a>
      <header className="topbar">
        <div className="brand-lockup">
          <button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>☰</button>
          <div className="brand-mark" aria-hidden="true">K</div>
          <strong>Configuration</strong>
          <span className="environment-badge">Staging environment</span>
        </div>
        <div className="account-strip">
          <button className="icon-button notification-button" aria-label="Notifications"><span aria-hidden="true">●</span><i /></button>
          <span className="availability"><i /> Not available</span>
          <span className="avatar" aria-hidden="true">MD</span>
          <strong>Muheeb Demo</strong>
          <button className="icon-button" aria-label="Open account menu">⌄</button>
        </div>
      </header>

      <nav className={`global-nav ${mobileNavOpen ? "open" : ""}`} aria-label="Primary navigation">
        <a className="nav-logo" href="#main-content" aria-label="Kapture CRM home">K</a>
        {NAVIGATION.map(([item, icon]) => (
          <a key={item} href={`#${item.toLowerCase()}`} className={item === "Configuration" ? "nav-item active" : "nav-item"} aria-label={item} aria-current={item === "Configuration" ? "page" : undefined} onClick={(event) => { event.preventDefault(); setMobileNavOpen(false); }}>
            <span aria-hidden="true">{icon}</span><em>{item}</em>
          </a>
        ))}
        <button className="nav-item nav-bottom" aria-label="Help"><span aria-hidden="true">?</span><em>Help</em></button>
      </nav>
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="page" id="main-content">
        <button className="back-link" type="button" onClick={requestExit}>‹ All escalation rules</button>
        <h1 className="sr-only">Update escalation rule</h1>

        <div className="workspace">
          <aside className="rule-sidebar sticky" aria-label="Rule details and summary">
            <label className="rule-name" htmlFor="rule-name"><span>Escalation name</span><input id="rule-name" name="ruleName" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} aria-invalid={!draft.name.trim()} /></label>
            <section className="panel summary-panel" aria-labelledby="summary-title">
              <div className="summary-title"><h2 id="summary-title">Rule summary</h2><button type="button" onClick={() => setSummaryOpen((open) => !open)} aria-expanded={summaryOpen} aria-controls="rule-summary-content" aria-label={`${summaryOpen ? "Collapse" : "Expand"} rule summary`}>{summaryOpen ? "−" : "+"}</button></div>
              {summaryOpen && <dl id="rule-summary-content">
                <div><dt>When</dt><dd>{draft.delay} {draft.delayUnit} after {eventLabel}</dd></div>
                <div><dt>Folders</dt><dd>{draft.folders.length ? draft.folders.map((folder) => <span className="chip folder" key={folder}>{folder}</span>) : "No folders selected"}{draft.includeSubfolders && <span className="muted"> + subfolders</span>}</dd></div>
                <div><dt className="summary-section-heading"><span>If {draft.matchMode} match</span><small>{orderedSummaryConditions.length} configured</small></dt><dd className="summary-condition-list"><div className="summary-condition-groups" id="summary-condition-groups">{visibleSummaryConditions.map((condition) => <SummaryConditionGroup condition={condition} key={condition.id} />)}</div>{orderedSummaryConditions.length > 3 && <button className="summary-condition-toggle" type="button" aria-expanded={summaryConditionsExpanded} aria-controls="summary-condition-groups" onClick={() => setSummaryConditionsExpanded((expanded) => !expanded)}>{summaryConditionsExpanded ? "Show fewer conditions" : `Show ${orderedSummaryConditions.length - 3} more conditions`} <span aria-hidden="true">{summaryConditionsExpanded ? "↑" : "↓"}</span></button>}</dd></div>
                <div><dt>Then</dt><dd>{draft.actions.map((action) => <span className="chip action" key={action.id}>{actionTitle(action)}</span>)}</dd></div>
                <div><dt>Trigger limit</dt><dd>{draft.frequency === "once-per-ticket" ? "Once per ticket" : draft.frequency === "once-per-cycle" ? "Once per resolution cycle" : "Every time conditions match"}</dd></div>
              </dl>}
            </section>
          </aside>

          <section className="editor-card" aria-label="Escalation rule editor">
            <section className="panel progress-panel editor-progress" aria-labelledby="progress-title">
              <h2 className="panel-kicker" id="progress-title">Progress</h2>
              {/* Explicit role preserves list semantics in Safari when markers are visually removed. */}
              {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
              <ol role="list">
                {(["conditions", "actions", "review"] as Step[]).map((item, index) => {
                  const conditionsComplete = draft.delay >= 0 && draft.delay <= 10080 && Boolean(draft.folders.length) && Boolean(draft.conditions.length) && draft.conditions.every((condition) => valuesOf(condition).length) && Boolean(valuesOf(draft.conditions.find((condition) => condition.field === "status")).length) && Boolean(valuesOf(draft.conditions.find((condition) => condition.field === "subStatus")).length);
                  const complete = item === "conditions" ? conditionsComplete : item === "actions" ? Boolean(draft.actions.length) : !issues.length;
                  const labels = item === "conditions" ? ["Conditions", `${draft.conditions.length} filters configured`] : item === "actions" ? ["Actions", `${draft.actions.length} actions configured`] : ["Review", "Test and save changes"];
                  return <li key={item}><button className={`step ${step === item ? "active" : ""} ${complete ? "complete" : ""}`} type="button" onClick={() => setCurrentStep(item)} aria-current={step === item ? "step" : undefined}><b aria-hidden="true">{complete && step !== item ? "✓" : index + 1}</b><span>{complete && <span className="sr-only">Completed. </span>}<strong>{labels[0]}</strong><small>{labels[1]}</small></span></button></li>;
                })}
              </ol>
            </section>

            {step === "conditions" && <div className="step-content">
              <section className="section-block timing-section" aria-labelledby="trigger-timing-title">
                <h3 id="trigger-timing-title" ref={stepHeadingRef} tabIndex={-1}>Trigger &amp; Timing</h3>
                <div className="sentence-control reference-sentence"><span>Wait</span><label className="sr-only" htmlFor="delay">Delay amount</label><input id="delay" name="delay" type="number" min="0" max="10080" required value={draft.delay} onChange={(event) => patchDraft({ delay: Number(event.target.value) })} /><span className="timing-unit">{draft.delayUnit}</span><span>after</span><label className="sr-only" htmlFor="trigger-event">Trigger event</label><select id="trigger-event" name="triggerEvent" value={draft.event} onChange={(event) => patchDraft({ event: event.target.value as RuleDraft["event"] })}><option value="resolution">Resolution</option><option value="creation">Creation</option><option value="status-change">Status change</option></select></div>
              </section>

              <section className="section-block folder-section reference-folder-section" aria-labelledby="folders-title">
                <div className="folder-surface"><h3 id="folders-title">Folders</h3><div className="folder-row">{draft.folders.map((folder) => <span className="folder-chip" key={folder}>{folder}<button type="button" aria-label={`Remove ${folder} folder`} onClick={() => { toggleFolder(folder); window.requestAnimationFrame(() => folderDisclosureRef.current?.focus()); }}>×</button></span>)}{!draft.folders.length && <span className="folder-placeholder">No folders selected</span>}<button ref={folderDisclosureRef} type="button" className="folder-add-icon" aria-label={folderBrowserOpen ? "Close folder picker" : "Add or edit folders"} aria-expanded={folderBrowserOpen} aria-controls="inline-folder-browser" onClick={() => { setFolderBrowserOpen((open) => { if (open) setShowAllFolders(false); return !open; }); setFolderSearch(""); }}><span aria-hidden="true">{folderBrowserOpen ? "−" : "+"}</span></button></div></div>

                {folderBrowserOpen && <div ref={folderBrowserRef} className="inline-folder-browser" id="inline-folder-browser" role="region" aria-label="Folder browser">
                  {folderHelpVisible && <div className="folder-help" role="note"><span aria-hidden="true">i</span><p>Select a folder below to add it. Select it again, or use the × on a selected folder, to remove it.</p><button type="button" aria-label="Dismiss folder selection help" onClick={() => setFolderHelpVisible(false)}>×</button></div>}
                  <label className="inline-folder-search"><span className="folder-search-icon" aria-hidden="true">▣</span><span className="sr-only">Search folders</span><input aria-controls="folder-results" value={folderSearch} onChange={(event) => setFolderSearch(event.target.value)} placeholder="Search by folder name" />{folderSearch && <button type="button" aria-label="Clear folder search" onClick={() => setFolderSearch("")}>×</button>}</label>
                  <span className="sr-only" role="status">{visibleFolderCount} folder options shown. {draft.folders.length} selected.</span>
                  <div className="folder-results" id="folder-results">
                    {visibleFolderGroups.map((group) => <section className="folder-group" aria-labelledby={`folder-group-${group.group.replaceAll(" ", "-").toLowerCase()}`} key={group.group}><h3 id={`folder-group-${group.group.replaceAll(" ", "-").toLowerCase()}`}>{group.group}</h3><div className="folder-options">{group.items.map((folder) => <button type="button" className={draft.folders.includes(folder) ? "selected" : ""} aria-pressed={draft.folders.includes(folder)} key={folder} onClick={() => toggleFolder(folder)}>{folder}{draft.folders.includes(folder) && <span aria-hidden="true"> ✓</span>}</button>)}</div></section>)}
                    {!visibleFolderGroups.length && <div className="folder-empty"><strong>No folders found</strong><span>Try a different name.</span></div>}
                  </div>
                  {!folderSearch && <button type="button" className="view-folders" onClick={() => setShowAllFolders((show) => !show)} aria-expanded={showAllFolders}>{showAllFolders ? "Show fewer folders" : "View more folders"} <span aria-hidden="true">{showAllFolders ? "↑" : "↓"}</span></button>}
                </div>}

                <label className="toggle-row reference-folder-toggle" htmlFor="include-subfolders" aria-label="Match Child folders"><input id="include-subfolders" type="checkbox" checked={draft.includeSubfolders} onChange={(event) => patchDraft({ includeSubfolders: event.target.checked })} /><span className="toggle" aria-hidden="true" /><span><strong>Match Child folders</strong></span></label>
              </section>

              <section className="section-block ticket-fields-card" aria-labelledby="ticket-fields-title">
                <button className="ticket-fields-header" type="button" aria-expanded={ticketFieldsOpen} aria-controls="ticket-fields-panel" onClick={() => setTicketFieldsOpen((open) => !open)}><span id="ticket-fields-title">Ticket Fields <b aria-hidden="true">*</b></span><i aria-hidden="true">{ticketFieldsOpen ? "⌃" : "⌄"}</i></button>
                {ticketFieldsOpen && <div className="ticket-fields-grid" id="ticket-fields-panel">{TICKET_FIELDS.map((field) => {
                  const condition = draft.conditions.find((item) => item.field === field.id);
                  const selectedValues = valuesOf(condition);
                  const value = selectedValues[0] ?? "";
                  const options = fieldFor(field.id).values;
                  return <div className="ticket-field" key={field.id}><label htmlFor={`ticket-field-${field.id}`}>{field.label}{field.required && <b aria-hidden="true"> *</b>}</label>{field.selection === "multiple" ? <SubStatusMultiSelect id={`ticket-field-${field.id}`} options={options} selected={selectedValues} maxSelections={field.maxSelections ?? MAX_SUB_STATUS_SELECTIONS} onToggle={(option) => toggleTicketFieldValue(field.id, option, field.maxSelections ?? MAX_SUB_STATUS_SELECTIONS)} onClear={() => clearTicketFieldValues(field.id)} /> : <div className={`ticket-select-control ${value ? "" : "is-placeholder"} ${field.required && value ? "has-clear" : ""}`}><select id={`ticket-field-${field.id}`} aria-required={field.required} value={value} onChange={(event) => setTicketField(field.id, event.target.value)}><option value="">{field.placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{field.required && value && <button type="button" className="ticket-select-clear" aria-label={`Clear ${field.label}`} onClick={() => setTicketField(field.id, "")}>×</button>}<span className="ticket-select-chevron" aria-hidden="true">⌄</span></div>}</div>;
                })}</div>}
              </section>

              <section className="section-block custom-fields-card" aria-labelledby="custom-fields-title">
                <button className="ticket-fields-header custom-fields-header" type="button" aria-expanded={customFieldsOpen} aria-controls="custom-fields-panel" onClick={() => setCustomFieldsOpen((open) => !open)}><span id="custom-fields-title">Custom Fields</span><i aria-hidden="true">{customFieldsOpen ? "⌃" : "⌄"}</i></button>
                {customFieldsOpen && <div className="custom-fields-empty" id="custom-fields-panel"><p>No custom fields are configured for this rule.</p></div>}
              </section>
            </div>}

            {step === "actions" && <div className="step-content">
              <ActionConfigurationEditor value={draft.actionConfiguration} onChange={updateActionConfiguration} headingRef={stepHeadingRef} />
            </div>}

            {step === "review" && <div className="step-content">
              <h2 className="sr-only" ref={stepHeadingRef} tabIndex={-1}>Review and test</h2>
              {issues.length > 0 && <div className="issue-banner" role="alert"><strong>{issues.length} item{issues.length === 1 ? "" : "s"} need attention</strong><ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
              {testIsStale && <div className="stale-banner" role="status"><strong>Test results are out of date.</strong><span>The rule changed since the last test.</span><button type="button" onClick={() => setDialog("test")}>Run test again</button></div>}
              <div className="review-grid" aria-label="Rule configuration review">
                <div className="review-grid-heading"><div><h2>Rule configuration</h2><p>Confirm the setup below before saving your changes.</p></div><span>{issues.length ? `${issues.length} to resolve` : "Ready to save"}</span></div>
                <section className="review-card">
                  <div className="review-card-heading"><span>01</span><div><h3>Trigger &amp; scope</h3><p>When and where this rule runs</p></div><button type="button" onClick={() => setStep("conditions")}>Edit</button></div>
                  <dl className="review-facts">
                    <div><dt>Starts</dt><dd>{draft.delay} {draft.delayUnit} after {eventLabel}</dd></div>
                    <div><dt>Folder scope</dt><dd><span className="review-value-pill">{draft.folders.join(", ") || "None"}</span>{draft.includeSubfolders && <small>Includes subfolders</small>}</dd></div>
                    <div><dt>Run frequency</dt><dd>{draft.frequency.replaceAll("-", " ")}</dd></div>
                  </dl>
                </section>
                <section className="review-card">
                  <div className="review-card-heading"><span>02</span><div><h3>Ticket conditions</h3><p>Match {draft.matchMode} · {draft.conditions.length} configured</p></div><button type="button" onClick={() => setStep("conditions")}>Edit</button></div>
                  <ul className="review-condition-grid" aria-label="Configured ticket conditions">{draft.conditions.map((condition) => {
                    const conditionValues = valuesOf(condition);
                    return <li key={condition.id}><span className="review-check" aria-hidden="true">✓</span><div><div className="review-condition-label"><strong>{fieldFor(condition.field).label}</strong><small>{operatorLabel(condition.operator)}</small></div><div className="review-condition-values">{conditionValues.map((value) => <span className="review-value-pill" key={value}>{value}</span>)}</div></div></li>;
                  })}</ul>
                </section>
                <section className="review-card">
                  <div className="review-card-heading"><span>03</span><div><h3>Actions</h3><p>Run from left to right in this order</p></div><button type="button" onClick={() => setStep("actions")}>Edit</button></div>
                  <ol className="review-actions">{draft.actions.map((action, index) => <li key={action.id}><b>{index + 1}</b><span><strong>{actionTitle(action)}</strong><small>{actionDescription(action)}</small></span></li>)}</ol>
                </section>
              </div>
              <section className="active-warning"><span>!</span><div><strong>This is an active rule</strong><p>Saved changes take effect immediately for new matching events. Already scheduled escalations keep their current configuration.</p></div></section>
            </div>}

            <div className="form-actions">
              {step !== "conditions" && <button type="button" className="secondary-button" onClick={() => setStep(step === "review" ? "actions" : "conditions")}>← Back</button>}
              <div className="action-spacer" />
              <button type="button" className="ghost-button" onClick={requestExit}>Cancel</button>
              {step === "conditions" && <button type="button" className="primary-button" onClick={() => setStep("actions")}>Next</button>}
              {step === "actions" && <button type="button" className="primary-button" onClick={() => setStep("review")} disabled={!draft.actions.length}>Review rule →</button>}
              {step === "review" && <button type="button" className="primary-button save-button" onClick={() => issues.length ? (setToast(issues[0]), setStep(issues.some((item) => item.includes("action")) ? "actions" : "conditions")) : setDialog("save")} disabled={!isDirty || saveStatus === "saving"}>{saveStatus === "saving" ? "Saving…" : isDirty ? "Save changes" : "No changes to save"}</button>}
            </div>
          </section>
        </div>
      </main>

      {toast && <div className="toast" role="status"><span>{toast}</span>{undoAvailable && <button type="button" onClick={() => undoRef.current?.()}>Undo</button>}<button type="button" aria-label="Dismiss notification" onClick={() => { undoRef.current = null; setUndoAvailable(false); setToast(null); }}>×</button></div>}

      {dialog === "action" && editingAction && <Modal title={draft.actions.some((action) => action.id === editingAction.id) ? "Edit action" : "Add action"} description="Configure one clear outcome for matched tickets." onClose={() => { setDialog(null); setEditingAction(null); }}><ActionEditor initial={editingAction} onCancel={() => { setDialog(null); setEditingAction(null); }} onSave={saveAction} /></Modal>}
      {dialog === "test" && <Modal title="Test this rule" description="See how the current draft evaluates a sample ticket." onClose={() => setDialog(null)} wide><TestRule draft={draft} onClose={() => setDialog(null)} onComplete={() => setLastTestFingerprint(fingerprint)} /></Modal>}
      {dialog === "discard" && <Modal title="Discard unsaved changes?" description="This will return the prototype to the last saved version." onClose={() => setDialog(null)}><div className="modal-body"><div className="confirm-illustration danger">!</div><p className="confirm-copy">Your edits to the trigger, conditions, and actions will be lost.</p></div><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setDialog(null)}>Keep editing</button><button type="button" className="danger-button" onClick={discardChanges}>Discard changes</button></div></Modal>}
      {dialog === "save" && <Modal title="Save changes to this active rule?" description="The updated configuration will be used for new matching events." onClose={() => setDialog(null)}><div className="modal-body"><div className="save-summary"><div><span>Trigger</span><strong>{draft.delay} {draft.delayUnit} after {eventLabel}</strong></div><div><span>Conditions</span><strong>{draft.conditions.length} configured</strong></div><div><span>Actions</span><strong>{draft.actions.length} configured</strong></div></div><label className="confirm-check"><input type="checkbox" defaultChecked /><span>I understand that these changes take effect immediately.</span></label></div><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setDialog(null)}>Cancel</button><button type="button" className="primary-button" onClick={saveChanges}>Save changes</button></div></Modal>}
    </div>
  );
}
