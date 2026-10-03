---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

You are the lead engineer, product designer, UX engineer, QA engineer, and technical project manager for this existing wedding invitation website.

Your task is to COMPLETE the existing project to production-ready quality.

IMPORTANT: DO NOT rebuild the application from scratch. DO NOT replace working architecture just because another approach is easier. First inspect the existing repository, current components, database schema, routes, environment configuration, translations, design tokens, image manifest, admin system, invitation flow, RSVP flow, and Spotify integration. Preserve working functionality and improve or connect what already exists.

The existing project already contains substantial functionality around tokenized invitations, RSVP, song requests, admin authentication/dashboard, localization, image optimization, maps, tracking, and invitation rendering. The remaining objective is to connect everything into one coherent, polished, production-ready wedding experience rather than creating parallel implementations.

The current project audit should be treated as the starting technical context.

---

# 1. PRIMARY PRODUCT OBJECTIVE

The final website must feel like a premium, elegant, highly personalized wedding invitation rather than a generic wedding template.

The experience must combine:

- Austrian/Viennese royal-inspired elegance
- modern editorial web design
- refined typography
- cinematic transitions
- sophisticated photography
- subtle but high-quality motion
- personalized guest experience
- multilingual content
- secure invitation access
- admin-controlled guest management
- RSVP
- Spotify wedding playlist interaction
- invitation delivery through email and WhatsApp
- excellent mobile experience

The result must look intentionally designed for THIS wedding.

Do not use generic wedding-template sections merely because they are common.

---

# 2. LANGUAGES — REQUIRED

The website must support exactly these four guest-facing languages:

1. English
2. Spanish
3. German — Austrian German (`de-AT`)
4. Hungarian

The language system must be implemented consistently across:

- landing page
- guest verification
- invitation introduction
- invitation content
- navigation
- RSVP
- guest forms
- song requests
- validation errors
- success/error messages
- admin-facing guest language settings where relevant
- invitation delivery messages
- privacy/legal content
- buttons
- accessibility labels
- metadata where applicable

Do not create four separate implementations.

Use one shared component architecture with localized content.

Do not mix languages accidentally.

German must use Austrian wording where it materially differs from generic German.

Never hardcode translated strings directly inside React components when the existing i18n architecture can be used.

Before finishing, scan the application for:

- untranslated strings
- fallback-to-English leaks
- inconsistent capitalization
- duplicated translation keys
- broken interpolation variables
- missing validation messages
- incorrect language persistence

---

# 3. FIRST VISIT / INTRO EXPERIENCE

The public visitor must NOT immediately be dropped into a normal wedding webpage.

Create a premium opening sequence.

## Stage A — Language selection

The first interaction should be a beautiful animated language introduction.

Display the four languages:

- English
- Español
- Deutsch
- Magyar

The interaction should feel like part of the invitation design, not like a normal website settings dropdown.

The selected language must persist using the project's existing locale/cookie mechanism.

The UI must remain accessible:

- keyboard navigable
- screen-reader usable
- reduced-motion compatible
- no animation required to understand the content

---

# 4. GUEST IDENTIFICATION / PERSONALIZED ACCESS

After language selection, the guest must identify themselves.

The experience should feel elegant and welcoming, not like a login page.

The visitor should be able to enter one configured identifier:

- guest name
- email
- phone number

The system must normalize values before comparison.

Examples:

- phone number formatting differences must not prevent a valid match
- email matching must be case-insensitive
- names must handle normal whitespace/capitalization variations

Do not expose whether arbitrary people exist in the database.

Avoid revealing sensitive guest information through error messages.

Rate-limit repeated lookup attempts.

Return safe/generic messages when no match exists.

On successful verification:

1. Resolve the guest/invitation.
2. Resolve the preferred invitation language.
3. Create/use the secure invitation token.
4. Store only appropriate security-safe identifiers.
5. Open the personalized invitation experience.

The public user must NEVER gain access to another guest's invitation by manipulating IDs, query parameters, or frontend state.

