/* Eric's places. The pins and the bottom cards are the same list.
   A correspondence pin marks an idea at a real place. It is not a claim
   that he lived there. */

const STORIES = [
  {
    id: 'roots',
    kicker: 'Route',
    title: 'Not a straight line',
    paragraphs: [
      'I was born in Shandong, China. My parents brought me to the United States when I was one. We settled in Orange County, California.',
      'Shandong to Orange County to Philadelphia is not a straight line. It is the route underneath everything else on this map.',
      'Orange County is the coast that built me. My parents are still there. My younger brother is in elementary school, so the house I grew up in is still a house with a kid in it.',
      'The Webb Schools, in Claremont, is where high school happened. I was a decent student and a better reader of people than of syllabi. Psychology got me early, on my own, years before it showed up in a course plan.',
      'University of Pennsylvania is the coast I am building now. Data science, because I want to know what data can do for human beings and, just as much, what it cannot. The limit is the interesting part.',
    ],
  },
  {
    id: 'crossing',
    kicker: 'Route',
    title: 'They crossed an ocean',
    paragraphs: [
      'The pin sits in the Pacific, on the arc between Shandong and Orange County.',
      'My parents crossed an ocean so the map could start somewhere else. The line is not straight, and it was never only mine.',
    ],
  },
  {
    id: 'mind',
    kicker: 'Curiosity',
    title: 'How minds judge, decide, and fool themselves',
    paragraphs: [
      'I am curious the way some people are tall. It is not a hobby I picked up. It is the way I am built.',
      'In high school it was psychology. I went deep on my own: how minds judge, decide, and fool themselves, years before it showed up in any course plan. It is still the lens under everything else I study.',
      'The pin is The Webb Schools, in Claremont. That is a place I actually was.',
    ],
  },
  {
    id: 'data',
    kicker: 'Curiosity',
    title: 'The blank edge is where judgment lives',
    paragraphs: [
      'I study data science because I want to know what data can do for human beings and, just as much, what it cannot. The limit is the interesting part. Past the last confident number there is a blank edge, and that is where judgment lives.',
      'Prediction, probability, and psychology are three ways of asking what a person will do next. Each one runs out. I care about the place it runs out.',
      'Penn is the true place for this one. The pin is the university, not a metaphor.',
    ],
  },
  {
    id: 'statistics',
    kicker: 'Curiosity',
    title: 'Where the map line comes from',
    paragraphs: [
      'The Art of Statistics, David Spiegelhalter. Where the map line comes from.',
      'Cambridge stands for that book. The pin is the idea of the line, not a trip.',
    ],
  },
  {
    id: 'markets',
    kicker: 'Curiosity',
    title: 'My favorite book on markets',
    paragraphs: [
      'The Price of Time, Edward Chancellor. My favorite book on markets.',
      'London stands for that book. What money costs, and who pays for the waiting.',
    ],
  },
  {
    id: 'exchange',
    kicker: 'Curiosity',
    title: 'What money costs',
    paragraphs: [
      'The same shelf as The Price of Time. Markets are psychology with a price on them, and a price is just the point where one method runs out and another has to start.',
      'Amsterdam’s old exchange stands for that. The pin is the idea, not a visit.',
    ],
  },
  {
    id: 'posture',
    kicker: 'Curiosity',
    title: 'Business model over culture over price',
    paragraphs: [
      'Duan Yongping’s interviews and writings. Not a book exactly. A posture. Business model over culture over price, and never touch what you do not understand.',
      'Hong Kong is a place I have walked. This pin is the posture, not a meeting.',
    ],
  },
  {
    id: 'day',
    kicker: 'Curiosity',
    title: 'How to live a day',
    paragraphs: [
      'Ogawa Ito, for the opposite shelf: how to live a day, seasonal food, small errands done attentively.',
      'I have been to Japan. The pin is that shelf, in Kyoto. It is Japan, not a trip story.',
    ],
  },
  {
    id: 'culture',
    kicker: 'Curiosity',
    title: 'A place that recalibrated something',
    paragraphs: [
      'Culture, the way I would mark it: Jerusalem. Israel is one of the places I have walked.',
      'The pin is a place that recalibrated something. That is the whole claim.',
    ],
  },
  {
    id: 'reading',
    kicker: 'Interest',
    title: 'One chapter, one line saved',
    paragraphs: [
      'I read slowly and I would rather finish one book than sample ten. The line I save is usually the one that names a limit.',
      'The Art of Statistics, David Spiegelhalter. The Price of Time, Edward Chancellor. Duan Yongping’s interviews and writings. Ogawa Ito, for the opposite shelf.',
      'The pin is Van Pelt Library, at Penn. This is an interest, not a category of its own.',
    ],
  },
  {
    id: 'ocean',
    kicker: 'Interest',
    title: 'The first length, before counting starts',
    paragraphs: [
      'I swim. I taught beginners with Penn Club Swim, which is mostly patience: the first length, before the counting starts, is the whole lesson.',
      'The sauna afterward is not a luxury. It is the period at the end of the sentence.',
      'The pin is in the ocean because this is the interest, not a beach I am claiming as mine.',
    ],
  },
  {
    id: 'tennis',
    kicker: 'Interest',
    title: 'An hour that ends at sunset',
    paragraphs: [
      'Tennis, happily, whatever schedule the courts allow. An hour that ends at sunset is a good hour.',
      'The pin is the courts at Penn Park, in Philadelphia. Not a stadium.',
    ],
  },
  {
    id: 'dumplings',
    kicker: 'Interest',
    title: 'Pork and leek, if they have them',
    paragraphs: [
      'Soup dumplings. An evening craving, not a personality. Pork and leek, if they have them.',
      'The pin is the walk through Philadelphia Chinatown. I am not naming a restaurant.',
    ],
  },
  {
    id: 'sauna',
    kicker: 'Interest',
    title: 'The first two minutes',
    paragraphs: [
      'The sauna is not a luxury. It is the period at the end of the sentence. The first two minutes are the part I came for.',
      'The pin sits with the pool at Pottruck, at Penn. Not a spa.',
    ],
  },
  {
    id: 'walk',
    kicker: 'Interest',
    title: 'An errand done at walking pace',
    paragraphs: [
      'Ogawa Ito’s shelf, in practice: seasonal fruit, or an errand done at walking pace.',
      'The pin is a walk in Philadelphia, a city I actually live the week in. Not a ritual I invented.',
    ],
  },
  {
    id: 'pool',
    kicker: 'Movement',
    title: 'Penn Club Swim, at the pool',
    paragraphs: [
      'Penn Club Swim, at the Pottruck pool. I taught beginners, which is mostly patience: the first length, before the counting starts, is the whole lesson.',
      'I like it because my head works better when my body has already done something hard. The thinking is downstream of the practice.',
    ],
  },
  {
    id: 'tennis-practice',
    kicker: 'Movement',
    title: 'Tennis',
    paragraphs: [
      'Tennis, happily, whatever schedule the courts allow. An hour that ends at sunset is a good hour.',
      'The pin is Penn Park. The practice is the point, not a league.',
    ],
  },
  {
    id: 'trail',
    kicker: 'Movement',
    title: 'Tuesday mornings, the Schuylkill',
    paragraphs: [
      'A run along the Schuylkill on Tuesday mornings. Easy pace, the kind where you can still talk.',
      'I love nature, plainly and without a program attached to it.',
    ],
  },
  {
    id: 'sauna-practice',
    kicker: 'Movement',
    title: 'The sauna, after',
    paragraphs: [
      'The sauna afterward is not a luxury. It is the period at the end of the sentence. The first two minutes are the part I came for.',
      'Same building as the pool, at Pottruck. Not a spa.',
    ],
  },
  {
    id: 'walked',
    kicker: 'Travel',
    title: 'A map you have walked',
    paragraphs: [
      'Thailand, Malaysia, Singapore, Vietnam, Japan, Taiwan, Hong Kong, Macao, Australia, Israel, Mexico, Canada.',
      'Every place recalibrated something. A map you have walked is different from a map you have only read.',
    ],
  },
  {
    id: 'discomfort',
    kicker: 'A note',
    title: 'The discomfort',
    paragraphs: [
      'The discomfort is the interesting part. Not pain for its own sake. The moment a number, a person, or a plan stops being smooth, and you have to decide without a cleaner dataset.',
      'I wrote that down on November 25, 2026. It still seems right.',
    ],
  },
  {
    id: 'edges',
    kicker: 'A note',
    title: 'What I will not pretend',
    paragraphs: [
      'I will not pretend a method covers the part it cannot see. Prediction runs out. Probability runs out. Psychology runs out. The blank edge is where judgment lives.',
      'I will not name a thing I do not understand in order to sound further along than I am.',
    ],
  },
  {
    id: 'notes',
    kicker: 'Field notes',
    title: 'Lines I kept',
    notes: [
      'Curious the way some people are tall.',
      'The limit is the interesting part.',
      'Business model over culture over price.',
      'Never touch what you do not understand.',
      'One chapter, one line saved.',
      'The first length, before counting starts.',
      'The first two minutes.',
      'Shandong to Orange County to Philadelphia is not a straight line.',
    ],
  },
];

