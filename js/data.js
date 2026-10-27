/* ==========================================================
   Along the Way: shared content.
   Every page reads from this one object. A backend can later
   return the same shape (e.g. from fetch('/api/journal')).
   ALL NAMES, PLACES AND EVENTS BELOW ARE FICTIONAL SAMPLES.
   ========================================================== */
window.JOURNAL = {
  site: {
    title: "Along the Way",
    tagline: "Sharing mission experiences and the lessons learned along the way.",
    heroImage: "images/hero-ocean.jpg",
    heroAlt: "Sun rising over a calm sea",
    sampleNotice: "Images shown here are illustrated samples, not mission photos. Replace them with real photos in images/ and js/data.js."
  },
  author: {
    // PLACEHOLDERS: replace with her real details.
    name: "[Her name]",
    photo: "images/author-placeholder.jpg",
    photoAlt: "Placeholder portrait of the author",
    annotation: "Hello, friends!",
    welcome: "Welcome, and thank you for stopping by. This is a place where I share what I'm seeing, feeling, and learning."
  },

  /* Sample pins for the illustrated map. Each links to a real entry above.
     x / y are percentages across the map. Positions are decorative, not real travel history. */
  map: { markers: [
    { entry: "packing-light", x: 69, y: 47 },
    { entry: "first-day-mtc", x: 47, y: 62 },
    { entry: "market-day",    x: 68, y: 76 }
  ] },

  /* Chapter order is controlled by the `order` number. Add or reorder freely. */
  chapters: [
    { id: "before-the-mission", order: 1, title: "Before the Mission", image: "images/chapter-before.jpg",
      description: "The preparing, the packing, and the goodbyes.",
      intro: "Every journey begins well before the first step. These entries gather the days of waiting, preparing, and wondering what lies ahead." },
    { id: "mtc", order: 2, title: "MTC", image: "images/chapter-mtc.jpg",
      description: "Weeks of learning, language, and new friends.",
      intro: "A season of study and surprise. Here are updates written during the training weeks." },
    { id: "on-the-mission", order: 3, title: "On the Mission", image: "images/chapter-mission.jpg",
      description: "Life in the field: people, places, and small miracles.",
      intro: "The heart of the journey. New streets, new faces, and lessons that arrive when least expected." }
  ],

  /* Photo records are defined once, then referenced by id from entries.
     The gallery is built from the photos entries actually use. */
  photos: {
    "envelope":     { src: "images/envelope.jpg",     alt: "Golden light over quiet hills", caption: "The morning the envelope arrived." },
    "packing":      { src: "images/packing.jpg",      alt: "Sunrise over green hills",      caption: "Packing light, with a full heart." },
    "mtc-gate":     { src: "images/mtc-gate.jpg",     alt: "Misty green hills",             caption: "" },
    "mtc-class":    { src: "images/mtc-class.jpg",    alt: "Tall hills under a pale sky",   caption: "Our classroom window view." },
    "mtc-garden":   { src: "images/mtc-garden.jpg",   alt: "Soft green garden hills",       caption: "Garden walk between classes." },
    "mtc-walk":     { src: "images/mtc-walk.jpg",     alt: "Purple dusk over rolling hills",caption: "An evening walk." },
    "arrival":      { src: "images/arrival.jpg",      alt: "Dawn over the sea",             caption: "First morning in a new place." },
    "market":       { src: "images/market.jpg",       alt: "Warm golden hills",             caption: "The hills above the market." },
    "market-hills": { src: "images/market-hills.jpg", alt: "Illustration of a village on green hills",        caption: "" },
    "bus-ride":     { src: "images/bus-ride.jpg",     alt: "Dusk over a long road",         caption: "The long ride home." }
  },

  /* Entry body blocks:
       { type: "p", text }                  paragraph
       { type: "photo", id }                single photo between paragraphs
       { type: "group", ids: [..] }         small photo group */
  entries: [
    { id: "the-envelope", chapter: "before-the-mission", title: "The Envelope on the Table", date: "2026-01-12", cover: "envelope",
      excerpt: "It sat on the kitchen table for an hour before anyone dared to open it.",
      body: [
        { type: "p", text: "It sat on the kitchen table for an hour before anyone dared to open it. We made tea. We straightened chairs. Finally, together, we read the words that would change the next chapter of life." },
        { type: "p", text: "[Sample text. Replace with her own entry.] What struck me most was how calm it felt, as though something had been quietly settled long ago." },
        { type: "photo", id: "envelope" },
        { type: "p", text: "I'm writing this so I remember exactly how the morning felt: bright, hushed, and full of possibility." }
      ] },
    { id: "packing-light", chapter: "before-the-mission", title: "Packing Light", date: "2026-02-03", cover: "packing",
      excerpt: "Two suitcases, a list that kept growing, and a lesson about what really matters.",
      body: [
        { type: "p", text: "Two suitcases, a list that kept growing, and a lesson about what really matters. [Sample text.]" },
        { type: "group", ids: ["packing", "envelope"] },
        { type: "p", text: "In the end, I kept the things that held stories and let go of the things that held only space." }
      ] },
    { id: "first-day-mtc", chapter: "mtc", title: "First Day at the MTC", date: "2026-03-04", cover: "mtc-gate",
      excerpt: "Name tags, new faces, and the happy chaos of a very first day.",
      body: [
        { type: "p", text: "Name tags, new faces, and the happy chaos of a very first day. [Sample text.]" },
        { type: "photo", id: "mtc-gate" },
        { type: "p", text: "By evening, the unfamiliar hallways already felt a little more like home." }
      ] },
    { id: "language-class", chapter: "mtc", title: "Lessons from the Language Class", date: "2026-03-18", cover: "mtc-class",
      excerpt: "Learning a language turns out to be an exercise in humility, and in laughing at yourself.",
      body: [
        { type: "p", text: "Learning a language turns out to be an exercise in humility, and in laughing at yourself. [Sample text.]" },
        { type: "photo", id: "mtc-class" },
        { type: "p", text: "Every mistake is a small doorway into someone else's patience and kindness." }
      ] },
    { id: "evening-walk", chapter: "mtc", title: "A Walk at Sunset", date: "2026-04-01", cover: "mtc-walk",
      excerpt: "Ten quiet minutes between classes became the best part of my day.",
      body: [
        { type: "p", text: "Ten quiet minutes between classes became the best part of my day. [Sample text.]" },
        { type: "group", ids: ["mtc-walk", "mtc-garden"] },
        { type: "p", text: "Some lessons arrive only when you slow down enough to hear them." }
      ] },
    { id: "arriving", chapter: "on-the-mission", title: "Arriving", date: "2026-04-22", cover: "arrival",
      excerpt: "The air smelled different, the sounds were new, and everything felt wonderfully unfamiliar.",
      body: [
        { type: "p", text: "The air smelled different, the sounds were new, and everything felt wonderfully unfamiliar. [Sample text.]" },
        { type: "photo", id: "arrival" },
        { type: "p", text: "I'm learning that being a beginner again is a gift." },
        { type: "photo", id: "bus-ride" }
      ] },
    { id: "market-day", chapter: "on-the-mission", title: "Market Day", date: "2026-05-13", cover: "market",
      excerpt: "A morning among fruit stalls, bargaining, and a stranger's generous smile.",
      body: [
        { type: "p", text: "A morning among fruit stalls, bargaining, and a stranger's generous smile. [Sample text.]" },
        { type: "group", ids: ["market", "market-hills"] },
        { type: "p", text: "Kindness, it turns out, needs no translation." }
      ] }
  ]
};