The server/database must be the authority.

Do not rely on hiding data in the frontend.

---

# 5. PERSONALIZED INVITATION INTRO

After successful identification, show a cinematic personalized opening.

Example conceptual flow:

Language
↓
Guest identified
↓
Elegant welcome
↓
Animated invitation reveal
↓
Wedding introduction
↓
Full personalized invitation

The guest's name should appear naturally.

Do not overuse animation.

The animation should communicate ceremony, elegance, anticipation, and intimacy.

Use the existing `InvitationIntro` architecture where possible.

Keep the existing reduced-motion handling and improve it instead of removing it.

---

# 6. CINEMATIC INTRO VIDEO / ANIMATION

Create a premium transition between guest verification and the full invitation.

This may be:

- a short cinematic invitation video
- animated typography
- elegant illustrated motion
- a combination of video and vector animation
- animated floral/ornamental elements
- paper/invitation-opening effect
- architectural/Viennese visual transition

The animation must look custom.

DO NOT use:

- cheap Lottie-looking wedding templates
- generic CSS hearts
- bouncing icons
- basic floating circles
- childish wedding animations
- default Framer Motion demos
- generic stock wedding intro templates

The animation should use real visual assets.

Where custom graphics are required:

- generate them with a free AI/image-generation tool
- or create real vector artwork with a free design tool
- keep the source assets in the project
- prefer SVG/vector assets for ornaments
- optimize raster images before deployment

Do not fake complex vector artwork using dozens of primitive CSS shapes.

---

# 7. AUSTRIAN / IMPERIAL VISUAL LANGUAGE

Use visual inspiration from historic Austrian/Viennese imperial aesthetics without making the website falsely appear to be officially affiliated with the Austrian royal family.

Possible visual vocabulary:

- refined imperial ornament
- Viennese architectural motifs
- elegant botanical engraving
- subtle heraldic-inspired framing
- ornamental flourishes
- antique invitation borders
- classical symmetrical composition
- palace/interior architectural references
- premium paper texture
- elegant gold/metallic accents only where consistent with the supplied design
- sophisticated decorative separators

Do not simply paste an Austrian coat of arms into the UI.

Do not use unofficial heraldic elements as though they represent the couple.

The result should be inspired by the aesthetic language, not impersonate an official institution.

---

# 8. DESIGN SYSTEM — FOLLOW THE EXISTING FILE

The attached project documentation/reference represents the existing design direction.

DO NOT invent a new color palette.

First inspect the existing project for:

- CSS variables
- Tailwind configuration
- theme tokens
- typography
- font imports
- spacing system
- border radii
- shadows
- existing image treatments
- existing decorative assets
- animation timing
- mobile breakpoints

Maintain design consistency across every component.

Every section must use the same visual system.

Pay particular attention to:

- font hierarchy
- heading scale
- body text readability
- line height
- letter spacing
- button proportions
- icon sizing
- spacing rhythm
- image ratios
- section transitions
- alignment
- whitespace

No section should look like it came from a different template.

---

# 9. FULL INVITATION STRUCTURE

The full invitation should feel like one continuous editorial story.

Use the existing `WeddingSections` architecture rather than creating disconnected pages.

The invitation should include the relevant existing sections such as:

- personalized welcome
- wedding date
- countdown
- couple introduction/story
- photo story
- gallery
- ceremony
- reception
- locations/maps
- travel information
- accommodation
- dress code
- wedding music
- gifts
- RSVP

The sequence should make emotional sense.

Do not mechanically render every component simply because it exists.

Reorganize presentation where necessary while preserving the underlying architecture.

---

# 10. ADMIN — COMPLETE GUEST MANAGEMENT

The admin panel must become the central operational tool for the wedding.

Create a proper guest/invitation management workflow.

Admin must be able to:

- create guest
- edit guest
- delete guest
- activate/deactivate invitation
- regenerate invitation where appropriate
- assign invitation language
- add email
- add phone
- add WhatsApp number
- add group/family
- specify number of allowed attendees
- add plus-one allowance
- add internal notes
- see RSVP status
- see invitation status
- see invitation opened status
- see song requests
- see delivery status
- see timestamps
- copy invitation link
- preview personalized invitation