const PINS = [
  { id: 'cluster', label: 'About Eric', short: 'Eric', at: [-75.15, 39.964], zoom: 12, motion: 'pulse', cats: [], story: 'roots', cluster: true },

  { id: 'webb', label: 'The Webb Schools', short: 'Webb', at: [-117.7197, 34.1245], zoom: 14, cats: ['route', 'curiosity'], story: 'mind', routeStop: true, offset: [0, 16] },
  { id: 'penn', label: 'University of Pennsylvania', short: 'Penn', at: [-75.1936, 39.9522], zoom: 15, cats: ['route', 'curiosity'], story: 'data', routeStop: true, local: true, offset: [0, -18] },
  { id: 'cambridge', label: 'Cambridge', short: 'Cambridge', at: [0.119, 52.205], zoom: 13, cats: ['curiosity'], story: 'statistics' },
  { id: 'london', label: 'London', short: 'London', at: [-0.088, 51.5134], zoom: 12, cats: ['curiosity'], story: 'markets' },
  { id: 'amsterdam', label: 'Amsterdam', short: 'Amsterdam', at: [4.896, 52.373], zoom: 13, cats: ['curiosity'], story: 'exchange' },
  { id: 'hongkong', label: 'Hong Kong', short: 'Hong Kong', at: [114.158, 22.285], zoom: 11, cats: ['curiosity', 'travel'], story: 'posture', country: true, offset: [-14, -12] },
  { id: 'kyoto', label: 'Japan', short: 'Japan', at: [135.768, 35.0116], zoom: 11, cats: ['curiosity'], story: 'day' },
  { id: 'jerusalem', label: 'Jerusalem', short: 'Jerusalem', at: [35.234, 31.778], zoom: 12, cats: ['curiosity'], story: 'culture' },

  { id: 'ocean', label: 'Swimming', short: 'Swimming', at: [-73.3, 39.0], zoom: 8, cats: ['interest'], story: 'ocean' },
  { id: 'tennis', label: 'Tennis', short: 'Tennis', at: [-75.1865, 39.9497], zoom: 15, cats: ['interest', 'movement'], story: 'tennis', local: true },
  { id: 'reading', label: 'Reading', short: 'Reading', at: [-75.1939, 39.9527], zoom: 16, cats: ['interest'], story: 'reading', local: true },
  { id: 'dumplings', label: 'Soup dumplings', short: 'Dumplings', at: [-75.1559, 39.9554], zoom: 15, cats: ['interest'], story: 'dumplings', local: true },
  { id: 'sauna', label: 'Sauna', short: 'Sauna', at: [-75.1966, 39.9543], zoom: 16, cats: ['interest', 'movement'], story: 'sauna', local: true },
  { id: 'walk', label: 'A walk', short: 'A walk', at: [-75.163, 39.951], zoom: 15, cats: ['interest'], story: 'walk', local: true },

  { id: 'shandong', label: 'Shandong', short: 'Shandong', at: [118.15, 36.35], zoom: 6, cats: ['route'], story: 'roots', routeStop: true },
  { id: 'oc', label: 'Orange County', short: 'Orange County', at: [-117.831, 33.684], zoom: 9, cats: ['route'], story: 'roots', routeStop: true, offset: [0, -18] },
  { id: 'pacific', label: 'The crossing', short: 'The crossing', at: [-169.9, 55.7], zoom: 4, cats: ['route'], story: 'crossing', routeStop: true },

  { id: 'pool', label: 'Penn Club Swim', short: 'Swim', at: [-75.1971, 39.9539], zoom: 16, cats: ['movement'], story: 'pool', local: true },
  { id: 'trail', label: 'Schuylkill', short: 'Schuylkill', at: [-75.1815, 39.9486], zoom: 14, cats: ['movement'], story: 'trail', local: true },
];

