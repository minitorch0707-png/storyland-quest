/* Storyland Quest – built-in content bank.
   Used when no AI key is configured, and as the safe fallback whenever an
   AI response fails validation. All items were written and checked by hand. */
window.BANK = {
  firstSound: [
    ['dog','🐶'],['duck','🦆'],['door','🚪'],['sun','☀️'],['sock','🧦'],['seal','🦭'],
    ['moon','🌙'],['mouse','🐭'],['milk','🥛'],['bear','🐻'],['ball','⚽'],['bus','🚌'],
    ['fish','🐟'],['fox','🦊'],['fire','🔥'],['pig','🐷'],['pen','🖊️'],['pizza','🍕'],
    ['tiger','🐯'],['tent','⛺'],['turtle','🐢'],['lion','🦁'],['leaf','🍃'],['lemon','🍋'],
    ['rabbit','🐰'],['rain','🌧️'],['ring','💍'],['hat','🎩'],['horse','🐴'],['house','🏠']
  ],
  rhymes: {
    1: [['cat','hat','bat','mat'],['dog','log','frog','fog'],['sun','run','fun','bun'],
        ['bed','red','fed','sled'],['pig','big','dig','wig'],['cake','lake','bake','snake'],
        ['ball','tall','wall','fall'],['ring','sing','king','wing']],
    2: [['light','kite','bite','night'],['bear','chair','hair','square'],['blue','shoe','two','flew'],
        ['rain','plane','train','lane'],['bread','said','head','shed'],['eight','late','wait','great'],
        ['moon','tune','spoon','June'],['toes','nose','rose','grows']]
  },
  syllables: [['butterfly',3],['elephant',3],['banana',3],['computer',3],['caterpillar',4],
    ['watermelon',4],['dinosaur',3],['table',2],['rainbow',2],['helicopter',4],['alligator',4],
    ['adventure',3],['astronaut',3],['celebration',4],['imagination',5],['vocabulary',5],
    ['refrigerator',5],['pencil',2],['mountain',2],['umbrella',3],['electricity',5]],

  vocab: {
    1: [['big','large'],['tiny','very small'],['happy','feeling glad'],['quick','fast'],
        ['begin','to start'],['shout','to yell loudly'],['sleepy','tired'],['giggle','to laugh a little'],
        ['chilly','a bit cold'],['gift','a present'],['angry','mad'],['pal','a friend'],['damp','a little wet']],
    2: [['enormous','very, very big'],['brave','not afraid'],['ancient','very old'],
        ['curious','wanting to know more'],['fragile','easy to break'],['discover','to find something new'],
        ['exhausted','very tired'],['journey','a long trip'],['gloomy','dark and sad'],['rapid','very fast'],
        ['whisper','to speak very softly'],['delicious','tasting very good']],
    3: [['reluctant','not wanting to do something'],['abundant','more than enough'],['conceal','to hide'],
        ['predict','to say what you think will happen next'],['cautious','very careful'],['triumph','a great win'],
        ['investigate','to look into something carefully'],['essential','really needed'],['peculiar','strange or odd'],
        ['persuade','to talk someone into something'],['vast','extremely wide and large'],
        ['generous','happy to share and give']]
  },

  spelling: {
    1: [['cat','🐱','It says meow'],['dog','🐶','It says woof'],['sun','☀️','It shines in the day'],
        ['hat','🎩','You wear it on your head'],['bus','🚌','It takes kids to school'],['fish','🐟','It swims'],
        ['frog','🐸','It hops and says ribbit'],['star','⭐','It twinkles at night'],['tree','🌳','It has leaves'],
        ['book','📖','You read it'],['moon','🌙','You see it at night'],['cake','🎂','A birthday treat']],
    2: [['apple','🍎','A crunchy fruit'],['tiger','🐯','A big striped cat'],['house','🏠','A place to live'],
        ['train','🚂','It rides on tracks'],['plant','🌱','It grows in soil'],['cloud','☁️','Fluffy and in the sky'],
        ['pizza','🍕','Cheesy slices'],['robot','🤖','A machine helper'],['snake','🐍','It slithers'],
        ['bread','🍞','You make toast with it'],['queen','👑','She wears a crown'],['rocket','🚀','It flies to space'],
        ['monkey','🐵','It loves bananas'],['chair','🪑','You sit on it']],
    3: [['elephant','🐘','It has a trunk'],['rainbow','🌈','Colours after the rain'],['dinosaur','🦖','It lived long ago'],
        ['mountain','⛰️','Taller than a hill'],['butterfly','🦋','It was a caterpillar'],['umbrella','☂️','Keeps you dry'],
        ['octopus','🐙','It has eight arms'],['penguin','🐧','A bird that swims'],['volcano','🌋','It erupts with lava'],
        ['giraffe','🦒','It has a very long neck'],['dolphin','🐬','A clever sea animal'],['kangaroo','🦘','It hops and has a pouch'],
        ['pumpkin','🎃','Big, orange and round'],['castle','🏰','A king might live here'],['guitar','🎸','You strum it']]
  },

  sentences: {
    1: ['The dog ran fast.','I like red apples.','We play at the park.','My cat is soft.',
        'The sun is hot.','She has a blue hat.','Birds can fly high.'],
    2: ['The little frog jumped into the pond.','My brother baked a cake yesterday.',
        'We saw three birds in the tree.','The children are reading a funny book.',
        'After lunch we played outside.','Our teacher told us a story.'],
    3: ['Although it was raining, we still went for a walk.',
        'The scientist carefully poured the liquid into the jar.',
        'Because she practised every day, Maya won the race.',
        'The old lighthouse stood bravely against the crashing waves.',
        'Before the movie started, we bought some popcorn.']
  },
  // [sentence with blank, correct, [wrong...], explanation]
  grammar: {
    1: [['The cat ___ on the mat.','sits',['sit','sitting'],'One cat <b>sits</b>.'],
        ['I ___ a big dog.','have',['has','having'],'We say “I <b>have</b>”.'],
        ['They ___ happy.','are',['is','am'],'With “they” we use <b>are</b>.'],
        ['She ___ my friend.','is',['are','am'],'With “she” we use <b>is</b>.']],
    2: [['Yesterday we ___ to the zoo.','went',['go','goed','going'],'“Yesterday” is in the past, so we use <b>went</b>.'],
        ['The dogs ___ barking loudly.','were',['was','is'],'More than one dog, so <b>were</b>.'],
        ['He ___ his homework every night.','does',['do','doing'],'With “he” we use <b>does</b>.'],
        ['Which one is a complete sentence?','The bird sang a song.',['Ran to the park.','The big brown.','Because it was.'],'A sentence needs a who and a what-they-did.']],
    3: [['The team ___ practising when it began to rain.','was',['were','is','be'],'One team, in the past: <b>was</b>.'],
        ['She sang ___ than anyone else.','more beautifully',['beautifuller','most beautiful','more beautiful'],'To compare how something is done, use <b>more + -ly word</b>.'],
        ['___ went to the store together.','He and I',['Me and him','Him and me','Him and I'],'Try each alone: “He went”, “I went”.'],
        ['Which sentence uses the comma correctly?','After dinner, we washed the dishes.',['After, dinner we washed the dishes.','After dinner we, washed the dishes.','After dinner we washed, the dishes.'],'The comma goes after the opening part.']]
  },

  sequences: {
    1: [{t:'Making toast 🍞',s:['Put the bread in the toaster.','Wait for it to pop up.','Spread butter on the toast.','Take a big bite!']},
        {t:'A rainy day ☔',s:['Dark clouds fill the sky.','Rain begins to fall.','Puddles form on the ground.','The sun comes out and dries the puddles.']},
        {t:'Growing a flower 🌱',s:['Dig a small hole.','Drop in the seed.','Cover it with soil and water it.','A green sprout pops up!']}],
    2: [{t:'A butterfly’s life 🦋',s:['A tiny egg sits on a leaf.','A caterpillar hatches and eats.','It makes a chrysalis.','A butterfly comes out and flies away.']},
        {t:'Building a snowman ⛄',s:['Roll a big snowball for the bottom.','Stack a smaller snowball on top.','Add a carrot nose and stone eyes.','Step back and admire your snowman.']},
        {t:'The lost tooth 🦷',s:['Mia’s tooth starts to wiggle.','The tooth falls out at lunch.','She puts it under her pillow.','In the morning she finds a coin.']}],
    3: [{t:'The water cycle 💧',s:['The sun heats water in the ocean.','Water vapour rises into the sky.','The vapour cools and forms clouds.','Rain falls back down to the earth.']},
        {t:'Mailing a letter ✉️',s:['Write your letter on paper.','Fold it and seal it in an envelope.','Add the address and a stamp.','Drop it in the mailbox.']},
        {t:'The science fair 🔬',s:['Ali chose volcanoes as his topic.','He built a model from clay and paint.','At the fair, he mixed baking soda and vinegar to make it erupt.','The judges gave him a blue ribbon.']}]
  },

  // First option is always the correct one; the app shuffles them.
  stories: [
    {level:1,title:'Sam and the Red Kite',emoji:'🪁',
     text:'Sam has a red kite. He takes it to the hill. The wind is strong. The kite goes up, up, up! Then the string snaps. The kite lands in a tree. Sam’s big sister Mia is tall. She gets the kite down. Sam is happy again.',
     glossary:{snaps:'breaks suddenly',strong:'having lots of power'},
     questions:[
      {q:'What is this story mostly about?',options:['A kite that gets stuck and is saved','A dog at the park','A rainy day','A birthday party'],sub:'main',explain:'The whole story is about Sam’s kite.'},
      {q:'Where does the kite land?',options:['In a tree','In a pond','On a roof','In a car'],sub:'detail',explain:'The story says “The kite lands in a tree.”'},
      {q:'Why can Mia get the kite down?',options:['She is tall','She can fly','She is very fast','She is loud'],sub:'inference',explain:'The story tells us Mia is tall, so she can reach.'},
      {q:'What does “snaps” mean in the story?',options:['breaks','grows','sings','sleeps'],sub:'vocab',explain:'When the string snaps, it breaks.'}]},
    {level:1,title:'Bella’s Lost Sock',emoji:'🧦',
     text:'Bella cannot find her sock. She looks under the bed. No sock. She looks in the box. No sock. Then she sees her puppy, Max. Max is wagging his tail. The sock is in his bed! Bella laughs and gives Max a hug.',
     glossary:{wagging:'moving from side to side'},
     questions:[
      {q:'What is this story mostly about?',options:['Bella looks for her lost sock','Bella goes to school','Max learns a trick','Bella buys new shoes'],sub:'main',explain:'Bella is looking for her sock the whole time.'},
      {q:'Who has the sock?',options:['Max the puppy','Bella’s mom','A cat','Nobody'],sub:'detail',explain:'The sock is in Max’s bed.'},
      {q:'How does Bella feel at the end?',options:['Happy','Angry','Scared','Sleepy'],sub:'inference',explain:'She laughs and hugs Max, so she is happy.'},
      {q:'What does “wagging” mean?',options:['moving from side to side','sleeping','eating fast','hiding'],sub:'vocab',explain:'A wagging tail moves from side to side.'}]},
    {level:2,title:'The Night Garden',emoji:'🌙',
     text:'Every evening, Noor watered the garden with her grandfather. One night, she noticed tiny lights blinking above the flowers. “Fireflies!” whispered Grandpa. “They glow to talk to each other.” Noor wanted to catch one in a jar, but Grandpa shook his head. “They are happiest when they are free,” he said. So Noor sat very still instead. Soon a firefly landed gently on her hand. It glowed once, twice, and then drifted away into the dark. Noor smiled. Some things are best enjoyed without holding on to them.',
     glossary:{drifted:'floated slowly',noticed:'saw something for the first time',gently:'in a soft, careful way'},
     questions:[
      {q:'What is the main idea of this story?',options:['Noor learns to enjoy fireflies without catching them','Noor learns how to water flowers','Grandpa is afraid of bugs','Fireflies live in jars'],sub:'main',explain:'The last line tells us the lesson Noor learned.'},
      {q:'Why do fireflies glow?',options:['To talk to each other','To stay warm','To scare birds','To find water'],sub:'detail',explain:'Grandpa says, “They glow to talk to each other.”'},
      {q:'Why did the firefly land on Noor’s hand?',options:['She sat still and calm','She had a jar','She shouted for it','She was holding a flower'],sub:'inference',explain:'Noor sat very still, so the firefly felt safe.'},
      {q:'What does “drifted” mean?',options:['floated slowly','fell hard','ran quickly','shouted loudly'],sub:'vocab',explain:'To drift is to float along slowly.'}]},
    {level:2,title:'The Robot Who Couldn’t Dance',emoji:'🤖',
     text:'Bolt was the best helper robot in the school. He could carry books, fix lights, and sort pencils by colour. But on Friday there was a dance party, and Bolt had a problem. His metal legs only moved in straight lines. The children showed him a new idea. “Don’t copy us,” said Leo. “Make your own dance!” Bolt blinked his lights, spun his arms, and beeped to the beat. Everyone cheered and copied the Robot Shuffle. Bolt learned that being different can be something to celebrate.',
     glossary:{celebrate:'to be happy about something and enjoy it',sort:'to put things into groups'},
     questions:[
      {q:'What lesson does Bolt learn?',options:['Being different can be a good thing','Robots should not dance','Pencils should be sorted','Parties are too loud'],sub:'main',explain:'The last sentence tells us the lesson.'},
      {q:'What was Bolt’s problem?',options:['His legs only moved in straight lines','He lost the pencils','He broke a light','He was late for school'],sub:'detail',explain:'His metal legs only moved in straight lines.'},
      {q:'How do the children feel about Bolt?',options:['They like him and want to help','They are scared of him','They want him to leave','They do not notice him'],sub:'inference',explain:'They give him an idea, cheer and copy his dance.'},
      {q:'What does “celebrate” mean?',options:['to be happy about something','to hide something','to forget something','to fix something'],sub:'vocab',explain:'When we celebrate, we show we are happy about something.'}]},
    {level:3,title:'The Lighthouse Keeper’s Secret',emoji:'🗼',
     text:'For forty years, Mr. Okafor had climbed the one hundred and twelve steps of the lighthouse each evening to light the great lamp. The villagers assumed he did it because it was his job. But when a new automatic light was installed, and he was told he could finally rest, he kept climbing the stairs anyway. One stormy night the power failed, and the automatic light went dark. A fishing boat was struggling toward the rocks. Without hesitating, Mr. Okafor lit the old oil lamp by hand and swung its beam across the waves. The boat turned just in time. The next morning, the captain asked how he had been ready so quickly. Mr. Okafor only smiled. “A lighthouse is a promise,” he said, “and promises don’t switch off.”',
     glossary:{hesitating:'pausing because you are unsure',assumed:'believed without checking',installed:'put in place and made ready to use',automatic:'working by itself'},
     questions:[
      {q:'What is the main idea of this story?',options:['Mr. Okafor’s dedication keeps sailors safe even when he is not required to help','Automatic lights are always better','Fishing is a dangerous job','Lighthouses have too many steps'],sub:'main',explain:'He keeps his “promise” even after he is told he can rest.'},
      {q:'Why did the automatic light go dark?',options:['The power failed','Mr. Okafor turned it off','It ran out of oil','The boat hit it'],sub:'detail',explain:'The story says “the power failed”.'},
      {q:'Why did Mr. Okafor keep climbing the stairs after the new light was installed?',options:['He felt responsible for keeping sailors safe','He was being paid extra','He forgot about the new light','He wanted exercise'],sub:'inference',explain:'He calls the lighthouse “a promise” – he feels responsible.'},
      {q:'What does “hesitating” mean?',options:['pausing because you are unsure','running very fast','shouting for help','falling asleep'],sub:'vocab',explain:'He acted right away, with no pause.'}]},
    {level:3,title:'Why Do Leaves Change Colour?',emoji:'🍁',
     text:'In summer, leaves are busy food factories. They are packed with a green chemical called chlorophyll, which captures sunlight and helps the tree turn air and water into sugar. There is so much chlorophyll that it hides every other colour in the leaf. As autumn arrives, the days grow shorter and cooler. The tree senses that winter is coming and stops making chlorophyll. Slowly the green fades, revealing yellow and orange colours that were there all along. Finally, the tree seals off each leaf stem, and the leaves fall. This is not a sad ending. By dropping its leaves, the tree saves water and energy so it can survive until spring.',
     glossary:{chlorophyll:'the green stuff in leaves that catches sunlight',revealing:'showing something that was hidden',survive:'to stay alive',captures:'catches'},
     questions:[
      {q:'What is this text mainly about?',options:['Why leaves change colour and fall in autumn','How to plant a tree','Why summer is hot','How sugar is sold'],sub:'main',explain:'Every paragraph explains part of why leaves change.'},
      {q:'What does chlorophyll do?',options:['It captures sunlight to help make food','It makes leaves fall','It keeps the tree warm','It turns leaves orange'],sub:'detail',explain:'Chlorophyll “captures sunlight” to help make sugar.'},
      {q:'Why can’t we see yellow and orange in summer leaves?',options:['The green chlorophyll covers them up','They have not been made yet','The sun is too bright','Leaves are too small'],sub:'inference',explain:'The colours “were there all along”, hidden by green.'},
      {q:'What does “revealing” mean?',options:['showing something that was hidden','painting something','breaking something','losing something'],sub:'vocab',explain:'When green fades, hidden colours are shown.'}]}
  ],

  writing: [
    'If you had a pet dragon, what would you do together?',
    'Tell about the best day you ever had.',
    'You find a door in a tree. What is behind it?',
    'What would you pack for a trip to the moon, and why?',
    'Describe your favourite animal to someone who has never seen it.',
    'You wake up and you can fly! What happens next?',
    'What makes someone a good friend?'
  ]
};
