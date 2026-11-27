// Single source of truth for the datasheet CV.
// Edit this file, then run `node src/build.mjs` to regenerate every page.
//
// Every project carries a relevance score per lens (0–3). A lens page lists
// its hand-picked `featured` projects first, then everything else sorted by
// that score, so the most relevant work is always at the top.

export const site = {
  url: "https://just-sil.github.io/just_me/",
  revision: "2026.11",
  image: "me.jpg"
};

export const person = {
  name: "Mohamed Simal M",
  short: "simal.m",
  location: "Tirur, Kerala, India",
  timezone: "Asia/Kolkata",
  email: "simalmannekkara@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/just-sil", handle: "just-sil" },
    { label: "WhatsApp", href: "https://wa.me/+919633302482", handle: "+91 96333 02482" },
    { label: "Instagram", href: "https://www.instagram.com/silman0_0/", handle: "silman0_0" }
  ],
  study: "B.Tech, Computer Science & Business Systems",
  school: "Model Engineering College, Thrikkakara",
  status: "Available to learn",
  philosophy: "Skill is the product of curiosity and interest.",
  bio: [
    "I'm a Computer Science and Business Systems student at Model Engineering College, Thrikkakara, from Tirur in Malappuram, Kerala.",
    "I'm drawn to projects where software meets the physical world: connected devices, useful automation and AI applied to practical problems. I learn best by making things, testing them, breaking them and improving them. Away from the bench I take photographs."
  ],
  approach: ["Start with a problem", "Explore possible solutions", "Build, test and refine"]
};

