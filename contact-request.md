# Contact Request Form

## Overview

This service allows a user to request that a member of the support team contacts them.

---

## Start Page

Title:
Request support

Body:
Use this service to request support from our team.

Button:
Start now

---

## Page: Personal Details

### Question

What is your full name?

Type:
TextField

Validation:
- Required

Error message:
Enter your full name

---

### Question

What is your email address?

Type:
EmailAddressField

Validation:
- Required
- Must be a valid email address

Error message:
Enter a valid email address

---

## Page: Contact Preference

### Question

How would you like us to contact you?

Type:
Radios

Options:
- Email
- Phone

Validation:
- Required

Error message:
Select a contact method

---

## Page: Phone Number

Display only if:

How would you like us to contact you? = Phone

### Question

What is your phone number?

Type:
TelephoneNumberField

Validation:
- Required

Error message:
Enter your phone number

---

## Check Answers

Display:

- Full name
- Email address
- Contact method
- Phone number (if supplied)

---

## Confirmation

Title:
Request submitted

Body:
Your support request has been submitted.

Reference:
Generate confirmation reference.