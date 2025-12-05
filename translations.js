// translations.js
// Global translation map used by main.js
// Access as window.SIQUE_TRANSLATIONS[lang][key]

window.SIQUE_TRANSLATIONS = {
  /* ======================= ENGLISH ======================= */
  en: {
    /* ========= SHARED / GLOBAL ========= */
    "auth.cta": "Login / Sign Up",
    "hero.scroll": "Scroll",
    "footer.contactLabel": "contact :",

    /* ========= INDEX / LANDING (index.html) ========= */
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

    /* ========= SQ-AI / AGENTS (agents.html) ========= */
    "ai.meta.title": "Still In Queue · SQ-AI Agents & Automations",

    "ai.nav.home": "Home",
    "ai.nav.agents": "Agents",
    "ai.nav.flows": "Automations",
    "ai.nav.about": "About",

    "ai.hero.kicker": "SQ-AI · Agents &amp; Workflows",
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
    "ai.flows.node.li1":
      "Input blocks: APIs, CSV, Google Sheets, databases.",
    "ai.flows.node.li2":
      "AI blocks: summarise, extract, classify, generate ideas.",
    "ai.flows.node.li3":
      "Output blocks: email, chat, dashboards, webhooks.",
    "ai.flows.node.badge1": "No-code feel",
    "ai.flows.node.badge2": "Python backend",
    "ai.flows.node.badge3": "Composable flows",

    "ai.flows.blueprints.title":
      "Blueprints &amp; Reusable Templates",
    "ai.flows.blueprints.text":
      "Instead of building everything from scratch, SQ-AI will ship with blueprints you can customise: monitoring templates, trackers, and life dashboards.",
    "ai.flows.blueprints.li1":
      "Weekly review &amp; summary agents.",
    "ai.flows.blueprints.li2":
      "“Watch this metric &amp; tell me when…” flows.",
    "ai.flows.blueprints.li3":
      "Templates for finance, travel, and learning.",
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
    "ai.footer.copy":
      "© 2025 Still in Queue · SQ-AI. All rights reserved.",

    /* ========= LEARNING / SQ-LP (learning.html) ========= */
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
    "lp.courses.card1.title":
      "School &amp; University Support",
    "lp.courses.card1.text":
      "Structured content for school and college students, with AI helping to explain concepts, create practice questions, and track progress.",
    "lp.courses.card1.meta":
      "Focus: Maths · Science · Languages · Exams",

    "lp.courses.card2.tag": "Careers",
    "lp.courses.card2.title": "Career &amp; Tech Skills",
    "lp.courses.card2.text":
      "Data, programming, design, business, and communication skills to support modern careers — with project-style learning and portfolio guidance.",
    "lp.courses.card2.meta":
      "Focus: Data · Dev · Design · Business",

    "lp.courses.card3.tag": "Lifelong",
    "lp.courses.card3.title": "Everyday Learning",
    "lp.courses.card3.text":
      "Personal finance, productivity, mindset, and hobby-based micro courses, designed for short sessions that fit into a busy week.",
    "lp.courses.card3.meta":
      "Focus: Money · Habits · Hobbies",

    "lp.sports.chip": "Sports",
    "lp.sports.kicker": "Sport Map",
    "lp.sports.title": "Find Places to Train &amp; Play",
    "lp.sports.desc":
      "SQ-LP also looks outward: it becomes a directory of academies, clubs, and tournaments so sports enthusiasts can find places to actually practice — not just watch.",

    "lp.sports.card1.title":
      "Nearby Academies &amp; Training Centers",
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

    "lp.sports.card2.title":
      "Tournaments, Leagues &amp; Events",
    "lp.sports.card2.text":
      "A calendar-style view will highlight local leagues, tournaments, and community events, so players and parents can plan participation in advance.",
    "lp.sports.card2.li1":
      "Monthly and seasonal tournaments.",
    "lp.sports.card2.li2":
      "Beginner-friendly events to start competing.",
    "lp.sports.card2.li3":
      "Links to registration pages and schedules.",
    "lp.sports.card2.badge1": "Calendar",
    "lp.sports.card2.badge2": "Notifications",
    "lp.sports.card2.badge3": "Team invites",

    "lp.arts.chip": "Arts &amp; Clubs",
    "lp.arts.kicker": "Arts &amp; Creative Clubs",
    "lp.arts.title": "Learning Beyond the Classroom",
    "lp.arts.desc":
      "Dance, music, painting, pottery, photography, acting, cooking, fashion — SQ-LP treats them as serious skills, not just hobbies.",

    "lp.arts.card1.title":
      "Studios, Schools &amp; Workshops",
    "lp.arts.card1.text":
      "Discover places to learn creative arts offline, with photos, timing, and areas of focus. In the future, hybrid programs will combine online modules with in-person practice.",
    "lp.arts.card1.li1":
      "Dance studios, music schools, and theatre groups.",
    "lp.arts.card1.li2":
      "Art, pottery, and craft workshops.",
    "lp.arts.card1.li3":
      "Cooking, baking, and culinary schools.",

    "lp.arts.card2.title":
      "Clubs, Communities &amp; Events",
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
    "lp.about.title":
      "The Idea Behind the Learning Platform",
    "lp.about.p1":
      "SQ-LP is the second fold of Still In Queue — a space where structured courses, sports, and arts share the same ecosystem. The long-term goal is to combine <strong>high-quality content</strong> with <strong>AI guidance</strong> and real-world places to learn.",
    "lp.about.p2":
      "This page is the concept layout. In future phases it will connect to a Python backend, video library, recommendation engine, and a map of academies and studios — turning SQ-LP into a real learning companion for different ages and goals.",
    "lp.about.note":
      "Rough roadmap:<br><br><strong>Phase 1:</strong> Front-end layout and content structure.<br><strong>Phase 2:</strong> Course catalog with AI-powered overviews and progress tracking.<br><strong>Phase 3:</strong> Integration with sports &amp; arts locations, maps, and events.<br><strong>Phase 4:</strong> Personalized learning paths and community features.",
    "lp.footer.copy":
      "© 2025 Still in Queue · SQ-LP. All rights reserved.",

    /* ========= COFFEE / SQ-CC (cc.html) ========= */
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
      "SQ-CC is an Ice cream and coffee concept that introduces <strong>Spaghettieis</strong> to Hyderabad — alongside bowls, sundaes, cakes, and specialty coffee made with organic, hand-selected ingredients.",
    "cc.hero.line2":
      "Think Insta-worthy, health-focused, and appointment-only: 90 minutes per guest, with space for work, conversation, and small celebrations.",
    "cc.hero.bullets":
      "SPAGHETTIEIS · BOWLS · COFFEE · VIBES",
    "cc.hero.cta.primary": "Explore the Concept Menu",
    "cc.hero.cta.secondary": "See the Experience",

    "cc.menu.kicker": "Menu Concept",
    "cc.menu.title": "Coffee, Cream &amp; Spaghettieis",
    "cc.menu.desc":
      "This is the first sketch of the menu. Later, this page can become an interactive menu with photos, nutrition details, and online ordering or pre-selection for your appointment.",

    "cc.menu.card1.tag": "Signature",
    "cc.menu.card1.title":
      "Spaghetti Eis Collection",
    "cc.menu.card1.text":
      "Classic vanilla “pasta”, rich sauces, crunchy toppings, and playful combinations designed for photos and flavour — from strawberry fields to chocolate night.",
    "cc.menu.card1.meta":
      "Base: organic dairy · low-refined sugar options",

    "cc.menu.card2.tag": "Bowls &amp; Sundaes",
    "cc.menu.card2.title":
      "Balanced Bowls &amp; Sundaes",
    "cc.menu.card2.text":
      "Fruit-forward bowls, protein-friendly sundaes, and customisable combinations that focus on freshness without losing the fun of a proper dessert.",
    "cc.menu.card2.meta":
      "Options: plant-based · high-protein · classic",

    "cc.menu.card3.tag": "Cakes &amp; Coffee",
    "cc.menu.card3.title":
      "Cakes, Bakes &amp; Specialty Coffee",
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
    "cc.exp.card1.li1":
      "90-minute slots per guest or group.",
    "cc.exp.card1.li2":
      "Quiet-friendly tables for laptops and reading.",
    "cc.exp.card1.li3":
      "Photo spots for those “this place” moments.",
    "cc.exp.card1.badge1": "Insta-worthy",
    "cc.exp.card1.badge2": "Cozy seating",
    "cc.exp.card1.badge3": "Work-friendly",

    "cc.exp.card2.title":
      "Reservations &amp; Specials",
    "cc.exp.card2.text":
      "Access is by appointment only, so the store never feels crowded. Over time, the website can handle slot booking, pre-ordered desserts, and special celebration add-ons.",
    "cc.exp.card2.li1":
      "Student discount concept: 10% with valid ID.",
    "cc.exp.card2.li2":
      "Birthday &amp; celebration packages (future phase).",
    "cc.exp.card2.li3":
      "Private or semi-private bookings for small events.",
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
    "cc.diy.card1.li1":
      "Step 1: Choose base (ice cream, yoghurt, vegan, etc.).",
    "cc.diy.card1.li2":
      "Step 2: Pick sauces, fruits, nuts, crunch.",
    "cc.diy.card1.li3":
      "Step 3: Add extras like shots of espresso or protein.",
    "cc.diy.card1.badge1": "Custom combos",
    "cc.diy.card1.badge2": "Profiles",
    "cc.diy.card1.badge3": "Recommendations",

    "cc.diy.card2.title": "Health-Aware, Not “Diet”",
    "cc.diy.card2.text":
      "The idea is not to remove joy, but to give transparency: clear ingredients, optional lighter choices, and portions that feel good.",
    "cc.diy.card2.li1":
      "Organic or carefully sourced key ingredients.",
    "cc.diy.card2.li2":
      "Labels for plant-based, protein-rich, or low-sugar options.",
    "cc.diy.card2.li3":
      "Room for seasonal menus with local produce.",
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
    "cc.footer.copy":
      "© 2025 Still in Queue · SQ-CC. All rights reserved.",

    /* ========= GREEN / SQ-GE (green.html) ========= */
    "ge.meta.title": "Still In Queue · Green Energy",

    "ge.nav.home": "Home",
    "ge.nav.solutions": "Solutions",
    "ge.nav.planning": "Calculator &amp; Planning",
    "ge.nav.projects": "Projects",
    "ge.nav.about": "About",

    "ge.hero.kicker": "SQ-GE · Green Energy",
    "ge.hero.title": "Solar, Explained &amp; Planned",
    "ge.hero.pill": "Phase 1 · Concept Platform",
    "ge.hero.line1":
      "SQ-GE is a platform that helps you compare world-class solar panels and equipment, understand investment and subsidies, and plan installations — from a single rooftop to large-scale projects.",
    "ge.hero.line2":
      "The idea is to make <strong>renewable decisions clear</strong>: what to buy, how much it costs, when it breaks even, and how it fits into long-term, sustainable income.",
    "ge.hero.bullets": "COMPARE · CALCULATE · PLAN · INSTALL",
    "ge.hero.cta.primary": "Explore Green Solutions",
    "ge.hero.cta.secondary": "See Planning Concept",

    "ge.solutions.chip": "Solutions",
    "ge.solutions.kicker": "Solutions",
    "ge.solutions.title": "Compare Solar Options",
    "ge.solutions.desc":
      "In a later phase, this becomes an interactive comparison tool with real products and specs. For now, it outlines how SQ-GE will think about equipment and recommendations.",

    "ge.solutions.card1.tag": "Panels",
    "ge.solutions.card1.title": "Solar Panel Matching",
    "ge.solutions.card1.text":
      "Compare leading panels globally: efficiency, temperature behaviour, warranty, and cost per watt. Match products to roof size, climate, and budget.",
    "ge.solutions.card1.meta":
      "Inputs: roof area · location · budget",

    "ge.solutions.card2.tag": "Inverters &amp; Storage",
    "ge.solutions.card2.title": "Inverters &amp; Battery Planning",
    "ge.solutions.card2.text":
      "Choose the right inverter and optional battery based on load profiles, backup requirements, and grid conditions.",
    "ge.solutions.card2.meta":
      "Inputs: usage pattern · backup hours",

    "ge.solutions.card3.tag": "Packages",
    "ge.solutions.card3.title": "Home &amp; Business Bundles",
    "ge.solutions.card3.text":
      "Pre-defined system sizes and package ideas for homes, apartments, small businesses, and commercial rooftops, including estimated energy output.",
    "ge.solutions.card3.meta":
      "Outputs: kW size · annual kWh",

    "ge.planning.chip": "Planning",
    "ge.planning.kicker": "Calculator &amp; Planning",
    "ge.planning.title": "Understand Costs &amp; Breakeven",
    "ge.planning.desc":
      "SQ-GE is also a planning tool. It doesn’t just show hardware — it explains the numbers: investment, subsidies, savings, and payback.",

    "ge.planning.card1.title": "Investment &amp; Breakeven Concept",
    "ge.planning.card1.text":
      "A future calculator will estimate upfront cost, monthly savings, and how many years it takes to recover the investment, with and without subsidies.",
    "ge.planning.card1.li1":
      "System cost breakdown: panels, inverters, structure, wiring, labour.",
    "ge.planning.card1.li2":
      "Expected monthly generation based on location &amp; tilt.",
    "ge.planning.card1.li3":
      "Current electricity tariff vs. solar savings.",
    "ge.planning.card1.li4":
      "Simple &amp; discounted payback period.",
    "ge.planning.card1.badge1": "Capex vs Opex",
    "ge.planning.card1.badge2": "Subsidy impact",
    "ge.planning.card1.badge3": "ROI timeline",

    "ge.planning.card2.title": "Subsidies &amp; Policy Awareness",
    "ge.planning.card2.text":
      "Over time, SQ-GE will map central and state-level subsidy schemes, especially in regions like Andhra Pradesh, and show how they affect payback.",
    "ge.planning.card2.li1": "Residential rooftop incentives.",
    "ge.planning.card2.li2": "Commercial and industrial schemes.",
    "ge.planning.card2.li3": "Net-metering rules and export tariffs.",
    "ge.planning.card2.badge1": "Govt schemes",
    "ge.planning.card2.badge2": "Eligibility",
    "ge.planning.card2.badge3": "Updated policy view",

    "ge.projects.chip": "Projects",
    "ge.projects.kicker": "Projects",
    "ge.projects.title": "From Rooftops to Fields",
    "ge.projects.desc":
      "The long-term plan is not just advisory — SQ-GE aims to support real installations and, later, larger projects.",

    "ge.projects.card1.title":
      "Residential &amp; Small Commercial",
    "ge.projects.card1.text":
      "Start with individual customers: homes, apartments, shops, and offices. Provide consulting, design proposals, and connect to installation partners.",
    "ge.projects.card1.li1":
      "Site assessment and basic layout concepts.",
    "ge.projects.card1.li2":
      "Estimated production and savings report.",
    "ge.projects.card1.li3":
      "Partner installer matching (future phase).",
    "ge.projects.card1.badge1": "Rooftops",
    "ge.projects.card1.badge2": "Shops &amp; offices",
    "ge.projects.card1.badge3": "Proposals",

    "ge.projects.card2.title":
      "Large-Scale &amp; Government Projects",
    "ge.projects.card2.text":
      "A later phase aims at larger installations such as mass rooftop programs and solar fields — for example in Andhra Pradesh — aligned with government tenders and long-term PPAs.",
    "ge.projects.card2.li1":
      "High-level feasibility and sizing concepts.",
    "ge.projects.card2.li2":
      "Dashboard-style overviews of project pipelines.",
    "ge.projects.card2.li3":
      "Focus on steady, sustainable income after the initial years.",
    "ge.projects.card2.badge1": "Andhra Pradesh focus",
    "ge.projects.card2.badge2": "Govt tenders",
    "ge.projects.card2.badge3": "Long-term revenue",

    "ge.about.chip": "About",
    "ge.about.kicker": "About · SQ-GE",
    "ge.about.title":
      "Why Green Energy is a Fold of Sique",
    "ge.about.p1":
      "SQ-GE is the renewable fold of Still In Queue — a way to use data, planning, and software thinking to make solar adoption easier. It accepts that green projects are often high investment with delayed returns, but focuses on the long-term benefits: environment, stability, and recurring income.",
    "ge.about.p2":
      "This page is the concept design. Future versions will connect to real product feeds, pricing APIs, policy databases, and project tracking tools, built on a Python backend — so SQ-GE can move from explanation into execution.",
    "ge.about.note":
      "High-level path:<br><br><strong>Phase 1:</strong> Concept site &amp; explanation tools.<br><strong>Phase 2:</strong> Solar comparison + basic calculators.<br><strong>Phase 3:</strong> Lead management &amp; installer network.<br><strong>Phase 4:</strong> Participation in larger govt and utility-scale projects.",
    "ge.footer.copy":
      "© 2025 Still in Queue · SQ-GE. All rights reserved."
  },

  /* ======================= GERMAN ======================= */
  de: {
    /* ========= SHARED / GLOBAL ========= */
    "auth.cta": "Login / Registrieren",
    "hero.scroll": "Scroll",
    "footer.contactLabel": "kontakt :",

    /* ========= INDEX / LANDING (index.html) ========= */
    "nav.ai": "Artificial Intelligence",
    "nav.learning": "Learning Platform",
    "nav.green": "Green Energy",
    "nav.coffee": "Coffee-Cream",
    "nav.about": "About",

    "hero.title": "Still In Queue",
    "hero.badge": "Phase 1 · Konzept-Plattform",
    "hero.line1":
      "<strong>Sique</strong> ist ein vierteiliges Startup-Ökosystem, das <strong>Artificial Intelligence</strong>, eine moderne <strong>Learning Platform</strong>, <strong>Green Energy</strong>-Lösungen und einen kuratierten <strong>Coffee &amp; Cream</strong>-Space zusammenbringt.",
    "hero.line2":
      "Schritt für Schritt gebaut, verbindet es Software, Bildung, Nachhaltigkeit und Lifestyle zu einer wachsenden Marke.",
    "hero.tagline": "AI · Learning · Energy · Coffee",
    "hero.cta.primary": "Die vier Folds entdecken",
    "hero.cta.secondary": "Über Sique",

    "pillars.title": "Die vier Folds",

    "pillars.ai.tag": "SQ-AI · Blue",
    "pillars.ai.title": "Artificial Intelligence",
    "pillars.ai.body":
      "Visuelle Automationen und interaktive AI-Agents, die Märkte, Reisen, Lebensziele und Routinen im Blick behalten – aufgebaut auf Drag-and-Drop-Workflows.",

    "pillars.lp.tag": "SQ-LP · Yellow",
    "pillars.lp.title": "Learning Platform",
    "pillars.lp.body":
      "Ein Learning-Space für alle Altersgruppen: Kurse, Sport-Academies, Arts und Sprachtraining – unterstützt von AI, die begleitet, coacht und verbindet.",

    "pillars.ge.tag": "SQ-GE · Green",
    "pillars.ge.title": "Green Energy",
    "pillars.ge.body":
      "Eine Plattform, um Solar-Lösungen zu vergleichen, Installationen zu planen und Kosten sowie Breakeven-Punkte für nachhaltige Energie zu verstehen.",

    "pillars.cc.tag": "SQ-CC · Orange",
    "pillars.cc.title": "Coffee &amp; Cream",
    "pillars.cc.body":
      "Ein Spaghettieis- und Coffee-Konzept in Hyderabad mit Bio-Anspruch, gesundheitsbewussten Optionen und bewusst begrenzter, nur per Termin buchbarer Atmosphäre.",

    "pillars.learnMore": "Mehr erfahren",

    "about.label": "About · Still In Queue",
    "about.title": "Die Idee hinter Sique",
    "about.p1":
      "Still In Queue (Sique) ist eine langfristige Vision, AI zu nutzen, um Technologie, Lernen, Nachhaltigkeit und Coffee-Erlebnisse über smarte, vernetzte Plattformen zu verändern.",
    "about.p2":
      "Der Plan ist, vorsichtig zu wachsen: zuerst digitale Produkte und AI-Systeme, dann Green-Energy-Projekte und physische Spaces, sobald das Fundament stabil ist.",
    "about.note":
      "Diese Website ist Phase 1: ein Frontend, das die vier Folds vorstellt. Spätere Phasen bringen User-Accounts, Python-Backends, Data-Engineering-Pipelines und voll funktionsfähige Plattformen unter dem Still-In-Queue-Dach.",
    "footer.copy":
      "© 2025 Still in Queue. Alle Rechte vorbehalten.",

    /* ========= SQ-AI / AGENTS (agents.html) ========= */
    "ai.meta.title": "Still In Queue · SQ-AI Agents & Automations",

    "ai.nav.home": "Start",
    "ai.nav.agents": "Agents",
    "ai.nav.flows": "Automationen",
    "ai.nav.about": "Über",

    "ai.hero.kicker": "SQ-AI · Agents &amp; Workflows",
    "ai.hero.title":
      "Agents, die beobachten, was dir wichtig ist",
    "ai.hero.pill": "Phase 1 · Konzept-Plattform",
    "ai.hero.p1":
      "SQ-AI ist eine Schicht aus <strong>visuellen Workflows</strong> und <strong>AI-Agents</strong>, die Märkte, Reisen, Routinen und Ziele im Blick behalten – ohne Code oder komplexe Dashboards.",
    "ai.hero.p2":
      "Die Idee ist einfach: Du zeichnest, was überwacht werden soll, legst fest, wann du einen Hinweis willst, und das System beobachtet den Rest im Hintergrund.",
    "ai.hero.bullets":
      "AGENTS · ALERTS · ROUTINES · BLUEPRINTS",
    "ai.hero.cta.primary": "Agent-Typen entdecken",
    "ai.hero.cta.secondary":
      "Automations-Konzept ansehen",

    "ai.agents.chip": "Agents",
    "ai.agents.kicker": "Agent-Typen",
    "ai.agents.title":
      "Unterschiedliche Agents für verschiedene Queues",
    "ai.agents.desc":
      "Mit der Zeit wird SQ-AI zu einer Bibliothek von Agents, die du ein- und ausschalten kannst: Finance, Travel, Habits, Research und mehr. Phase 1 zeigt nur, wie sie gruppiert sind und was sie beobachten.",

    "ai.cards.signals.tag": "Signals",
    "ai.cards.signals.title":
      "Finance &amp; Market Agents",
    "ai.cards.signals.text":
      "Agents, die Aktien, ETFs, Krypto und Makro-Indikatoren verfolgen. Statt ständig Charts zu beobachten, definierst du Trigger und bekommst nur dann einen Hinweis, wenn es wichtig ist.",
    "ai.cards.signals.meta":
      "Inputs: Symbole · Bereiche · Alerts",

    "ai.cards.life.tag": "Life",
    "ai.cards.life.title":
      "Life &amp; Routine Agents",
    "ai.cards.life.text":
      "Checklisten und Mikro-Routinen: Gesundheit, Workouts, Lesen, Projektfortschritt. Die Agents verhalten sich wie kleine Coaches, die Streaks im Blick haben – nicht nur To-dos.",
    "ai.cards.life.meta":
      "Fokus: Habits · Journals · Check-ins",

    "ai.cards.travel.tag": "Travel",
    "ai.cards.travel.title":
      "Travel &amp; Exploration Agents",
    "ai.cards.travel.text":
      "Beobachten Flugpreise, Visa-Slots und Ziele, die du auf einer Karte pinnst. Agents zeigen Zeitfenster mit Chancen statt zufälliger Deals.",
    "ai.cards.travel.meta":
      "Fokus: Daten · Routen · Präferenzen",

    "ai.flows.chip": "Automationen",
    "ai.flows.kicker": "Visuelle Workflows",
    "ai.flows.title":
      "Flows zeichnen statt Code schreiben",
    "ai.flows.desc":
      "SQ-AI soll sich wie eine Leinwand anfühlen: Du ziehst Nodes, verbindest sie und definierst, wie Daten fließen – von APIs und Dateien zu Summaries und Notifications.",

    "ai.flows.node.title":
      "Node-basierter Flow-Builder",
    "ai.flows.node.text":
      "Eine spätere Version bietet einen Node-Editor, in dem jeder Block eine Aktion darstellt: fetch, transform, analyse, notify oder store. Du verbindest sie visuell statt Klebecode zu schreiben.",
    "ai.flows.node.li1":
      "Input-Blöcke: APIs, CSV, Google Sheets, Datenbanken.",
    "ai.flows.node.li2":
      "AI-Blöcke: zusammenfassen, extrahieren, klassifizieren, Ideen generieren.",
    "ai.flows.node.li3":
      "Output-Blöcke: E-Mail, Chat, Dashboards, Webhooks.",
    "ai.flows.node.badge1":
      "No-Code-Gefühl",
    "ai.flows.node.badge2":
      "Python-Backend",
    "ai.flows.node.badge3":
      "Composable Flows",

    "ai.flows.blueprints.title":
      "Blueprints &amp; wiederverwendbare Templates",
    "ai.flows.blueprints.text":
      "Statt alles von Null zu bauen, bringt SQ-AI Blueprints mit, die du anpassen kannst: Monitoring-Vorlagen, Tracker und Life-Dashboards.",
    "ai.flows.blueprints.li1":
      "Weekly-Review- &amp; Summary-Agents.",
    "ai.flows.blueprints.li2":
      "„Beobachte diese Kennzahl &amp; sag mir, wenn …“-Flows.",
    "ai.flows.blueprints.li3":
      "Templates für Finance, Travel und Learning.",
    "ai.flows.blueprints.badge1":
      "Blueprints",
    "ai.flows.blueprints.badge2":
      "Personalisiert",
    "ai.flows.blueprints.badge3":
      "Shareable Flows",

    "ai.about.chip": "Über",
    "ai.about.kicker": "Über · SQ-AI",
    "ai.about.title":
      "Wie SQ-AI in Sique passt",
    "ai.about.p1":
      "SQ-AI ist der erste Fold von Still In Queue – die Software- und Automationsschicht, die später mit der Lernplattform, Green-Energy-Dashboards und sogar dem physischen Coffee-Space verbunden wird.",
    "ai.about.p2":
      "Diese Seite ist ein Konzept-Layout. Spätere Phasen verbinden sie mit einem Python-Backend, einer Flow-Datenbank und einem Interface zum Erstellen, Speichern und Teilen von Agents, die auf echten Daten laufen.",
    "ai.about.note":
      "Grobe Roadmap:<br><br><strong>Phase 1:</strong> Frontend-Konzept &amp; Agent-Kategorien.<br><strong>Phase 2:</strong> Visueller Flow-Builder mit Basis-Blöcken.<br><strong>Phase 3:</strong> Accounts, Storage und Scheduling.<br><strong>Phase 4:</strong> Tiefe Integrationen mit den anderen Folds von Sique.",
    "ai.footer.copy":
      "© 2025 Still in Queue · SQ-AI. Alle Rechte vorbehalten.",

    /* ========= LEARNING / SQ-LP ========= */
    "lp.meta.title": "Still In Queue · Learning",

    "lp.nav.home": "Start",
    "lp.nav.courses": "Kurse",
    "lp.nav.sports": "Sport",
    "lp.nav.arts": "Arts &amp; Clubs",
    "lp.nav.about": "Über",

    "lp.hero.kicker": "SQ-LP · Learning Platform",
    "lp.hero.title":
      "Lernen, das deinem Leben folgt",
    "lp.hero.pill": "Phase 1 · Konzept-Campus",
    "lp.hero.line1":
      "SQ-LP ist eine Lernplattform, die strukturierte Kurse, Sport-Academies, Arts und Sprachtraining an einem Ort kombiniert – gestützt von <strong>AI-Mentoren</strong>, die begleiten, coachen und dich auf Kurs halten.",
    "lp.hero.line2":
      "Von Online-Lektionen bis zu realen Clubs und Akademien: Ziel ist es, Entdecken, Planen und Dranbleiben bei den Skills zu erleichtern, die dir wirklich wichtig sind.",
    "lp.hero.bullets": "COURSES · SPORTS · ARTS · CLUBS",
    "lp.hero.cta.primary":
      "Learning-Bereiche entdecken",
    "lp.hero.cta.secondary": "Über SQ-LP",

    "lp.courses.chip": "Kurse",
    "lp.courses.kicker": "E-Learning",
    "lp.courses.title": "Kurse für jede Phase",
    "lp.courses.desc":
      "In späteren Phasen wird dies eine interaktive Kursbibliothek mit AI-Tutoren und personalisierten Pfaden. Jetzt skizziert sie nur den Kern dessen, was SQ-LP abdecken soll.",

    "lp.courses.card1.tag": "Foundations",
    "lp.courses.card1.title":
      "Unterstützung für Schule &amp; Uni",
    "lp.courses.card1.text":
      "Strukturierte Inhalte für Schüler:innen und Studierende, mit AI, die Konzepte erklärt, Übungsaufgaben erzeugt und Fortschritt trackt.",
    "lp.courses.card1.meta":
      "Fokus: Mathe · Naturwissenschaften · Sprachen · Prüfungen",

    "lp.courses.card2.tag": "Careers",
    "lp.courses.card2.title":
      "Karriere- &amp; Tech-Skills",
    "lp.courses.card2.text":
      "Data, Programmierung, Design, Business und Kommunikation für moderne Karrieren – mit projektbasiertem Lernen und Portfolio-Guidance.",
    "lp.courses.card2.meta":
      "Fokus: Data · Dev · Design · Business",

    "lp.courses.card3.tag": "Lifelong",
    "lp.courses.card3.title": "Everyday Learning",
    "lp.courses.card3.text":
      "Persönliche Finanzen, Produktivität, Mindset und Hobby-Mikrokurse, ausgelegt auf kurze Sessions in einer vollen Woche.",
    "lp.courses.card3.meta":
      "Fokus: Money · Habits · Hobbies",

    "lp.sports.chip": "Sport",
    "lp.sports.kicker": "Sport Map",
    "lp.sports.title":
      "Orte zum Trainieren &amp; Spielen finden",
    "lp.sports.desc":
      "SQ-LP schaut auch nach außen: Es wird zu einem Verzeichnis von Academies, Clubs und Turnieren, damit Sportfans Orte zum wirklichen Spielen finden – nicht nur zum Zuschauen.",

    "lp.sports.card1.title":
      "Academies &amp; Trainingszentren in der Nähe",
    "lp.sports.card1.text":
      "Der Sport-View soll Academies und Coaching-Zentren in deiner Umgebung zeigen – mit Filtern für Alter, Level und Budget. Später können AI-Empfehlungen zu Interessen und Zeitplan passen.",
    "lp.sports.card1.li1":
      "Team-Sport: Fußball, Cricket, Basketball, Volleyball etc.",
    "lp.sports.card1.li2":
      "Einzelsport: Tennis, Badminton, Leichtathletik, Schwimmen.",
    "lp.sports.card1.li3":
      "Spezielle Programme: Strength &amp; Conditioning, Kids-Camps.",
    "lp.sports.card1.badge1":
      "Karten &amp; Distanzen",
    "lp.sports.card1.badge2": "Zeiten",
    "lp.sports.card1.badge3":
      "Schwierigkeitsgrad",

    "lp.sports.card2.title":
      "Turniere, Ligen &amp; Events",
    "lp.sports.card2.text":
      "Ein Kalender-View zeigt lokale Ligen, Turniere und Community-Events, damit Spieler:innen und Eltern langfristig planen können.",
    "lp.sports.card2.li1":
      "Monatliche und saisonale Turniere.",
    "lp.sports.card2.li2":
      "Einsteigerfreundliche Events für den ersten Wettbewerb.",
    "lp.sports.card2.li3":
      "Links zu Anmeldeseiten und Spielplänen.",
    "lp.sports.card2.badge1": "Kalender",
    "lp.sports.card2.badge2":
      "Benachrichtigungen",
    "lp.sports.card2.badge3":
      "Team-Invites",

    "lp.arts.chip": "Arts &amp; Clubs",
    "lp.arts.kicker": "Arts &amp; Creative Clubs",
    "lp.arts.title":
      "Lernen über das Klassenzimmer hinaus",
    "lp.arts.desc":
      "Tanz, Musik, Malen, Töpfern, Fotografie, Schauspiel, Kochen, Mode – SQ-LP behandelt sie als ernsthafte Skills, nicht nur als Hobbies.",

    "lp.arts.card1.title":
      "Studios, Schulen &amp; Workshops",
    "lp.arts.card1.text":
      "Finde Orte, an denen du kreative Künste offline lernen kannst – mit Bildern, Zeiten und Schwerpunkten. Später verbinden Hybrid-Programme Online-Modules mit Praxis vor Ort.",
    "lp.arts.card1.li1":
      "Tanzstudios, Musikschulen und Theatergruppen.",
    "lp.arts.card1.li2":
      "Kunst-, Töpfer- und Kreativ-Workshops.",
    "lp.arts.card1.li3":
      "Koch-, Back- und Culinary-Schools.",

    "lp.arts.card2.title":
      "Clubs, Communities &amp; Events",
    "lp.arts.card2.text":
      "Ein Club-Verzeichnis hilft, Fotowalks, Buchclubs, Jam-Sessions, Open Mics und mehr zu finden – damit Lernen ganz natürlich in Community übergeht.",
    "lp.arts.card2.li1":
      "Community-Clubs und informelle Meetups.",
    "lp.arts.card2.li2":
      "Showcases, Recitals und Ausstellungen.",
    "lp.arts.card2.li3":
      "AI-gestützte Vorschläge basierend auf deinem Profil.",
    "lp.arts.card2.badge1": "Events",
    "lp.arts.card2.badge2": "Groups",
    "lp.arts.card2.badge3":
      "AI-Vorschläge",

    "lp.about.chip": "Über",
    "lp.about.kicker": "Über · SQ-LP",
    "lp.about.title":
      "Die Idee hinter der Learning Platform",
    "lp.about.p1":
      "SQ-LP ist der zweite Fold von Still In Queue – ein Ort, an dem strukturierte Kurse, Sport und Arts im gleichen Ökosystem leben. Langfristig sollen <strong>hochwertige Inhalte</strong> mit <strong>AI-Guidance</strong> und realen Lernorten kombiniert werden.",
    "lp.about.p2":
      "Diese Seite ist das Konzept-Layout. Spätere Phasen verbinden sie mit einem Python-Backend, einer Video-Library, Recommendation-Engine und einer Karte von Academies und Studios – damit SQ-LP zu einem echten Lern-Companion für verschiedene Altersgruppen und Ziele wird.",
    "lp.about.note":
      "Grober Fahrplan:<br><br><strong>Phase 1:</strong> Frontend-Layout &amp; Content-Struktur.<br><strong>Phase 2:</strong> Kurskatalog mit AI-Overviews und Fortschritts-Tracking.<br><strong>Phase 3:</strong> Integration von Sport- &amp; Arts-Locations, Karten und Events.<br><strong>Phase 4:</strong> Personalisierte Lernpfade und Community-Features.",
    "lp.footer.copy":
      "© 2025 Still in Queue · SQ-LP. Alle Rechte vorbehalten.",

    /* ========= COFFEE / SQ-CC ========= */
    "cc.meta.title":
      "Still In Queue · Coffee &amp; Cream",

    "cc.nav.home": "Start",
    "cc.nav.menu": "Menu",
    "cc.nav.experience": "Experience",
    "cc.nav.diy": "DIY Bar",
    "cc.nav.about": "Über",

    "cc.hero.kicker": "SQ-CC · Coffee &amp; Cream",
    "cc.hero.title": "Spaghettieis, Coffee &amp; Calm",
    "cc.hero.pill": "Phase 1 · Konzept-Storefront",
    "cc.hero.line1":
      "SQ-CC ist ein Eis- und Coffee-Konzept, das <strong>Spaghettieis</strong> nach Hyderabad bringt – zusammen mit Bowls, Sundaes, Cakes und Specialty Coffee aus Bio- und handverlesenen Zutaten.",
    "cc.hero.line2":
      "Insta-tauglich, gesundheitsbewusst und nur mit Termin: 90 Minuten pro Gast, mit Platz für Arbeit, Gespräche und kleine Feiern.",
    "cc.hero.bullets":
      "SPAGHETTIEIS · BOWLS · COFFEE · VIBES",
    "cc.hero.cta.primary":
      "Konzept-Menu entdecken",
    "cc.hero.cta.secondary":
      "Die Experience ansehen",

    "cc.menu.kicker": "Menu-Konzept",
    "cc.menu.title":
      "Coffee, Cream &amp; Spaghettieis",
    "cc.menu.desc":
      "Dies ist der erste Entwurf des Menus. Später kann diese Seite zu einem interaktiven Menu mit Fotos, Nährwerten und Online-Bestellung oder Vorauswahl für deinen Termin werden.",

    "cc.menu.card1.tag": "Signature",
    "cc.menu.card1.title":
      "Spaghetti-Eis-Kollektion",
    "cc.menu.card1.text":
      "Klassische Vanille-„Pasta“, reichhaltige Saucen, Crunch-Toppings und spielerische Kombinationen – von Strawberry Fields bis Chocolate Night.",
    "cc.menu.card1.meta":
      "Base: Bio-Milch · Optionen mit wenig raffiniertem Zucker",

    "cc.menu.card2.tag": "Bowls &amp; Sundaes",
    "cc.menu.card2.title":
      "Balanced Bowls &amp; Sundaes",
    "cc.menu.card2.text":
      "Fruchtige Bowls, proteinfreundliche Sundaes und anpassbare Kombinationen mit Fokus auf Frische – ohne den Spaß eines echten Desserts zu verlieren.",
    "cc.menu.card2.meta":
      "Optionen: pflanzlich · high-protein · classic",

    "cc.menu.card3.tag": "Cakes &amp; Coffee",
    "cc.menu.card3.title":
      "Cakes, Bakes &amp; Specialty Coffee",
    "cc.menu.card3.text":
      "Small-Batch Cakes und Bakes, kombiniert mit Espresso-Drinks, Cold Brew und Slow-Coffee-Optionen – für Menschen, die gerne sitzen, reden oder arbeiten.",
    "cc.menu.card3.meta":
      "Roast: kuratierte Bohnen · saisonale Specials",

    "cc.exp.kicker": "Space &amp; Experience",
    "cc.exp.title": "Ein 90-Minuten-Tiny-Escape",
    "cc.exp.desc":
      "SQ-CC ist als Ort mit begrenzter Kapazität und Termin-Only gedacht – für junge und berufstätige Menschen, offen aber für alle Altersgruppen und Anlässe.",

    "cc.exp.card1.title": "Ambience &amp; Seating",
    "cc.exp.card1.text":
      "Warm light, Holz und weiche Texturen, mit Layouts für Solo-Besuche, Paare oder kleine Gruppen. Jeder Spot ist foto-freundlich, ohne künstlich zu wirken.",
    "cc.exp.card1.li1":
      "90-Minuten-Slots pro Gast oder Gruppe.",
    "cc.exp.card1.li2":
      "Ruhige Tische für Laptop und Lesen.",
    "cc.exp.card1.li3":
      "Foto-Spots für diese „dieser Laden“-Momente.",
    "cc.exp.card1.badge1": "Insta-würdig",
    "cc.exp.card1.badge2":
      "Gemütliche Plätze",
    "cc.exp.card1.badge3":
      "Work-friendly",

    "cc.exp.card2.title":
      "Reservierungen &amp; Specials",
    "cc.exp.card2.text":
      "Zugang nur mit Termin, damit der Space nie überfüllt wirkt. Später kann die Website Slot-Buchung, vorbestellte Desserts und Celebration-Add-ons übernehmen.",
    "cc.exp.card2.li1":
      "Studenten-Konzept: 10 % mit gültigem Ausweis.",
    "cc.exp.card2.li2":
      "Birthday- &amp; Celebration-Packages (spätere Phase).",
    "cc.exp.card2.li3":
      "Private oder halbprivate Buchungen für kleine Events.",
    "cc.exp.card2.badge1": "Slots",
    "cc.exp.card2.badge2": "Student 10 %",
    "cc.exp.card2.badge3":
      "Celebrations",

    "cc.diy.kicker": "DIY Terminal",
    "cc.diy.title": "Bau dir deine eigene Bowl",
    "cc.diy.desc":
      "Ein großer Teil von SQ-CC ist Wahlfreiheit. Am DIY-Terminal gestalten Gäste ihre Bowls, Sundaes und Spaghettieis, bevor sie an die Theke kommen.",

    "cc.diy.card1.title":
      "Digitaler DIY-Flow (Konzept)",
    "cc.diy.card1.text":
      "Auf dieser Seite kann die DIY-Experience später ein interaktiver Builder werden: Base, Sauce, Toppings und Extras wählen, Nährwert-Hinweise sehen und Favoriten im Profil speichern.",
    "cc.diy.card1.li1":
      "Schritt 1: Base wählen (Eis, Joghurt, vegan etc.).",
    "cc.diy.card1.li2":
      "Schritt 2: Saucen, Früchte, Nüsse, Crunch.",
    "cc.diy.card1.li3":
      "Schritt 3: Extras wie Espresso-Shot oder Protein.",
    "cc.diy.card1.badge1": "Custom Combos",
    "cc.diy.card1.badge2": "Profile",
    "cc.diy.card1.badge3":
      "Empfehlungen",

    "cc.diy.card2.title":
      "Health-aware, nicht „Diet“",
    "cc.diy.card2.text":
      "Die Idee ist nicht, Freude zu streichen, sondern Transparenz zu geben: klare Zutaten, optionale leichtere Varianten und Portionen, die sich gut anfühlen.",
    "cc.diy.card2.li1":
      "Bio oder sorgfältig ausgewählte Kernzutaten.",
    "cc.diy.card2.li2":
      "Labels für pflanzliche, proteinreiche oder zuckerreduzierte Optionen.",
    "cc.diy.card2.li3":
      "Platz für saisonale Menus mit lokalen Zutaten.",
    "cc.diy.card2.badge1": "Zutaten-Fokus",
    "cc.diy.card2.badge2":
      "Ausbalancierte Optionen",
    "cc.diy.card2.badge3":
      "Seasonal Menus",

    "cc.about.kicker": "Über · SQ-CC",
    "cc.about.title":
      "Warum Coffee &amp; Cream ein Fold ist",
    "cc.about.p1":
      "SQ-CC ist der Lifestyle-Fold von Still In Queue – ein physischer Space als Gegengewicht zu den technischeren Folds AI, Learning und Green Energy. Er spiegelt die gleiche Haltung: durchdachtes Design, langfristige Qualität und Experiences, die bewusst wirken – nicht zufällig.",
    "cc.about.p2":
      "Diese Seite ist das Konzept-Layout für Store und digitale Experience. Später kann sie zu einem vollständigen Buchungssystem mit Loyalty-Features und Live-Menu werden, direkt mit dem SQ-Backend verbunden.",
    "cc.about.note":
      "Zukünftige Ideen:<br><br><strong>Phase 1:</strong> Konzept-Site &amp; Brand-Story.<br><strong>Phase 2:</strong> Slot-Buchung, digitales Menu, DIY-UI.<br><strong>Phase 3:</strong> Loyalty-Accounts mit dem Sique-Login verknüpft.<br><strong>Phase 4:</strong> Mehrere Standorte oder Pop-ups unter der Marke SQ-CC.",
    "cc.footer.copy":
      "© 2025 Still in Queue · SQ-CC. Alle Rechte vorbehalten.",

    /* ========= GREEN / SQ-GE ========= */
    "ge.meta.title": "Still In Queue · Green Energy",

    "ge.nav.home": "Start",
    "ge.nav.solutions": "Solutions",
    "ge.nav.planning": "Rechner &amp; Planung",
    "ge.nav.projects": "Projects",
    "ge.nav.about": "Über",

    "ge.hero.kicker": "SQ-GE · Green Energy",
    "ge.hero.title":
      "Solar, erklärt &amp; geplant",
    "ge.hero.pill": "Phase 1 · Konzept-Plattform",
    "ge.hero.line1":
      "SQ-GE ist eine Plattform, die hilft, führende Solarmodule und Equipment zu vergleichen, Investition und Förderungen zu verstehen und Anlagen zu planen – von einem einzelnen Dach bis zu Großprojekten.",
    "ge.hero.line2":
      "Ziel ist, <strong>erneuerbare Entscheidungen klar</strong> zu machen: was man kauft, wie viel es kostet, wann es sich rechnet und wie es in langfristige, nachhaltige Einnahmen passt.",
    "ge.hero.bullets": "COMPARE · CALCULATE · PLAN · INSTALL",
    "ge.hero.cta.primary":
      "Green-Solutions entdecken",
    "ge.hero.cta.secondary":
      "Planungs-Konzept ansehen",

    "ge.solutions.chip": "Solutions",
    "ge.solutions.kicker": "Solutions",
    "ge.solutions.title":
      "Solar-Optionen vergleichen",
    "ge.solutions.desc":
      "Später wird dies ein interaktives Vergleichstool mit echten Produkten und Specs. Aktuell zeigt es nur, wie SQ-GE Equipment und Empfehlungen strukturiert.",

    "ge.solutions.card1.tag": "Panels",
    "ge.solutions.card1.title":
      "Solar-Panel-Matching",
    "ge.solutions.card1.text":
      "Vergleich führender Module weltweit: Effizienz, Temperaturverhalten, Garantie und Kosten pro Watt. Produkte werden an Dachgröße, Klima und Budget angepasst.",
    "ge.solutions.card1.meta":
      "Inputs: Dachfläche · Standort · Budget",

    "ge.solutions.card2.tag": "Inverters &amp; Storage",
    "ge.solutions.card2.title":
      "Inverter- &amp; Batterie-Planung",
    "ge.solutions.card2.text":
      "Die passende Kombination aus Inverter und optionaler Batterie wählen – basierend auf Lastprofil, Backup-Bedarf und Netzbedingungen.",
    "ge.solutions.card2.meta":
      "Inputs: Verbrauchsmuster · Backup-Stunden",

    "ge.solutions.card3.tag": "Packages",
    "ge.solutions.card3.title":
      "Home- &amp; Business-Bundles",
    "ge.solutions.card3.text":
      "Vordefinierte Systemgrößen und Paket-Ideen für Häuser, Wohnungen, kleine Unternehmen und Gewerbedächer – inklusive geschätzter Energieerzeugung.",
    "ge.solutions.card3.meta":
      "Outputs: kW-Größe · jährliche kWh",

    "ge.planning.chip": "Planning",
    "ge.planning.kicker": "Rechner &amp; Planung",
    "ge.planning.title":
      "Kosten &amp; Breakeven verstehen",
    "ge.planning.desc":
      "SQ-GE ist auch ein Planungstool. Es zeigt nicht nur Hardware, sondern erklärt Zahlen: Investition, Förderungen, Einsparungen und Payback.",

    "ge.planning.card1.title":
      "Investment- &amp; Breakeven-Konzept",
    "ge.planning.card1.text":
      "Ein späterer Rechner schätzt Investitionskosten, monatliche Ersparnis und die Jahre bis zur Amortisation – mit und ohne Förderung.",
    "ge.planning.card1.li1":
      "Systemkosten-Aufschlüsselung: Panels, Inverter, Unterkonstruktion, Verkabelung, Montage.",
    "ge.planning.card1.li2":
      "Erwartete Monatsproduktion basierend auf Standort &amp; Neigung.",
    "ge.planning.card1.li3":
      "Aktueller Stromtarif vs. Solar-Ersparnis.",
    "ge.planning.card1.li4":
      "Einfache &amp; diskontierte Amortisationszeit.",
    "ge.planning.card1.badge1":
      "Capex vs Opex",
    "ge.planning.card1.badge2":
      "Förder-Effekt",
    "ge.planning.card1.badge3":
      "ROI-Timeline",

    "ge.planning.card2.title":
      "Förderungen &amp; Policy-Überblick",
    "ge.planning.card2.text":
      "Mit der Zeit mappt SQ-GE zentrale und bundesstaatliche Förderprogramme – z. B. in Andhra Pradesh – und zeigt, wie sie den Payback verändern.",
    "ge.planning.card2.li1":
      "Förderungen für Residential-Rooftops.",
    "ge.planning.card2.li2":
      "Programme für Commercial &amp; Industrial.",
    "ge.planning.card2.li3":
      "Net-Metering-Regeln und Einspeise-Tarife.",
    "ge.planning.card2.badge1":
      "Govt-Schemes",
    "ge.planning.card2.badge2":
      "Eligibility",
    "ge.planning.card2.badge3":
      "Policy-View",

    "ge.projects.chip": "Projects",
    "ge.projects.kicker": "Projects",
    "ge.projects.title":
      "Von Dächern zu Feldern",
    "ge.projects.desc":
      "Langfristig geht es nicht nur um Beratung – SQ-GE soll echte Installationen und später größere Projekte unterstützen.",

    "ge.projects.card1.title":
      "Residential &amp; Small Commercial",
    "ge.projects.card1.text":
      "Start mit einzelnen Kund:innen: Häuser, Wohnungen, Shops, Büros. Beratung, Design-Vorschläge und später die Verbindung zu Installations-Partnern.",
    "ge.projects.card1.li1":
      "Site-Assessment und grobe Layout-Konzepte.",
    "ge.projects.card1.li2":
      "Bericht zu Produktion und Einsparungen.",
    "ge.projects.card1.li3":
      "Matching mit Installations-Partnern (spätere Phase).",
    "ge.projects.card1.badge1": "Rooftops",
    "ge.projects.card1.badge2":
      "Shops &amp; Offices",
    "ge.projects.card1.badge3":
      "Proposals",

    "ge.projects.card2.title":
      "Large-Scale- &amp; Government-Projects",
    "ge.projects.card2.text":
      "Später zielt SQ-GE auf größere Installationen wie Mass-Rooftop-Programme und Solar-Felder – etwa in Andhra Pradesh – im Einklang mit öffentlichen Ausschreibungen und langfristigen PPAs.",
    "ge.projects.card2.li1":
      "High-Level-Machbarkeits- und Größen-Konzepte.",
    "ge.projects.card2.li2":
      "Dashboard-artige Overviews von Projekt-Pipelines.",
    "ge.projects.card2.li3":
      "Fokus auf stetige, nachhaltige Einnahmen nach den Anfangsjahren.",
    "ge.projects.card2.badge1":
      "Andhra-Pradesh-Fokus",
    "ge.projects.card2.badge2":
      "Govt-Tenders",
    "ge.projects.card2.badge3":
      "Long-Term-Revenue",

    "ge.about.chip": "Über",
    "ge.about.kicker": "Über · SQ-GE",
    "ge.about.title":
      "Warum Green Energy ein Fold von Sique ist",
    "ge.about.p1":
      "SQ-GE ist der Renewable-Fold von Still In Queue – ein Weg, mit Daten, Planung und Software-Denken Solar-Adoption einfacher zu machen. Er akzeptiert hohe Anfangsinvestitionen mit verzögertem Return, fokussiert aber auf langfristige Vorteile: Umwelt, Stabilität und wiederkehrende Einnahmen.",
    "ge.about.p2":
      "Diese Seite ist das Konzept-Design. Spätere Versionen verbinden sie mit Produkt-Feeds, Preis-APIs, Policy-Datenbanken und Projekt-Tracking-Tools auf einem Python-Backend – damit SQ-GE von Erklärung zu Execution wird.",
    "ge.about.note":
      "High-Level-Pfad:<br><br><strong>Phase 1:</strong> Konzept-Site &amp; Explanation-Tools.<br><strong>Phase 2:</strong> Solar-Vergleich + Basis-Rechner.<br><strong>Phase 3:</strong> Lead-Management &amp; Installer-Netzwerk.<br><strong>Phase 4:</strong> Teilnahme an größeren Govt- und Utility-Scale-Projekten.",
    "ge.footer.copy":
      "© 2025 Still in Queue · SQ-GE. Alle Rechte vorbehalten."
  }
};