/* ── lenses: one per URL ─────────────────────────────────────── */
export const lenses = {
  general: {
    path: "",
    part: "MSM-G",
    label: "General",
    variant: "General-purpose builder",
    title: "Mohamed Simal M — Embedded, Hardware & Software CV",
    description:
      "Mohamed Simal M builds where code meets the physical world: embedded Linux, ESP32 and Raspberry Pi devices, robotics and full web apps. State-level Young Innovators Programme winner.",
    headline: ["Builds where code", "meets the physical world."],
    summary:
      "CS & Business Systems student at Model Engineering College, Kerala. Twenty-eight projects across embedded systems, electronics and software, and a state-level win at the Young Innovators Programme.",
    features: [
      "State-level winner at Kerala Startup Mission's Young Innovators Programme, with MOT",
      "Custom embedded Linux image brought up from scratch with the Yocto Project",
      "ESP32 and Raspberry Pi devices wired to cloud services and real sensors",
      "Solo-built EdTech platform running Python in the browser through WebAssembly",
      "Self-hosted local-LLM tools that keep data off the cloud"
    ],
    featured: ["P-01", "P-02", "P-06", "P-09", "P-04", "P-03"],
    specs: [
      ["Platforms", "i.MX7D · ESP32 · Arduino · Raspberry Pi · Linux · browser", "Hardware to web"],
      ["Languages", "Python · JavaScript · Embedded C++", "Plus HTML/CSS and SQL"]
    ],
    bestFor: "Generalist, R&D and maker roles"
  },
  embedded: {
    path: "embedded/",
    part: "MSM-E",
    label: "Embedded",
    variant: "Embedded systems variant",
    title: "Mohamed Simal M — Embedded Systems CV",
    description:
      "Embedded systems CV of Mohamed Simal M: Yocto Linux bring-up on i.MX7D, ESP32 and Raspberry Pi builds, RFID, load cells, SPI ADCs and device-to-cloud pipelines.",
    headline: ["Embedded systems,", "from bootloader to sensor."],
    summary:
      "Brought up a custom Yocto Linux image on a locked i.MX7D Pico board. Builds ESP32 and Raspberry Pi devices that talk to the cloud, and reads the physical world through RFID, load cells and SPI ADCs.",
    features: [
      "Board bring-up: custom Yocto image on an i.MX7D Pico, from bootloader to running OS",
      "Microcontrollers: ESP32, ESP32-C3, ESP8266 and Arduino; Raspberry Pi as an SBC",
      "Peripherals: RFID, load cells, MCP3008 ADC, 128×64 OLED, 8×8 LED matrix",
      "Battery-friendly device-to-cloud polling between an ESP32 and a Cloudflare Worker",
      "Linux input stack: virtual uinput devices that work on Wayland, lock screen and TTYs"
    ],
    featured: ["P-06", "P-09", "P-03", "P-21", "P-11", "P-02"],
    specs: [
      ["Targets", "i.MX7D · ESP32 · ESP32-C3 · ESP8266 · Arduino · Raspberry Pi", "MPU, MCU and SBC"],
      ["Interfaces", "RFID · load cell · MCP3008 ADC · OLED · LED matrix · Wi-Fi", "Plus Linux uinput"]
    ],
    bestFor: "Embedded, firmware, IoT and embedded Linux roles"
  },
  software: {
    path: "software/",
    part: "MSM-S",
    label: "Software",
    variant: "Software engineering variant",
    title: "Mohamed Simal M — Software Engineering CV",
    description:
      "Software CV of Mohamed Simal M: a vanilla-JS learn-to-code platform with in-browser Python, an offline-first local-LLM expense tracker, a Python software KVM and serverless tools.",
    headline: ["Software, built from", "first principles and shipped."],
    summary:
      "Wrote a learn-to-code platform with a simulated bash and Git terminal and real Python in the browser, an offline-first expense tracker backed by a local LLM, and a software KVM over authenticated TCP. Most of it with no frameworks.",
    features: [
      "24-lesson platform in vanilla JS: simulated bash + Git with its own virtual file system",
      "WebAssembly: real Python execution in the browser through Pyodide",
      "Local AI: Ollama/Qwen3 extraction into PostgreSQL, and a React + Tauri desktop app",
      "Networking: HMAC-authenticated TCP input forwarding using the Python standard library",
      "Edge and serverless: Cloudflare Workers and Tunnels, Supabase auth and validation"
    ],
    featured: ["P-01", "P-04", "P-11", "P-05", "P-07", "P-09"],
    specs: [
      ["Languages", "Python · JavaScript · SQL", "Plus HTML/CSS"],
      ["Runtimes", "Browser · WebAssembly · Node.js · Flask · Flutter · Tauri", "Edge: Cloudflare Workers"]
    ],
    bestFor: "Software, full-stack, tooling and applied-AI roles"
  },
  hardware: {
    path: "hardware/",
    part: "MSM-H",
    label: "Hardware",
    variant: "Hardware & robotics variant",
    title: "Mohamed Simal M — Hardware & Robotics CV",
    description:
      "Hardware and robotics CV of Mohamed Simal M: a state-level winning medicine robot, an RFID + load-cell ration system, a solar-panel cleaner, a pen plotter and 3D-printed prototypes.",
    headline: ["Hardware that senses,", "measures and moves."],
    summary:
      "A healthcare robot that won at state level, an RFID and load-cell ration dispenser, a solar-panel cleaning mechanism and a pen plotter. Designed, wired, printed and tested by hand.",
    features: [
      "Robotics: MOT medicine robot with reminders and automated restocking (YIP state winner)",
      "Sensing: RFID identification and load-cell measurement in EasyRation (state level ×2)",
      "Motion: motorised solar-panel cleaner and a stepper-driven pen plotter",
      "Fabrication: CAD models and PLA prints on an Anycubic Kobra 2 Neo",
      "Circuits: an interactive Zener diode characteristics lab, wired and simulated in the browser"
    ],
    featured: ["P-02", "P-03", "P-18", "P-09", "P-28", "P-26"],
    specs: [
      ["Mechanisms", "Medicine robot · panel-cleaning mechanism · pen plotter", "Motors and steppers"],
      ["Fabrication", "CAD · PLA on an Anycubic Kobra 2 Neo · hand wiring", "Prototype to working model"]
    ],
    bestFor: "Hardware, electronics, robotics and product-prototyping roles"
  }
};

export const lensOrder = ["general", "embedded", "software", "hardware"];

