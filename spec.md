This is a mockup for an application form for people getting a short term rental (STR) permit so they can legally rent their property on platforms like AirBnb.

Nothing will be connected to real systems; all data will be mocked.

There is no need to write any copy -- e.g. no landing page, no extra instructions, etc. This is just focused on trying out different things for the application form itself.

The form will be multi-part. For starters, let's do a single-page form, where each section is progressively revealed when the previous section is complete.

The first step will be Applicant Contact Information.

- applicant name
- phone number (optional)
- email

Email and phone should be validated with whatever the industry standard regex is.

Once they enter at least a name and email, the button to continue to the next section will be enabled.

The next step is Property Selection. This is where they search for their property. There will be two options for searching: PAN (Property Account Number) and Address.

Addresses can auto-complete. If the user selects an auto-completion, it will immediately be used without needing to press the "search" button.

If the PAN or Address is valid, some information about the property appears. This includes: a photo of their house, the PAN, the address, and the owner name.

The button to continue to the next section will be enabled.

This section will get some more information from the user.

It will ask if they are the owner. If the answer is no, a file upload component will appear asking them to upload a signed and notarized document from the property owner stating that the applicant has the right to rent the property out.

We may add more things later to this section, but that's it for now. Once they have completed the question, the option to continue will be enabled.

The next section is where they select the units they want to rent. This requires some explanation:

A permit application applies to a single PAN. Within the application, they can apply for multiple permits for separate "units" that are on that PAN, for example if the owner has multiple separate cabins.

Each unit, by law, will be required to have an address. These addresses will have been already issued before the applicant starts the application process, and the system will know what addresses are associated with a PAN.

There are three different types of units: single room, whole house, and ADU (Accessory Dwelling Unit).

There will be a number input box that starts at 1 (which is the minimum) for the number of units they're applying for. 20 is the max.

For however many units they've indicated, a card will appear. This card will start with a dashed border to indicate that it's incomplete. It will have two dropdowns: one to select the unit type, and one to select the address.

If an ADU type shares an address with any other unit, all such cards will be highlighted and a error message will appear that the ADUs should have unique addresses. This will block continuing to the next section.

It is okay for rooms and houses to share addresses with each other.

The "continue to payment" options will be enabled when all units they have selected have had their type and address set.

The "continue to payment" button will just open an alert saying "demo over".

Technical considerations:

- the file upload should support drag-n-drop
- split things into components where they make sense
  - file upload (because we'll probably end up reusing it)
  - the whole unit selection section, because it's complex
  - whatever else makes sense
- use semantic HTML
- make sure everything is accessible
- add comments when needed to clarify any tricky or unusual code, or to explain that a specific choice was made due to a requirement I specified
- this project was created from the official vue starting template; feel free do delete/overwrite anything you see.
- for the component tests, only test behavior, not presentation.

For demo data, start with just one example property that has 5 address. There should be a main house address of `123 Main St`, and the others should be things like:

```
123 Main St
Cabin A

123 Main St
Unit 14

etc.
```

For showing off auto complete, have a few other `Main St` addresses. Don't include the unit addresses -- in the real system we know whether an address is primary or not, and will be filtering out the unit addresses.

If the user selects one of those other properties, show a message saying "no demo data; use `123 Main St`."
