/* Storyland Quest – question banks for the new subject worlds and for Writer's Cove battles.
   Each entry: [question, correct answer, [three wrong answers], hint, explanation].
   The subject banks are PROTOTYPES written by Claude for the demo. They are not reviewed against any curriculum.
   The game keeps each world locked until a teacher approves its set in the Teacher dashboard. */
window.SQ_SUBJECTS = {
  status: 'prototype',
  banks: {
    math: [
      ['▰▱▱▱<br>Which fraction of this bar is shaded?', '1/4', ['3/4', '1/3', '4/1'], 'Count the shaded parts, then count all the parts.', '1 of the 4 equal parts is shaded, so the fraction is 1/4.'],
      ['▰▰▰▱<br>Which fraction of this bar is shaded?', '3/4', ['1/4', '3/3', '4/3'], 'The bottom number is how many parts in all.', '3 of the 4 equal parts are shaded, so the fraction is 3/4.'],
      ['▰▰▱▱▱▱<br>Which fraction of this bar is shaded?', '2/6', ['4/6', '2/4', '6/2'], 'Count all the parts for the bottom number.', '2 of the 6 equal parts are shaded, so the fraction is 2/6.'],
      ['Which is the biggest piece of the same pizza?', '1/2', ['1/4', '1/8', '1/16'], 'When the top number is 1, a smaller bottom number means a bigger piece.', 'Cutting a pizza into 2 equal pieces makes bigger pieces than cutting it into 4, 8 or 16.']
    ],
    science: [
      ['Observation: The Moon looks like a different shape on different nights. Which claim does it best support?', 'We see a different amount of the Moon’s sunlit side each night.', ['The Moon gets bigger when clouds cover it.', 'The Moon turns itself off at night.', 'The Moon moves closer to the Sun each night.'], 'Which claim explains the shape changing from night to night?', 'The Moon’s phases happen because we see more or less of its sunlit side.'],
      ['Observation: Rin could see stars only on clear nights. Which claim does it best support?', 'Clouds can block our view of the stars.', ['Stars only exist on clear nights.', 'Stars are brighter when it rains.', 'Stars switch off in the cloud.'], 'What is different on the nights with no stars?', 'The stars are still there. Clouds are in the way.'],
      ['Observation: A shadow is longest early in the morning. Which claim does it best support?', 'The Sun is low in the sky, so shadows are long.', ['The Sun is closest to us in the morning.', 'Shadows grow when it is cold.', 'The ground is darker in the morning.'], 'Think about where the Sun is in the sky in the morning.', 'A low Sun makes long shadows.'],
      ['Observation: Day turns into night where Maya lives. Which claim does it best support?', 'Earth spins, so her side turns away from the Sun.', ['The Sun moves around Earth in a small circle.', 'The Moon covers the Sun every evening.', 'The Sun gets tired and goes out.'], 'What does Earth do once every day?', 'Earth spins once a day, so each place turns toward and then away from the Sun.']
    ],
    art: [
      ['Which colour is a warm colour?', 'Red', ['Blue', 'Green', 'Grey'], 'Think of fire and sunshine.', 'Red, orange and yellow are warm colours.'],
      ['Which colour is a cool colour?', 'Blue', ['Red', 'Orange', 'Yellow'], 'Think of water and ice.', 'Blue, green and purple are cool colours.'],
      ['Which pair of colours are both warm?', 'Red and orange', ['Blue and green', 'Green and grey', 'Blue and grey'], 'Look for two colours that remind you of fire.', 'Red and orange are both warm colours.'],
      ['A line that goes straight up and down is called…', 'Vertical', ['Horizontal', 'Diagonal', 'Curved'], 'Think of a tall flagpole.', 'A vertical line goes up and down.']
    ],
    history: [
      ['Timeline: 1900 Town founded · 1920 School built · 1950 Library opened.<br>Which event happened first?', 'The town was founded', ['The school was built', 'The library opened', 'They all happened together'], 'Find the earliest year.', '1900 is the earliest year on the timeline.'],
      ['Timeline: 1900 Town founded · 1920 School built · 1950 Library opened.<br>Which event happened last?', 'The library opened', ['The town was founded', 'The school was built', 'They all happened together'], 'Find the latest year.', '1950 is the latest year on the timeline.'],
      ['Timeline: 1900 Town founded · 1920 School built · 1950 Library opened.<br>How many years passed between the school and the library?', '30 years', ['20 years', '50 years', '70 years'], 'Subtract 1920 from 1950.', '1950 − 1920 = 30 years.'],
      ['Which source tells about a past event in a person’s own words?', 'A diary entry', ['A map of today', 'A calculator', 'A weather forecast'], 'Which one was written by someone who was there?', 'A diary is a person’s own account of what happened.']
    ],
    french: [
      ['What do you say in the morning to greet someone?', 'Bonjour', ['Bonsoir', 'Au revoir', 'Merci'], 'It begins with “bon” and means “good day”.', 'Bonjour means hello or good day.'],
      ['Which word means “thank you”?', 'Merci', ['Bonjour', 'Au revoir', 'Bonsoir'], 'You say it when someone helps you.', 'Merci means thank you.'],
      ['You are leaving. What do you say?', 'Au revoir', ['Bonjour', 'Merci', 'Bonsoir'], 'It means goodbye.', 'Au revoir means goodbye.'],
      ['Which greeting is best at night?', 'Bonsoir', ['Bonjour', 'Au revoir', 'Merci'], 'Look for “soir”, the word for evening.', 'Bonsoir means good evening.']
    ],
    writing: [
      ['Goal: start with a capital letter and end with a period. Which sentence meets the goal?', 'The dog ran fast.', ['the dog ran fast.', 'The dog ran fast', 'the dog ran fast'], 'Check the first letter and the last mark.', 'It starts with “T” and ends with a period.'],
      ['Goal: use a word that tells why. Which sentence meets the goal?', 'I smiled because we won.', ['I smiled and ran.', 'I smiled at the big dog.', 'I smiled, then I sat.'], 'Look for the word that gives a reason.', '“Because” tells why I smiled.'],
      ['Goal: tell how the dog looks. Which sentence meets the goal?', 'The fluffy brown dog ran home.', ['The dog ran home quickly.', 'The dog ran home today.', 'The dog ran home.'], 'Find the words that tell what the dog looks like.', '“Fluffy” and “brown” describe the dog.'],
      ['Goal: ask a question. Which sentence meets the goal?', 'Where did Mia put her hat?', ['Mia put her hat on the shelf.', 'Mia put her hat away.', 'Where Mia put her hat.'], 'A question asks and ends with a question mark.', 'It asks something and ends with a question mark.'],
      ['Goal: use capital letters for names. Which sentence meets the goal?', 'Sam and Priya went to the park.', ['sam and priya went to the park.', 'Sam and priya went to the park.', 'sam and Priya went to the park.'], 'Names start with a capital letter.', 'Both names start with a capital letter.'],
      ['Goal: use a comma correctly. Which sentence meets the goal?', 'After lunch, we played soccer.', ['After lunch we played, soccer.', 'After, lunch we played soccer.', 'After lunch we, played soccer.'], 'The comma goes after the opening part.', 'The comma comes after “After lunch”.']
    ]
  }
};
