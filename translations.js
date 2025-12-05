// translations.js
// Shared translations for index.html + agents.html

const TRANSLATIONS = {
  en: {
    // ===== Meta (generic) =====
    "meta.title": "Still In Queue",

    // ===== Common / shared =====
    "auth.cta": "Login / Sign Up",
    "footer.contactLabel": "contact :",
    "hero.scroll": "Scroll",

    // ===== INDEX (main landing) =====
    "nav.ai": "Artificial Intelligence",
    "nav.learning": "Learning Platform",
    "nav.green": "Green Energy",
    "nav.coffee": "Coffee-Cream",
    "nav.about": "About",

    "hero.title": "Still In Queue",
    "hero.badge": "Phase 1 · Concept Platform",
    "hero.line1":
      "<strong>Sique</strong> is a four-fold startup ecosystem that brings together <strong>Artificial Intelligence</strong>, a modern <strong>Learning Platform</strong>, <strong>Green Energy</strong> solutions, and a curated <strong>Coffee &amp; Cream</strong> experience.",
    "hero.line2":
      "Built step by step, it connects software, education, sustainability, and lifestyle into one evolving brand.",
    "hero.tagline": "AI · Learning · Energy · Coffee",
    "hero.cta.primary": "Explore the Four Folds",
    "hero.cta.secondary": "About Sique",

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

    "pillars.learnMore": "Learn more",

    "about.label": "About · Still In Queue",
    "about.title": "The Idea Behind Sique",
    "about.p1":
      "Still In Queue (Sique) is a long-term vision to use AI to transform how people experience technology, learning, sustainability, and coffee through smart, connected platforms.",
    "about.p2":
      "The plan is to grow carefully: begin with digital products and AI systems, then expand into green energy projects and physical spaces once the foundation is stable.",
    "about.note":
      "This website is Phase 1: a front-end that introduces the four folds. Future phases will add user accounts, backends in Python, data engineering pipelines, and fully functional platforms under the Still In Queue umbrella.",

    "footer.copy": "© 2025 Still in Queue. All rights reserved.",

    // ===== SQ-AI / AGENTS PAGE =====
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
    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. All rights reserved."
  },

  de: {
    // ===== Meta (generic) =====
    "meta.title": "Still In Queue",

    // ===== Common / shared =====
    "auth.cta": "Login / Registrieren",
    "footer.contactLabel": "kontakt :",
    "hero.scroll": "Scroll",

    // ===== INDEX (main landing) =====
    "nav.ai": "Künstliche Intelligenz",
    "nav.learning": "Lernplattform",
    "nav.green": "Grüne Energie",
    "nav.coffee": "Coffee-Cream",
    "nav.about": "Über",

    "hero.title": "Still In Queue",
    "hero.badge": "Phase 1 · Konzeptplattform",
    "hero.line1":
      "<strong>Sique</strong> ist ein vierteiliges Startup-Ökosystem, das <strong>Künstliche Intelligenz</strong>, eine moderne <strong>Lernplattform</strong>, <strong>Green-Energy</strong>-Lösungen und ein kuratiertes <strong>Coffee &amp; Cream</strong>-Erlebnis zusammenbringt.",
    "hero.line2":
      "Schritt für Schritt verbindet es Software, Bildung, Nachhaltigkeit und Lifestyle zu einer wachsenden Marke.",
    "hero.tagline": "AI · Lernen · Energie · Coffee",
    "hero.cta.primary": "Die vier Folds erkunden",
    "hero.cta.secondary": "Über Sique",

    "pillars.title": "Die vier Folds",

    "pillars.ai.tag": "SQ-AI · Blau",
    "pillars.ai.title": "Künstliche Intelligenz",
    "pillars.ai.body":
      "Visuelle Automationen und interaktive KI-Agents, die Märkte, Reisen, Ziele und Routinen im Blick behalten – aufgebaut auf Drag-and-Drop-Workflows.",

    "pillars.lp.tag": "SQ-LP · Gelb",
    "pillars.lp.title": "Lernplattform",
    "pillars.lp.body":
      "Ein Lernraum für alle Altersgruppen: Kurse, Sportakademien, Arts und Sprachtraining – mit KI, die begleitet, coached und vernetzt.",

    "pillars.ge.tag": "SQ-GE · Grün",
    "pillars.ge.title": "Grüne Energie",
    "pillars.ge.body":
      "Eine Plattform, um Solar-Lösungen zu vergleichen, Installationen zu planen und Kosten sowie Breakeven-Punkte für nachhaltige Energie zu verstehen.",

    "pillars.cc.tag": "SQ-CC · Orange",
    "pillars.cc.title": "Coffee &amp; Cream",
    "pillars.cc.body":
      "Ein Spaghettieis- und Coffee-Konzept in Hyderabad mit Bio-orientierter, gesundheitsbewusster Karte und bewusst geplanter, terminbasierter Atmosphäre.",

    "pillars.learnMore": "Mehr erfahren",

    "about.label": "About · Still In Queue",
    "about.title": "Die Idee hinter Sique",
    "about.p1":
      "Still In Queue (Sique) ist eine langfristige Vision, mit Hilfe von KI zu verändern, wie Menschen Technologie, Lernen, Nachhaltigkeit und Coffee erleben – über intelligente, vernetzte Plattformen.",
    "about.p2":
      "Der Plan ist vorsichtiges Wachstum: Zuerst digitale Produkte und KI-Systeme, dann Green-Energy-Projekte und physische Räume, sobald das Fundament stabil ist.",
    "about.note":
      "Diese Website ist Phase 1: ein Frontend, das die vier Folds vorstellt. Spätere Phasen bringen Accounts, Python-Backends, Data-Engineering-Pipelines und voll funktionsfähige Plattformen unter dem Still-In-Queue-Dach.",

    "footer.copy": "© 2025 Still in Queue. Alle Rechte vorbehalten.",

    // ===== SQ-AI / AGENTS PAGE =====
    "ai.meta.title": "Still In Queue · SQ-AI Agents & Automations",

    "ai.nav.home": "Home",
    "ai.nav.agents": "Agents",
    "ai.nav.flows": "Automationen",
    "ai.nav.about": "Über",

    "ai.hero.kicker": "SQ-AI · Agents & Workflows",
    "ai.hero.title": "Agents, die für dich aufpassen",
    "ai.hero.pill": "Phase 1 · Konzeptplattform",
    "ai.hero.p1":
      "SQ-AI ist eine Schicht aus <strong>visuellen Workflows</strong> und <strong>KI-Agents</strong>, die Märkte, Reisen, Routinen und Ziele verfolgen – ohne dass du Code schreiben oder komplexe Dashboards pflegen musst.",
    "ai.hero.p2":
      "Die Idee ist einfach: Du zeichnest, was überwacht werden soll, legst fest, wann du erinnert werden willst, und das System behält es im Hintergrund im Blick.",
    "ai.hero.bullets": "AGENTS · ALERTS · ROUTINES · BLUEPRINTS",
    "ai.hero.cta.primary": "Agent-Typen erkunden",
    "ai.hero.cta.secondary": "Automations-Konzept ansehen",

    "ai.agents.chip": "Agents",
    "ai.agents.kicker": "Agent Types",
    "ai.agents.title": "Unterschiedliche Agents für unterschiedliche Queues",
    "ai.agents.desc":
      "Mit der Zeit wird SQ-AI zu einer Bibliothek von Agents, die du einschalten kannst: Finanzen, Reisen, Gewohnheiten, Recherche und mehr. Phase 1 skizziert, wie sie gruppiert sind und was sie beobachten.",

    "ai.cards.signals.tag": "Signals",
    "ai.cards.signals.title": "Finance &amp; Market Agents",
    "ai.cards.signals.text":
      "Agents, die Aktien, ETFs, Krypto und Makro-Indikatoren verfolgen. Statt ständig Charts zu schauen, setzt du Trigger und wirst nur angestupst, wenn es wirklich wichtig ist.",
    "ai.cards.signals.meta": "Inputs: Symbole · Ranges · Alerts",

    "ai.cards.life.tag": "Life",
    "ai.cards.life.title": "Life &amp; Routine Agents",
    "ai.cards.life.text":
      "Checklisten und Mikro-Routinen: Gesundheit, Workouts, Lesen, Projektfortschritt. Agents wirken wie kleine Coaches, die Streaks im Blick haben – nicht nur To-dos.",
    "ai.cards.life.meta": "Fokus: Habits · Journals · Check-ins",

    "ai.cards.travel.tag": "Travel",
    "ai.cards.travel.title": "Travel &amp; Exploration Agents",
    "ai.cards.travel.text":
      "Flugpreise, Visa-Slots und Ziele, die du dir merkst. Agents heben Chancenfenster hervor, statt nur zufällige Deals zu zeigen.",
    "ai.cards.travel.meta": "Fokus: Daten · Routen · Präferenzen",

    "ai.flows.chip": "Automations",
    "ai.flows.kicker": "Visual Workflows",
    "ai.flows.title": "Flows zeichnen statt Code schreiben",
    "ai.flows.desc":
      "SQ-AI soll sich wie eine Canvas anfühlen: Du ziehst Nodes, verbindest sie und definierst, wie Daten fließen – von APIs und Dateien zu Summaries und Notifications.",

    "ai.flows.node.title": "Node-basierter Flow Builder",
    "ai.flows.node.text":
      "Später wird es einen Node-Editor geben, in dem jeder Block eine Aktion ist: holen, transformieren, analysieren, benachrichtigen oder speichern. Du verbindest sie visuell statt Glue-Code zu schreiben.",
    "ai.flows.node.li1": "Input-Blöcke: APIs, CSV, Google Sheets, Datenbanken.",
    "ai.flows.node.li2": "AI-Blöcke: zusammenfassen, extrahieren, klassifizieren, Ideen generieren.",
    "ai.flows.node.li3": "Output-Blöcke: E-Mail, Chat, Dashboards, Webhooks.",
    "ai.flows.node.badge1": "No-Code-Feeling",
    "ai.flows.node.badge2": "Python-Backend",
    "ai.flows.node.badge3": "Composable Flows",

    "ai.flows.blueprints.title": "Blueprints &amp; wiederverwendbare Templates",
    "ai.flows.blueprints.text":
      "Statt alles von Null zu bauen, liefert SQ-AI Blueprints, die du anpassen kannst: Monitoring-Templates, Tracker und Life-Dashboards.",
    "ai.flows.blueprints.li1": "Weekly-Review- &amp; Summary-Agents.",
    "ai.flows.blueprints.li2": "„Watch this metric &amp; tell me when…“-Flows.",
    "ai.flows.blueprints.li3": "Templates für Finanzen, Reisen und Lernen.",
    "ai.flows.blueprints.badge1": "Blueprints",
    "ai.flows.blueprints.badge2": "Personalisiert",
    "ai.flows.blueprints.badge3": "Teilbare Flows",

    "ai.about.chip": "About",
    "ai.about.kicker": "Über · SQ-AI",
    "ai.about.title": "Wie SQ-AI in Sique passt",
    "ai.about.p1":
      "SQ-AI ist der erste Fold von Still In Queue – die Software- und Automations-Schicht, die später mit der Lernplattform, Green-Energy-Dashboards und sogar dem physischen Coffee-Space verbunden wird.",
    "ai.about.p2":
      "Diese Seite ist das Konzept-Layout. Spätere Phasen verdrahten sie mit einem Python-Backend, einer Flow-Datenbank und einem Interface zum Erstellen, Speichern und Teilen von Agents, die mit echten Daten laufen.",
    "ai.about.note":
      "Grobe Roadmap:<br><br><strong>Phase 1:</strong> Frontend-Konzept &amp; Agent-Kategorien.<br><strong>Phase 2:</strong> Visueller Flow-Builder mit Basis-Blöcken.<br><strong>Phase 3:</strong> User-Accounts, Storage und Scheduling.<br><strong>Phase 4:</strong> Tiefe Integration mit den anderen Folds von Sique.",
    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. Alle Rechte vorbehalten."
  }
};

// Expose globally for main.js
window.TRANSLATIONS = TRANSLATIONS;
