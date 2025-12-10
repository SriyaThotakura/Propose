import React, { useState } from 'react';
import { Code, Map, GitBranch, Zap, Database, Eye } from 'lucide-react';

const ComputationalPipeline = () => {
  const [activeStage, setActiveStage] = useState(null);
  const [activeEngine, setActiveEngine] = useState('spatial');

  const stages = {
    spatial: [
      {
        id: 'input',
        title: '1. Input: Agent-Based Archive',
        tech: 'City_Type.geojson → L.geoJSON()',
        math: 'FeatureCollection<Polygon>',
        implementation: 'SVG rendering (preferCanvas: false) exposes DOM elements for CSS manipulation',
        color: 'from-cyan-500 to-blue-600'
      },
      {
        id: 'process',
        title: '2. Process: KDE Simulation',
        tech: 'CSS3 Keyframes + SVG Filters',
        math: 'f̂(x,y) = (1/nh²)Σᵢ K((x-xᵢ)/h, (y-yᵢ)/h)',
        implementation: '@keyframes kde-pulse on fill-opacity, filter: blur(1px) creates continuous density field',
        color: 'from-purple-500 to-pink-600'
      },
      {
        id: 'output',
        title: '3. Output: Iso-Surface (Gold Line)',
        tech: 'TRIVARIATE.geojson + Z-Index Layering',
        math: 'T = w₁V + w₂P + w₃R',
        implementation: 'map.createPane("trivariatePane") with zIndex: 450, D3 event binding for popup data',
        color: 'from-amber-500 to-yellow-600'
      }
    ],
    relational: [
      {
        id: 'concept',
        title: '1. Concept: Horizontal Flow',
        tech: 'Bipartite Graph / Sankey',
        math: 'Sources → Target',
        implementation: 'Left: Input Variables (V,P,R) → Right: Intervention Zone. Ribbon width ∝ contribution weight',
        color: 'from-green-500 to-emerald-600'
      },
      {
        id: 'binding',
        title: '2. Data Binding',
        tech: 'd3.datum() + GeoJSON Properties',
        math: '{source, target, value}[]',
        implementation: 'Extract CVI, Canopy, Asthma from TRIVARIATE.geojson, map to D3 data structure',
        color: 'from-indigo-500 to-purple-600'
      },
      {
        id: 'rendering',
        title: '3. Rendering: Bézier Ribbons',
        tech: 'd3.linkHorizontal() + d3.scaleLinear()',
        math: 'C(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃',
        implementation: 'Dynamic scales map raw values to pixel heights, creating organic flow visualization',
        color: 'from-rose-500 to-red-600'
      }
    ]
  };

  const dataFlow = [
    { from: 'Raw ABM Data', to: 'Leaflet Map', engine: 'spatial' },
    { from: 'Leaflet Map', to: 'KDE Visualization', engine: 'spatial' },
    { from: 'KDE Visualization', to: 'Iso-Surface', engine: 'spatial' },
    { from: 'Iso-Surface', to: 'D3 Data Binding', engine: 'relational' },
    { from: 'D3 Data Binding', to: 'Validation Layer', engine: 'relational' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-8 h-8 text-amber-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
            Computational Proof Pipeline
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          From spatial data to actionable policy boundary through dual-engine visualization
        </p>
      </div>

      {/* Engine Selector */}
      <div className="max-w-7xl mx-auto mb-8 flex gap-4">
        <button
          onClick={() => setActiveEngine('spatial')}
          className={`flex-1 p-6 rounded-xl border-2 transition-all ${
            activeEngine === 'spatial'
              ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/20'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <Map className={`w-8 h-8 mb-2 ${activeEngine === 'spatial' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <h3 className="text-xl font-bold mb-1">Spatial Engine</h3>
          <p className="text-sm text-slate-400">Leaflet.js + Turf.js</p>
          <p className="text-xs text-slate-500 mt-2">Renders the "where"—physical location of risk</p>
        </button>
        
        <button
          onClick={() => setActiveEngine('relational')}
          className={`flex-1 p-6 rounded-xl border-2 transition-all ${
            activeEngine === 'relational'
              ? 'border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-500/20'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <GitBranch className={`w-8 h-8 mb-2 ${activeEngine === 'relational' ? 'text-purple-400' : 'text-slate-400'}`} />
          <h3 className="text-xl font-bold mb-1">Relational Engine</h3>
          <p className="text-sm text-slate-400">D3.js Data-Driven Docs</p>
          <p className="text-xs text-slate-500 mt-2">Renders the "why"—weighted relationships between inputs</p>
        </button>
      </div>

      {/* Pipeline Stages */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="grid gap-6">
          {stages[activeEngine].map((stage, idx) => (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                activeStage === stage.id
                  ? 'border-amber-400 bg-slate-800 shadow-xl shadow-amber-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-2">{stage.title}</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-400">TECHNICAL</span>
                      </div>
                      <p className="text-sm font-mono text-slate-300">{stage.tech}</p>
                    </div>
                    
                    <div className="bg-slate-900/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-slate-400">MATHEMATICAL</span>
                      </div>
                      <p className="text-sm font-mono text-slate-300">{stage.math}</p>
                    </div>
                    
                    <div className="bg-slate-900/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-400">IMPLEMENTATION</span>
                      </div>
                      <p className="text-sm text-slate-400">{stage.implementation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Data Loop */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400" />
            Complete Data Loop
          </h2>
          
          <div className="space-y-4">
            {dataFlow.map((flow, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg border-2 ${
                  flow.engine === 'spatial' 
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' 
                    : 'border-purple-400 bg-purple-400/10 text-purple-300'
                } font-mono text-sm`}>
                  {flow.from}
                </div>
                
                <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-600 to-transparent relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                </div>
                
                <div className={`px-4 py-2 rounded-lg border-2 ${
                  flow.engine === 'spatial' 
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' 
                    : 'border-purple-400 bg-purple-400/10 text-purple-300'
                } font-mono text-sm`}>
                  {flow.to}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg">
            <p className="text-amber-300 font-semibold mb-2">Validation Loop Complete:</p>
            <p className="text-slate-300">
              D3.js breaks the Gold Line back into component parts (V, P, R), proving the boundary is <span className="text-amber-400 font-bold">data-driven, not arbitrary</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Stack Summary */}
      <div className="max-w-7xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-xl p-6">
          <Map className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-bold mb-2">Spatial Engine</h3>
          <p className="text-sm text-slate-400">Leaflet.js (Rendering) + Turf.js (Logic)</p>
        </div>
        
        <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6">
          <GitBranch className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="text-lg font-bold mb-2">Relational Engine</h3>
          <p className="text-sm text-slate-400">D3.js (Data-Driven Documents)</p>
        </div>
        
        <div className="bg-pink-500/10 border-2 border-pink-500/30 rounded-xl p-6">
          <Eye className="w-8 h-8 text-pink-400 mb-3" />
          <h3 className="text-lg font-bold mb-2">Styling Engine</h3>
          <p className="text-sm text-slate-400">CSS3 Animations + SVG Filters</p>
        </div>
      </div>
    </div>
  );
};

export default ComputationalPipeline;