Use the existing secure admin architecture.

Do not expose administration functionality through public APIs.

Continue using:

- authenticated admin access
- allowlisted admin authorization
- audit logging
- destructive-action confirmation

The existing admin/auth/data structure should be extended rather than replaced.

---

# 11. INVITATION DELIVERY

The admin must be able to send an invitation to a guest.

Provide delivery actions such as:

EMAIL
WHATSAPP
COPY LINK

The system should record:

- delivery channel
- timestamp
- guest
- invitation
- delivery attempt
- success/failure
- relevant provider response where safe
- admin who initiated the action

Do not store sensitive provider credentials in the database.

Do not place secrets in client-side code.

Use environment variables/server-side secrets.

---

# 12. EMAIL DELIVERY

Implement actual invitation email functionality.

The email should be beautifully designed and localized.

The email must contain:

- couple names
- wedding invitation message
- personalized guest name
- wedding date
- invitation link
- selected language
- elegant branding
- fallback plain-text version

The invitation link must lead to the secure personalized invitation flow.

Do not send raw database IDs.

Use the secure invitation token system already present in the application.

Use a FREE service/tier only.

Before selecting or finalizing a provider, verify its current official free-tier/pricing and technical limitations.

Do not create a paid dependency for this wedding project.

Abstract the mail provider behind a small server-side service so the provider can be replaced later without rewriting the admin system.

---

# 13. WHATSAPP INVITATION

The admin must have a WhatsApp invitation workflow.

There must be a practical free option.

At minimum:

- normalize the WhatsApp number
- generate the personalized invitation message
- include secure invitation link
- provide a one-click WhatsApp action from the admin
- record that WhatsApp was initiated/generated

Where an actual WhatsApp Business API is required, do not pretend it is configured.

Do not build fake “sent successfully” behavior.

If the official WhatsApp API/provider requires configuration outside the free project, implement the free `wa.me`/WhatsApp deep-link fallback cleanly and make the provider integration replaceable later.

The UI must clearly distinguish:

- “Open WhatsApp to send”
from
- “Message sent through API”

Never claim a message was delivered when the app only opened a WhatsApp link.

---

# 14. PERSONALIZED INVITATION SECURITY

This is a wedding invitation, but guest data is still personal data.

Protect:

- guest names
- email addresses
- phone numbers
- WhatsApp numbers
- RSVP information
- internal admin notes

Use the existing hashed-token approach.

Do not expose raw invitation tokens in application logs or unnecessarily persist them.

Do not expose the guest table directly to the public client.

Use Supabase RLS and server-side authorization where applicable.

Keep service-role/secret credentials strictly server-side.

Supabase's current security guidance requires proper RLS/grants for exposed data and explicitly warns against exposing service-role credentials in the frontend.

---

# 15. GUEST LOOKUP DATA MODEL

Review the current schema and extend it only where necessary.

Ensure the guest model supports, at minimum:

- id
- full name
- normalized name
- email
- normalized email
- phone
- normalized phone
- WhatsApp number
- language
- invitation/token relation
- invitation active status
- guest group
- allowed guests
- RSVP status
- invitation open status
- delivery history
- notes
- created_at
- updated_at

Avoid unnecessary duplication.

Add appropriate database indexes for lookup fields.

Do not create overcomplicated abstractions.

---

# 16. RSVP

Complete and verify RSVP end-to-end.

Guest must be able to:

- confirm attendance
- decline
- specify attendees
- add plus-one where allowed
- provide required guest information
- submit safely
- receive localized success/error feedback

Server must validate:

- invitation ownership
- active invitation
- maximum attendee allowance
- plus-one constraints
- payload format
- duplicate/rapid submissions
- rate limits

Do not trust client-side validation alone.

The current project already has RSVP validation and server-side submission patterns; finish and test those instead of replacing them.