/* ── skills: the chip's pins ─────────────────────────────────── */
// type: FW firmware/embedded · HW hardware · SW software · AI
export const skills = {
  esp32: { name: "ESP32", type: "FW", desc: "ESP32, ESP32-C3 and ESP8266 boards" },
  arduino: { name: "Arduino", type: "FW", desc: "Arduino-based controllers" },
  rpi: { name: "Raspberry Pi", type: "FW", desc: "Raspberry Pi with GPIO and SPI peripherals" },
  emblinux: { name: "Embedded Linux", type: "FW", desc: "Yocto images and board bring-up" },
  cpp: { name: "Embedded C++", type: "FW", desc: "Firmware for microcontrollers" },
  linuxsys: { name: "Linux systems", type: "FW", desc: "uinput, input devices, TTYs, Wayland" },
  sensors: { name: "Sensors", type: "HW", desc: "RFID, load cells, ADCs, displays" },
  iot: { name: "IoT", type: "FW", desc: "Connected devices and remote control" },
  robotics: { name: "Robotics", type: "HW", desc: "Mechanisms, actuators and automation" },
  motion: { name: "Motion control", type: "HW", desc: "Motors, steppers and mechanisms" },
  circuits: { name: "Circuits", type: "HW", desc: "Circuit design and electronics" },
  fab: { name: "3D print / CAD", type: "HW", desc: "CAD models and PLA fabrication" },
  python: { name: "Python", type: "SW", desc: "Tools, servers, automation and vision" },
  js: { name: "JavaScript", type: "SW", desc: "Vanilla JS apps, Canvas and WebAudio" },
  three: { name: "Three.js", type: "SW", desc: "Real-time 3D graphics with WebGL" },
  wasm: { name: "WebAssembly", type: "SW", desc: "Python in the browser through Pyodide" },
  flask: { name: "Flask", type: "SW", desc: "Python web backends" },
  node: { name: "Node.js", type: "SW", desc: "Express servers and tooling" },
  sql: { name: "SQL", type: "SW", desc: "SQLite and PostgreSQL" },
  cloud: { name: "Cloudflare", type: "SW", desc: "Workers, Pages and Tunnels" },
  flutter: { name: "Flutter", type: "SW", desc: "Cross-platform mobile apps" },
  react: { name: "React / Tauri", type: "SW", desc: "Desktop apps" },
  net: { name: "Networking", type: "SW", desc: "TCP, RTSP streams, HMAC auth" },
  git: { name: "Git", type: "SW", desc: "Version control and workflow automation" },
  llm: { name: "Local LLMs", type: "AI", desc: "Ollama and Qwen3 running on-device" },
  cv: { name: "Vision / OCR", type: "AI", desc: "OpenCV, face recognition, OCR" }
};

