# Livestock Movement Notification

## Start Page

Notify a livestock movement.

---

## Page: Animal Type

Question:
What type of animal are you moving?

Type:
Radios

Options:
- Cattle
- Sheep
- Goats
- Other

Required

---

## Page: Other Animal

Display if:

Animal Type = Other

Question:
Describe the animal type

Type:
TextField

Required

---

## Page: Number Of Animals

Question:
How many animals are being moved?

Type:
NumberField

Validation:
- Required
- Minimum 1
- Maximum 1000

---

## Page: Movement Type

Question:
What type of movement is this?

Type:
Radios

Options:
- To market
- To slaughterhouse
- Between holdings

Required

---

## Page: Destination Holding

Display if:

Movement Type = Between holdings

Question:
Enter destination holding number

Type:
TextField

Validation:
- Required
- Length exactly 9 characters

---

## Page: Movement Date

Question:
When will the movement take place?

Type:
DatePartsField

Validation:
- Required
- Cannot be in the past

---

## Check Answers

Section 1: Animals

- Animal type
- Number of animals

Section 2: Movement

- Movement type
- Destination holding

Section 3: Date

- Movement date

---

## Confirmation

Title:
Movement recorded

Body:
Your livestock movement notification has been submitted successfully.