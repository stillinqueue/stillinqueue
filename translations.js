// translations.js
// Shared translations for index.html, agents.html (SQ-AI) and learning.html (SQ-LP)

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
    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. All rights reserved.",

    // ===== SQ-LP / LEARNING PAGE =====
    "lp.meta.title": "Still In Queue · Learning",

    "lp.nav.home": "Home",
    "lp.nav.courses": "Courses",
    "lp.nav.sports": "Sports",
    "lp.nav.arts": "Arts &amp; Clubs",
    "lp.nav.about": "About",

    "lp.hero.kicker": "SQ-LP · Learning Platform",
    "lp.hero.title": "Learning That Follows Your Life",
    "lp.hero.pill": "Phase 1 · Concept Campus",
    "lp.hero.line1":
      "SQ-LP is a learning platform that combines structured courses, sports academies, arts, and language training into one place — supported by <strong>AI mentors</strong> that guide, coach, and keep you on track.",
    "lp.hero.line2":
      "From online lessons to real-world clubs and academies, the goal is to make it easy to discover, plan, and stay consistent with the skills you actually care about.",
    "lp.hero.bullets": "COURSES · SPORTS · ARTS · CLUBS",
    "lp.hero.cta.primary": "Explore Learning Areas",
    "lp.hero.cta.secondary": "About SQ-LP",

    "lp.courses.chip": "Courses",
    "lp.courses.kicker": "E-Learning",
    "lp.courses.title": "Courses for Every Stage",
    "lp.courses.desc":
      "In later phases, this becomes an interactive library of courses with AI tutors and personalised paths. For now, it maps the core idea of what SQ-LP will cover.",

    "lp.courses.card1.tag": "Foundations",
    "lp.courses.card1.title": "School &amp; University Support",
    "lp.courses.card1.text":
      "Structured content for school and college students, with AI helping to explain concepts, create practice questions, and track progress.",
    "lp.courses.card1.meta": "Focus: Maths · Science · Languages · Exams",

    "lp.courses.card2.tag": "Careers",
    "lp.courses.card2.title": "Career &amp; Tech Skills",
    "lp.courses.card2.text":
      "Data, programming, design, business, and communication skills to support modern careers — with project-style learning and portfolio guidance.",
    "lp.courses.card2.meta": "Focus: Data · Dev · Design · Business",

    "lp.courses.card3.tag": "Lifelong",
    "lp.courses.card3.title": "Everyday Learning",
    "lp.courses.card3.text":
      "Personal finance, productivity, mindset, and hobby-based micro courses, designed for short sessions that fit into a busy week.",
    "lp.courses.card3.meta": "Focus: Money · Habits · Hobbies",

    "lp.sports.chip": "Sports",
    "lp.sports.kicker": "Sport Map",
    "lp.sports.title": "Find Places to Train &amp; Play",
    "lp.sports.desc":
      "SQ-LP also looks outward: it becomes a directory of academies, clubs, and tournaments so sports enthusiasts can find places to actually practice — not just watch.",

    "lp.sports.card1.title": "Nearby Academies &amp; Training Centers",
    "lp.sports.card1.text":
      "The sports view is meant to show academies and coaching centers around you, with filters for age, level, and budget. Later, AI can recommend options based on your interests and schedule.",
    "lp.sports.card1.li1":
      "Team sports: football, cricket, basketball, volleyball, etc.",
    "lp.sports.card1.li2":
      "Individual sports: tennis, badminton, athletics, swimming.",
    "lp.sports.card1.li3":
      "Specialized programs: strength &amp; conditioning, kids camps.",
    "lp.sports.card1.badge1": "Maps &amp; distances",
    "lp.sports.card1.badge2": "Timings",
    "lp.sports.card1.badge3": "Difficulty level",

    "lp.sports.card2.title": "Tournaments, Leagues &amp; Events",
    "lp.sports.card2.text":
      "A calendar-style view will highlight local leagues, tournaments, and community events, so players and parents can plan participation in advance.",
    "lp.sports.card2.li1": "Monthly and seasonal tournaments.",
    "lp.sports.card2.li2": "Beginner-friendly events to start competing.",
    "lp.sports.card2.li3": "Links to registration pages and schedules.",
    "lp.sports.card2.badge1": "Calendar",
    "lp.sports.card2.badge2": "Notifications",
    "lp.sports.card2.badge3": "Team invites",

    "lp.arts.chip": "Arts &amp; Clubs",
    "lp.arts.kicker": "Arts &amp; Creative Clubs",
    "lp.arts.title": "Learning Beyond the Classroom",
    "lp.arts.desc":
      "Dance, music, painting, pottery, photography, acting, cooking, fashion — SQ-LP treats them as serious skills, not just hobbies.",

    "lp.arts.card1.title": "Studios, Schools &amp; Workshops",
    "lp.arts.card1.text":
      "Discover places to learn creative arts offline, with photos, timing, and areas of focus. In the future, hybrid programs will combine online modules with in-person practice.",
    "lp.arts.card1.li1":
      "Dance studios, music schools, and theatre groups.",
    "lp.arts.card1.li2":
      "Art, pottery, and craft workshops.",
    "lp.arts.card1.li3":
      "Cooking, baking, and culinary schools.",

    "lp.arts.card2.title": "Clubs, Communities &amp; Events",
    "lp.arts.card2.text":
      "A club directory will help people find photography walks, book clubs, jam sessions, open mics, and more — so learning naturally connects to community.",
    "lp.arts.card2.li1":
      "Community clubs and informal meetups.",
    "lp.arts.card2.li2":
      "Showcases, recitals, and exhibitions.",
    "lp.arts.card2.li3":
      "AI-assisted discovery based on your profile.",
    "lp.arts.card2.badge1": "Events",
    "lp.arts.card2.badge2": "Groups",
    "lp.arts.card2.badge3": "AI suggestions",

    "lp.about.chip": "About",
    "lp.about.kicker": "About · SQ-LP",
    "lp.about.title": "The Idea Behind the Learning Platform",
    "lp.about.p1":
      "SQ-LP is the second fold of Still In Queue — a space where structured courses, sports, and arts share the same ecosystem. The long-term goal is to combine <strong>high-quality content</strong> with <strong>AI guidance</strong> and real-world places to learn.",
    "lp.about.p2":
      "This page is the concept layout. In future phases it will connect to a Python backend, video library, recommendation engine, and a map of academies and studios — turning SQ-LP into a real learning companion for different ages and goals.",
    "lp.about.note":
      "Rough roadmap:<br><br><strong>Phase 1:</strong> Front-end layout and content structure.<br><strong>Phase 2:</strong> Course catalog with AI-powered overviews and progress tracking.<br><strong>Phase 3:</strong> Integration with sports &amp; arts locations, maps, and events.<br><strong>Phase 4:</strong> Personalized learning paths and community features.",

    "lp.footer.copy": "© 2025 Still in Queue · SQ-LP. All rights reserved."
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
      "Ein Lernraum für alle Altersgruppen: Kurse, Sportakademien, Arts und Sprachtraining – mit KI, die begleitet, coacht und vernetzt.",

    "pillars.ge.tag": "SQ-GE · Grün",
    "pillars.ge.title": "Grüne Energie",
    "pillars.ge.body":
      "Eine Plattform, um Solar-Lösungen zu vergleichen, Installationen zu planen und Kosten sowie Breakeven-Punkte für nachhaltige Energie zu verstehen.",

    "pillars.cc.tag": "SQ-CC · Orange",
    "pillars.cc.title": "Coffee &amp; Cream",
    "pillars.cc.body":
      "Ein Spaghettieis- und Coffee-Konzept in Hyderabad mit bio-orientierter, gesundheitsbewusster Karte und bewusst geplanter, terminbasierter Atmosphäre.",

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
    "ai.footer.copy": "© 2025 Still in Queue · SQ-AI. Alle Rechte vorbehalten.",

    // ===== SQ-LP / LEARNING PAGE =====
    "lp.meta.title": "Still In Queue · Lernplattform",

    "lp.nav.home": "Home",
    "lp.nav.courses": "Kurse",
    "lp.nav.sports": "Sport",
    "lp.nav.arts": "Arts &amp; Clubs",
    "lp.nav.about": "Über",

    "lp.hero.kicker": "SQ-LP · Lernplattform",
    "lp.hero.title": "Lernen, das zu deinem Leben passt",
    "lp.hero.pill": "Phase 1 · Konzept-Campus",
    "lp.hero.line1":
      "SQ-LP ist eine Lernplattform, die strukturierte Kurse, Sportakademien, Arts und Sprachtraining an einem Ort bündelt – unterstützt von <strong>KI-Mentoren</strong>, die führen, coachen und dich auf Kurs halten.",
    "lp.hero.line2":
      "Von Online-Lektionen bis zu realen Clubs und Akademien soll es leicht werden, die Themen zu finden, zu planen und dranzubleiben, die dir wirklich wichtig sind.",
    "lp.hero.bullets": "KURSE · SPORT · ARTS · CLUBS",
    "lp.hero.cta.primary": "Lernbereiche erkunden",
    "lp.hero.cta.secondary": "Über SQ-LP",

    "lp.courses.chip": "Kurse",
    "lp.courses.kicker": "E-Learning",
    "lp.courses.title": "Kurse für jede Phase",
    "lp.courses.desc":
      "Später wird daraus eine interaktive Kursbibliothek mit KI-Tutoren und personalisierten Pfaden. Im Moment skizziert sie die Kernidee dessen, was SQ-LP abdecken soll.",

    "lp.courses.card1.tag": "Grundlagen",
    "lp.courses.card1.title": "Schul- &amp; Studien-Support",
    "lp.courses.card1.text":
      "Strukturierte Inhalte für Schul- und Studierende, mit KI, die Konzepte erklärt, Übungsaufgaben erstellt und Fortschritt trackt.",
    "lp.courses.card1.meta": "Fokus: Mathe · Science · Sprachen · Exams",

    "lp.courses.card2.tag": "Karriere",
    "lp.courses.card2.title": "Karriere- &amp; Tech-Skills",
    "lp.courses.card2.text":
      "Data, Programmierung, Design, Business und Kommunikation für moderne Karrieren – mit projektbasiertem Lernen und Portfolio-Guidance.",
    "lp.courses.card2.meta": "Fokus: Data · Dev · Design · Business",

    "lp.courses.card3.tag": "Lebenslang",
    "lp.courses.card3.title": "Everyday Learning",
    "lp.courses.card3.text":
      "Finanzen, Produktivität, Mindset und Hobby-Microkurse – gedacht für kurze Sessions, die in eine volle Woche passen.",
    "lp.courses.card3.meta": "Fokus: Money · Habits · Hobbies",

    "lp.sports.chip": "Sport",
    "lp.sports.kicker": "Sport Map",
    "lp.sports.title": "Orte zum Trainieren &amp; Spielen finden",
    "lp.sports.desc":
      "SQ-LP schaut auch nach außen: Es wird ein Verzeichnis von Akademien, Clubs und Turnieren, damit Sportbegeisterte Orte zum Trainieren finden – nicht nur zum Zuschauen.",

    "lp.sports.card1.title": "Akademien &amp; Trainingszentren in der Nähe",
    "lp.sports.card1.text":
      "Die Sport-Ansicht soll Akademien und Coaching-Center in deiner Umgebung zeigen – mit Filtern für Alter, Level und Budget. Später kann KI basierend auf Interessen und Zeitplan Vorschläge machen.",
    "lp.sports.card1.li1":
      "Team-Sportarten: Fußball, Cricket, Basketball, Volleyball etc.",
    "lp.sports.card1.li2":
      "Einzel-Sportarten: Tennis, Badminton, Leichtathletik, Schwimmen.",
    "lp.sports.card1.li3":
      "Spezialisierte Programme: Strength &amp; Conditioning, Kids-Camps.",
    "lp.sports.card1.badge1": "Maps &amp; Distanzen",
    "lp.sports.card1.badge2": "Zeiten",
    "lp.sports.card1.badge3": "Schwierigkeitsgrad",

    "lp.sports.card2.title": "Turniere, Ligen &amp; Events",
    "lp.sports.card2.text":
      "Eine Kalender-Ansicht hebt lokale Ligen, Turniere und Community-Events hervor, damit Spieler:innen und Eltern frühzeitig planen können.",
    "lp.sports.card2.li1": "Monatliche und saisonale Turniere.",
    "lp.sports.card2.li2": "Einsteigerfreundliche Events zum Reinkommen.",
    "lp.sports.card2.li3": "Links zu Anmeldung und Spielplänen.",
    "lp.sports.card2.badge1": "Kalender",
    "lp.sports.card2.badge2": "Benachrichtigungen",
    "lp.sports.card2.badge3": "Team-Invites",

    "lp.arts.chip": "Arts &amp; Clubs",
    "lp.arts.kicker": "Arts &amp; Creative Clubs",
    "lp.arts.title": "Lernen jenseits des Klassenzimmers",
    "lp.arts.desc":
      "Tanz, Musik, Malen, Töpfern, Fotografie, Acting, Kochen, Fashion – SQ-LP nimmt sie als ernsthafte Skills, nicht nur als Hobbys.",

    "lp.arts.card1.title": "Studios, Schulen &amp; Workshops",
    "lp.arts.card1.text":
      "Finde Orte, an denen du kreative Arts offline lernen kannst – mit Fotos, Zeiten und Schwerpunkten. Später sollen Hybrid-Programme Online-Module mit Praxis vor Ort verbinden.",
    "lp.arts.card1.li1":
      "Tanzstudios, Musikschulen und Theatergruppen.",
    "lp.arts.card1.li2":
      "Art-, Töpfer- und Craft-Workshops.",
    "lp.arts.card1.li3":
      "Koch-, Back- und Culinary-Schulen.",

    "lp.arts.card2.title": "Clubs, Communities &amp; Events",
    "lp.arts.card2.text":
      "Ein Club-Verzeichnis hilft, Fotowalks, Book-Clubs, Jam-Sessions, Open Mics und mehr zu finden – damit Lernen natürlich in Community übergeht.",
    "lp.arts.card2.li1":
      "Community-Clubs und informelle Meetups.",
    "lp.arts.card2.li2":
      "Showcases, Recitals und Ausstellungen.",
    "lp.arts.card2.li3":
      "KI-gestützte Entdeckung basierend auf deinem Profil.",
    "lp.arts.card2.badge1": "Events",
    "lp.arts.card2.badge2": "Groups",
    "lp.arts.card2.badge3": "KI-Suggestions",

    "lp.about.chip": "About",
    "lp.about.kicker": "Über · SQ-LP",
    "lp.about.title": "Die Idee hinter der Lernplattform",
    "lp.about.p1":
      "SQ-LP ist der zweite Fold von Still In Queue – ein Raum, in dem strukturierte Kurse, Sport und Arts im selben Ökosystem leben. Langfristig sollen <strong>hochwertige Inhalte</strong> mit <strong>KI-Guidance</strong> und realen Lernorten verbunden werden.",
    "lp.about.p2":
      "Diese Seite ist das Konzept-Layout. Später wird sie mit einem Python-Backend, Videobibliothek, Recommendation-Engine und einer Karte von Akademien und Studios verbunden – damit SQ-LP zu einem echten Lernbegleiter für verschiedene Altersgruppen und Ziele wird.",
    "lp.about.note":
      "Grobe Roadmap:<br><br><strong>Phase 1:</strong> Frontend-Layout und Content-Struktur.<br><strong>Phase 2:</strong> Kurskatalog mit KI-Overviews und Fortschritts-Tracking.<br><strong>Phase 3:</strong> Integration von Sport- &amp; Arts-Locations, Maps und Events.<br><strong>Phase 4:</strong> Personalisierte Lernpfade und Community-Features.",

    "lp.footer.copy": "© 2025 Still in Queue · SQ-LP. Alle Rechte vorbehalten."
  }
};

// Expose globally
window.TRANSLATIONS = TRANSLATIONS;
