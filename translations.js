// translations.js
// Global translation map for all SQ folds/pages

const TRANSLATIONS = {
  /* =========================================================
   * ENGLISH
   * ======================================================= */
  en: {
    /* ===== Common / Shared ===== */
    "auth.cta": "Login / Sign Up",
    "footer.contactLabel": "contact :",
    "hero.scroll": "Scroll",

    /* ===== CORE / INDEX (Main Landing) ===== */
    "core.meta.title": "Still In Queue · Folds",

    "core.nav.home": "Home",
    "core.nav.agents": "Agents",
    "core.nav.green": "Green Energy",
    "core.nav.learning": "Learning",
    "core.nav.cc": "Coffee & Cream",

    "core.hero.kicker": "Still In Queue · Folds",
    "core.hero.title": "A Small Group of Long-Term Folds",
    "core.hero.pill": "Phase 1 · Concept Layer",
    "core.hero.line1":
      "Still In Queue (SQ) is a small ecosystem of folds – AI agents, learning, green energy, and lifestyle – each one designed to grow slowly and deliberately over time.",
    "core.hero.line2":
      "This site is the concept layer: a place to sketch the roadmap, explain ideas, and show what each fold could become before it turns into a full product.",
    "core.hero.bullets": "AGENTS · LEARNING · GREEN ENERGY · LIFESTYLE",
    "core.hero.cta.primary": "Explore the Folds",
    "core.hero.cta.secondary": "Read the Idea",

    // Fold teaser cards on index
    "core.card.agents.tag": "Fold · SQ-Agents",
    "core.card.agents.title": "Agents · Tools that Do the Work",
    "core.card.agents.text":
      "A stack of agent-style tools for research, operations, and day-to-day workflows. Less dashboard noise, more actual output.",
    "core.card.agents.link": "Go to Agents",

    "core.card.learning.tag": "Fold · SQ-LP",
    "core.card.learning.title": "Learning · Platform that Follows Your Life",
    "core.card.learning.text":
      "Courses, sports, arts, and language – mapped into one ecosystem with AI mentors and real places to train.",
    "core.card.learning.link": "Go to Learning",

    "core.card.green.tag": "Fold · SQ-GE",
    "core.card.green.title": "Green Energy · Solar, Explained & Planned",
    "core.card.green.text":
      "Compare solar options, understand investment and subsidies, and plan rooftop or large-scale projects.",
    "core.card.green.link": "Go to Green Energy",

    "core.card.cc.tag": "Fold · SQ-CC",
    "core.card.cc.title": "Coffee & Cream · Spaghettieis & Space",
    "core.card.cc.text":
      "A concept café bringing Spaghettieis and specialty coffee to Hyderabad – appointment-only, cozy, and camera-friendly.",
    "core.card.cc.link": "Go to SQ-CC",

    "core.about.kicker": "About · Still In Queue",
    "core.about.title": "Why Folds, Not Just One Product",
    "core.about.p1":
      "Still In Queue is a long-term project: instead of one big app, it’s a set of folds that can grow at different speeds – some digital, some physical.",
    "core.about.p2":
      "Phase 1 is mostly storytelling, roadmaps, and concept layouts. Over time, the folds connect to backends, data, and real-world projects.",

    "core.footer.copy":
      "© 2025 Still in Queue. All folds are still in queue – on purpose.",

    /* ===== AGENTS PAGE (sq-agents) ===== */
    "agents.meta.title": "Still In Queue · Agents",

    "agents.nav.home": "Home",
    "agents.nav.stack": "Agent Stack",
    "agents.nav.flows": "Flows",
    "agents.nav.vision": "Vision",
    "agents.nav.about": "About",

    "agents.hero.kicker": "SQ-AG · Agents & Tools",
    "agents.hero.title": "Agents that Move Work Forward",
    "agents.hero.pill": "Phase 1 · Concept Stack",
    "agents.hero.line1":
      "SQ-AG is the fold focused on automated and semi-automated agents – tools that research, summarise, draft, and coordinate tasks.",
    "agents.hero.line2":
      "The goal is to create a small, opinionated stack: fewer dashboards, more work done, and clear handover between humans and agents.",
    "agents.hero.bullets": "RESEARCH · OPS · WRITING · WORKFLOWS",
    "agents.hero.cta.primary": "Explore the Agent Stack",
    "agents.hero.cta.secondary": "See Flows",

    "agents.stack.chip": "Agent Stack",
    "agents.stack.kicker": "Stack",
    "agents.stack.title": "Layers of the Agent Stack",
    "agents.stack.desc":
      "This section sketches how SQ-AG thinks about agents: from simple helpers to more integrated flows.",

    "agents.stack.card1.tag": "Research",
    "agents.stack.card1.title": "Research & Discovery Agents",
    "agents.stack.card1.text":
      "Agents that scan documents, sites, and internal sources to surface relevant information with clear citations.",
    "agents.stack.card1.meta":
      "Use cases: desk research · briefings · monitoring",

    "agents.stack.card2.tag": "Writing",
    "agents.stack.card2.title": "Drafting & Editing Agents",
    "agents.stack.card2.text":
      "Helpers for drafting emails, reports, posts, and documentation – with style presets and review loops.",
    "agents.stack.card2.meta":
      "Use cases: outreach · content · internal docs",

    "agents.stack.card3.tag": "Ops",
    "agents.stack.card3.title": "Operations & Glue Agents",
    "agents.stack.card3.text":
      "Agents that move data between tools, update trackers, and keep simple operational tasks off your plate.",
    "agents.stack.card3.meta":
      "Use cases: reporting · CRM hygiene · checklists",

    "agents.flows.chip": "Flows",
    "agents.flows.kicker": "Flows",
    "agents.flows.title": "From Single Prompts to Repeatable Flows",
    "agents.flows.desc":
      "SQ-AG is not only about single prompts – it’s about wrapping them into flows you can reuse and improve.",

    "agents.flows.card1.title": "Client Research Flow",
    "agents.flows.card1.text":
      "A templated flow that takes a name or company, pulls structured information, and outputs a concise briefing.",
    "agents.flows.card1.li1": "Input: names, links, or seed docs.",
    "agents.flows.card1.li2": "Output: PDF or dashboard-ready summary.",
    "agents.flows.card1.li3": "Re-useable for sales, strategy, and prep.",

    "agents.flows.card2.title": "Reporting & Recaps",
    "agents.flows.card2.text":
      "Flows that turn raw updates, meeting notes, and metrics into consistent weekly or monthly summaries.",
    "agents.flows.card2.li1": "Collect updates from tools and humans.",
    "agents.flows.card2.li2": "Standardise into a recurring format.",
    "agents.flows.card2.li3": "Send to stakeholders or dashboards.",

    "agents.vision.chip": "Vision",
    "agents.vision.kicker": "Vision",
    "agents.vision.title": "What SQ-AG Aims to Become",
    "agents.vision.p1":
      "Instead of a generic ‘AI assistant’, SQ-AG focuses on a narrow set of agents that can be trusted for specific jobs.",
    "agents.vision.p2":
      "Over time, the stack will connect deeper into calendars, docs, CRMs, and project tools – while staying explainable and controllable.",

    "agents.about.chip": "About",
    "agents.about.kicker": "About · SQ-AG",
    "agents.about.title": "Why Agents Are a Fold of Still In Queue",
    "agents.about.p1":
      "Agents are one of the earliest ways SQ can be useful: you don’t need a full product to feel the impact of a good flow.",
    "agents.about.p2":
      "This fold experiments with workflows first, and only then builds the right UI or integrations around them.",

    "agents.footer.copy":
      "© 2025 Still in Queue · SQ-AG. All rights reserved.",

    /* ===== COFFEE & CREAM (SQ-CC) ===== */
    "cc.meta.title": "Still In Queue · Coffee & Cream",

    "cc.nav.home": "Home",
    "cc.nav.menu": "Menu",
    "cc.nav.experience": "Experience",
    "cc.nav.diy": "DIY Bar",
    "cc.nav.about": "About",

    "cc.hero.kicker": "SQ-CC · Coffee & Cream",
    "cc.hero.title": "Spaghettieis, Coffee & Calm",
    "cc.hero.pill": "Phase 1 · Concept Storefront",
    "cc.hero.line1":
      "SQ-CC is an ice cream and coffee concept that introduces <strong>Spaghettieis</strong> to Hyderabad — alongside bowls, sundaes, cakes, and specialty coffee made with organic, hand-selected ingredients.",
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

    /* ===== GREEN ENERGY (SQ-GE) ===== */
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
    "ge.planning.card2.li2":
      "Commercial and industrial schemes.",
    "ge.planning.card2.li3":
      "Net-metering rules and export tariffs.",
    "ge.planning.card2.badge1": "Govt schemes",
    "ge.planning.card2.badge2": "Eligibility",
    "ge.planning.card2.badge3": "Updated policy view",

    "ge.projects.chip": "Projects",
    "ge.projects.kicker": "Projects",
    "ge.projects.title": "From Rooftops to Fields",
    "ge.projects.desc":
      "The long-term plan is not just advisory — SQ-GE aims to support real installations and, later, larger projects.",

    "ge.projects.card1.title": "Residential &amp; Small Commercial",
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

    "ge.projects.card2.title": "Large-Scale &amp; Government Projects",
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
    "ge.about.title": "Why Green Energy is a Fold of Sique",
    "ge.about.p1":
      "SQ-GE is the renewable fold of Still In Queue — a way to use data, planning, and software thinking to make solar adoption easier. It accepts that green projects are often high investment with delayed returns, but focuses on the long-term benefits: environment, stability, and recurring income.",
    "ge.about.p2":
      "This page is the concept design. Future versions will connect to real product feeds, pricing APIs, policy databases, and project tracking tools, built on a Python backend — so SQ-GE can move from explanation into execution.",

    "ge.about.note":
      "High-level path:<br><br><strong>Phase 1:</strong> Concept site &amp; explanation tools.<br><strong>Phase 2:</strong> Solar comparison + basic calculators.<br><strong>Phase 3:</strong> Lead management &amp; installer network.<br><strong>Phase 4:</strong> Participation in larger govt and utility-scale projects.",

    "ge.footer.copy":
      "© 2025 Still in Queue · SQ-GE. All rights reserved.",

    /* ===== LEARNING PLATFORM (SQ-LP) ===== */
    "lp.meta.title": "Still In Queue · Learning Platform",

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

    "lp.footer.copy":
      "© 2025 Still in Queue · SQ-LP. All rights reserved."
  },

  /* =========================================================
   * DEUTSCH
   * ======================================================= */
  de: {
    /* ===== Common / Shared ===== */
    "auth.cta": "Login / Registrieren",
    "footer.contactLabel": "kontakt :",
    "hero.scroll": "Scroll",

    /* ===== CORE / INDEX (Main Landing) ===== */
    "core.meta.title": "Still In Queue · Folds",

    "core.nav.home": "Home",
    "core.nav.agents": "Agents",
    "core.nav.green": "Green Energy",
    "core.nav.learning": "Learning",
    "core.nav.cc": "Coffee & Cream",

    "core.hero.kicker": "Still In Queue · Folds",
    "core.hero.title": "Ein kleines Set langfristiger Folds",
    "core.hero.pill": "Phase 1 · Konzept-Ebene",
    "core.hero.line1":
      "Still In Queue (SQ) ist ein kleines Ökosystem aus Folds – Agents, Learning, Green Energy und Lifestyle – die langsam und bewusst wachsen dürfen.",
    "core.hero.line2":
      "Diese Seite ist die Konzept-Ebene: ein Ort, um Roadmaps zu skizzieren, Ideen zu erklären und zu zeigen, was jede Fold werden kann, bevor sie zum Produkt wird.",
    "core.hero.bullets": "AGENTS · LEARNING · GREEN ENERGY · LIFESTYLE",
    "core.hero.cta.primary": "Folds erkunden",
    "core.hero.cta.secondary": "Die Idee lesen",

    "core.card.agents.tag": "Fold · SQ-Agents",
    "core.card.agents.title": "Agents · Tools, die Arbeit bewegen",
    "core.card.agents.text":
      "Eine kleine Agent-Stack für Recherche, Operations und Alltag – weniger Dashboard-Lärm, mehr echtes Output.",
    "core.card.agents.link": "Zu Agents",

    "core.card.learning.tag": "Fold · SQ-LP",
    "core.card.learning.title": "Learning · Plattform, die mitgeht",
    "core.card.learning.text":
      "Kurse, Sport, Arts und Sprachen – in einem Ökosystem mit KI-Mentoren und echten Orten zum Trainieren.",
    "core.card.learning.link": "Zu Learning",

    "core.card.green.tag": "Fold · SQ-GE",
    "core.card.green.title": "Green Energy · Solar erklärt & geplant",
    "core.card.green.text":
      "Solar-Optionen vergleichen, Investition & Förderungen verstehen und Dach- oder Großprojekte planen.",
    "core.card.green.link": "Zu Green Energy",

    "core.card.cc.tag": "Fold · SQ-CC",
    "core.card.cc.title": "Coffee & Cream · Spaghettieis & Space",
    "core.card.cc.text":
      "Ein Café-Konzept, das Spaghettieis und Specialty Coffee nach Hyderabad bringt – mit Terminen, gemütlich und kamera-freundlich.",
    "core.card.cc.link": "Zu SQ-CC",

    "core.about.kicker": "About · Still In Queue",
    "core.about.title": "Warum Folds – nicht nur ein Produkt",
    "core.about.p1":
      "Still In Queue ist ein Langzeitprojekt: Statt einer großen App gibt es mehrere Folds, die sich unterschiedlich schnell entwickeln – manche digital, manche physisch.",
    "core.about.p2":
      "Phase 1 dreht sich vor allem um Storytelling, Roadmaps und Konzept-Layouts. Später verbinden sich die Folds mit Backends, Daten und echten Projekten.",

    "core.footer.copy":
      "© 2025 Still in Queue. Alle Folds sind noch in der Queue – mit Absicht.",

    /* ===== AGENTS PAGE (sq-agents) ===== */
    "agents.meta.title": "Still In Queue · Agents",

    "agents.nav.home": "Home",
    "agents.nav.stack": "Agent Stack",
    "agents.nav.flows": "Flows",
    "agents.nav.vision": "Vision",
    "agents.nav.about": "Über",

    "agents.hero.kicker": "SQ-AG · Agents & Tools",
    "agents.hero.title": "Agents, die Arbeit voranbringen",
    "agents.hero.pill": "Phase 1 · Konzept-Stack",
    "agents.hero.line1":
      "SQ-AG ist der Fold für automatisierte und halb-automatisierte Agents – Tools, die recherchieren, zusammenfassen, entwerfen und koordinieren.",
    "agents.hero.line2":
      "Ziel ist ein kleiner, klarer Stack: weniger Oberflächen, mehr Arbeit, die wirklich erledigt wird – mit sauberen Übergaben zwischen Mensch und Agent.",
    "agents.hero.bullets": "RESEARCH · OPS · WRITING · WORKFLOWS",
    "agents.hero.cta.primary": "Agent Stack erkunden",
    "agents.hero.cta.secondary": "Flows ansehen",

    "agents.stack.chip": "Agent Stack",
    "agents.stack.kicker": "Stack",
    "agents.stack.title": "Ebenen des Agent-Stacks",
    "agents.stack.desc":
      "Dieser Bereich skizziert, wie SQ-AG über Agents denkt: von einfachen Helfern bis zu integrierten Flows.",

    "agents.stack.card1.tag": "Research",
    "agents.stack.card1.title": "Research & Discovery Agents",
    "agents.stack.card1.text":
      "Agents, die Dokumente, Sites und interne Quellen scannen und relevante Infos mit klaren Quellenangaben liefern.",
    "agents.stack.card1.meta":
      "Use Cases: Desk Research · Briefings · Monitoring",

    "agents.stack.card2.tag": "Writing",
    "agents.stack.card2.title": "Drafting & Editing Agents",
    "agents.stack.card2.text":
      "Helfer zum Schreiben von E-Mails, Reports, Posts und Doku – mit Style-Presets und Review-Loops.",
    "agents.stack.card2.meta":
      "Use Cases: Outreach · Content · interne Doku",

    "agents.stack.card3.tag": "Ops",
    "agents.stack.card3.title": "Operations & Glue Agents",
    "agents.stack.card3.text":
      "Agents, die Daten zwischen Tools bewegen, Tracker pflegen und einfache Operation-Tasks übernehmen.",
    "agents.stack.card3.meta":
      "Use Cases: Reporting · CRM-Hygiene · Checklisten",

    "agents.flows.chip": "Flows",
    "agents.flows.kicker": "Flows",
    "agents.flows.title": "Von einzelnen Prompts zu wiederverwendbaren Flows",
    "agents.flows.desc":
      "SQ-AG geht nicht nur um einzelne Prompts – sondern darum, sie in wiederverwendbare Flows zu packen.",

    "agents.flows.card1.title": "Client Research Flow",
    "agents.flows.card1.text":
      "Ein Flow, der aus Namen oder Firmen strukturierte Infos zieht und ein kompaktes Briefing erzeugt.",
    "agents.flows.card1.li1":
      "Input: Namen, Links oder Seed-Dokumente.",
    "agents.flows.card1.li2":
      "Output: PDF oder Dashboard-Ready-Summary.",
    "agents.flows.card1.li3":
      "Wiederverwendbar für Sales, Strategie, Vorbereitung.",

    "agents.flows.card2.title": "Reporting & Recaps",
    "agents.flows.card2.text":
      "Flows, die Roh-Updates, Meeting-Notes und KPIs in konsistente Weekly- oder Monthly-Reports übersetzen.",
    "agents.flows.card2.li1":
      "Updates aus Tools und von Menschen einsammeln.",
    "agents.flows.card2.li2":
      "In ein wiederkehrendes Format bringen.",
    "agents.flows.card2.li3":
      "Automatisch versenden oder ins Dashboard schieben.",

    "agents.vision.chip": "Vision",
    "agents.vision.kicker": "Vision",
    "agents.vision.title": "Was SQ-AG langfristig werden soll",
    "agents.vision.p1":
      "Statt einem generischen „AI Assistant“ fokussiert sich SQ-AG auf eine kleine Menge Agents, denen man für bestimmte Jobs vertrauen kann.",
    "agents.vision.p2":
      "Mit der Zeit wird der Stack tiefer an Kalender, Docs, CRMs und Projekt-Tools angebunden – bei möglichst erklärbaren und kontrollierbaren Agents.",

    "agents.about.chip": "About",
    "agents.about.kicker": "Über · SQ-AG",
    "agents.about.title": "Warum Agents ein Fold von Still In Queue sind",
    "agents.about.p1":
      "Agents sind einer der frühesten Wege, wie SQ nützlich werden kann: Man braucht kein volles Produkt, um Wirkung zu spüren.",
    "agents.about.p2":
      "Diese Fold experimentiert zuerst mit Workflows und baut erst danach das passende UI oder Integrationen darum herum.",

    "agents.footer.copy":
      "© 2025 Still in Queue · SQ-AG. Alle Rechte vorbehalten.",

    /* ===== COFFEE & CREAM (SQ-CC) ===== */
    "cc.meta.title": "Still In Queue · Coffee & Cream",

    "cc.nav.home": "Home",
    "cc.nav.menu": "Menu",
    "cc.nav.experience": "Experience",
    "cc.nav.diy": "DIY Bar",
    "cc.nav.about": "Über",

    "cc.hero.kicker": "SQ-CC · Coffee & Cream",
    "cc.hero.title": "Spaghettieis, Coffee & Calm",
    "cc.hero.pill": "Phase 1 · Konzept-Storefront",
    "cc.hero.line1":
      "SQ-CC ist ein Eis- und Coffee-Konzept, das <strong>Spaghettieis</strong> nach Hyderabad bringt – zusammen mit Bowls, Sundaes, Kuchen und Specialty Coffee aus ausgewählten, überwiegend Bio-Zutaten.",
    "cc.hero.line2":
      "Insta-tauglich, bewusst und nur mit Termin: 90 Minuten pro Gast, mit Platz zum Arbeiten, Reden und für kleine Feiern.",
    "cc.hero.bullets":
      "SPAGHETTIEIS · BOWLS · COFFEE · VIBES",
    "cc.hero.cta.primary": "Konzept-Menu ansehen",
    "cc.hero.cta.secondary": "Experience entdecken",

    "cc.menu.kicker": "Menu-Konzept",
    "cc.menu.title": "Coffee, Cream &amp; Spaghettieis",
    "cc.menu.desc":
      "Dies ist der erste Entwurf des Menus. Später kann diese Seite ein interaktives Menu mit Fotos, Nährwerten und Online-Vorbestellungen werden.",

    "cc.menu.card1.tag": "Signature",
    "cc.menu.card1.title": "Spaghetti-Eis Collection",
    "cc.menu.card1.text":
      "Klassische Vanille-„Pasta“, reichhaltige Saucen, Crunch-Toppings und verspielte Kombinationen – gedacht für Fotos und echten Geschmack.",
    "cc.menu.card1.meta":
      "Basis: Bio-Milch · Optionen mit wenig Zucker",

    "cc.menu.card2.tag": "Bowls &amp; Sundaes",
    "cc.menu.card2.title": "Balanced Bowls &amp; Sundaes",
    "cc.menu.card2.text":
      "Fruchtige Bowls, proteinfreundliche Sundaes und frei kombinierbare Varianten – frisch, ohne den Dessert-Spaß zu verlieren.",
    "cc.menu.card2.meta":
      "Optionen: plant-based · high-protein · classic",

    "cc.menu.card3.tag": "Cakes &amp; Coffee",
    "cc.menu.card3.title": "Cakes, Bakes &amp; Specialty Coffee",
    "cc.menu.card3.text":
      "Kleine Batches bei Kuchen & Gebäck, kombiniert mit Espresso-Drinks, Cold Brew und Slow Coffee – für Leute, die etwas länger bleiben.",
    "cc.menu.card3.meta":
      "Röstung: kuratierte Bohnen · saisonale Specials",

    "cc.exp.kicker": "Space &amp; Experience",
    "cc.exp.title": "Eine 90-Minuten-Mini-Auszeit",
    "cc.exp.desc":
      "SQ-CC ist als Terminspace mit begrenzter Kapazität gedacht – gebaut für junge & arbeitende Gäste, offen für alle Altersgruppen und Feiern.",

    "cc.exp.card1.title": "Ambience &amp; Seating",
    "cc.exp.card1.text":
      "Warm, holzlastig, weiche Texturen und ein Layout, das für Solo-Besuche, Paare und kleine Gruppen funktioniert. Jeder Spot ist kamera-freundlich, ohne künstlich zu wirken.",
    "cc.exp.card1.li1": "90-Minuten-Slots pro Gast oder Gruppe.",
    "cc.exp.card1.li2": "Ruhige Tische für Laptop & Lesen.",
    "cc.exp.card1.li3": "Foto-Spots für „dieser Ort“-Momente.",
    "cc.exp.card1.badge1": "Insta-worthy",
    "cc.exp.card1.badge2": "Cozy Seating",
    "cc.exp.card1.badge3": "Work-friendly",

    "cc.exp.card2.title": "Reservations &amp; Specials",
    "cc.exp.card2.text":
      "Zutritt nur mit Termin, damit es nie voll wirkt. Später können Slots, Pre-Orders und Celebration-Add-ons direkt über die Website laufen.",
    "cc.exp.card2.li1":
      "Studenten-Rabatt-Konzept: 10% mit gültigem Ausweis.",
    "cc.exp.card2.li2":
      "Geburtstags- & Celebration-Pakete (spätere Phase).",
    "cc.exp.card2.li3":
      "Private oder halb-private Buchungen für kleine Events.",
    "cc.exp.card2.badge1": "Slots",
    "cc.exp.card2.badge2": "Student 10%",
    "cc.exp.card2.badge3": "Celebrations",

    "cc.diy.kicker": "DIY Terminal",
    "cc.diy.title": "Build Your Own Bowl",
    "cc.diy.desc":
      "Ein Kern von SQ-CC ist Auswahl. Das DIY-Terminal lässt Gäste Bowls, Sundaes und Spaghettieis vor dem Tresen zusammenstellen.",

    "cc.diy.card1.title": "Digitaler DIY-Flow (Konzept)",
    "cc.diy.card1.text":
      "Auf dieser Seite kann später ein interaktiver Builder entstehen: Base, Sauce, Toppings & Extras wählen, Nährwert-Hints sehen und Favoriten speichern.",
    "cc.diy.card1.li1":
      "Step 1: Base wählen (Eis, Joghurt, vegan etc.).",
    "cc.diy.card1.li2":
      "Step 2: Saucen, Früchte, Nüsse, Crunch.",
    "cc.diy.card1.li3":
      "Step 3: Extras wie Espresso-Shots oder Protein.",
    "cc.diy.card1.badge1": "Custom Combos",
    "cc.diy.card1.badge2": "Profiles",
    "cc.diy.card1.badge3": "Recommendations",

    "cc.diy.card2.title": "Health-Aware, nicht „Diet“",
    "cc.diy.card2.text":
      "Ziel ist nicht Verzicht, sondern Klarheit: transparente Zutaten, leichtere Optionen und Portionen, die sich gut anfühlen.",
    "cc.diy.card2.li1":
      "Bio oder sorgfältig ausgewählte Kernzutaten.",
    "cc.diy.card2.li2":
      "Labels für plant-based, proteinreich oder low-sugar.",
    "cc.diy.card2.li3":
      "Platz für saisonale Menus mit lokalem Angebot.",
    "cc.diy.card2.badge1": "Ingredient Focus",
    "cc.diy.card2.badge2": "Balanced Options",
    "cc.diy.card2.badge3": "Seasonal Menus",

    "cc.about.kicker": "About · SQ-CC",
    "cc.about.title": "Warum Coffee &amp; Cream ein Fold ist",
    "cc.about.p1":
      "SQ-CC ist der Lifestyle-Fold von Still In Queue – ein physischer Raum, der die eher technischen Folds (AI, Learning, Green Energy) ausbalanciert. Mit derselben Haltung: durchdachtes Design, langfristige Qualität und Experience statt Zufall.",
    "cc.about.p2":
      "Diese Seite ist das Konzept-Layout für Store & Digital Experience. Später kann sie sich in ein Buchungs-System, Loyalty/Membership und ein Live-Menu anbinden, das direkt mit dem SQ-Backend verbunden ist.",

    "cc.about.note":
      "Future Ideas:<br><br><strong>Phase 1:</strong> Konzept-Site &amp; Brand Story.<br><strong>Phase 2:</strong> Slot-Buchung, digitales Menu, DIY-UI.<br><strong>Phase 3:</strong> Loyalty-Accounts mit Haupt-Sique-Login.<br><strong>Phase 4:</strong> Mehrere Locations oder Pop-ups unter SQ-CC.",

    "cc.footer.copy":
      "© 2025 Still in Queue · SQ-CC. Alle Rechte vorbehalten.",

    /* ===== GREEN ENERGY (SQ-GE) ===== */
    "ge.meta.title": "Still In Queue · Green Energy",

    "ge.nav.home": "Home",
    "ge.nav.solutions": "Solutions",
    "ge.nav.planning": "Rechner &amp; Planung",
    "ge.nav.projects": "Projekte",
    "ge.nav.about": "Über",

    "ge.hero.kicker": "SQ-GE · Green Energy",
    "ge.hero.title": "Solar, erklärt &amp; geplant",
    "ge.hero.pill": "Phase 1 · Konzept-Plattform",
    "ge.hero.line1":
      "SQ-GE ist eine Plattform, die beim Vergleich von Solar-Modulen und Equipment hilft, Investitionen & Förderungen erklärt und Installationen plant – vom einzelnen Dach bis zu Großprojekten.",
    "ge.hero.line2":
      "Ziel ist, <strong>Erneuerbare-Entscheidungen klar</strong> zu machen: Was kaufen, was kostet es, wann rechnet es sich und wie passt es in langfristiges, nachhaltiges Einkommen.",
    "ge.hero.bullets": "COMPARE · CALCULATE · PLAN · INSTALL",
    "ge.hero.cta.primary": "Green Solutions entdecken",
    "ge.hero.cta.secondary": "Planungs-Konzept ansehen",

    "ge.solutions.chip": "Solutions",
    "ge.solutions.kicker": "Solutions",
    "ge.solutions.title": "Solar-Optionen vergleichen",
    "ge.solutions.desc":
      "In einer späteren Phase wird dies ein interaktives Vergleichstool mit echten Produkten und Specs. Aktuell skizziert es, wie SQ-GE über Equipment & Empfehlungen denkt.",

    "ge.solutions.card1.tag": "Panels",
    "ge.solutions.card1.title": "Solar Panel Matching",
    "ge.solutions.card1.text":
      "Panels weltweit vergleichen: Wirkungsgrad, Temperaturverhalten, Garantien und Kosten pro Watt. Passend zu Dachgröße, Klima und Budget.",
    "ge.solutions.card1.meta":
      "Inputs: Dachfläche · Standort · Budget",

    "ge.solutions.card2.tag": "Inverters &amp; Storage",
    "ge.solutions.card2.title": "Inverter &amp; Battery Planning",
    "ge.solutions.card2.text":
      "Den richtigen Inverter und optionale Batterie auswählen – passend zu Lastprofil, Backup-Anforderungen und Netzbedingungen.",
    "ge.solutions.card2.meta":
      "Inputs: Verbrauchsmuster · Backup-Stunden",

    "ge.solutions.card3.tag": "Packages",
    "ge.solutions.card3.title": "Home &amp; Business Bundles",
    "ge.solutions.card3.text":
      "Vordefinierte Systemgrößen und Paket-Ideen für Häuser, Wohnungen, kleine Businesses und Gewerbedächer – inklusive geschätzter Energieproduktion.",
    "ge.solutions.card3.meta":
      "Outputs: kW-Größe · jährliche kWh",

    "ge.planning.chip": "Planning",
    "ge.planning.kicker": "Rechner &amp; Planung",
    "ge.planning.title": "Kosten &amp; Breakeven verstehen",
    "ge.planning.desc":
      "SQ-GE ist auch ein Planungs-Tool. Es zeigt nicht nur Hardware, sondern erklärt die Zahlen: Investition, Förderungen, Ersparnis und Payback.",

    "ge.planning.card1.title": "Investment &amp; Breakeven-Konzept",
    "ge.planning.card1.text":
      "Ein späterer Rechner schätzt Investitionskosten, monatliche Ersparnis und Payback – mit und ohne Förderung.",
    "ge.planning.card1.li1":
      "Kosten-Breakdown: Panels, Inverter, Struktur, Kabel, Arbeit.",
    "ge.planning.card1.li2":
      "Erwartete Monatsproduktion nach Standort & Neigung.",
    "ge.planning.card1.li3":
      "Stromtarif vs. Solar-Ersparnis.",
    "ge.planning.card1.li4":
      "Einfacher & diskontierter Payback.",
    "ge.planning.card1.badge1": "Capex vs Opex",
    "ge.planning.card1.badge2": "Förder-Impact",
    "ge.planning.card1.badge3": "ROI Timeline",

    "ge.planning.card2.title": "Subsidies &amp; Policy Awareness",
    "ge.planning.card2.text":
      "Mit der Zeit mappt SQ-GE zentrale & bundesstaatliche Förderprogramme – z.B. in Andhra Pradesh – und zeigt ihren Einfluss auf Payback.",
    "ge.planning.card2.li1":
      "Förderungen für Residential Rooftop.",
    "ge.planning.card2.li2":
      "Programme für Commercial & Industrial.",
    "ge.planning.card2.li3":
      "Net-Metering-Regeln und Einspeisetarife.",
    "ge.planning.card2.badge1": "Govt Schemes",
    "ge.planning.card2.badge2": "Eligibility",
    "ge.planning.card2.badge3": "Policy View",

    "ge.projects.chip": "Projects",
    "ge.projects.kicker": "Projects",
    "ge.projects.title": "Vom Dach zum Feld",
    "ge.projects.desc":
      "Langfristig bleibt es nicht bei Beratung – SQ-GE soll reale Installationen und später größere Projekte begleiten.",

    "ge.projects.card1.title": "Residential &amp; Small Commercial",
    "ge.projects.card1.text":
      "Start mit individuellen Kund:innen: Häuser, Wohnungen, Shops, Offices. Beratung, Designvorschläge und später Anbindung an Installationspartner.",
    "ge.projects.card1.li1":
      "Site Assessment & grundlegende Layout-Konzepte.",
    "ge.projects.card1.li2":
      "Schätzung von Erzeugung & Ersparnis.",
    "ge.projects.card1.li3":
      "Partner-Installer-Matching (spätere Phase).",
    "ge.projects.card1.badge1": "Rooftops",
    "ge.projects.card1.badge2": "Shops & Offices",
    "ge.projects.card1.badge3": "Proposals",

    "ge.projects.card2.title": "Large-Scale &amp; Government Projects",
    "ge.projects.card2.text":
      "Eine spätere Phase zielt auf größere Installationen – z.B. Mass-Rooftop-Programme und Solar-Felder in Andhra Pradesh – abgestimmt auf Govt-Tenders und langfristige PPAs.",
    "ge.projects.card2.li1":
      "High-Level-Feasibility & System-Sizing.",
    "ge.projects.card2.li2":
      "Pipeline-Overviews im Dashboard-Stil.",
    "ge.projects.card2.li3":
      "Fokus auf stabile, nachhaltige Einnahmen nach den Anfangsjahren.",
    "ge.projects.card2.badge1": "AP-Fokus",
    "ge.projects.card2.badge2": "Govt Tenders",
    "ge.projects.card2.badge3": "Long-term Revenue",

    "ge.about.chip": "About",
    "ge.about.kicker": "Über · SQ-GE",
    "ge.about.title": "Warum Green Energy ein Fold von Sique ist",
    "ge.about.p1":
      "SQ-GE ist der Renewable-Fold von Still In Queue – ein Versuch, mit Daten, Planung und Software-Denken Solaranlagen einfacher zu machen. Es akzeptiert hohe Anfangsinvestitionen, fokussiert sich aber auf die langfristigen Vorteile: Umwelt, Stabilität und wiederkehrende Einnahmen.",
    "ge.about.p2":
      "Diese Seite ist das Konzept-Design. Spätere Versionen verbinden reale Produkt-Feeds, Pricing-APIs, Policy-Datenbanken und Projekt-Tracking – auf einem Python-Backend.",

    "ge.about.note":
      "High-Level Path:<br><br><strong>Phase 1:</strong> Konzept-Site &amp; Explanation-Tools.<br><strong>Phase 2:</strong> Solar-Vergleich + Basic-Rechner.<br><strong>Phase 3:</strong> Lead-Management &amp; Installer-Netzwerk.<br><strong>Phase 4:</strong> Teilnahme an größeren Govt- & Utility-Scale-Projekten.",

    "ge.footer.copy":
      "© 2025 Still in Queue · SQ-GE. Alle Rechte vorbehalten.",

    /* ===== LEARNING PLATFORM (SQ-LP) ===== */
    "lp.meta.title": "Still In Queue · Lernplattform",

    "lp.nav.home": "Home",
    "lp.nav.courses": "Kurse",
    "lp.nav.sports": "Sport",
    "lp.nav.arts": "Arts &amp; Clubs",
    "lp.nav.about": "Über",

    "lp.hero.kicker": "SQ-LP · Learning Platform",
    "lp.hero.title": "Lernen, das deinem Leben folgt",
    "lp.hero.pill": "Phase 1 · Konzept-Campus",
    "lp.hero.line1":
      "SQ-LP ist eine Lernplattform, die strukturierte Kurse, Sportakademien, kreative Angebote und Sprachtraining an einem Ort bündelt – unterstützt von <strong>KI-Mentoren</strong>, die begleiten, coachen und dich auf Kurs halten.",
    "lp.hero.line2":
      "Von Online-Lektionen bis zu echten Clubs und Akademien soll es leicht werden, Fähigkeiten zu entdecken, zu planen und dranzubleiben – genau bei den Themen, die dir wirklich wichtig sind.",
    "lp.hero.bullets": "KURSE · SPORT · ARTS · CLUBS",
    "lp.hero.cta.primary": "Lernbereiche entdecken",
    "lp.hero.cta.secondary": "Über SQ-LP",

    "lp.courses.chip": "Kurse",
    "lp.courses.kicker": "E-Learning",
    "lp.courses.title": "Kurse für jede Phase",
    "lp.courses.desc":
      "In späteren Phasen wird daraus eine interaktive Kursbibliothek mit KI-Tutoren und personalisierten Pfaden. Im Moment skizziert sie die Kernidee, was SQ-LP abdecken soll.",

    "lp.courses.card1.tag": "Foundations",
    "lp.courses.card1.title": "Schul- &amp; Uni-Unterstützung",
    "lp.courses.card1.text":
      "Strukturierte Inhalte für Schüler:innen und Studierende – mit KI, die Konzepte erklärt, Übungen generiert und Fortschritte mitverfolgt.",
    "lp.courses.card1.meta":
      "Fokus: Mathe · Naturwissenschaften · Sprachen · Prüfungen",

    "lp.courses.card2.tag": "Careers",
    "lp.courses.card2.title": "Karriere- &amp; Tech-Skills",
    "lp.courses.card2.text":
      "Daten, Programmierung, Design, Business und Kommunikation – Skills für moderne Berufe mit Projekt-Lernen und Portfolio-Fokus.",
    "lp.courses.card2.meta":
      "Fokus: Data · Dev · Design · Business",

    "lp.courses.card3.tag": "Lifelong",
    "lp.courses.card3.title": "Alltagslernen",
    "lp.courses.card3.text":
      "Finanzen, Produktivität, Mindset und Hobby-Mikrokurse – gedacht für kurze Sessions, die in eine volle Woche passen.",
    "lp.courses.card3.meta":
      "Fokus: Money · Habits · Hobbies",

    "lp.sports.chip": "Sport",
    "lp.sports.kicker": "Sport Map",
    "lp.sports.title": "Orte zum Trainieren &amp; Spielen finden",
    "lp.sports.desc":
      "SQ-LP schaut auch nach außen: eine Übersicht über Akademien, Clubs und Turniere, damit Sportbegeisterte Orte zum Trainieren finden – nicht nur zum Zuschauen.",

    "lp.sports.card1.title": "Akademien &amp; Trainingszentren in der Nähe",
    "lp.sports.card1.text":
      "Die Sportansicht zeigt Akademien und Coaching-Center in deiner Umgebung – mit Filtern nach Alter, Level und Budget. Später können KI-Empfehlungen nach Interessen und Zeitplan dazukommen.",
    "lp.sports.card1.li1":
      "Teamsport: Fußball, Cricket, Basketball, Volleyball etc.",
    "lp.sports.card1.li2":
      "Einzelsport: Tennis, Badminton, Leichtathletik, Schwimmen.",
    "lp.sports.card1.li3":
      "Spezialprogramme: Strength &amp; Conditioning, Kids Camps.",
    "lp.sports.card1.badge1": "Karte &amp; Distanz",
    "lp.sports.card1.badge2": "Zeiten",
    "lp.sports.card1.badge3": "Schwierigkeitsgrad",

    "lp.sports.card2.title": "Turniere, Ligen &amp; Events",
    "lp.sports.card2.text":
      "Eine Kalenderansicht hebt lokale Ligen, Turniere und Community-Events hervor, damit Spieler:innen und Eltern frühzeitig planen können.",
    "lp.sports.card2.li1":
      "Monatliche und saisonale Turniere.",
    "lp.sports.card2.li2":
      "Einsteigerfreundliche Wettbewerbe für den Einstieg.",
    "lp.sports.card2.li3":
      "Links zu Anmeldung und Spielplänen.",
    "lp.sports.card2.badge1": "Kalender",
    "lp.sports.card2.badge2": "Benachrichtigungen",
    "lp.sports.card2.badge3": "Team-Invites",

    "lp.arts.chip": "Arts &amp; Clubs",
    "lp.arts.kicker": "Arts &amp; Creative Clubs",
    "lp.arts.title": "Lernen über das Klassenzimmer hinaus",
    "lp.arts.desc":
      "Tanz, Musik, Malerei, Töpferei, Fotografie, Schauspiel, Kochen, Fashion – SQ-LP behandelt sie als ernstzunehmende Skills, nicht nur als Hobbys.",

    "lp.arts.card1.title": "Studios, Schulen &amp; Workshops",
    "lp.arts.card1.text":
      "Orte für kreatives Lernen offline entdecken – mit Fotos, Zeiten und Schwerpunkten. Später kombinieren Hybrid-Programme Online-Module mit Praxis vor Ort.",
    "lp.arts.card1.li1":
      "Tanzstudios, Musikschulen und Theatergruppen.",
    "lp.arts.card1.li2":
      "Kunst-, Töpfer- und Kreativ-Workshops.",
    "lp.arts.card1.li3":
      "Koch-, Back- und Culinary-Schulen.",

    "lp.arts.card2.title": "Clubs, Communities &amp; Events",
    "lp.arts.card2.text":
      "Ein Club-Verzeichnis hilft, Fotowalks, Lesekreise, Jam-Sessions, Open Mics und mehr zu finden – damit Lernen ganz natürlich in Gemeinschaft übergeht.",
    "lp.arts.card2.li1":
      "Community-Clubs und informelle Meetups.",
    "lp.arts.card2.li2":
      "Showcases, Recitals und Ausstellungen.",
    "lp.arts.card2.li3":
      "KI-gestützte Vorschläge auf Basis deines Profils.",
    "lp.arts.card2.badge1": "Events",
    "lp.arts.card2.badge2": "Groups",
    "lp.arts.card2.badge3": "AI Suggestions",

    "lp.about.chip": "About",
    "lp.about.kicker": "Über · SQ-LP",
    "lp.about.title": "Die Idee hinter der Lernplattform",
    "lp.about.p1":
      "SQ-LP ist der zweite Bereich von Still In Queue – ein Raum, in dem strukturierte Kurse, Sport und Arts im selben Ökosystem stattfinden. Das langfristige Ziel: <strong>hochwertige Inhalte</strong> mit <strong>KI-Guidance</strong> und realen Lernorten verbinden.",
    "lp.about.p2":
      "Diese Seite ist das Konzept-Layout. In späteren Phasen wird sie an ein Python-Backend, eine Videothek, eine Empfehlungslogik und eine Karte mit Akademien &amp; Studios angebunden – damit SQ-LP zu einem echten Lernbegleiter für verschiedene Lebensphasen wird.",
    "lp.about.note":
      "Grobe Roadmap:<br><br><strong>Phase 1:</strong> Frontend-Layout &amp; Content-Struktur.<br><strong>Phase 2:</strong> Kurskatalog mit KI-Overviews und Fortschritts-Tracking.<br><strong>Phase 3:</strong> Integration von Sport- &amp; Arts-Locations, Karten und Events.<br><strong>Phase 4:</strong> Personalisierte Lernpfade und Community-Features.",

    "lp.footer.copy":
      "© 2025 Still in Queue · SQ-LP. Alle Rechte vorbehalten."
  }
};

// Expose globally for main.js
window.TRANSLATIONS = TRANSLATIONS;
