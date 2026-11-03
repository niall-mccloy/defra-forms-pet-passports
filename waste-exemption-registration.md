# Waste Exemption Registration

## Start Page

Title:
Register a waste exemption

Body:
Use this service to register an exemption for a waste activity.

---

## Page: Applicant Type

### Question

What type of applicant are you?

Type:
Radios

Options:
- Individual
- Business

Validation:
- Required

Error message:
Select an applicant type

---

## Page: Personal Details

Display if:

Applicant Type = Individual

### Question

What is your full name?

Type:
TextField

Validation:
- Required

---

## Page: Business Details

Display if:

Applicant Type = Business

### Question

Business name

Type:
TextField

Validation:
- Required

---

### Question

Companies House number

Type:
TextField

Validation:
- Optional

---

## Page: Site Address

### Question

Site address line 1

Type:
TextField

Validation:
- Required

---

### Question

Town or city

Type:
TextField

Validation:
- Required

---

### Question

Postcode

Type:
TextField

Validation:
- Required

---

## Page: Waste Activities

### Question

Which waste activities will be carried out?

Type:
Checkboxes

Options:
- Storage
- Treatment
- Transfer
- Other

Validation:
- At least one option required

Error message:
Select at least one activity

---

## Page: Other Activity

Display if:

Waste Activities contains Other

### Question

Describe the activity

Type:
MultilineTextField

Validation:
- Required

Error message:
Describe the activity

---

## Check Answers

Section: Applicant

- Applicant type
- Name or business details

Section: Site

- Address

Section: Activities

- Selected activities

---

## Confirmation

Title:
Registration complete

Body:
Your exemption registration has been received.

Reference:
Generate application reference number.