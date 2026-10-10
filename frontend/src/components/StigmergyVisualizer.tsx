import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const StigmergyVisualizer: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      stepNumber: '01',
      title: 'Sense local voltage',
      agent: 'Grid monitor agent',
      location: 'Its assigned IEEE-14 bus',
      condition: 'Each coordination tick',
      description:
        'Each agent reads voltage at its own bus. It then labels the bus as low, high, or normal. This agent does not read line loading.',
      action: 'Local voltage is the first fact the agent uses.',
    },
    {
      stepNumber: '02',
      title: 'Leave a trail signal',
      agent: 'Agent assigned to the bus',
      location: 'Shared trail memory',
      condition: 'After the agent classifies its voltage',
      description:
        'The agent writes a demand or surplus signal into shared memory. Other agents do not receive a direct message. They will read this trail later.',
      action: 'A later tick is when neighbors can sense this deposit.',
    },
    {
      stepNumber: '03',
      title: 'Read nearby trails as they fade',
      agent: 'Shared trail memory',
      location: 'The depositing bus and its neighbors',
      condition: 'Neighbor sensing with decay over time',
      description:
        'Signals stay attached to the bus that wrote them. A neighbor sees a weaker copy. Signals fade over time so old conditions do not linger forever.',
      action: 'Sensed trail values are stored with the agent and in tick diagnostics.',
    },
    {
      stepNumber: '04',
      title: 'Decide from voltage and trails',
      agent: 'One agent per bus',
      location: 'Current bus and direct neighbors',
      condition: 'Local voltage plus sensed demand or surplus',
      description:
        'Stigmergy means agents coordinate by leaving signals in a shared memory that gradually fades. On this step, the agent first reads existing trail values (not the deposit it is about to write). It then combines those values with its local voltage and chooses an action, such as raise support, reduce generation, or keep monitoring.',
      action: 'This is only a local decision. It is not applied to the grid yet.',
    },
    {
      stepNumber: '05',
      title: 'Propose a generator change',
      agent: 'Agent on a bus that has a generator',
      location: 'The in-service generator on that same bus',
      condition: 'The decision asks for a setpoint change and a generator is available',
      description:
        'If the decision needs a generator change, the agent proposes a 1 MW increase or decrease on its own bus. It does not reroute lines or control a battery. Buses without a generator stay as monitors.',
      action: 'The proposal is sent to SafetyGate. It is not applied yet.',
    },
    {
      stepNumber: '06',
      title: 'SafetyGate checks the proposal',
      agent: 'SafetyGate',
      location: 'A copy of the IEEE-14 network',
      condition: 'A candidate power flow must not worsen safety limits',
      description:
        'SafetyGate means every proposed change is checked against grid safety limits before it is applied. Only accepted proposals are committed. Existing voltage or loading problems can remain if the change would not make them worse.',
      action: 'Open Safety and Decisions, or tick diagnostics, to see accept or reject results.',
    },
  ];

  return (
    <section id="stigmergy" className="scroll-mt-20 border-b border-slate-200 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">04 · Stigmergy</p>
            <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">
              How shared-trail coordination works
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This is the intended sequence. Live agent decisions and SafetyGate results appear after you run a coordination tick.
            </p>
          </div>
        </div>

        {/* Shared-trail signal sweep (visual metaphor for propagation only) */}
        <div aria-hidden="true" className="relative h-px w-full overflow-hidden rounded-full bg-slate-200">
          <span className="trail-sweep absolute top-0 h-px w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        </div>

        {/* The 6-Step Visual Process Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s, index) => {
            const isCurrent = activeStep === index;
            return (
              <button
                key={s.stepNumber}
                onClick={() => {
                  setActiveStep(index);
                }}
                className={`text-left p-3 border transition-colors relative ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                  <span className={isCurrent ? 'text-blue-700 font-bold' : ''}>STEP {s.stepNumber}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {s.title}
                </h4>
              </button>
            );
          })}
        </div>

          {/* Right Explanation Column */}
        <div key={activeStep} className="fade-in-up max-w-3xl space-y-4 border-y border-slate-200 py-5">
            <div className="space-y-1">
                <span className="text-xs font-mono text-blue-700 uppercase tracking-widest">
                Step {steps[activeStep].stepNumber}
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-950">
                {steps[activeStep].title}
              </h3>
            </div>

            <div className="border-y border-slate-200 py-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Who:</span>
                <span className="text-slate-900 font-semibold">{steps[activeStep].agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Where:</span>
                <span className="text-slate-700">{steps[activeStep].location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">When:</span>
                <span className="text-slate-700">{steps[activeStep].condition}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="border-l-2 border-blue-700 bg-blue-50 p-3 text-xs text-slate-700">
              <strong className="text-blue-900 font-semibold">What this means: </strong>
              {steps[activeStep].action}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={activeStep === 0}
                onClick={() => {
                  setActiveStep((prev) => Math.max(0, prev - 1));
                }}
                className="border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Previous Step
              </button>

              <button
                disabled={activeStep === steps.length - 1}
                onClick={() => {
                  setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
                }}
                className="flex items-center gap-1.5 border border-blue-700 px-4 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-30"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

        </div>

        {/* Trail types exposed by the backend */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-950">
              Trail signals
            </h3>
            <p className="text-sm text-slate-600">
              Agents currently leave two kinds of fading signals: demand and surplus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                type: 'DEMAND_SIGNAL',
                dot: 'bg-red-500',
                title: 'Demand',
                badge: 'Sinks',
                desc: 'Written when a bus looks short of voltage support (low voltage). Nearby agents can treat this as a request for help.',
                effect: 'Supports the agent decision',
              },
              {
                type: 'ENERGY_SURPLUS',
                dot: 'bg-cyan-500',
                title: 'Surplus',
                badge: 'Sources',
                desc: 'Written when local conditions look like extra generation. Nearby agents can ease output instead of adding more.',
                effect: 'Supports the agent decision',
              },
            ].map((sig) => (
              <div
                key={sig.type}
                className="border-y border-slate-200 py-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sig.dot}`} />
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {sig.title}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{sig.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
