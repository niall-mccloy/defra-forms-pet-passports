# Report a damaged, destroyed, lost or incorrectly completed pet passport

## Purpose

Allow authorised users to report a pet passport that has been damaged, destroyed, lost, or completed incorrectly.

The information will be used to maintain accurate passport records and prevent invalid pet passports from being used.

---

## Page 1: Landing page

### Heading

Report a damaged, destroyed, lost or incorrectly completed pet passport

### Content

You must report any pet passport that is damaged, destroyed, lost or incorrectly completed.

This helps keep passport records accurate and prevents invalid passports from being used.

### Button

Start now

### Heading level 2

Before you start

### Content

We will need the following information:

### Bullet points

- the passport ID you want to report
- the microchip number of the pet, if the passport was issued to an animal

---

## Page 2: Report reason

### Question

What would you like to report?

### Options

- Damaged pet passport
- Destroyed pet passport
- Lost pet passport
- Incorrectly completed pet passport

### Validation

- Required

### Button

Continue

---

## Page 3: Pet details

### Question

Was the passport registered to a pet?

### Options

- Yes
- No

### Validation

- Required

### Button

Continue

### Conditional logic

If "Yes" selected, continue to Page 5.

If "No" selected, skip to Page 4.

---

## Page 4 : Enter passport ID

Passport details

### Question

What is the pet passport number?

### Component

Text input

### Validation

- Required
- Maximum length: 50 characters

### Hint text

For example, PPB-100926-001.

### Button

Submit

---

## Page 5: Microchip number

### Question

What is the microchip number?

### Component

Text input

### Validation

- Required
- Maximum length: 30 characters

### Hint text

Enter the animal's microchip number.

### Button

Continue

---

## Page 6: Additional information

### Question

Provide any additional information (optional)

### Component

Multiline text area

### Validation

- Optional
- Maximum length: 1000 characters

### Hint text

Include any details that may help us identify the passport record.

### Button

Continue

---

## Page 7: Check your answers

### Heading

Check your answers before submitting

### Summary list

Display:

- Report reason
- Passport ID
- Animal passport answer
- Microchip number (if provided)
- Additional information (if provided)

### Button

Submit

---

## Page 8: Confirmation page

### Heading

Report submitted

### Heading level 2

What happens next

### Content

Your report has been received and recorded.

The passport record will be reviewed and updated where necessary.

You do not need to take any further action unless we contact you for additional information.

### Content link

Return to pet passports

### Feedback content

What did you think of this service? (takes 30 seconds)