const COUNTRIES = [
  ['Thailand', [100.5, 13.75]],
  ['Malaysia', [101.7, 3.14]],
  ['Singapore', [103.85, 1.29]],
  ['Vietnam', [105.85, 21.03]],
  ['Japan', [139.69, 35.69]],
  ['Taiwan', [121.56, 25.03]],
  ['Macao', [113.54, 22.2]],
  ['Australia', [151.21, -33.87]],
  ['Israel', [34.78, 32.08]],
  ['Mexico', [-99.13, 19.43]],
  ['Canada', [-79.38, 43.65]],
];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '');

for (const [name, at] of COUNTRIES) {
  const id = slug(name);
  PINS.push({
    id,
    label: name,
    short: name,
    at,
    zoom: 5,
    cats: ['travel'],
    story: 'walked',
    country: true,
    offset: id === 'taiwan' ? [18, -4] : id === 'macao' ? [14, 12] : null,
  });
}

export const CAT_COLOR = {
  curiosity: '#1a73e8',
  interest: '#c43362',
  route: '#174ea6',
  movement: '#188038',
  travel: '#e8710a',
};

const card = (pin, story, title, line, place) => ({ pin, story, title, line, place });

export const CARDS = {
  curiosity: [
    card('webb', 'mind', 'How minds judge, decide, and fool themselves', 'Self-taught, at Webb, years before a syllabus.', 'The Webb Schools, Claremont'),
    card('penn', 'data', 'The blank edge is where judgment lives', 'What data can do, and where it runs out.', 'University of Pennsylvania'),
    card('cambridge', 'statistics', 'Where the map line comes from', 'The Art of Statistics, David Spiegelhalter.', 'Cambridge stands for the book'),
    card('london', 'markets', 'My favorite book on markets', 'The Price of Time, Edward Chancellor.', 'London stands for the book'),
    card('amsterdam', 'exchange', 'What money costs', 'Markets, psychology, and the old exchange.', 'Amsterdam stands for the shelf'),
    card('hongkong', 'posture', 'Business model over culture over price', 'Duan Yongping. A posture, not a meeting.', 'Hong Kong, a place he has walked'),
    card('kyoto', 'day', 'How to live a day', 'Ogawa Ito. Seasonal food, small errands.', 'Japan, a place he has walked'),
    card('jerusalem', 'culture', 'A place that recalibrated something', 'Culture, marked the way he offered it.', 'Jerusalem'),
  ],
  interest: [
    card('ocean', 'ocean', 'The first length, before counting starts', 'Swimming. The pin is the ocean, not a beach.', 'The Atlantic, as the interest'),
    card('tennis', 'tennis', 'An hour that ends at sunset', 'Whatever schedule the courts allow.', 'Penn Park, Philadelphia'),
    card('reading', 'reading', 'One chapter, one line saved', 'Spiegelhalter, Chancellor, Duan, Ogawa.', 'Van Pelt Library, Penn'),
    card('dumplings', 'dumplings', 'Pork and leek, if they have them', 'An evening craving, and a walk.', 'Philadelphia Chinatown'),
    card('sauna', 'sauna', 'The first two minutes', 'The period at the end of the sentence.', 'With the pool, at Penn'),
    card('walk', 'walk', 'An errand done at walking pace', 'Seasonal fruit, or one small errand.', 'A walk in Philadelphia'),
  ],
  route: [
    card('shandong', 'roots', 'Shandong', 'Where the map started.', 'Shandong, China'),
    card('oc', 'roots', 'Orange County', 'The coast that built me.', 'Orange County, California'),
    card('webb', 'roots', 'The Webb Schools', 'High school, in Claremont.', 'Claremont, California'),
    card('penn', 'roots', 'University of Pennsylvania', 'The coast I am building.', 'Philadelphia'),
    card('pacific', 'crossing', 'They crossed an ocean', 'So the map could start somewhere else.', 'The Pacific'),
  ],
  movement: [
    card('pool', 'pool', 'Penn Club Swim', 'At the pool. Beginners, and patience.', 'Pottruck, University of Pennsylvania'),
    card('tennis', 'tennis-practice', 'Tennis', 'Happily, when the courts allow.', 'Penn Park'),
    card('trail', 'trail', 'Tuesday, the Schuylkill', 'Easy pace. You can still talk.', 'Schuylkill River, Philadelphia'),
    card('sauna', 'sauna-practice', 'The sauna, after', 'Not a luxury. The period at the end.', 'Pottruck, with the pool'),
  ],
  travel: [
    'Thailand', 'Malaysia', 'Singapore', 'Vietnam', 'Japan', 'Taiwan',
    'Hong Kong', 'Macao', 'Australia', 'Israel', 'Mexico', 'Canada',
  ].map((name) => card(
    slug(name),
    'walked',
    name,
    'Every place recalibrated something.',
    'A place he has walked',
  )),
};

export const ROUTE = ['shandong', 'oc', 'webb', 'penn'];

export const storyById = Object.fromEntries(STORIES.map((s) => [s.id, s]));

export { PINS, STORIES };