---

# 17. SPOTIFY WEDDING MUSIC

The final music experience must have two clearly separated functions:

## A. Wedding playlist

Show the wedding Spotify playlist.

Use the existing lazy Spotify playlist component.

It must have:

- elegant UI
- mobile compatibility
- localized text
- proper fallback when Spotify is unavailable
- no forced autoplay

## B. Guest song requests

Guests can submit up to THREE songs.

The experience should be:

Search Spotify
↓
Select song
↓
See selected songs
↓
Maximum 3
↓
Submit
↓
Success confirmation

Do not allow a fourth selection.

The UI must clearly explain that the three selected songs will become part of the wedding playlist.

---

# 18. ACTUAL SPOTIFY PLAYLIST ADDITION

Do not build a fake song request feature.

The desired production behavior is:

Guest selects track
↓
Server validates track
↓
Song request persisted
↓
Track is added to configured wedding Spotify playlist
↓
Success state shown

Use the current Spotify Web API playlist-item endpoint rather than the deprecated legacy playlist endpoint.

The current Spotify API uses:

`POST /playlists/{playlist_id}/items`

and playlist modification requires the relevant `playlist-modify-public` and/or `playlist-modify-private` OAuth scope.

Keep Spotify credentials and refresh tokens server-side.

Do not put Spotify secrets in React/client bundles.

Do not claim a song was added to Spotify if the provider request failed.

Persist request state such as:

- pending
- submitted
- added
- failed

Handle:

- duplicate submissions
- Spotify API errors
- expired tokens
- rate limits
- unavailable tracks
- invalid track IDs

The Spotify integration should remain provider-configurable.

---

# 19. PLAYLIST SAFETY

Do not allow arbitrary visitors to manipulate the wedding playlist directly.

Guests may request maximum 3 songs per invitation/guest according to the product rule.

Do not expose playlist credentials.

Do not allow the frontend to call privileged Spotify playlist-modification endpoints directly.

All modification must happen through secure server-side logic.

---

# 20. ANIMATION & MOTION QUALITY

Animation should be elegant and intentional.

Use motion for:

- invitation reveal
- page transitions
- typography
- ornament movement
- image reveal
- section entrances
- gallery interactions
- subtle hover interactions
- countdown
- musical interactions

Do not animate everything.

Avoid:

- bouncing cards
- excessive parallax
- random floating elements
- basic transform demos
- excessive blur
- distracting gradients
- excessive particle effects
- generic “AI website” visual patterns

Respect:

- `prefers-reduced-motion`
- mobile performance
- low-power devices
- accessibility
- page loading speed

---

# 21. REAL VISUAL ASSETS

Do not use placeholder shapes where a real asset is expected.

For custom artwork use:

- free AI image generation
- free vector-design tools
- free illustration tools
- properly licensed free assets

Generate custom:

- floral ornaments
- invitation borders
- ornamental separators
- imperial/Viennese decorative motifs
- subtle background textures
- elegant graphical elements

Whenever possible, create SVGs or optimized WebP/AVIF assets.

Do not use watermarked images.

Do not use assets with unclear licensing.

Do not use paid stock resources.

Maintain an organized `/public` or existing project asset structure.

Update the project's image manifest/optimization pipeline rather than bypassing it.

The existing application already has an image optimization/manifest architecture; preserve this system.

---

# 22. FREE-INFRASTRUCTURE REQUIREMENT

The complete implementation must be deployable using free resources or free tiers suitable for this wedding project.

Primary infrastructure:

- Vercel
- Supabase

Vercel's current Hobby plan is $0/month, so do not introduce infrastructure that unnecessarily requires a paid Vercel tier.

For every external service:

1. verify current official pricing
2. verify the free-tier limitations
3. document any required configuration
4. avoid paid dependencies
5. provide a graceful fallback when a provider is unavailable

Do not introduce:

- paid animation libraries
- paid stock photography
- paid fonts
- paid CMS platforms
- paid analytics
- paid map services
- unnecessary SaaS subscriptions

