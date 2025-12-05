// translations.js
// Expose translations as a global so main.js can access it.
window.SQ_TRANSLATIONS = {
  en: {
    "meta.title": "Still In Queue",

    "nav.ai": "Artificial Intelligence",
    "nav.learning": "Learning Platform",
    "nav.green": "Green Energy",
    "nav.coffee": "Coffee-Cream",
    "nav.about": "About",

    "auth.cta": "Login / Sign Up",

    "hero.title": "Still In Queue",
    "hero.badge": "Phase 1 · Concept Platform",
    "hero.line1":
      "<strong>Sique</strong> is a four-fold startup ecosystem that brings together <strong>Artificial Intelligence</strong>, a modern <strong>Learning Platform</strong>, <strong>Green Energy</strong> solutions, and a curated <strong>Coffee &amp; Cream</strong> experience.",
    "hero.line2":
      "Built step by step, it connects software, education, sustainability, and lifestyle into one evolving brand.",
    "hero.tagline": "AI · Learning · Energy · Coffee",
    "hero.cta.primary": "Explore the Four Folds",
    "hero.cta.secondary": "About Sique",
    "hero.scroll": "Scroll",

    "pillars.title": "The Four Folds",

    "pillars.ai.tag": "SQ-AI · Blue",
    "pillars.ai.title": "Artificial Intelligence",
    "pillars.ai.body":
      "Visual automations and interactive AI agents that keep an eye on markets, travel, life goals, and routines — built around drag-and-drop workflows.",

    "pillars.lp.tag": "SQ-LP · Yellow",
    "pillars.lp.title": "Learning Platform",
    "pillars.lp.body":
      "A learning space for all ages: courses, sports academies, arts, and language training — supported by AI to guide, coach, and connect.",

    "pillars.ge.tag": "SQ-GE · Green",
    "pillars.ge.title": "Green Energy",
    "pillars.ge.body":
      "A platform to compare world-class solar solutions, plan installations, and understand costs and breakeven points for sustainable energy.",

    "pillars.cc.tag": "SQ-CC · Orange",
    "pillars.cc.title": "Coffee &amp; Cream",
    "pillars.cc.body":
      "A premium Spaghettieis and coffee concept in Hyderabad, with organic, health-focused menu options and a carefully designed, appointment-only ambience.",

    "pillars.learnMore": "Learn more <span>→</span>",

    "about.label": "About · Still In Queue",
    "about.title": "The Idea Behind Sique",
    "about.p1":
      "Still In Queue (Sique) is a long-term vision to use AI to transform how people experience technology, learning, sustainability, and coffee through smart, connected platforms.",
    "about.p2":
      "The plan is to grow carefully: begin with digital products and AI systems, then expand into green energy projects and physical spaces once the foundation is stable.",
    "about.note":
      "This website is Phase 1: a front-end that introduces the four folds. Future phases will add user accounts, backends in Python, data engineering pipelines, and fully functional platforms under the Still In Queue umbrella.",

    "footer.copy": "© 2025 Still in Queue. All rights reserved.",
    "footer.contactLabel": "contact :",

    /* ===== SQ-AI page ===== */
    "ai.meta.title": "Still In Queue · SQ-AI Agents & Automations",

    "ai.nav.home": "Home",
    "ai.nav.agents": "Agents",
    "ai.nav.flows": "Automations",
    "ai.nav.about": "About",

    "ai.hero.kicker": "SQ-AI · Agents & Workflows",
    "ai.hero.title": "Agents That Watch What You Care About",
    "ai.hero.pill": "Phase 1 · Concept Platform",
    "ai.hero.p1":
      "SQ-AI is a layer of <strong>visual workflows</strong> and <strong>AI agents</strong> built to track markets, trips, routines and goals — without needing to code or manage complex dashboards.",
    "ai.hero.p2":
      "The idea is simple: draw what should be monitored, decide when to be nudged, and let the system keep an eye on it in the background.",
    "ai.hero.bullets": "AGENTS · ALERTS · ROUTINES · BLUEPRINTS",
    "ai.hero.cta.primary": "Explore Agent Types",
    "ai.hero.cta.secondary": "See Automation Concept",

    "ai.agents.chip": "Agents",
    "ai.agents.kicker": "Agent Types",
    "ai.agents.title": "Different Agents for Different Queues",
    "ai.agents.desc":
      "Over time, SQ-AI becomes a library of agents you can switch on: finance, travel, habits, research, and more. Phase 1 is a concept of how they’re grouped and what they watch.",

    "ai.cards.signals.tag": "Signals",
    "ai.cards.signals.title": "Finance &amp; Market Agents",
    "ai.cards.signals.text":
      "Agents that keep track of stocks, ETFs, crypto, and macro indicators. Instead of charts all day, you set triggers and get nudged only when it matters.",
    "ai.cards.signals.meta": "Inputs: Symbols · Ranges · Alerts",

    "ai.cards.life.tag": "Life",
    "ai.cards.life.title": "Life &amp; Routine Agents",
    "ai.cards.life.text":
      "Checklists and micro routines: health, workouts, reading, progress on projects. Agents act like small coaches that watch streaks, not just to-dos.",
    "ai.cards.life.meta": "Focus: Habits · Journals · Check-ins",

    "ai.cards.travel.tag": "Travel",
    "ai.cards.travel.title": "Travel &amp; Exploration Agents",
    "ai.cards.travel.text":
      "Track flight prices, visa slots, and destinations you pin on a map. Agents surface windows of opportunity instead of random deals.",
    "ai.cards.travel.meta": "Focus: Dates · Routes · Preferences",

    "ai.flows.chip": "Automations",
    "ai.flows.kicker": "Visual Workflows",
    "ai.flows.title": "Draw the Flow Instead of Writing Code",
    "ai.flows.desc":
      "SQ-AI is meant to feel like a canvas: you drag nodes, connect them, and define how data moves — from APIs and files to summaries and notifications.",

    "ai.flows.node.title": "Node-Based Flow Builder",
    "ai.flows.node.text":
      "A future version will provide a node editor where each block represents an action: fetch, transform, analyze, notify, or store. You connect them visually instead of writing glue code.",
    "ai.flows.node.li1": "Input blocks: APIs, CSV, Google Sheets, databases.",
    "ai.flows.node.li2": "AI blocks: summarise, extract, classify, generate ideas.",
    "ai.flows.node.li3": "Output blocks: email, chat, dashboards, webhooks.",
    "ai.flows.node.badge1": "No-code feel",
    "ai.flows.node.badge2": "Python backend",
    "ai.flows.node.badge3": "Composable flows",

    "ai.flows.blueprints.title": "Blueprints &amp; Reusable Templates",
    "ai.flows.blueprints.text":
      "Instead of building everything from scratch, SQ-AI will ship with blueprints you can customise: monitoring templates, trackers, and life dashboards.",
    "ai.flows.blueprints.li1": "Weekly review &amp; summary agents.",
    "ai.flows.blueprints.li2": "“Watch this metric &amp; tell me when…” flows.",
    "ai.flows.blueprints.li3": "Templates for finance, travel, and learning.",
    "ai.flows.blueprints.badge1": "Blueprints",
    "ai.flows.blueprints.badge2": "Personalised",
    "ai.flows.blueprints.badge3": "Shareable flows",

    "ai.about.chip": "About",
    "ai.about.kicker": "About · SQ-AI",
    "ai.about.title": "How SQ-AI Fits into Sique",
    "ai.about.p1":
      "SQ-AI is the first fold of Still In Queue — the software and automation layer that eventually connects to the learning platform, green energy dashboards, and even the physical coffee space.",
    "ai.about.p2":
      "This page is a concept layout. Future phases will wire it to a Python backend, a database of flows, and an interface for creating, saving, and sharing agents that run on real data.",
    "ai.about.note":
      "Rough path:<br><br><strong>Phase 1:</strong> Front-end concept &amp; agent categories.<br><strong>Phase 2:</strong> Visual flow builder with basic blocks.<br><strong>Phase 3:</strong> User accounts, storage, and scheduling.<br><strong>Phase 4:</strong> Deep integrations with the other folds of Sique.",

    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. All rights reserved.",

    /* ===== SQ-CC page ===== */
    "cc.meta.title": "Still In Queue · Coffee &amp; Cream",

    "cc.nav.home": "Home",
    "cc.nav.menu": "Menu",
    "cc.nav.experience": "Experience",
    "cc.nav.diy": "DIY Bar",
    "cc.nav.about": "About",

    "cc.hero.kicker": "SQ-CC · Coffee &amp; Cream",
    "cc.hero.title": "Spaghettieis, Coffee &amp; Calm",
    "cc.hero.pill": "Phase 1 · Concept Storefront",
    "cc.hero.line1":
      "SQ-CC is an ice cream and coffee concept that introduces <strong>Spaghettieis</strong> to Hyderabad — alongside bowls, sundaes, cakes, and specialty coffee made with organic, hand-selected ingredients.",
    "cc.hero.line2":
      "Think Insta-worthy, health-focused, and appointment-only: 90 minutes per guest, with space for work, conversation, and small celebrations.",
    "cc.hero.bullets": "SPAGHETTIEIS · BOWLS · COFFEE · VIBES",
    "cc.hero.cta.primary": "Explore the Concept Menu",
    "cc.hero.cta.secondary": "See the Experience",

    "cc.menu.kicker": "Menu Concept",
    "cc.menu.title": "Coffee, Cream &amp; Spaghettieis",
    "cc.menu.desc":
      "This is the first sketch of the menu. Later, this page can become an interactive menu with photos, nutrition details, and online ordering or pre-selection for your appointment.",

    "cc.menu.card1.tag": "Signature",
    "cc.menu.card1.title": "Spaghetti Eis Collection",
    "cc.menu.card1.text":
      "Classic vanilla “pasta”, rich sauces, crunchy toppings, and playful combinations designed for photos and flavour — from strawberry fields to chocolate night.",
    "cc.menu.card1.meta":
      "Base: organic dairy · low-refined sugar options",

    "cc.menu.card2.tag": "Bowls &amp; Sundaes",
    "cc.menu.card2.title": "Balanced Bowls &amp; Sundaes",
    "cc.menu.card2.text":
      "Fruit-forward bowls, protein-friendly sundaes, and customisable combinations that focus on freshness without losing the fun of a proper dessert.",
    "cc.menu.card2.meta":
      "Options: plant-based · high-protein · classic",

    "cc.menu.card3.tag": "Cakes &amp; Coffee",
    "cc.menu.card3.title": "Cakes, Bakes &amp; Specialty Coffee",
    "cc.menu.card3.text":
      "Small-batch cakes and bakes, paired with espresso drinks, cold brew, and slow coffee options tailored for people who like to sit, talk, or work for a while.",
    "cc.menu.card3.meta":
      "Roast: curated beans · seasonal specials",

    "cc.exp.kicker": "Space &amp; Experience",
    "cc.exp.title": "A 90-Minute Tiny Escape",
    "cc.exp.desc":
      "SQ-CC is planned as a limited-capacity, appointment-only space — designed for young and working professionals, but welcoming for all ages and celebrations.",

    "cc.exp.card1.title": "Ambience &amp; Seating",
    "cc.exp.card1.text":
      "Warm lighting, wood and soft textures, and a layout that works for solo visits, pairs, or small groups. Every corner is designed to be camera-friendly without feeling fake.",
    "cc.exp.card1.li1": "90-minute slots per guest or group.",
    "cc.exp.card1.li2": "Quiet-friendly tables for laptops and reading.",
    "cc.exp.card1.li3": "Photo spots for those “this place” moments.",
    "cc.exp.card1.badge1": "Insta-worthy",
    "cc.exp.card1.badge2": "Cozy seating",
    "cc.exp.card1.badge3": "Work-friendly",

    "cc.exp.card2.title": "Reservations &amp; Specials",
    "cc.exp.card2.text":
      "Access is by appointment only, so the store never feels crowded. Over time, the website can handle slot booking, pre-ordered desserts, and special celebration add-ons.",
    "cc.exp.card2.li1": "Student discount concept: 10% with valid ID.",
    "cc.exp.card2.li2": "Birthday &amp; celebration packages (future phase).",
    "cc.exp.card2.li3": "Private or semi-private bookings for small events.",
    "cc.exp.card2.badge1": "Slots",
    "cc.exp.card2.badge2": "Student 10%",
    "cc.exp.card2.badge3": "Celebrations",

    "cc.diy.kicker": "DIY Terminal",
    "cc.diy.title": "Build Your Own Bowl",
    "cc.diy.desc":
      "A big part of SQ-CC is choice. The DIY terminal lets guests design their own bowls, sundaes, and Spaghettieis before they reach the counter.",

    "cc.diy.card1.title": "Digital DIY Flow (Concept)",
    "cc.diy.card1.text":
      "On this page, the DIY experience can later become an interactive builder: pick a base, sauce, toppings, and extras, see nutrition hints, and save favourites to your profile.",
    "cc.diy.card1.li1": "Step 1: Choose base (ice cream, yoghurt, vegan, etc.).",
    "cc.diy.card1.li2": "Step 2: Pick sauces, fruits, nuts, crunch.",
    "cc.diy.card1.li3": "Step 3: Add extras like shots of espresso or protein.",
    "cc.diy.card1.badge1": "Custom combos",
    "cc.diy.card1.badge2": "Profiles",
    "cc.diy.card1.badge3": "Recommendations",

    "cc.diy.card2.title": "Health-Aware, Not “Diet”",
    "cc.diy.card2.text":
      "The idea is not to remove joy, but to give transparency: clear ingredients, optional lighter choices, and portions that feel good.",
    "cc.diy.card2.li1": "Organic or carefully sourced key ingredients.",
    "cc.diy.card2.li2": "Labels for plant-based, protein-rich, or low-sugar options.",
    "cc.diy.card2.li3": "Room for seasonal menus with local produce.",
    "cc.diy.card2.badge1": "Ingredient focus",
    "cc.diy.card2.badge2": "Balanced options",
    "cc.diy.card2.badge3": "Seasonal menus",

    "cc.about.kicker": "About · SQ-CC",
    "cc.about.title": "Why Coffee &amp; Cream is a Fold",
    "cc.about.p1":
      "SQ-CC is the lifestyle fold of Still In Queue — a physical space that balances the more technical folds of AI, learning, and green energy. It reflects the same mindset: thoughtful design, long-term quality, and experiences that feel considered rather than random.",
    "cc.about.p2":
      "This page is a concept layout for the store and its digital experience. In the future, it can evolve into a full booking system, loyalty or membership features, and a live menu directly connected to SQ’s backend stack.",
    "cc.about.note":
      "Future ideas:<br><br><strong>Phase 1:</strong> Concept site &amp; brand story.<br><strong>Phase 2:</strong> Slot booking, digital menu, DIY builder UI.<br><strong>Phase 3:</strong> Loyalty accounts connected to the main Sique login.<br><strong>Phase 4:</strong> Multiple locations or pop-ups under the SQ-CC brand.",

    "cc.footer.copy": "© 2025 Still in Queue · SQ-CC. All rights reserved."
  },

  de: {
    "meta.title": "Still In Queue",

    "nav.ai": "Künstliche Intelligenz",
    "nav.learning": "Lernplattform",
    "nav.green": "Grüne Energie",
    "nav.coffee": "Coffee &amp; Cream",
    "nav.about": "Über Sique",

    "auth.cta": "Login / Registrierung",

    "hero.title": "Still In Queue",
    "hero.badge": "Phase 1 · Konzeptplattform",
    "hero.line1":
      "<strong>Sique</strong> ist ein vierteiliges Startup-Ökosystem, das <strong>Künstliche Intelligenz</strong>, eine moderne <strong>Lernplattform</strong>, Lösungen im Bereich <strong>Grüne Energie</strong> und ein kuratiertes <strong>Coffee-&amp;-Cream</strong>-Erlebnis miteinander verbindet.",
    "hero.line2":
      "Schritt für Schritt wachsen hier Software, Bildung, Nachhaltigkeit und Lifestyle zu einer Marke zusammen, die sich kontinuierlich weiterentwickelt.",
    "hero.tagline": "KI · Lernen · Energie · Coffee",
    "hero.cta.primary": "Die vier Bereiche entdecken",
    "hero.cta.secondary": "Mehr über Sique",
    "hero.scroll": "Scrollen",

    "pillars.title": "Die vier Bereiche",

    "pillars.ai.tag": "SQ-AI · Blau",
    "pillars.ai.title": "Künstliche Intelligenz",
    "pillars.ai.body":
      "Visuelle Automatisierungen und interaktive KI-Agenten, die Märkte, Reisen, Lebensziele und Routinen im Blick behalten – aufgebaut auf intuitiven Drag-and-Drop-Workflows.",

    "pillars.lp.tag": "SQ-LP · Gelb",
    "pillars.lp.title": "Lernplattform",
    "pillars.lp.body":
      "Ein Lernraum für alle Altersgruppen: Online-Kurse, Sportakademien, kreative Angebote und Sprachtraining – unterstützt von KI, die begleitet, coacht und vernetzt.",

    "pillars.ge.tag": "SQ-GE · Grün",
    "pillars.ge.title": "Grüne Energie",
    "pillars.ge.body":
      "Eine Plattform, um erstklassige Solarlösungen zu vergleichen, Installationen zu planen und Kosten sowie Amortisationszeiten für nachhaltige Energie transparent zu verstehen.",

    "pillars.cc.tag": "SQ-CC · Orange",
    "pillars.cc.title": "Coffee &amp; Cream",
    "pillars.cc.body":
      "Ein Premium-Spaghettieis- und Coffee-Konzept in Hyderabad mit organischen, bewusst ausgewählten Zutaten, gesundheitsorientierten Optionen und einer bewusst begrenzten, terminbasierten Atmosphäre.",

    "pillars.learnMore": "Mehr erfahren <span>→</span>",

    "about.label": "Über · Still In Queue",
    "about.title": "Die Idee hinter Sique",
    "about.p1":
      "Still In Queue (Sique) ist eine langfristige Vision, KI einzusetzen, um zu verändern, wie Menschen Technologie, Lernen, Nachhaltigkeit und Coffee erleben – über intelligente, miteinander verbundene Plattformen.",
    "about.p2":
      "Der Plan ist, sorgfältig zu wachsen: zuerst mit digitalen Produkten und KI-Systemen, später mit Projekten im Bereich Grüne Energie und physischen Orten, sobald das Fundament stabil ist.",
    "about.note":
      "Diese Website ist Phase 1: ein Frontend, das die vier Bereiche vorstellt. In späteren Phasen kommen Nutzerkonten, Python-Backends, Data-Engineering-Pipelines und voll funktionsfähige Plattformen unter dem Dach von Still In Queue hinzu.",

    "footer.copy": "© 2025 Still in Queue. Alle Rechte vorbehalten.",
    "footer.contactLabel": "Kontakt:",

    /* ===== SQ-AI page ===== */
    "ai.meta.title": "Still In Queue · SQ-AI Agents & Automatisierungen",

    "ai.nav.home": "Home",
    "ai.nav.agents": "Agents",
    "ai.nav.flows": "Automatisierungen",
    "ai.nav.about": "Über SQ-AI",

    "ai.hero.kicker": "SQ-AI · Agents & Workflows",
    "ai.hero.title": "Agents, die beobachten, was dir wichtig ist",
    "ai.hero.pill": "Phase 1 · Konzeptplattform",
    "ai.hero.p1":
      "SQ-AI ist eine Schicht aus <strong>visuellen Workflows</strong> und <strong>KI-Agents</strong>, die Märkte, Reisen, Routinen und Ziele im Blick behalten – ohne dass du Code schreiben oder komplexe Dashboards pflegen musst.",
    "ai.hero.p2":
      "Die Idee ist einfach: Du zeichnest, was überwacht werden soll, legst fest, wann du angestupst wirst, und das System behält alles im Hintergrund im Auge.",
    "ai.hero.bullets": "AGENTS · ALERTS · ROUTINEN · BLUEPRINTS",
    "ai.hero.cta.primary": "Agent-Typen entdecken",
    "ai.hero.cta.secondary": "Automationskonzept ansehen",

    "ai.agents.chip": "Agents",
    "ai.agents.kicker": "Agent-Typen",
    "ai.agents.title": "Verschiedene Agents für verschiedene Queues",
    "ai.agents.desc":
      "Mit der Zeit wird SQ-AI zu einer Bibliothek von Agents, die du einfach aktivieren kannst: Finanzen, Reisen, Gewohnheiten, Recherche und mehr. Phase 1 skizziert, wie sie gruppiert sind und was sie beobachten.",

    "ai.cards.signals.tag": "Signals",
    "ai.cards.signals.title": "Finanz- &amp; Markt-Agents",
    "ai.cards.signals.text":
      "Agents, die Aktien, ETFs, Krypto und makroökonomische Indikatoren verfolgen. Statt den ganzen Tag Charts zu checken, definierst du Trigger und wirst nur dann angestupst, wenn es wirklich relevant ist.",
    "ai.cards.signals.meta": "Inputs: Symbole · Bereiche · Alerts",

    "ai.cards.life.tag": "Life",
    "ai.cards.life.title": "Life- &amp; Routine-Agents",
    "ai.cards.life.text":
      "Checklisten und Mikro-Routinen: Gesundheit, Workouts, Lesen, Fortschritt in Projekten. Agents verhalten sich wie kleine Coaches, die deine Streaks im Auge behalten – nicht nur To-do-Listen.",
    "ai.cards.life.meta": "Fokus: Gewohnheiten · Journals · Check-ins",

    "ai.cards.travel.tag": "Travel",
    "ai.cards.travel.title": "Travel- &amp; Exploration-Agents",
    "ai.cards.travel.text":
      "Sie verfolgen Flugpreise, Visa-Slots und Ziele, die du auf der Karte pinnst. Statt zufälliger Angebote zeigen sie dir Zeitfenster, in denen sich etwas wirklich lohnt.",
    "ai.cards.travel.meta": "Fokus: Daten · Routen · Präferenzen",

    "ai.flows.chip": "Automatisierungen",
    "ai.flows.kicker": "Visuelle Workflows",
    "ai.flows.title": "Flows zeichnen statt Code zu schreiben",
    "ai.flows.desc":
      "SQ-AI soll sich wie eine Leinwand anfühlen: Du ziehst Nodes, verbindest sie und definierst, wie Daten fließen – von APIs und Dateien bis hin zu Zusammenfassungen und Notifications.",

    "ai.flows.node.title": "Node-basierter Flow-Builder",
    "ai.flows.node.text":
      "In einer späteren Version gibt es einen Editor, in dem jeder Block eine Aktion darstellt: holen, transformieren, analysieren, benachrichtigen oder speichern. Du verbindest alles visuell statt mit Glue-Code.",
    "ai.flows.node.li1": "Input-Nodes: APIs, CSV, Google Sheets, Datenbanken.",
    "ai.flows.node.li2": "KI-Nodes: zusammenfassen, extrahieren, klassifizieren, Ideen generieren.",
    "ai.flows.node.li3": "Output-Nodes: E-Mail, Chat, Dashboards, Webhooks.",
    "ai.flows.node.badge1": "No-Code-Feeling",
    "ai.flows.node.badge2": "Python-Backend",
    "ai.flows.node.badge3": "Composable Flows",

    "ai.flows.blueprints.title": "Blueprints &amp; wiederverwendbare Templates",
    "ai.flows.blueprints.text":
      "Statt alles von vorne aufzubauen, liefert SQ-AI Blueprints, die du anpassen kannst: Monitoring-Templates, Tracker und Life-Dashboards.",
    "ai.flows.blueprints.li1": "Wöchentliche Review- &amp; Summary-Agents.",
    "ai.flows.blueprints.li2": "„Beobachte diese Kennzahl &amp; sag mir, wenn…“-Flows.",
    "ai.flows.blueprints.li3": "Templates für Finanzen, Reisen und Lernen.",
    "ai.flows.blueprints.badge1": "Blueprints",
    "ai.flows.blueprints.badge2": "Personalisiert",
    "ai.flows.blueprints.badge3": "Teilbare Flows",

    "ai.about.chip": "About",
    "ai.about.kicker": "About · SQ-AI",
    "ai.about.title": "Wie SQ-AI in Sique hineinpasst",
    "ai.about.p1":
      "SQ-AI ist der erste Bereich von Still In Queue – die Software- und Automationsschicht, die später mit der Lernplattform, Green-Energy-Dashboards und sogar dem physischen Coffee-Space verbunden wird.",
    "ai.about.p2":
      "Diese Seite ist ein Konzeptlayout. In späteren Phasen wird sie mit einem Python-Backend, einer Flow-Datenbank und einem Interface verbunden, in dem du Agents mit echten Daten erstellen, speichern und teilen kannst.",
    "ai.about.note":
      "Grobe Roadmap:<br><br><strong>Phase 1:</strong> Frontend-Konzept &amp; Agent-Kategorien.<br><strong>Phase 2:</strong> Visueller Flow-Builder mit Basis-Nodes.<br><strong>Phase 3:</strong> Nutzerkonten, Speicherung und Scheduling.<br><strong>Phase 4:</strong> Tiefe Integration mit den anderen Sique-Bereichen.",

    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. Alle Rechte vorbehalten.",

    /* ===== SQ-CC page ===== */
    "cc.meta.title": "Still In Queue · Coffee &amp; Cream",

    "cc.nav.home": "Home",
    "cc.nav.menu": "Menü",
    "cc.nav.experience": "Erlebnis",
    "cc.nav.diy": "DIY Bar",
    "cc.nav.about": "Über",

    "cc.hero.kicker": "SQ-CC · Coffee &amp; Cream",
    "cc.hero.title": "Spaghettieis, Coffee &amp; Calm",
    "cc.hero.pill": "Phase 1 · Konzept-Storefront",
    "cc.hero.line1":
      "SQ-CC ist ein Eis- und Coffee-Konzept, das <strong>Spaghettieis</strong> nach Hyderabad bringt – zusammen mit Bowls, Sundaes, Kuchen und Specialty Coffee auf Basis organischer, sorgfältig ausgewählter Zutaten.",
    "cc.hero.line2":
      "Gedacht als Insta-tauglich, bewusst, und nur mit Termin: 90 Minuten pro Gast, mit Raum für Arbeit, Gespräche und kleine Feiern.",
    "cc.hero.bullets": "SPAGHETTIEIS · BOWLS · COFFEE · VIBES",
    "cc.hero.cta.primary": "Konzept-Menü entdecken",
    "cc.hero.cta.secondary": "Das Erlebnis ansehen",

    "cc.menu.kicker": "Menü-Konzept",
    "cc.menu.title": "Coffee, Cream &amp; Spaghettieis",
    "cc.menu.desc":
      "Dies ist der erste Entwurf des Menüs. Später kann diese Seite zu einer interaktiven Karte mit Fotos, Nährwertangaben und Online-Bestellung oder Vorauswahl für deinen Termin werden.",

    "cc.menu.card1.tag": "Signature",
    "cc.menu.card1.title": "Spaghetti-Eis Kollektion",
    "cc.menu.card1.text":
      "Klassische Vanille-„Pasta“, intensive Saucen, Crunch-Toppings und verspielte Kombinationen – entworfen für Fotos und Geschmack, von Strawberry Fields bis Chocolate Night.",
    "cc.menu.card1.meta":
      "Basis: Bio-Milch · Optionen mit wenig raffiniertem Zucker",

    "cc.menu.card2.tag": "Bowls &amp; Sundaes",
    "cc.menu.card2.title": "Balanced Bowls &amp; Sundaes",
    "cc.menu.card2.text":
      "Fruchtige Bowls, proteinfreundliche Sundaes und anpassbare Kombinationen, die Frische in den Fokus stellen, ohne den Spaß eines echten Desserts zu verlieren.",
    "cc.menu.card2.meta":
      "Optionen: plant-based · proteinreich · klassisch",

    "cc.menu.card3.tag": "Cakes &amp; Coffee",
    "cc.menu.card3.title": "Cakes, Bakes &amp; Specialty Coffee",
    "cc.menu.card3.text":
      "Kleinteilige Batches an Kuchen und Gebäck, kombiniert mit Espresso-Drinks, Cold Brew und Slow-Coffee-Optionen für alle, die gerne sitzen, reden oder arbeiten.",
    "cc.menu.card3.meta":
      "Röstung: kuratierte Bohnen · saisonale Specials",

    "cc.exp.kicker": "Space &amp; Experience",
    "cc.exp.title": "Eine 90-minütige kleine Auszeit",
    "cc.exp.desc":
      "SQ-CC ist als Ort mit begrenzter Kapazität und Terminvergabe geplant – gedacht für junge und berufstätige Menschen, aber offen für alle Altersgruppen und Anlässe.",

    "cc.exp.card1.title": "Ambience &amp; Seating",
    "cc.exp.card1.text":
      "Warme Beleuchtung, Holz und weiche Texturen, plus ein Layout, das für Solo-Besuche, Paare und kleine Gruppen funktioniert. Jeder Winkel ist fotofreundlich, ohne gekünstelt zu wirken.",
    "cc.exp.card1.li1": "90-Minuten-Slots pro Gast oder Gruppe.",
    "cc.exp.card1.li2": "Ruhige Tische für Laptop und Lesen.",
    "cc.exp.card1.li3": "Foto-Spots für diese „dieser Ort“-Momente.",
    "cc.exp.card1.badge1": "Insta-worthy",
    "cc.exp.card1.badge2": "Gemütliche Plätze",
    "cc.exp.card1.badge3": "Work-friendly",

    "cc.exp.card2.title": "Reservations &amp; Specials",
    "cc.exp.card2.text":
      "Der Zugang erfolgt nur mit Termin, damit der Store nie überfüllt wirkt. Mit der Zeit kann die Website Slot-Buchungen, Vorbestellungen und Celebration-Add-ons übernehmen.",
    "cc.exp.card2.li1": "Studenten-Rabattidee: 10 % mit gültigem Ausweis.",
    "cc.exp.card2.li2": "Birthday- &amp; Celebration-Packages (spätere Phase).",
    "cc.exp.card2.li3": "Private oder halb-private Buchungen für kleine Events.",
    "cc.exp.card2.badge1": "Slots",
    "cc.exp.card2.badge2": "Student 10 %",
    "cc.exp.card2.badge3": "Celebrations",

    "cc.diy.kicker": "DIY Terminal",
    "cc.diy.title": "Build Your Own Bowl",
    "cc.diy.desc":
      "Ein großer Teil von SQ-CC ist Auswahl. Am DIY-Terminal stellen Gäste ihre eigenen Bowls, Sundaes und Spaghettieis-Kreationen zusammen, bevor sie an der Theke ankommen.",

    "cc.diy.card1.title": "Digital DIY Flow (Konzept)",
    "cc.diy.card1.text":
      "Auf dieser Seite kann der DIY-Flow später interaktiv werden: Base, Sauce, Toppings und Extras wählen, Nährwert-Hinweise sehen und Favoriten im Profil speichern.",
    "cc.diy.card1.li1": "Schritt 1: Basis wählen (Eis, Joghurt, vegan etc.).",
    "cc.diy.card1.li2": "Schritt 2: Saucen, Früchte, Nüsse, Crunch.",
    "cc.diy.card1.li3": "Schritt 3: Extras wie Espresso-Shots oder Protein ergänzen.",
    "cc.diy.card1.badge1": "Custom Combos",
    "cc.diy.card1.badge2": "Profile",
    "cc.diy.card1.badge3": "Recommendations",

    "cc.diy.card2.title": "Health-Aware, nicht „Diät“",
    "cc.diy.card2.text":
      "Die Idee ist nicht, Freude zu streichen, sondern Transparenz zu geben: klare Zutaten, optionale leichtere Varianten und Portionen, die sich gut anfühlen.",
    "cc.diy.card2.li1": "Organische oder bewusst ausgewählte Schlüsselzutaten.",
    "cc.diy.card2.li2": "Labels für plant-based, proteinreich oder zuckerreduziert.",
    "cc.diy.card2.li3": "Platz für saisonale Menüs mit lokalen Zutaten.",
    "cc.diy.card2.badge1": "Zutaten im Fokus",
    "cc.diy.card2.badge2": "Ausgewogene Optionen",
    "cc.diy.card2.badge3": "Saisonale Menüs",

    "cc.about.kicker": "Über · SQ-CC",
    "cc.about.title": "Warum Coffee &amp; Cream ein Bereich ist",
    "cc.about.p1":
      "SQ-CC ist der Lifestyle-Bereich von Still In Queue – ein physischer Ort, der die technischeren Bereiche KI, Lernen und Green Energy ausbalanciert. Er spiegelt dieselbe Haltung wider: durchdachtes Design, langfristige Qualität und Erlebnisse, die bewusst wirken statt zufällig.",
    "cc.about.p2":
      "Diese Seite ist ein Konzept-Layout für Store und digitales Erlebnis. Später kann daraus ein vollwertiges Buchungssystem mit Loyalty- oder Membership-Features und ein Live-Menü werden, das direkt an das SQ-Backend angebunden ist.",
    "cc.about.note":
      "Zukünftige Ideen:<br><br><strong>Phase 1:</strong> Konzept-Site &amp; Brand Story.<br><strong>Phase 2:</strong> Slot-Buchung, digitales Menü, DIY-Builder-UI.<br><strong>Phase 3:</strong> Loyalty-Accounts verbunden mit dem Haupt-Sique-Login.<br><strong>Phase 4:</strong> Mehrere Locations oder Pop-ups unter der Marke SQ-CC.",

    "cc.footer.copy": "© 2025 Still in Queue · SQ-CC. Alle Rechte vorbehalten."
  }
};
