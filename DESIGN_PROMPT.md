# Prompt for ChatGPT: Storyland Quest art and web design

Paste everything in the box below into ChatGPT. Save each image it makes as a PNG
with the exact file name listed, into `storyland-quest/public/assets/`.
The site picks up any file that is there and keeps the emoji for anything missing,
so you can add art a few pieces at a time.

```text
You are the art director and UI designer for "Storyland Quest", a reading game website for children in Grades 1–6 (ages 6–11).

WHAT THE WEBSITE IS
Storyland Quest helps kids who have fallen behind in reading. Word monsters have scrambled the land of Storyland. The child picks a mystery egg, and it hatches into a pet that fights beside them. Each "battle" is a short set of reading questions (rhymes, spelling, word meanings, building sentences, putting events in order, reading stories, writing). Correct answers make the pet attack and drain the monster's health bar. Monsters are never hurt: when beaten they become friends. Winning gives coins, a treasure chest and pet energy. Coins are spent in a pet shop on food, hats, new worlds (backgrounds), power-ups and new eggs. Pets evolve through 4 stages: egg, baby, teen, legendary. An AI guide, a friendly orange fox called Pip, writes choose-your-own-adventure stories starring the child's pet, explains mistakes kindly, and builds special boss missions from what the child needs to practise. Teachers and parents get a separate, calmer dashboard.

FEELING
Bright, joyful, adventurous, a bit magical. It should feel like a real game a kid chooses to play, not homework. Friendly and safe: nothing scary, no weapons, no blood, no angry faces. Monsters are silly and mischievous.

ART STYLE (keep identical across every image)
- Chunky 3D-cartoon / vinyl-toy look: soft rounded shapes, big expressive eyes, thick clean silhouettes, glossy highlights, soft shadow underneath.
- Saturated candy palette. Main purple #6C4CF1, sunny gold #FFD23F, coral #FF8A5B, mint #2FBF71, sky blue #3D9DF2, pink #EF5DA8, teal #19B5B0, deep ink #2B2350.
- Every character faces slightly toward the viewer, centred, filling about 80% of the frame.
- All original designs. Do not copy or resemble characters from any existing game, show or brand.
- No text, letters or numbers inside any image.

STEP 1 – STYLE SHEET AND SCREEN MOCKUPS (do this first and show me before continuing)
a) One style sheet image showing Pip the fox, one pet at all 4 stages, two monsters, a coin and the colour palette.
b) Four website screen mockups at 1440×900: (1) title screen with player select, (2) world map with 7 islands plus the pet card and a glowing "AI Mission" button, (3) battle screen: pet on the left, monster on the right, health bar between them, question card with four big answer buttons below, (4) pet home and shop. Big rounded buttons, large readable text, plenty of space. These mockups are a design reference for the developer.

STEP 2 – GAME ASSETS
After I approve the style, generate each asset below as its own image: square 1024×1024 PNG with a fully transparent background (except the backgrounds group). Work through one group at a time and label each image with its file name.

Core
- logo.png – Pip the fox hugging an open glowing book (no text)
- coin.png – shiny gold coin with a star on it
- chest_closed.png – wooden treasure chest, closed, glowing seams
- chest_open.png – same chest open, bursting with coins and sparkles

Pip the fox guide
- pip_happy.png – waving, smiling
- pip_cheer.png – jumping with arms up, confetti
- pip_think.png – paw on chin, small sparkles around head (used while the AI is "thinking")

Pets – 4 families × 4 stages. Stage 1 is a patterned egg, stage 2 a cute baby, stage 3 a confident teen, stage 4 a majestic but still friendly legendary form. Keep each family's colours consistent across stages.
- pet_dragon_1.png … pet_dragon_4.png – fire dragon, coral and gold
- pet_bird_1.png … pet_bird_4.png – sky bird, blue and white
- pet_sea_1.png … pet_sea_4.png – sea creature, teal (fish-like baby to friendly whale)
- pet_cat_1.png … pet_cat_4.png – wild cat, gold and orange (kitten to lion)

Word monsters – silly, mischievous, never scary
- monster_phonics.png – Echo Blob: bouncy jelly blob with big ears and musical notes
- monster_spelling.png – Jumble Troll: small troll juggling blank letter blocks
- monster_vocab.png – Word Croc: grinning crocodile wearing reading glasses
- monster_grammar.png – Mix-Up Bot: wobbly robot with tangled wires
- monster_sequence.png – Time Twister: little tornado with a clock face (no numbers)
- monster_reading.png – Fog Ghost: soft friendly cloud-ghost holding a lantern
- monster_writing.png – Ink Squid: purple squid holding pencils
- monster_placement.png – Target Bot: round training robot with a bullseye tummy
- monster_mission.png – Riddle Master: boss character, a caped trickster owl with a question-mark-shaped staff (shape only, no text)

Map islands – small floating islands, three-quarter view
- isle_phonics.png – Sound Island: palm trees and giant seashell speakers
- isle_spelling.png – Spell Castle: purple castle made of blank letter blocks
- isle_vocab.png – Word Jungle: lush jungle with hanging vines and a treehouse
- isle_grammar.png – Sentence Station: little train station with a colourful train
- isle_sequence.png – Order Orchard: apple trees in neat rows with stepping stones
- isle_reading.png – Story Mountain: pink mountain with a path shaped like an open book
- isle_writing.png – Writer's Cove: beach cove with a giant pencil lighthouse
- isle_stickers.png – a fat sticker album with stars on the cover

Shop items
- item_apple.png, item_cookie.png, item_cake.png (star-topped cake)
- item_hint.png – glowing green potion bottle with a lightbulb-shaped cork
- item_magnet.png – red horseshoe magnet pulling coins
- hat_cap.png, hat_bow.png, hat_shades.png (sunglasses), hat_tophat.png, hat_grad.png (graduation cap), hat_crown.png – each drawn alone, front view, so it can sit on a pet's head
- theme_sky.png, theme_jungle.png, theme_ocean.png, theme_candy.png, theme_space.png – small round badge icons for each world

Backgrounds – 1920×1080 PNG, NOT transparent, soft and low-contrast so text and white cards stay readable on top, with the busiest detail near the edges
- bg_sky.png – sunny sky with fluffy clouds and distant floating islands
- bg_jungle.png, bg_ocean.png (underwater), bg_candy.png, bg_space.png

Before each group, restate the style rules to yourself so everything matches the approved style sheet.
```

## After ChatGPT is done

1. Put the PNGs in `storyland-quest/public/assets/` with the exact names above.
2. Put the four screen mockups anywhere in the project (for example `storyland-quest/design/`).
3. Tell Claude the art is in, and it will rebuild the look of the site around it.