Prefer existing libraries and browser capabilities.

---

# 23. MAPS

Keep map functionality lightweight.

The existing application already lazy-loads the map.

Maintain:

- lazy loading
- mobile usability
- ceremony/reception markers
- external directions
- privacy-conscious tracking

Do not load a heavy map stack during the initial page render.

---

# 24. PRIVACY / GDPR

Because guests are being identified using personal information, review the privacy implementation.

The application already has a localized privacy layer; update it to accurately reflect the actual services and data collected.

Document only what the application actually collects.

Do not add third-party analytics simply because it is available.

Do not add unnecessary trackers.

Avoid collecting:

- precise location
- unnecessary device fingerprints
- unnecessary behavioral data

Keep the existing minimal first-party event model.

---

# 25. ADMIN DASHBOARD UX

The admin dashboard should make the wedding operationally manageable.

Provide a clean overview:

Guests
Invitations
RSVPs
Opened
Pending
Songs
Delivery status

Provide useful filtering/search.

Examples:

- search guest
- filter by language
- filter by RSVP
- filter by invitation status
- filter by delivery status
- filter by group/family

Make the admin interface usable on desktop and tablet.

Do not overbuild it into a generic CRM.

---

# 26. ADMIN INVITATION PREVIEW

Admin must be able to preview an invitation using the real guest data.

The preview should show:

- correct guest name
- correct language
- correct personalized content
- invitation status
- expected RSVP state
- correct link

Provide a safe preview mechanism without exposing production invitation secrets unnecessarily.

---

# 27. INVITATION LINK

Use a secure tokenized URL architecture.

Example concept:

`/i/[secure-token]`

The server resolves the hashed token.

Do not change this architecture unnecessarily.

Do not:

- expose raw guest database IDs
- put email/phone in URLs
- place sensitive data in query parameters
- make invitation access dependent on client-side localStorage alone

The audit confirms the current tokenized invitation approach already exists and should be preserved.

---

# 28. PERFORMANCE

The final website must feel fast despite cinematic design.

Optimize:

- hero images
- video
- gallery
- fonts
- JS bundle
- map
- Spotify embed
- animations

Use lazy loading for non-critical media.

Do not sacrifice the premium visual experience, but do not make every asset load on first paint.

Pay particular attention to mobile devices.

---

# 29. MOBILE-FIRST EXPERIENCE

Assume many guests will open the invitation from WhatsApp on a phone.

Therefore the mobile experience is critical.

Test at minimum:

- iPhone-sized viewport
- Android-sized viewport
- desktop
- tablet

Verify:

- no horizontal scrolling
- readable text
- buttons easy to tap
- intro animation fits the viewport
- invitation video does not overflow
- gallery works with touch
- maps remain usable
- RSVP is easy to complete
- Spotify area works
- guest name displays correctly
- menu/navigation remains accessible
- safe-area handling where relevant

---

# 30. ACCESSIBILITY

Maintain:

- semantic HTML
- labels
- keyboard support
- visible focus
- accessible contrast
- reduced motion
- alt text
- meaningful button names
- proper form error messages

Do not use animation as the only way to communicate state.

---

# 31. SEO / SHARING

The public site may be shareable, but personalized guest details must not leak into public metadata.

Review:

- metadata
- favicon
- Open Graph
- social preview
- canonical handling
- robots behavior where appropriate

Public metadata should describe the wedding site without revealing guest personal information.

---

# 32. TESTING REQUIREMENTS

Do not declare the project complete until the following work end-to-end.

## Guest tests

Test:

- valid name lookup
- valid email lookup
- valid phone lookup
- invalid lookup
- rate-limit behavior
- correct guest language
- correct personalized greeting
- valid invitation token
- invalid token
- expired/deactivated invitation
- invitation opening tracking
- language switching
- RSVP yes
- RSVP no
- plus-one allowed
- plus-one not allowed
- attendee-limit validation
- duplicate/rapid RSVP
- song selection 1
- song selection 2
- song selection 3
- attempt to select 4
- song submission
- Spotify failure
- Spotify success
- mobile invitation