/* ── projects ────────────────────────────────────────────────── */
// score: relevance per lens, 0–3 (e = embedded, s = software, h = hardware)
// flow: an optional functional block diagram, drawn left to right
export const projects = [
  {
    id: "P-01",
    title: "CodeRoof",
    sub: "Interactive learn-to-code platform",
    status: "Live · solo build",
    domain: ["software"],
    score: { e: 0, s: 3, h: 0 },
    skills: ["js", "wasm", "python"],
    stack: ["Vanilla JS", "WebAssembly / Pyodide", "EdTech", "Auto-grading"],
    desc: "A learn-to-code platform built solo in vanilla HTML, CSS and JS, with no frameworks and no backend. 24 lessons across Programming Basics and Vibe Coding & Prompt Engineering, each ending in exercises that auto-grade in the browser: a hand-built simulated bash and Git terminal with its own virtual file system, and real Python execution through Pyodide.",
    flow: ["Lesson", "Exercise", "Bash/Git sim · Pyodide", "Auto-grader"],
    link: { href: "https://just-sil.github.io/code_roof/", label: "Try CodeRoof" }
  },
  {
    id: "P-02",
    title: "MOT — Medicine On Time",
    sub: "Healthcare robot for elderly care",
    status: "YIP state-level winner",
    domain: ["hardware", "embedded"],
    score: { e: 2, s: 1, h: 3 },
    skills: ["robotics", "iot", "motion", "sensors"],
    stack: ["Robotics", "IoT", "Healthcare", "Automation"],
    desc: "A healthcare robot that makes sure elderly people take their medicine on time, with reminders and automated restocking so medicine is always available. State-level winner at Kerala Startup Mission's Young Innovators Programme.",
    flow: ["Schedule", "Reminder", "Dispense", "Auto-restock"]
  },
  {
    id: "P-03",
    title: "EasyRation",
    sub: "Digital ration management for the PDS",
    status: "State level ×2",
    domain: ["hardware", "embedded"],
    score: { e: 3, s: 1, h: 3 },
    skills: ["arduino", "sensors", "circuits"],
    stack: ["Arduino", "RFID", "Load sensors", "Mobile app"],
    desc: "A ration-management system for India's Public Distribution System. RFID identifies the beneficiary, load sensors measure what is dispensed, and a mobile app ties it together for transparent tracking. Presented at state level in INSPIRE-MANAK and the Kerala School Science Fair.",
    flow: ["RFID card", "Arduino", "Load cell", "Mobile app"]
  },
  {
    id: "P-04",
    title: "Chillara",
    sub: "Offline-first AI expense tracker",
    status: "Released · Android APK",
    domain: ["software", "ai"],
    score: { e: 0, s: 3, h: 0 },
    skills: ["flutter", "sql", "llm", "flask", "python"],
    stack: ["Flutter", "SQLite", "Ollama · Qwen3:8b", "Flask", "PostgreSQL"],
    desc: "Log a spend in plain words like “24 tea” on your phone, even offline. When it syncs over USB or Wi-Fi, a self-hosted LLM on the laptop extracts amount, category and date into PostgreSQL. Daily limits and weekly summaries, with nothing sent to the cloud.",
    flow: ["Phone · SQLite", "USB / Wi-Fi sync", "Flask + Qwen3", "PostgreSQL"],
    link: { href: "https://github.com/just-sil/expense_tracker", label: "Repository" }
  },
  {
    id: "P-05",
    title: "EG Sim",
    sub: "Projection-of-solids playground",
    status: "New",
    domain: ["software"],
    score: { e: 0, s: 3, h: 0 },
    skills: ["js", "three"],
    stack: ["JavaScript", "Three.js", "Canvas", "EdTech"],
    desc: "A drafting playground for KTU Engineering Graphics (Module 2). Draw projections on a snapping drafting sheet with exact input, follow step-by-step ghost constructions, get progressive hints and auto-checked answers, and inspect each stage of the solid in 3D.",
    link: { href: "https://github.com/just-sil/eg-sim", label: "Repository" }
  },
  {
    id: "P-06",
    title: "Yocto Linux on i.MX7D Pico",
    sub: "Board bring-up from scratch",
    status: "Board bring-up",
    domain: ["embedded", "hardware"],
    score: { e: 3, s: 1, h: 2 },
    skills: ["emblinux", "linuxsys"],
    stack: ["Embedded Linux", "Yocto", "i.MX7D", "Board bring-up"],
    desc: "Cracked a locked i.MX7D Pico board and built a custom embedded Linux image from scratch with the Yocto Project: a full board bring-up, from bootloader to running OS.",
    flow: ["Locked board", "Bootloader", "Yocto image", "Running Linux"]
  },
  {
    id: "P-07",
    title: "Woolly Run 2",
    sub: "Sheep platformer for the web",
    status: "Playable · in development",
    domain: ["software"],
    score: { e: 0, s: 2, h: 0 },
    skills: ["js", "node"],
    stack: ["JavaScript", "Canvas", "WebAudio", "Supabase", "Node.js"],
    desc: "A canvas platformer: 20 levels across 5 themed worlds, an endless Woolly Rush mode, a coin economy with a shop, daily rewards and leaderboards. All graphics and sound are generated in code, with Supabase handling login and validating every coin server-side.",
    link: { href: "https://github.com/just-sil/cospo", label: "Repository" }
  },
  {
    id: "P-08",
    title: "GitGlow",
    sub: "GitHub receipt generator",
    status: "Live · Cloudflare",
    domain: ["software"],
    score: { e: 0, s: 2, h: 0 },
    skills: ["js", "cloud"],
    stack: ["JavaScript", "GitHub", "Cloudflare Workers"],
    desc: "A web app that turns GitHub profile activity into a customisable, receipt-style visual, giving developer activity a playful, shareable format.",
    link: { href: "https://gitglow.pages.dev/", label: "Open GitGlow" }
  },
  {
    id: "P-09",
    title: "Telegram → ESP32 OLED",
    sub: "Messages, photos and video on a 128×64 display",
    status: "Hardware + cloud",
    domain: ["embedded", "software", "hardware"],
    score: { e: 3, s: 2, h: 2 },
    skills: ["esp32", "cloud", "sensors", "iot"],
    stack: ["ESP32", "Cloudflare Workers", "ffmpeg", "Telegram bot"],
    desc: "Send a message, photo or short video to a Telegram bot and it appears on a tiny 128×64 OLED. A Cloudflare Worker stores the latest message, an ffmpeg service converts media into dithered 1-bit frames, and the battery-friendly ESP32 checks in every few minutes.",
    flow: ["Telegram bot", "CF Worker", "ffmpeg → 1-bit", "ESP32 · OLED"],
    link: { href: "https://github.com/just-sil/pathiribot", label: "Repository" }
  },
  {
    id: "P-10",
    title: "Smart Room Automation",
    sub: "Lighting, appliances and monitoring",
    status: "YIP state level",
    domain: ["embedded", "hardware"],
    score: { e: 2, s: 1, h: 2 },
    skills: ["esp32", "iot", "sensors"],
    stack: ["ESP32 / ESP8266", "IoT", "Automation"],
    desc: "A smart-room system integrating IoT devices for automated lighting, appliance control and environmental monitoring, built on ESP32 and ESP8266 with remote control. Presented at state level in the Young Innovators Programme."
  },
  {
    id: "P-11",
    title: "anykey",
    sub: "One keyboard, two computers",
    status: "Daily driver",
    domain: ["software", "embedded"],
    score: { e: 2, s: 3, h: 0 },
    skills: ["python", "linuxsys", "net"],
    stack: ["Python", "Win32 hooks", "Linux uinput", "TCP"],
    desc: "A software KVM that shares one keyboard and mouse between a Windows PC and a Fedora laptop with a hotkey. Low-level Windows hooks forward input over HMAC-authenticated TCP to virtual uinput devices, so it works on Wayland, the lock screen and TTYs. Standard library only.",
    flow: ["Win32 hooks", "HMAC · TCP", "uinput device", "Wayland / TTY"]
  },
  {
    id: "P-12",
    title: "Circuits Lab",
    sub: "Zener diode characteristics simulator",
    status: "Live",
    domain: ["software", "hardware"],
    score: { e: 0, s: 2, h: 2 },
    skills: ["js", "circuits"],
    stack: ["JavaScript", "Simulation", "Electronics", "EdTech"],
    desc: "A virtual physics lab for the Zener diode experiment. Wire the circuit yourself with live feedback on each connection, then run the simulation, move the rheostat, record readings and plot the characteristic curve, all in the browser.",
    link: { href: "https://just-sil.github.io/sim-lab/", label: "Try it" }
  },
  {
    id: "P-13",
    title: "Stick Verse",
    sub: "Private WhatsApp sticker sharing",
    status: "Self-hosted",
    domain: ["software"],
    score: { e: 0, s: 2, h: 0 },
    skills: ["node", "sql", "cloud"],
    stack: ["Node.js", "Express", "SQLite", "Cloudflare Tunnel"],
    desc: "A site for sharing WhatsApp stickers in private groups: admin-approved membership, packs auto-converted to 512×512 WebP, likes and super likes, and a top-contributors board. Exposed safely through a Cloudflare Tunnel that sends the public link to Telegram.",
    link: { href: "https://github.com/just-sil/stickverse", label: "Repository" }
  },
  {
    id: "P-14",
    title: "AI Smart Farming",
    sub: "Precision agriculture",
    status: "Prototype",
    domain: ["hardware", "embedded", "ai"],
    score: { e: 2, s: 1, h: 2 },
    skills: ["iot", "sensors"],
    stack: ["AI", "IoT", "Agriculture"],
    desc: "An AI-assisted precision-agriculture system: environmental monitoring, automation and data-driven crop management to raise productivity and cut manual work."
  },
  {
    id: "P-15",
    title: "Contactless Attendance",
    sub: "Face-recognition attendance device",
    status: "Prototype",
    domain: ["software", "ai"],
    score: { e: 1, s: 2, h: 1 },
    skills: ["python", "cv"],
    stack: ["Python", "OpenCV", "Face recognition"],
    desc: "A contactless attendance device that uses OpenCV face recognition to register attendance with a timestamp. No touch or card needed."
  },
  {
    id: "P-16",
    title: "KEAM Rank Analyzer",
    sub: "OCR score calculation",
    status: "Tool",
    domain: ["software", "ai"],
    score: { e: 0, s: 1, h: 0 },
    skills: ["python", "flask", "cv"],
    stack: ["Python", "Flask", "OCR"],
    desc: "A Python and Flask application that reads KEAM response sheets with OCR and automates score calculation."
  },
  {
    id: "P-17",
    title: "Hello Kitty",
    sub: "Local AI desktop companion",
    status: "Prototype",
    domain: ["software", "ai"],
    score: { e: 0, s: 2, h: 0 },
    skills: ["react", "llm"],
    stack: ["React", "Tauri", "Ollama", "Qwen3:8b"],
    desc: "A desktop companion overlay built with React and Tauri, connected to a locally running Ollama model (Qwen3:8b): a lightweight desktop interface for a local AI assistant.",
    link: { href: "https://github.com/just-sil/hello_kitty", label: "Repository" }
  },
  {
    id: "P-18",
    title: "Solar Panel Cleaner",
    sub: "Autonomous cleaning mechanism",
    status: "Prototype",
    domain: ["hardware", "embedded"],
    score: { e: 2, s: 0, h: 3 },
    skills: ["robotics", "motion", "circuits"],
    stack: ["Robotics", "Embedded control", "Solar"],
    desc: "An autonomous solar-panel cleaning mechanism that keeps panels efficient and cuts manual maintenance, using motorised cleaning and embedded control.",
    flow: ["Trigger", "Controller", "Motor drive", "Clean pass"]
  },
  {
    id: "P-19",
    title: "RTSP CCTV Monitoring",
    sub: "Multi-camera IP surveillance",
    status: "Tool",
    domain: ["software"],
    score: { e: 1, s: 1, h: 0 },
    skills: ["python", "net"],
    stack: ["Python", "VLC", "RTSP"],
    desc: "A multi-camera IP surveillance viewer built with Python and VLC, with RTSP streams configured for smooth simultaneous viewing."
  },
  {
    id: "P-20",
    title: "RankRack",
    sub: "Student ranking platform",
    status: "Tool",
    domain: ["software"],
    score: { e: 0, s: 1, h: 0 },
    skills: ["python", "sql"],
    stack: ["Web", "Python", "Database"],
    desc: "A ranking platform that organises marks and generates ranked results, making student performance easy to track and compare."
  },
  {
    id: "P-21",
    title: "Potentiometer Radio",
    sub: "A retro dial on a Raspberry Pi",
    status: "Raspberry Pi build",
    domain: ["embedded", "hardware"],
    score: { e: 3, s: 1, h: 2 },
    skills: ["rpi", "python", "sensors"],
    stack: ["Raspberry Pi", "Python", "MCP3008", "Audius API"],
    desc: "Turning a potentiometer, read through an MCP3008 ADC, tunes between Music, AI and Standby bands like a real dial. The music band plays local tracks or streams from the Audius API through VLC; the AI band is next.",
    flow: ["Potentiometer", "MCP3008 ADC", "Raspberry Pi", "Band → VLC"],
    link: { href: "https://github.com/just-sil/the-faah-radio", label: "Repository" }
  },
  {
    id: "P-22",
    title: "Kaida",
    sub: "Pocket voice AI assistant",
    status: "Prototype",
    domain: ["hardware", "embedded", "ai"],
    score: { e: 2, s: 1, h: 2 },
    skills: ["iot"],
    stack: ["AI", "Voice", "IoT", "Portable"],
    desc: "A pocket-sized AI chatbot with voice: talk to it naturally and have it control the smart room hands-free, from anywhere."
  },
  {
    id: "P-23",
    title: "Kerala Drive",
    sub: "3D driving simulator",
    status: "Work in progress",
    domain: ["software"],
    score: { e: 0, s: 2, h: 0 },
    skills: ["three", "js"],
    stack: ["Three.js", "WebGL", "JavaScript"],
    desc: "A browser driving simulator inspired by Kerala roads, exploring a first-person WagonR cockpit, local road layouts and junctions, and traffic behaviour in real-time 3D.",
    link: { href: "https://github.com/just-sil/kerala-drive", label: "Repository" }
  },
  {
    id: "P-24",
    title: "PrintDaddy",
    sub: "On-demand 3D printing service",
    status: "In progress",
    domain: ["software", "hardware"],
    score: { e: 0, s: 1, h: 1 },
    skills: ["fab"],
    stack: ["Web", "Full-stack", "3D printing"],
    desc: "A web platform for an on-demand 3D-printing service where visitors browse, submit print jobs online and get them fabricated."
  },
  {
    id: "P-25",
    title: "Auto-Git",
    sub: "Git workflow automation",
    status: "In development",
    domain: ["software"],
    score: { e: 0, s: 1, h: 0 },
    skills: ["git", "python"],
    stack: ["Git", "Automation", "File watcher"],
    desc: "A file-watcher that automates a Git-based file handoff, using a commit-message__filename.ext convention to keep the intended commit message separate from the filename.",
    link: { href: "https://github.com/just-sil/auto-git", label: "Repository" }
  },
  {
    id: "P-26",
    title: "3D Printing & Prototyping",
    sub: "Functional printed parts",
    status: "Ongoing",
    domain: ["hardware"],
    score: { e: 0, s: 0, h: 3 },
    skills: ["fab"],
    stack: ["3D printing", "CAD", "PLA"],
    desc: "Designs and fabricates functional prototypes on an Anycubic Kobra 2 Neo: CAD models, PLA printing and print optimisation."
  },
  {
    id: "P-27",
    title: "ESP32-C3 LED Matrix",
    sub: "Snake on an 8×8 display",
    status: "Hardware experiment",
    domain: ["embedded", "hardware"],
    score: { e: 3, s: 0, h: 2 },
    skills: ["esp32", "cpp"],
    stack: ["ESP32-C3", "LED matrix", "WLED", "Embedded C++"],
    desc: "An 8×8 LED matrix driven by an ESP32-C3, with WLED set up and a Snake-style game explored for the compact display."
  },
  {
    id: "P-28",
    title: "DIY Pen Plotter",
    sub: "Drawings into pen movement",
    status: "Early exploration",
    domain: ["hardware"],
    score: { e: 2, s: 0, h: 3 },
    skills: ["motion", "circuits"],
    stack: ["Electronics", "Stepper motors", "Motion control"],
    desc: "An exploratory pen-plotter build that turns digital drawings into physical pen movement, focused on simple motion control and reusing available components."
  }
];

