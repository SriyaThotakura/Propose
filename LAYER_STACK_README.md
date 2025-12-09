# 📊 FERAL GOVERNANCE LAYER STACK DIAGRAM
## D3.js Interactive Visualization

---

## 🎨 WHAT IT SHOWS

An **interactive stacked layer diagram** that visualizes your 4-layer system architecture with:
- Layer-specific color coding
- Data flow arrows showing connections
- Complete aesthetic specifications
- Source/purpose information
- Interactive tooltips

---

## 📐 THE 4 LAYERS

### Layer 1: Base Map
**Color:** Dark Gray (#2a2a2a)  
**Source:** Leaflet.js / NYC GIS Data  
**Aesthetic:** Subway Surfers - Stylized, fractured infrastructure  
**Purpose:** Provides contextual urban geometry  

### Layer 2: Vulnerability Index
**Color:** Gray (#616161)  
**Source:** OpenFEMA / NCEI Climate Data  
**Aesthetic:** Tactical Overlay - Static hazard texture  
**Purpose:** Communicates systemic precarity  

### Layer 3: The Feral Agent
**Color:** Hot Pink (#ff1744)  
**Source:** ABM Output (KDE)  
**Aesthetic:** Plague Inc. Spread - Pulsating neon threat  
**Purpose:** Visualizes emergent socio-economic burden  
**Special:** Pulsing animation to show active threat

### Layer 4: Tactical UI
**Color:** Electric Lime (#76ff03)  
**Source:** HTML/CSS/JS (Game Logic)  
**Aesthetic:** Console Interface - Sharp, high-contrast  
**Purpose:** Interactive control panel and feedback  

---

## 🔄 DATA FLOW VISUALIZATION

**6 connections shown:**

1. **Base Map → Vulnerability** - "Geographic foundation"
2. **Vulnerability → Feral Agent** - "Vulnerability zones → Agent spawn"
3. **Feral Agent → Tactical UI** - "Feral Score → UI Dashboard"
4. **Tactical UI → Feral Agent** - "User interventions → ABM"
5. **Tactical UI → Vulnerability** - "UI adjusts visualization"
6. **Tactical UI → Base Map** - "Map rendering updates"

**Flow arrows:**
- Animated dashed lines
- Color-coded by source layer
- Curved bezier paths
- Interactive hover effects

---

## 💡 INTERACTIVE FEATURES

### Hover over Layers
- See complete aesthetic description
- View computational source details
- Read full purpose statement
- Highlighted glow effect

### Hover over Arrows
- See source and target layers
- Read connection description
- Arrow brightens and thickens

### Visual Feedback
- Layer cards shift right on hover
- Brightness increases
- Tooltip appears with full info
- Smooth transitions

---

## 🎨 DESIGN ELEMENTS

### Tactical Aesthetic Applied
- **Background:** Deep charcoal (#0a0a0a)
- **Typography:** JetBrains Mono (monospace)
- **Accents:** Electric Lime (#76ff03) and Cyan (#00e5ff)
- **Borders:** Color-coded by layer
- **Effects:** Scanlines, glows, shadows

### Color Hierarchy
- **Layer 1 (Base):** Darkest gray - foundational
- **Layer 2 (Vulnerability):** Medium gray - overlay
- **Layer 3 (Feral):** Hot pink - attention-grabbing threat
- **Layer 4 (UI):** Electric lime - interactive control

### Visual Language
- Large layer numbers (72px, semi-transparent)
- Rounded corners (8px border radius)
- Drop shadow glows
- CRT scanline effect
- Pulsing animation on Feral Agent layer

---

## 📊 LAYOUT SPECIFICATIONS

**Dimensions:**
- Layer height: 180px
- Layer spacing: 100px vertical gap
- Width: Responsive (max 1200px)
- Card padding: 24px

**Typography Sizes:**
- Layer title: 24px bold
- Subtitle labels: 12px uppercase
- Source/purpose text: 14px/11px
- Big numbers: 72px at 30% opacity

**Spacing:**
- Top margin: 40px
- Legend: 60px top margin
- Tooltip offset: 15px from cursor

---

## 🎯 USE CASES

### For Presentations
- Explain system architecture clearly
- Show data flow relationships
- Demonstrate layer independence
- Highlight aesthetic choices

### For Documentation
- Technical specification reference
- Onboarding new team members
- Grant proposals showing rigor
- Portfolio piece demonstrating skill

### For Development
- Design specification for implementation
- Color palette reference
- Aesthetic style guide
- Component hierarchy visualization

---

## 🔧 TECHNICAL DETAILS

### D3.js Elements Used
- **SVG Groups** for layer organization
- **Bezier curves** for flow arrows
- **Marker definitions** for arrow heads
- **Transitions** for smooth animations
- **Event handlers** for interactivity

### Animation Effects
```javascript
// Pulsing Feral Agent layer
setInterval(() => {
  layer3.transition()
    .duration(1000)
    .attr("opacity", 0.7)
    .transition()
    .duration(1000)
    .attr("opacity", 0.9);
}, 2000);

// Dashed line animation
.attr("stroke-dasharray", "8, 4")
.style("animation", "dash 20s linear infinite");
```

### Responsive Design
- Viewport-aware sizing
- Reloads on window resize
- Mobile-friendly tooltips
- Scalable SVG elements

---

## 📁 FILE STRUCTURE

```
feral-layer-stack-diagram.html
├── Inline CSS (tactical styling)
├── D3.js v7 (CDN)
└── JavaScript
    ├── Layer data array
    ├── Flow connections array
    ├── SVG setup
    ├── Arrow markers
    ├── Flow path rendering
    ├── Layer card rendering
    ├── Tooltip functions
    └── Animation loops
```

---

## 🎨 COLOR PALETTE REFERENCE

```css
/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-card-l1: #2a2a2a;
--bg-card-l2: #616161;
--bg-card-l3: #ff1744;
--bg-card-l4: #76ff03;

/* Accents */
--accent-lime: #76ff03;
--accent-cyan: #00e5ff;
--accent-pink: #ff1744;

/* Text */
--text-primary: #ffffff;
--text-secondary: #e0e0e0;
--text-muted: #9e9e9e;

/* Borders */
--border-l1: #9e9e9e;
--border-l2: #bdbdbd;
--border-l3: #ff8a80;
--border-l4: #ccff90;
```

---

## 💫 SPECIAL EFFECTS

### Scanline CRT Effect
```css
background: repeating-linear-gradient(
  0deg,
  rgba(0, 0, 0, 0.05),
  rgba(0, 0, 0, 0.05) 1px,
  transparent 1px,
  transparent 2px
);
```

### Glow Effect
```javascript
.style("filter", d => `drop-shadow(0 0 15px ${d.color})`)
```

### Flow Arrow Animation
```css
@keyframes dash {
  to {
    stroke-dashoffset: -1000;
  }
}
```

---

## 📖 LEGEND SPECIFICATIONS

**Bottom panel includes:**
- All 4 layers with descriptions
- Color-coded borders
- Source information
- Purpose statements
- Aesthetic style tags

**Grid layout:**
- Responsive columns (auto-fit)
- Minimum 300px per column
- 20px gap between items
- Dark background with cyan border

---

## 🎯 AESTHETIC TAGS

Each layer has a tag identifying its visual style:

1. **Subway Surfers** - Urban runner aesthetic
2. **Tactical Overlay** - Military/strategic style
3. **Plague Inc. Spread** - Epidemiological visualization
4. **Console Interface** - Command-line aesthetic

These tags link to your original design references!

---

## 🚀 FUTURE ENHANCEMENTS

### Could Add:
- **Click to expand** layer details
- **Toggle flow arrows** on/off
- **Zoom/pan** for mobile
- **Export as PNG** button
- **Dark/light mode** toggle
- **Animation speed** controls
- **Layer reordering** (drag and drop)

### Advanced Features:
- Real-time data integration
- Multiple view modes (stacked, circular, network)
- Time-series animation showing data flow
- Interactive legend filtering
- Screenshot/export functionality

---

## 📊 COMPARISON TO OTHER VISUALIZATIONS

### vs Chord Diagram
- **Stack:** Shows hierarchical layers clearly
- **Chord:** Shows circular relationships
- **Use stack for:** Sequential data flow
- **Use chord for:** Multi-directional dependencies

### vs Network Graph
- **Stack:** Cleaner, more organized
- **Network:** More connections visible
- **Use stack for:** Presentations
- **Use network for:** Analysis

---

## ✨ WHY THIS WORKS

1. **Clear hierarchy** - Layers stack naturally bottom-to-top
2. **Color coding** - Instant visual differentiation
3. **Interactive** - Hover reveals details without clutter
4. **Animated** - Feral Agent pulses = active threat
5. **Professional** - Tactical aesthetic matches project
6. **Informative** - All specs visible in one view

---

## 🎓 EDUCATIONAL VALUE

**Teaches:**
- D3.js SVG manipulation
- Data visualization principles
- Interactive design patterns
- Color theory application
- Information hierarchy
- Aesthetic consistency

**Shows:**
- Technical competence
- Design thinking
- Attention to detail
- System architecture understanding

---

## 📝 QUICK START

1. **Open HTML file** in modern browser
2. **Hover over layers** to see full details
3. **Hover over arrows** to see connections
4. **Scroll down** to read legend
5. **Notice pulsing** on Layer 3 (Feral Agent)

No installation, no dependencies, no setup!

---

## 🔗 INTEGRATION

**Can be embedded in:**
- Project website
- Presentation slides (iframe)
- Documentation pages
- Portfolio
- Grant applications
- Academic papers (as figure)

**Export options:**
- Screenshot for static use
- Embed iframe for interactivity
- Print to PDF for distribution

---

## 📐 DIMENSIONS SUMMARY

| Element | Size |
|:--------|:-----|
| Layer card | 1080px × 180px |
| Vertical gap | 100px |
| Total height | ~900px |
| Title font | 24px |
| Number overlay | 72px |
| Border radius | 8px |
| Glow spread | 15px |

---

## 🎨 MIKA PIKAZO INFLUENCE

While maintaining tactical aesthetic, the diagram uses:
- **High contrast** (Mika's signature)
- **Vibrant accents** (lime, cyan, pink)
- **Glowing effects** (neon-like borders)
- **Clean geometry** (sharp, modern)

This bridges your **tactical darkness** and **Mika Pikazo vibrancy**!

---

## 💬 PRESENTATION TALKING POINTS

When showing this diagram:

1. "Four computational layers working in sequence"
2. "Layer 3 (Feral Agent) pulses to show active threat modeling"
3. "Flow arrows show bidirectional data exchange"
4. "Each layer has distinct aesthetic from game design references"
5. "Hover to see complete technical specifications"

---

**LAYER STACK DIAGRAM README COMPLETE**  
**D3.js Interactive Visualization**  
**Version 1.0 — December 2025**
