# Apply for a Community Event Permit

## Purpose

Allow residents to apply for permission to hold a community event in a public space.

---

## Page 1: Start Page

### Content

Apply for a permit to hold a community event in a public space.

### Actions

- Start now

---

## Page 2: Applicant Details

### Questions

#### Full name

Validation:
- Required
- Maximum length: 100 characters

#### Email address

Validation:
- Required
- Must be a valid email address

---

## Page 3: Event Information

### Questions

#### Event name

Validation:
- Required
- Maximum length: 150 characters

#### Expected attendance

Validation:
- Required
- Whole number only
- Must be greater than 0

---

## Page 4: Alcohol Sales

### Question

Will alcohol be sold at the event?

Options:
- Yes
- No

Validation:
- Selection required

---

## Branching Logic

If the user selects **Yes**, navigate to **Alcohol Details**.

If the user selects **No**, navigate directly to **Event Date**.

---

## Page 5: Alcohol Details

### Question

Describe the alcohol sales arrangements.

Validation:
- Required
- Maximum length: 500 characters

---

## Page 6: Event Date

### Question

Event date

Validation:
- Required
- Must be a valid date
- Date must not be in the past

---

## Summary Page

Display all submitted answers.

Allow users to:
- Review answers
- Change answers before submission

---

## Confirmation Page

Display the following message:

Your permit application has been submitted successfully.

Generate and display a confirmation reference number.