/* ── recognition ─────────────────────────────────────────────── */
export const recognition = [
  {
    level: "State · winner",
    title: "Young Innovators Programme (YIP)",
    org: "Kerala Startup Mission",
    note: "Reached state level twice: with Smart Room automation, then won at state level with MOT (Medicine On Time).",
    refs: ["P-02", "P-10"]
  },
  {
    level: "State",
    title: "INSPIRE Awards — MANAK",
    org: "Government of India",
    note: "Selected to state level presenting EasyRation, an engineering solution for the Public Distribution System.",
    refs: ["P-03"]
  },
  {
    level: "State · 2024–25",
    title: "Kerala School Science Fair",
    org: "Kerala",
    note: "Reached state level presenting EasyRation as an engineering and technology innovation.",
    refs: ["P-03"]
  },
  {
    level: "Winner",
    title: "Code-a-Pookalam",
    org: "TinkerHub",
    note: "Won the school-students category by designing a traditional Onam pookalam entirely in code.",
    refs: []
  }
];

export const education = [
  { when: "Current", title: "B.Tech, Computer Science & Business Systems", where: "Model Engineering College, Thrikkakara", grade: "In progress" },
  { when: "Completed", title: "Higher Secondary, Science (Class 12)", where: "Kerala", grade: "95%" }
];
