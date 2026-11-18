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
    {level:3,adv:true,title:'The Lighthouse Keeper’s Ledger',emoji:'🏮',text:'For thirty years, Marta climbed the one hundred and twelve steps of the Gull Point lighthouse every evening. She polished the great lens, trimmed the lamp, and wrote the weather in a leather ledger. When the town installed an automatic beacon, the council thanked her with a small party and a framed certificate. Marta smiled politely, but that night she did not sleep. At dawn she walked the empty stairs once more. On the last page of the ledger, below thirty years of numbers, she wrote a single line: the light is still on. Then she hung the key on its hook, left the door unlocked, and went down to the harbour, where the fishing boats were already heading out under a beam she no longer had to tend.',glossary:{'tend': 'to take care of'},
     questions:[
      {q:'What is this passage mostly about?',options:['A keeper adjusting to a job that technology has replaced', 'A town arguing about a new beacon', 'A storm that nearly wrecks the fishing boats', 'A ledger that records unusual weather'],sub:'main',explain:'The whole passage follows Marta as her work is taken over by an automatic beacon.',quote:'When the town installed an automatic beacon',why:['The council thanked her at a party. Nobody argues, so this is not the main idea.', 'No storm appears. Watch for details that are not in the passage.', 'The ledger is one detail. The passage is about Marta, not the weather records.']},
      {q:'Why did Marta not sleep that night?',options:['She felt unsettled that her work was no longer needed', 'She was angry at the council', 'She was worried about the fishing boats', 'She had paperwork to finish'],sub:'inference',explain:'She smiled politely, but could not sleep. That suggests mixed feelings about being replaced.',quote:'Marta smiled politely, but that night she did not sleep.',why:['The text says she smiled politely. Nothing shows she was angry.', 'The boats head out safely at the end. The text does not say she worried about them.', 'The ledger entry comes after she goes up at dawn. Nothing says paperwork kept her awake.']},
      {q:'In the passage, “tend” means',options:['take care of', 'lean toward', 'watch from far away', 'replace with something new'],sub:'vocab',explain:'A keeper looks after a beam, so “tend” means take care of.',quote:'a beam she no longer had to tend',why:['“Tend toward” is another meaning. Here a person is doing a job for the beam.', 'Marta is not watching from far away. She works on the lamp herself.', 'Replacing is what the automatic beacon does. Tend is what Marta did.']},
      {q:'What does the line “the light is still on” suggest?',options:['Marta takes comfort that the work continues in a new way', 'Marta is angry that nobody checked the lamp', 'Marta thinks the beacon will soon fail', 'Marta wants the council to change its mind'],sub:'inference',explain:'She leaves the key and walks to the harbour. The sentence shows calm acceptance.',quote:'the light is still on',why:['Nothing says she is angry. She leaves the door unlocked and walks away calmly.', 'The boats leave under the beam. Nothing suggests it will fail.', 'She hangs the key and leaves. She is not asking the council to change anything.']}]},
    {level:3,adv:true,title:'Why Bees Dance',emoji:'🐝',text:'When a honeybee finds a field of flowers, she does not keep the news to herself. Back in the hive, she performs a waggle dance on the vertical honeycomb. The angle of her straight run, measured against the pull of gravity, shows the direction of the flowers relative to the sun. The length of the run shows distance: the longer the waggle, the farther the food. Scientists once doubted that insects could share such detailed information. In the 1940s, Karl von Frisch spent years tracking marked bees and proved that the dancers’ sisters flew to the exact patch described. His work earned a Nobel Prize in 1973. Researchers have also used robot bees to test how the dance is read, hoping to learn how simple brains pass on complex messages.',glossary:{'waggle': 'a quick side-to-side shake'},
     questions:[
      {q:'What is the main idea of the passage?',options:['Honeybees use a dance to tell hive-mates where food is', 'Scientists were wrong about every insect', 'Karl von Frisch won a Nobel Prize', 'Bees get lost without the sun'],sub:'main',explain:'The passage explains the waggle dance and how scientists proved it carries information.',quote:'she performs a waggle dance on the vertical honeycomb',why:['The passage says scientists doubted one idea. It does not say they were wrong about every insect.', 'The prize is one supporting detail, not the main idea.', 'The sun is used as a reference for direction. The passage is about the dance.']},
      {q:'According to the passage, what does a longer waggle run show?',options:['The food is farther away', 'The flowers are more plentiful', 'The sun is higher in the sky', 'The dancer is older'],sub:'detail',explain:'The passage says the longer the waggle, the farther the food.',quote:'the longer the waggle, the farther the food',why:['Angle shows direction and length shows distance. Quantity of flowers is not mentioned.', 'The sun is only a reference point for the angle.', 'Nothing links the dancer’s age to the dance.']},
      {q:'In the passage, “doubted” most nearly means',options:['were unsure about', 'were angry about', 'had studied', 'had measured'],sub:'vocab',explain:'“Scientists once doubted” and then von Frisch “proved” it. So doubted means were not sure it was true.',quote:'Scientists once doubted',why:['Being angry does not fit with later being proven wrong.', 'Studying would not need proof afterwards. Look at the contrast with “proved”.', 'Measuring is what von Frisch did later, not what the earlier scientists did.']},
      {q:'Why did von Frisch track marked bees?',options:['To check that other bees really flew to the place the dance described', 'To count how many bees lived in a hive', 'To teach bees a new dance', 'To find the flowers himself'],sub:'inference',explain:'Marked bees let him see where the dancers’ sisters flew, proving the dance carried the message.',quote:'tracking marked bees and proved that the dancers’ sisters flew to the exact patch described',why:['Nothing says he counted bees. He followed where they flew.', 'The bees already knew the dance. He studied it, he did not teach it.', 'The passage says he proved where the other bees went, not that he searched for flowers.']}]},
    {level:3,adv:true,title:'Should School Start Later?',emoji:'⏰',text:'Every weekday morning, millions of teenagers drag themselves out of bed before sunrise. Researchers who study sleep say this is not laziness. During adolescence, the body clock shifts so that teens naturally fall asleep later and wake later. When a district in Seattle moved its high school start time from 7:50 to 8:45 a.m., researchers found that students slept about thirty-four minutes more each night. Critics worry that later starts will disrupt sports practices and bus schedules. These concerns are real, but they are logistical problems, not health problems, and logistics can be solved. Schools exist to help students learn, and a tired brain learns poorly. The schedule should serve the students, not the other way around.',glossary:{'adolescence': 'the teenage years'},
     questions:[
      {q:'What is the author’s main purpose?',options:['To persuade readers that schools should start later', 'To explain how the body clock works', 'To describe how Seattle’s buses run', 'To warn students to go to bed earlier'],sub:'main',explain:'The last lines say the schedule should serve students. The author argues for a change.',quote:'The schedule should serve the students, not the other way around.',why:['The body clock is evidence used to support the argument, not the purpose.', 'Buses are mentioned only as a concern critics raise.', 'The author blames the schedule, not students’ bedtimes.']},
      {q:'Why does the author mention that critics worry about sports and buses?',options:['To admit the objections, then argue they can be solved', 'To show the idea is flawed', 'To prove teenagers are lazy', 'To suggest sports should be cancelled'],sub:'inference',explain:'The next sentence says these concerns are real but logistical and can be solved.',quote:'These concerns are real, but they are logistical problems',why:['The author keeps arguing for the change after naming the concern.', 'The passage says the opposite: it is not laziness.', 'Nothing suggests cancelling sports. The author says the problem can be solved.']},
      {q:'What did the Seattle change show?',options:['Students slept about thirty-four minutes more each night', 'Students stopped playing sports', 'Teenagers went to bed earlier', 'Buses ran late'],sub:'detail',explain:'The passage reports thirty-four more minutes of sleep each night.',quote:'students slept about thirty-four minutes more each night',why:['Sports are mentioned only as a worry from critics.', 'The body clock makes teens fall asleep later. The change gave them more morning sleep.', 'Late buses are a worry, not a result reported in Seattle.']},
      {q:'In the passage, “logistical” most nearly means',options:['about organizing and arranging details', 'about health and medicine', 'about money and costs', 'about rules and punishments'],sub:'vocab',explain:'The author contrasts logistical problems with health problems, and gives examples of schedules.',quote:'they are logistical problems, not health problems',why:['The sentence says logistical problems are not health problems.', 'Costs are never mentioned. Look at the examples: practices and bus schedules.', 'Neither rules nor punishments appear in the passage.']}]},
    {level:3,adv:true,title:'The Glass Bridge',emoji:'🌉',text:'Dani stopped at the edge of the glass bridge, where the canyon floor lay far below. Her cousins were already halfway across, laughing and waving. “Don’t look down,” her brother called. Dani gripped the rail until her knuckles turned white. She took one step, then another, and felt the whole bridge hum faintly beneath her shoes. Her stomach tightened. Halfway over, a gust of wind pushed against her, and she froze. Then she remembered how her grandmother crossed rivers: one stone at a time, never the whole river. Dani fixed her eyes on the next square of glass, and then the next. By the time she reached the far side, her hands were still shaking, but she was grinning.',glossary:{'gust': 'a sudden strong rush of wind'},
     questions:[
      {q:'What is this passage mostly about?',options:['Dani works through her fear to cross the bridge', 'A family trip that goes wrong', 'The dangerous history of a canyon', 'An argument between Dani and her brother'],sub:'main',explain:'The passage follows Dani from fear to finishing the crossing.',quote:'By the time she reached the far side, her hands were still shaking, but she was grinning.',why:['Nothing goes wrong. Everyone crosses safely.', 'The canyon is only the setting. No history is given.', 'Her brother only calls out advice. There is no argument.']},
      {q:'Why did Dani grip the rail until her knuckles turned white?',options:['She was frightened of the height', 'She was angry at her cousins', 'The bridge was shaking dangerously', 'She was cold'],sub:'inference',explain:'The bridge hums faintly and the canyon is far below. Her fear of the height is the best reason.',quote:'Dani gripped the rail until her knuckles turned white.',why:['Her cousins are laughing and waving, but nothing says she is angry.', 'The bridge only hums faintly. That is a tempting detail, but it is not described as dangerous.', 'Temperature is never mentioned.']},
      {q:'Why does the author include the grandmother and the river?',options:['To show a strategy Dani uses: one step at a time', 'To explain how bridges are built', 'To show the grandmother was braver than Dani', 'To change the setting to a river'],sub:'inference',explain:'Dani remembers the one-stone-at-a-time idea and then focuses on the next square of glass.',quote:'one stone at a time, never the whole river',why:['The passage never explains building a bridge.', 'The memory helps Dani. It is not a comparison of bravery.', 'The setting stays on the bridge. The river is only a memory.']},
      {q:'In the passage, “froze” means',options:['stopped moving because of fear', 'became very cold', 'turned into ice', 'stopped speaking'],sub:'vocab',explain:'A gust pushes her and she cannot move. “Froze” describes being stuck with fear.',quote:'a gust of wind pushed against her, and she froze',why:['Cold is never mentioned.', 'This is a figure of speech. She does not turn into ice.', 'The sentence is about stopping her movement, not her voice.']}]},

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