## Admin tests

Test:

- admin login
- unauthorized admin access
- create guest
- edit guest
- delete guest
- disable invitation
- enable invitation
- invitation preview
- copy invitation link
- send email
- WhatsApp action
- delivery logging
- RSVP visibility
- song requests visibility
- filtering
- search
- export if implemented

## Security tests

Test:

- unauthorized guest cannot access another invitation
- manipulated invitation token fails
- public client cannot read guest table directly
- service role never reaches client bundle
- API payload validation
- rate limiting
- RLS behavior
- admin authorization
- destructive confirmation
- sensitive information is not exposed in errors

---

# 33. DATABASE / SUPABASE

Before writing new tables or migrations:

1. inspect current schema
2. inspect current migrations
3. inspect actual application queries
4. identify mismatches
5. make the smallest safe migration necessary

Do not duplicate tables or create competing models for the same concept.

Verify:

- indexes
- constraints
- foreign keys
- RLS
- grants
- server-only access
- migration reproducibility

Add tests for RLS policies where appropriate.

Supabase currently recommends validating both RLS policies and underlying grants because policies alone do not fully define Data API access.

---

# 34. ENVIRONMENT CONFIGURATION

Audit every environment variable.

Create/update:

- `.env.example`
- setup documentation
- required secrets list
- optional secrets list
- local-development instructions
- Vercel deployment instructions
- Supabase setup instructions
- Spotify setup instructions
- email provider setup instructions

Never commit real credentials.

Clearly distinguish:

PUBLIC CONFIG
from
SERVER-ONLY SECRET CONFIG

---

# 35. ERROR HANDLING

Every external integration needs honest failure states.

Do not show:

“Success”

when an API call failed.

Use:

- loading
- success
- recoverable error
- permanent error
- retry

Provide human-friendly localized error messages.

Log technical details server-side without exposing secrets.

---

# 36. CONTENT QUALITY

Review every visible piece of copy.

The final copy should feel:

- romantic
- elegant
- warm
- personal
- sophisticated
- natural

Avoid generic wedding clichés unless they fit the chosen tone.

Do not use placeholder text.

Where factual wedding details are unknown, preserve explicit TODO/config fields rather than inventing information.

---

# 37. IMPORTANT DESIGN RULE

The final website must NOT look like:

“a developer assembled components from a template.”

It should feel like:

“a professionally art-directed digital wedding invitation.”

Every major section must visually belong to the same story.

---

# 38. IMPLEMENTATION WORKFLOW

Follow this exact order.

PHASE 1 — AUDIT

Inspect the whole repository.

Identify:

- existing components
- routes
- APIs
- Supabase schema
- translations
- styles
- assets
- environment variables
- tests
- technical debt
- incomplete implementations

Create a concise internal implementation checklist.

Do not start coding blindly.

PHASE 2 — ARCHITECTURE GAP ANALYSIS

Map each requirement in this prompt to:

- existing implementation
- partial implementation
- missing implementation
- needs redesign
- needs configuration
- needs testing

Avoid duplicate implementations.

PHASE 3 — DATA / SECURITY

Finish:

- guest model
- invitation model
- secure lookup
- token flow
- RLS
- admin authorization
- audit events
- rate limiting

PHASE 4 — ADMIN

Finish:

- guest CRUD
- invitation lifecycle
- delivery actions
- preview
- status tracking
- song request management

PHASE 5 — GUEST ENTRY EXPERIENCE

Finish:

- language selector
- guest verification
- personalized transition
- invitation intro animation

PHASE 6 — VISUAL ART DIRECTION

Finish:

- typography
- spacing
- colors from existing design system
- Austrian/Viennese-inspired ornaments
- custom visual assets
- animation system
- photography
- gallery

PHASE 7 — RSVP + SPOTIFY

Finish and test:

- RSVP
- song requests
- three-song limit
- actual Spotify playlist addition
- fallback states

