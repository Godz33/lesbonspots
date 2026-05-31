# Security Specification: Australian Backpackers RV Market

## 1. Data Invariants
- Anyone can read the list of ads.
- Anyone can create an ad document if the schema is strictly respected.
- We must prevent malicious users from hacking existing ads or posting with unverified / oversized data.
- Fields like `isPremium` cannot be set to `true` by manual user input upon create; they must be defaulted to `false` or verified.
- ID format verification to avoid denial of wallet.

## 2. The "Dirty Dozen" Malicious Payloads
Here are the malicious payloads that must be rejected:
1. Missing title on creation
2. Price is negative
3. Mileage is a giant string instead of a positive integer
4. Rego state is invalid (e.g., "XYZ")
5. Vehicle type is invalid (e.g., "Spaceship")
6. `isPremium` forced to `true`
7. Title exceeds 200 characters limit
8. WhatsApp number too long / invalid
9. Submitting unknown fields ("Ghost Fields")
10. String payload for brand/model is 1MB large
11. Document ID too long / invalid characters
12. Attempting to delete an ad without permission / restriction

## 3. Test Runner Specification
The rules will ensure permissions are denied for any operations that violate these rules.
