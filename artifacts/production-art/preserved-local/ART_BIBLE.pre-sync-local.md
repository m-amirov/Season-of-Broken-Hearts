# Season of Broken Hearts — Art Bible (Stage 5 pilot proposal)

Status: `PROPOSED_NOT_APPROVED`  
Scope: EP1 vertical slice, bounded art pilot only  
Source HEAD: `04db0cc35748d80e497ee022750a5bc4f40c848e`

## Gate state

This is the first project-owned Art Bible for the Stage 5 pilot. It is not an
approval of production art and does not replace the missing
`docs/CODEX_STAGE5_ART_PILOT.md`, which is absent from both the current checkout
and `origin/main`. No runtime mapping or placeholder asset has been changed by
this document.

The direction below is a bounded proposal for a comparative character contact
sheet. It must be reviewed against real generated pixels before any pilot CG is
authorized. The four pilot CGs remain out of scope until the visual direction
is explicitly approved.

## Chosen visual direction

**Mediterranean editorial gouache:** cinematic digital painting with visible,
controlled brush grain; warm limestone and sun-bleached fabric; restrained
sea-glass blues; deep indigo evening contrast; natural skin texture; human-eye
camera and quiet, observant framing. The image should feel like a literary
travel magazine illustration that has been allowed to keep its imperfections,
not like a glossy game UI or a photorealistic stock photograph.

The style has one rendering language across all characters and locations:
softly blocked color masses, selective dry-brush edges, modest atmospheric
perspective, realistic proportions, and lighting that carries scene time. Faces
remain readable at the mobile dialogue crop. No text, interface, captions or
decorative labels are baked into art.

## Palette and light

- limestone: `#D8C4A4`, sunlit cream `#F3E6C8`;
- terracotta: `#A65C43`, muted coral `#C98268`;
- sea-glass: `#6F9D9A`, deep water `#244A5A`;
- evening indigo: `#1C2840`, blue shadow `#334761`;
- accent gold: `#D6A86A`, used sparingly for reflected light, never as a UI
  substitute.

Daylight is warm and directional, with cool reflected fill from the sea.
Evening is indigo and low-contrast at the edges but preserves eye light and
hands. Avoid a universal blue-purple gradient, neon rim light and blown white
backgrounds.

## Character canon anchors

The anchors below derive from `narrative/NARRATIVE_BIBLE.md` and
`docs/CONCEPT.md`. They are identity constraints, not generated-image proof.

### Nika Vorontsova

28; event organiser; observant, practical, recently left a broken engagement.
Compact dark ash-brown bob at jaw length, alert grey-hazel eyes, composed mouth,
warm-neutral complexion. Wardrobe: practical cream linen shirt, rust or faded
coral layer, dark navy trousers; functional, elegant, never decorative for its
own sake. Her posture is balanced and slightly guarded; she looks as if she has
already found the operational problem in the room.

### Matteo Ricci

33; Villa Serena owner. Tall, lean, dark wavy hair, controlled brown eyes,
quietly tired expression. Wardrobe: white or stone linen shirt, deep navy
trousers, one understated watch. Straight stance and economical gestures; no
smirk, luxury-brand signalling or possessive body language. His visual tension
is responsibility turning into control.

### Elio Benedetti

30; chef. Warm olive complexion, dark loose curls, expressive brown eyes,
short stubble kept natural. Wardrobe: rolled-sleeve pale shirt under a faded
terracotta apron or overshirt, practical but not costume-like. Open shoulders,
weight slightly off-centre, a smile that can recede when the subject becomes
serious. Humour is an invitation to breathe, not a clown identity.

### Leonardo “Leo” Vitale

31; architect on the Villa Serena survey. Angular but natural face, dark brown
hair with a soft wave, green-grey eyes, restrained expression. Wardrobe:
charcoal overshirt, washed blue-grey tee, weathered leather detail kept
subordinate to the face. His hands and shoulders show held-back speech; no
brooding villain shorthand. Blueprint tube or rolled drawings are allowed only
when the authored cue explicitly calls for them.

## Shared composition rules

- Character studies use the same 3/4 waist-up camera, natural human-eye height,
  and approximately normal-lens perspective.
- All four characters share a neutral limestone/sea-light environment so scale,
  skin rendering and edge treatment can be compared directly.
- Keep clear negative space around the head and chest; no crop through eyes,
  hands or jaw. Preserve a deliberate lower-third safety area for later mobile
  dialogue overlays.
- Portrait derivatives are consciously composed, not squeezed landscape crops.
  Use a waist-up or mid-thigh crop when a full figure would distort anatomy.
- Expressions are specific and quiet: attentive, controlled, warm, or guarded.
  Do not make all characters smile or turn every conflict into glamour.
- Backgrounds establish a supporting surface and horizon. Characters must not
  float, sink into reflective pavement or stand in ambiguous floodwater.

## Pilot contact sheet brief

The contact sheet compares Nika, Matteo, Elio and Leo in the same direction. It
is an exploration artifact, not a shipped asset and not a final character
sheet. It must contain no readable text, logo, watermark, UI, or baked dialogue.
The sheet must be created from actual native image output and retain its raw
source plus checksum. Any crop used as a later reference must record its parent
sheet and transformation.

## Approval and stop line

Approval requires an explicit owner decision after inspecting the actual
contact-sheet pixels. If identity, anatomy, material language, or mobile-safe
framing is materially wrong, do not start the four-CG batch. The current task
stops before generation because the authoritative Stage 5 contract is missing
and CEOS source-bound briefs require real local character-reference images.
