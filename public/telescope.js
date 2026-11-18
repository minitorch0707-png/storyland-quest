/* Synthetic telescope case from the Storyland handoff (kind: synthetic-offline-practice). */
window.SQ_TELESCOPE = {
 "kind": "synthetic-offline-practice",
 "generatorInput": {
  "sourceVersion": "telescope-v1",
  "subject": "Ontario Language",
  "gradeBand": "Grades 3–4",
  "questionReadingLoad": "At most 20 words per stem. Use familiar short words in options and hints.",
  "skillId": "inference_causal",
  "skillDescription": "Use clues in the text to infer why a character or object did something.",
  "evidenceStrength": "repeated",
  "passage": [
   {
    "id": "s1",
    "text": "Rin set a telescope beside a red bench."
   },
   {
    "id": "s2",
    "text": "A tall tree hid the moon from that spot."
   },
   {
    "id": "s3",
    "text": "Rin carried the telescope to the open field."
   },
   {
    "id": "s4",
    "text": "From the field, Rin could see the moon through the lens."
   },
   {
    "id": "s5",
    "text": "When the wind shook the tripod, the moon slid out of view."
   },
   {
    "id": "s6",
    "text": "Rin moved the tripod behind a stone wall, where the air was still."
   },
   {
    "id": "s7",
    "text": "The moon stayed in view long enough for Rin to draw it."
   }
  ],
  "attempts": [
   {
    "id": "a1",
    "sourceId": "anchor-a",
    "firstAttempt": true,
    "assisted": false,
    "stem": "Why did Jo move the plant away from the window?",
    "context": "Jo put a plant by the green window. A cold draft blew on its leaves. Jo moved the plant to a warm shelf.",
    "selected": "The window was green.",
    "correct": "The draft was cold.",
    "observedPattern": "selected_visible_detail_over_cause"
   },
   {
    "id": "a2",
    "sourceId": "anchor-b",
    "firstAttempt": true,
    "assisted": false,
    "stem": "Why did Cam bring the blanket inside?",
    "context": "Cam spread a striped blanket on the grass. Dark clouds gathered, and rain began to fall. Cam brought the blanket inside.",
    "selected": "The blanket had stripes.",
    "correct": "It began to rain.",
    "observedPattern": "selected_visible_detail_over_cause"
   }
  ]
 },
 "fixedBankBaseline": {
  "id": "bank-causal-01",
  "context": "Mira took her paper kite down. The string had begun to tear.",
  "question": "Why did Mira take down her kite?",
  "options": [
   "The string was tearing.",
   "The kite was made of paper.",
   "Mira wanted to find a kite.",
   "The kite had a short tail."
  ],
  "correctIndex": 0
 },
 "offlinePractice": {
  "status": "draft",
  "skillId": "inference_causal",
  "sourceVersion": "telescope-v1",
  "evidenceStrength": "repeated",
  "teacherNote": "In a1 and a2, the learner selected a visible detail. In both cases the chosen detail did not explain the action.",
  "items": [
   {
    "id": "fixture-1",
    "difficulty": "guided",
    "question": "Why did Rin carry the telescope to the field?",
    "options": [
     {
      "id": "a",
      "text": "To see past the tree."
     },
     {
      "id": "b",
      "text": "To sit on the red bench."
     },
     {
      "id": "c",
      "text": "To hide from the wind."
     },
     {
      "id": "d",
      "text": "To put away the lens."
     }
    ],
    "correctId": "a",
    "citations": [
     {
      "sentenceId": "s2",
      "quote": "A tall tree hid the moon from that spot."
     },
     {
      "sentenceId": "s4",
      "quote": "From the field, Rin could see the moon through the lens."
     }
    ],
    "hint": "Read what hid the moon. What changed when Rin moved?",
    "feedbackByOption": {
     "a": "Yes. The tree blocked the view by the bench. From the open field, Rin could see the moon.",
     "b": "The bench tells you where Rin started. What made the moon hard to see there?",
     "c": "Wind caused a problem later. Look for what blocked the moon at the first spot.",
     "d": "Rin still used the lens in the field. Look for what had been in the way."
    }
   },
   {
    "id": "fixture-2",
    "difficulty": "independent",
    "question": "How did the wall help Rin finish the drawing?",
    "options": [
     {
      "id": "a",
      "text": "It made the moon brighter."
     },
     {
      "id": "b",
      "text": "It helped keep the tripod still."
     },
     {
      "id": "c",
      "text": "It held the drawing up."
     },
     {
      "id": "d",
      "text": "It moved the red bench."
     }
    ],
    "correctId": "b",
    "citations": [
     {
      "sentenceId": "s5",
      "quote": "the wind shook the tripod"
     },
     {
      "sentenceId": "s6",
      "quote": "behind a stone wall, where the air was still"
     },
     {
      "sentenceId": "s7",
      "quote": "The moon stayed in view long enough for Rin to draw it."
     }
    ],
    "hint": "Compare what happened in the wind with what happened behind the wall.",
    "feedbackByOption": {
     "a": "The story describes a change in the wind. What did the wind do to the tripod?",
     "b": "Yes. The tripod stopped shaking in the still air, so Rin could keep looking at the moon.",
     "c": "Rin drew the moon after it stayed in view. Look for what made the view steady.",
     "d": "The bench was at the first spot. Look at what happened after the tripod moved."
    }
   }
  ]
 }
};
