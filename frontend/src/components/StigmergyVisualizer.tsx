import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const StigmergyVisualizer: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      stepNumber: '01',
      title: 'Localized Environmental Sensing',
      agent: 'Grid monitor agent',
      location: 'Assigned IEEE-14 bus',
      condition: 'Local voltage or sensed demand / surplus trail',
      description:
        'Each backend agent reads voltage at its assigned bus. The current agent does not sense line thermal loading.',
      signalEmitted: 'DEMAND_SIGNAL',
      signalColor: 'text-amber-500',
      badgeColor: 'border-amber-300 bg-amber-50 text-amber-800',
      action: 'The agent classifies its local voltage condition.',
    },
    {
      stepNumber: '02',
      title: 'Shared Trail Deposit',
      agent: 'Agent assigned to the bus',
      location: 'Shared trail memory keyed by bus and signal type',
      condition: 'Tick-end deposit from local voltage state',
      description:
        'The backend stores deposits in shared trail memory. Agents do not message each other directly.',
      signalEmitted: 'DEMAND_SIGNAL or ENERGY_SURPLUS',
      signalColor: 'text-rose-500',
      badgeColor: 'border-rose-300 bg-rose-50 text-rose-800',
      action: 'Deposits are sensed on a later coordination tick.',
    },
    {
      stepNumber: '03',
      title: 'Neighborhood Sensing & Trail Decay',
      agent: 'Shared trail memory',
      location: 'Depositing bus and directly connected buses',
      condition: 'Neighbor sensing with attenuation and temporal decay',
      description:
        'Signals remain keyed to their deposit bus. A neighbor senses them at configured attenuation; the API does not return a spatial trail field.',
      signalEmitted: 'Demand / surplus trail values',
      signalColor: 'text-orange-500',
      badgeColor: 'border-orange-300 bg-orange-50 text-orange-800',
      action: 'Sensed values are included in agent metadata and tick diagnostics.',
    },
    {
      stepNumber: '04',
      title: 'Trail-informed Agent Decision',
      agent: 'One agent per bus',
      location: 'Current bus and direct neighbors',
      condition: 'Decision uses local voltage and sensed trail',
      description:
        'Agents read existing trail values before current-tick deposits, then decide from local voltage and sensed demand or surplus.',
      signalEmitted: 'Trail-informed decision',
      signalColor: 'text-blue-600',
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
      action: 'No direct agent-to-agent messaging is used.',
    },
    {
      stepNumber: '05',
      title: 'Generator Setpoint Proposal',
      agent: 'Agent on a controllable generator bus',
      location: 'In-service net.gen row on its assigned bus',
      condition: 'Eligible decision and in-service generator at this bus',
      description:
        'Eligible decisions map to a generator at that same bus. This path does not reroute lines or dispatch a battery.',
      signalEmitted: 'Discrete +/-1 MW proposal',
      signalColor: 'text-emerald-600',
      badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      action: 'Buses without an in-service generator remain monitors for this action path.',
    },
    {
      stepNumber: '06',
      title: 'SafetyGate Evaluation',
      agent: 'SafetyGate',
      location: 'Candidate IEEE-14 network copy',
      condition: 'Candidate power flow and non-worsening constraint checks',
      description:
        'The SafetyGate commits only accepted candidates. Existing voltage or loading violations can remain.',
      signalEmitted: 'Accepted or rejected proposal',
      signalColor: 'text-blue-500',
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
      action: 'Inspect tick diagnostics for the actual decision and gate result.',
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
              Shared trail coordination
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Conceptual sequence only. Live decisions and gate results are shown in Safety and Decisions.
            </p>
          </div>
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
        <div className="max-w-3xl space-y-4 border-y border-slate-200 py-5">
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
                <span className="text-slate-400">Acting Entity:</span>
                <span className="text-slate-900 font-semibold">{steps[activeStep].agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bus / scope:</span>
                <span className="text-slate-700">{steps[activeStep].location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trigger Condition:</span>
                <span className="text-slate-700">{steps[activeStep].condition}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="border-l-2 border-blue-700 bg-blue-50 p-3 text-xs text-slate-700">
              <strong className="text-blue-900 font-semibold">Coordination detail: </strong>
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
              Agent deposits currently include demand and energy-surplus trail signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                type: 'DEMAND_SIGNAL',
                dot: 'bg-red-500',
                title: 'Demand',
                badge: 'Sinks',
                desc: 'The backend deposits demand trail for low-voltage conditions.',
                effect: 'Supports the agent decision',
              },
              {
                type: 'ENERGY_SURPLUS',
                dot: 'bg-cyan-500',
                title: 'Surplus',
                badge: 'Sources',
                desc: 'The backend deposits surplus trail based on local grid state.',
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
