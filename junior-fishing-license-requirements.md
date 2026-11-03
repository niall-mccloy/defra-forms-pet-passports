# Apply for a Junior Fishing Licence

## Purpose

Allow young people to apply for a junior fishing licence.

---

## Page 1: Start Page

### Content

Use this service to apply for a junior fishing licence.

### Actions

- Start now

---

## Page 2: Applicant Details

### Questions

#### First name

Validation:
- Required
- Maximum length: 100 characters

#### Last name

Validation:
- Required
- Maximum length: 100 characters

#### Date of birth

Validation:
- Required
- Must be a valid date

---

## Branching Logic

Calculate age from the supplied date of birth.

If age is less than 16 years old:
- Navigate to Parent or Guardian Details.

If age is 16 years old or older:
- Skip Parent or Guardian Details and continue to Address Details.

---

## Page 3: Parent or Guardian Details

### Questions

#### Parent or guardian name

Validation:
- Required

#### Parent or guardian email address

Validation:
- Required
- Must be a valid email address

---

## Page 4: Address Details

### Questions

#### Address line 1

Validation:
- Required

#### Town or city

Validation:
- Required

#### Postcode

Validation:
- Required

---

## Page 5: Contact Preference

### Question

How would you like to receive updates?

Options:
- Email
- Post

Validation:
- Selection required

---

## Branching Logic

If the user selects **Email**, navigate to **Email Address**.

If the user selects **Post**, continue directly to the Summary Page.

---

## Page 6: Email Address

### Question

Email address

Validation:
- Required
- Must be a valid email address

---

## Summary Page

Display all answers collected during the journey.

Allow the user to review and amend answers before submission.

---

## Confirmation Page

Display the following message:

Your junior fishing licence application has been submitted successfully.

Generate and display a licence reference number.