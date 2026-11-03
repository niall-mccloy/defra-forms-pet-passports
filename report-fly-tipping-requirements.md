# Report Fly-Tipping

## Purpose

Allow members of the public to report illegally dumped waste.

---

## Page 1: Start Page

### Content

Use this service to report fly-tipping in your area.

### Actions

- Start now

---

## Page 2: Location Details

### Questions

#### Postcode

Validation:
- Required

#### Describe where the waste is located

Validation:
- Required
- Maximum length: 250 characters

---

## Page 3: Waste Type

### Question

What type of waste are you reporting?

Options:
- Household waste
- Furniture
- Building materials
- Electrical items
- Other

Validation:
- Selection required

---

## Branching Logic

If the user selects **Other**, navigate to **Waste Description**.

Otherwise continue to **Reporter Details**.

---

## Page 4: Waste Description

### Question

Describe the waste.

Validation:
- Required
- Maximum length: 500 characters

---

## Page 5: Reporter Details

### Questions

#### Full name

Validation:
- Optional

#### Email address

Validation:
- Optional
- Must be a valid email address when entered

#### Telephone number

Validation:
- Optional
- Must be a valid UK telephone number when entered

---

## Page 6: Supporting Evidence

### Question

Do you have photographs of the fly-tipping?

Options:
- Yes
- No

Validation:
- Selection required

---

## Summary Page

Display all answers submitted by the user.

Allow answers to be updated before final submission.

---

## Confirmation Page

Display the following message:

Thank you for reporting fly-tipping.

A reference number has been generated for your report.

Display the generated reference number.