PHASE 8 — INVITATION DELIVERY

Finish:

- email delivery
- localized message
- WhatsApp workflow
- secure links
- logging

PHASE 9 — RESPONSIVE / ACCESSIBILITY

Test all critical flows on desktop and mobile.

PHASE 10 — PRODUCTION HARDENING

Verify:

- environment variables
- Supabase
- migrations
- RLS
- secrets
- Vercel
- API errors
- rate limits
- privacy
- build
- lint
- tests

PHASE 11 — FINAL VISUAL QA

Review the website as an actual wedding guest.

Ask:

Does the intro feel special?
Does the invitation feel personalized?
Does the visual language feel coherent?
Does anything look generic?
Does anything look unfinished?
Does mobile feel premium?
Does any animation feel cheap?
Are typography and spacing harmonious?

Fix everything found.

---

# 39. DO NOT STOP AFTER ONE SUCCESSFUL BUILD

A successful `npm run build` does NOT mean this task is complete.

The final acceptance criteria require:

- application builds
- lint passes
- tests pass
- critical flows work
- database schema is synchronized
- environment configuration is documented
- invitation verification works
- guest personalization works
- admin workflow works
- email workflow works
- WhatsApp workflow works/falls back honestly
- Spotify requests work
- three-song limit works
- Spotify playlist addition is real
- multilingual content works
- mobile layout works
- accessibility works
- reduced-motion works
- privacy/security requirements are satisfied

---

# 40. ACCEPTANCE CRITERIA

Do not report “finished” until every requirement below has a verified implementation or an explicitly documented external configuration dependency.

[ ] English
[ ] Spanish
[ ] Austrian German
[ ] Hungarian

[ ] Language selection intro
[ ] Guest identification
[ ] Name lookup
[ ] Email lookup
[ ] Phone lookup
[ ] Secure personalized invitation
[ ] Personalized guest name
[ ] Cinematic invitation introduction
[ ] Austrian/Viennese-inspired visual direction
[ ] Existing design system preserved
[ ] Custom real visual/vector assets
[ ] No paid visual assets
[ ] Admin guest management
[ ] Email field
[ ] Phone field
[ ] WhatsApp field
[ ] Invitation sending
[ ] Email delivery
[ ] WhatsApp workflow
[ ] Copy invitation link
[ ] RSVP
[ ] Plus-one rules
[ ] RSVP validation
[ ] Spotify playlist
[ ] Guest song requests
[ ] Maximum 3 songs
[ ] Real Spotify playlist addition
[ ] Song request state
[ ] Admin song visibility
[ ] Maps
[ ] Gallery
[ ] Countdown
[ ] Privacy page
[ ] RLS
[ ] Admin authorization
[ ] Secure tokens
[ ] Rate limits
[ ] Audit logging
[ ] Mobile responsive
[ ] Accessibility
[ ] Reduced motion
[ ] Performance optimization
[ ] Production environment validation
[ ] Deployment documentation
[ ] End-to-end tests

---

# 41. FINAL REPORT TO PROVIDE AFTER IMPLEMENTATION

When implementation is complete, provide a structured final report with:

1. WHAT ALREADY EXISTED
2. WHAT YOU CHANGED
3. WHAT FILES YOU CREATED/UPDATED
4. DATABASE/MIGRATION CHANGES
5. ENVIRONMENT VARIABLES REQUIRED
6. EXTERNAL SERVICES REQUIRED
7. WHAT IS FULLY WORKING
8. WHAT REQUIRES MANUAL CONFIGURATION
9. WHAT WAS TESTED
10. TEST RESULTS
11. PRODUCTION DEPLOYMENT CHECKLIST
12. ANY KNOWN LIMITATIONS

For every feature that cannot be fully activated without an external credential or account, say so explicitly.

Never fake successful integration.

Never leave silent TODOs.

Do not finish by saying “the rest can be done later.”

The goal is a coherent, elegant, secure, multilingual, personalized wedding invitation product that is genuinely ready to deploy on the free infrastructure available for this project.