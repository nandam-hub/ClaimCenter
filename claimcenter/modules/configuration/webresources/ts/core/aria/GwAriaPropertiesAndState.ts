export interface GwAriaRelationshipPropertiesAndState {
    // Relationship
    activedescendant: string; // Identifies the currently active descendant of a composite widget.
    controls: string[]; // Identifies the element (or elements) whose contents or presence are controlled by the current element. See related aria-owns.
    describedby: string[]; // Identifies the element (or elements) that describes the object. See related aria-labelledby.
    flowto: string[]; // Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order.
    labelledby: string; // Identifies the element (or elements) that labels the current element. See related aria-label and aria-describedby.
    owns: string[]; // Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. See related aria-controls.
}

export interface GwAriaPropertiesAndState extends GwAriaRelationshipPropertiesAndState {
    autocomplete: "inline" | "list" | "both" | null; //Indicates whether user input completion suggestions are provided. (Inline List Both Null)
    checked: boolean | null; // Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. See related aria-pressed and aria-selected.
    disabled: boolean | null; // Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. See related aria-hidden and aria-readonly.
    expanded: boolean | null; // Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.
    haspopup: boolean | null; // Indicates that the element has a popup context menu or sub-level menu.
    hidden: boolean | null; // Indicates that the element and all of its descendants are not visible or perceivable to any user as implemented by the author. See related aria-disabled.
    invalid: boolean | null; // Indicates the entered value does not conform to the format expected by the application.
    label: string; // Defines a string value that labels the current element. See related aria-labelledby.
    level: number | null; // Defines the hierarchical level of an element within a structure.
    multiline: boolean | null; // Indicates whether a text box accepts multiple lines of input or only a single line.
    multilineselectable: boolean | null; // Indicates that the user may select more than one item from the current selectable descendants.
    orientation: "vertical" | "horizontal" | null; //Indicates whether the element and orientation is horizontal or vertical. Vertical Horizontal Null
    pressed: boolean | null; // Indicates the current "pressed" state of toggle buttons. See related aria-checked and aria-selected.
    readonly: boolean | null; // Indicates that the element is not editable, but is otherwise operable. See related aria-disabled.
    required: boolean | null; // Indicates that user input is required on the element before a form may be submitted.
    selected: boolean | null; //Indicates the current "selected" state of various widgets. See related aria-checked and aria-pressed.
    sort: "ascending" | "descending" | null; // Indicates if items in a table or grid are sorted in ascending or descending order.
    valuemax: number | null; // Defines the maximum allowed value for a range widget.
    valuemin: number | null; // Defines the minimum allowed value for a range widget.
    valuenow: number | null; // Defines the current value for a range widget. See related aria-valuetext.
    valuetext: string; // Defines the human readable text alternative of aria-valuenow for a range widget.

    atomic: boolean | null; //Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. See related aria-relevant.
    busy: boolean | null; // Indicates whether an element, and its subtree, are currently being updated.
    live: "assertive" | "polite" | null; // Polite Assertive Null // Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.
    relevant: ("additions" | "removals" | "text" | "all")[]; //Indicates what user agent change notifications (additions, removals, etc.) assistive technologies will receive within a live region. See related aria-atomic.  Additions removals text all

    // Drag and Drop
    dropeffect: "copy" | "move" | "link" | "execute" | "popup"; // copy move link execute popup //Indicates what functions can be performed when the dragged object is released on the drop target. This allows assistive technologies to convey the possible drag options available to users, including whether a pop-up menu of choices is provided by the application. Typically, drop effect functions can only be provided once an object has been grabbed for a drag operation as the drop effect functions available are dependent on the object being dragged.
    grabbed: boolean | null; // Indicates an element's "grabbed" state in a drag-and-drop operation.

    // Sets, radiobuttons
    posinset: number | null; // Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. See related aria-setsize.
    setsize: number | null; // Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. See related aria-posinset.
}

export type GwAriaProperty = keyof GwAriaPropertiesAndState;
