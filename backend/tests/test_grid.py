import copy
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import pandas as pd

from app.agents.grid_agent import GridAgent
import app.main as main
from app.safety.safety_gate import SafetyGate
from app.trail.memory import TrailMemory
from app.trail.model import PheromoneType


def make_agent(bus_id, action="monitoring"):
    agent = GridAgent(f"agent-{bus_id:02d}", f"Agent {bus_id}", "Monitor", bus_id)
    agent.state.action = action
    return agent


def make_generator_environment():
    gen = pd.DataFrame(
        [
            {"bus": 1, "p_mw": 40.0, "min_p_mw": 0.0, "max_p_mw": 100.0, "in_service": True},
            {"bus": 2, "p_mw": 0.0, "min_p_mw": 0.0, "max_p_mw": 50.0, "in_service": True},
            {"bus": 7, "p_mw": 20.0, "min_p_mw": 0.0, "max_p_mw": 50.0, "in_service": False},
        ],
        index=[0, 1, 2],
    )
    return SimpleNamespace(
        network=SimpleNamespace(
            gen=gen,
            # External grid is deliberately not represented in net.gen.
            ext_grid=pd.DataFrame([{"bus": 0, "in_service": True}], index=[0]),
        )
    )


class GridCoordinationTests(unittest.TestCase):
    def test_trail_persists_and_is_sensed_across_ticks(self):
        trail = TrailMemory(decay_rate=0.0, diffusion_rate=0.5)
        trail.set_topology([(1, 2)])
        trail.deposit(1, PheromoneType.ENERGY_SURPLUS, 0.2, "agent-01")

        first_agent = make_agent(1)
        first_agent.sense_trail(trail)
        self.assertAlmostEqual(first_agent.state.metadata["trail_energy_surplus"], 0.2)

        # A later deposit is stored and sensed through the neighbor link.
        trail.deposit(2, PheromoneType.DEMAND_SIGNAL, 0.4, "agent-02")
        next_agent = make_agent(1)
        next_agent.sense_trail(trail)
        self.assertAlmostEqual(next_agent.state.metadata["trail_energy_surplus"], 0.2)
        self.assertAlmostEqual(next_agent.state.metadata["trail_demand_signal"], 0.2)

    def test_weak_trail_below_threshold_does_not_trigger_action(self):
        agent = make_agent(1)
        agent.trail_response_threshold = 0.005
        agent.state.sensed_signal = "NORMAL"
        agent.state.metadata.update(trail_energy_surplus=0.004, trail_demand_signal=0.0)
        agent.decide()
        self.assertEqual(agent.state.action, "monitoring")

    def test_trail_above_threshold_triggers_action(self):
        agent = make_agent(1)
        agent.trail_response_threshold = 0.005
        agent.state.sensed_signal = "NORMAL"
        agent.state.metadata.update(trail_energy_surplus=0.006, trail_demand_signal=0.0)
        agent.decide()
        self.assertEqual(agent.state.action, "respond_to_energy_surplus")

    def test_observed_runtime_trail_scale_is_actionable(self):
        agent = make_agent(1)
        agent.state.sensed_signal = "NORMAL"
        agent.state.metadata.update(trail_energy_surplus=0.00454, trail_demand_signal=0.0)
        agent.decide()
        self.assertEqual(agent.trail_response_threshold, GridAgent.TRAIL_RESPONSE_THRESHOLD)
        self.assertEqual(agent.state.action, "respond_to_energy_surplus")

    def test_zero_output_generator_lower_bound_skips_downward_noop(self):
        environment = make_generator_environment()
        agent = make_agent(2, "reduce_local_generation")
        with patch.object(main, "grid_environment", environment):
            proposal, reason = main.propose_generator_target(agent)
        self.assertIsNone(proposal)
        self.assertIn("no-op", reason)

    def test_bus_one_generator_allows_one_mw_downward_proposal(self):
        environment = make_generator_environment()
        agent = make_agent(1, "reduce_local_generation")
        with patch.object(main, "grid_environment", environment):
            proposal, reason = main.propose_generator_target(agent)
        self.assertIsNone(reason)
        self.assertEqual(proposal["generator_id"], 0)
        self.assertEqual(proposal["target_p_mw"], 39.0)

    def test_external_grid_bus_zero_is_never_net_gen_generator(self):
        environment = make_generator_environment()
        agent = make_agent(0, "increase_local_support")
        with patch.object(main, "grid_environment", environment):
            self.assertEqual(main.get_generator_for_bus(0), (None, None))
            proposal, reason = main.propose_generator_target(agent)
        self.assertIsNone(proposal)
        self.assertIn("No in-service net.gen", reason)

    def test_out_of_service_generator_is_not_eligible(self):
        environment = make_generator_environment()
        with patch.object(main, "grid_environment", environment):
            self.assertEqual(main.get_generator_for_bus(7), (None, None))

    def test_safety_gate_rejection_does_not_mutate_live_network(self):
        class FakeNetwork:
            def __init__(self):
                self.gen = pd.DataFrame(
                    [{"p_mw": 40.0, "min_p_mw": 0.0, "max_p_mw": 100.0}],
                    index=[0],
                )
                self.bus = pd.DataFrame(
                    [{"min_vm_pu": 0.94, "max_vm_pu": 1.06}], index=[0]
                )
                self.line = pd.DataFrame(columns=["max_loading_percent"])
                self.trafo = pd.DataFrame(columns=["max_loading_percent"])
                self.res_bus = pd.DataFrame([{"vm_pu": 1.0}], index=[0])
                self.res_line = pd.DataFrame(columns=["loading_percent"])
                self.res_trafo = pd.DataFrame(columns=["loading_percent"])
                self.converged = True

        live = FakeNetwork()
        original = copy.deepcopy(live)

        def fake_runpp(candidate):
            candidate.res_bus.at[0, "vm_pu"] = (
                1.07 if candidate.gen.at[0, "p_mw"] > 40.0 else 1.0
            )
            candidate.converged = True

        environment = SimpleNamespace(network=live)
        with patch("app.safety.safety_gate.pp.runpp", fake_runpp):
            result = SafetyGate().evaluate_generator_action(
                environment, 0, 41.0, "agent-01"
            )

        self.assertFalse(result["accepted"])
        self.assertIn("voltage violation worsened", result["reason"])
        self.assertIs(environment.network, live)
        pd.testing.assert_frame_equal(live.gen, original.gen)

    def test_tick_diagnostics_distinguish_skips_and_gate_rejections(self):
        class FakeGrid:
            def run_power_flow(self):
                return True

            def get_grid_state(self):
                return SimpleNamespace(
                    buses=[SimpleNamespace(id=0, voltage_pu=1.0)],
                    model_dump=lambda: {"converged": True},
                )

        skipped_agent = make_agent(0, "monitoring")
        rejected_agent = make_agent(1, "increase_local_support")
        for agent in (skipped_agent, rejected_agent):
            agent.state.metadata.update(
                trail_demand_signal=0.0,
                trail_energy_surplus=0.0,
            )

        def propose(agent):
            if agent is skipped_agent:
                return None, "Agent decision does not request generator setpoint change"
            return (
                {
                    "agent_id": "agent-01",
                    "generator_id": 0,
                    "target_p_mw": 1.0,
                    "previous_p_mw": 0.0,
                    "proposed_action": "increase_local_support",
                },
                None,
            )

        with (
            patch.object(main, "grid_environment", FakeGrid()),
            patch.object(main, "agents", [skipped_agent, rejected_agent]),
            patch.object(main, "trail_memory", TrailMemory()),
            patch.object(main, "coordination_tick", 0),
            patch.object(main, "propose_generator_target", side_effect=propose),
            patch.object(
                main.safety_gate,
                "evaluate_generator_action",
                return_value={"accepted": False, "reason": "test rejection"},
            ),
        ):
            skipped_agent.sense = lambda state: setattr(
                skipped_agent.state, "sensed_signal", "NORMAL"
            )
            rejected_agent.sense = lambda state: setattr(
                rejected_agent.state, "sensed_signal", "NORMAL"
            )
            skipped_agent.decide = lambda: setattr(
                skipped_agent.state, "action", "monitoring"
            )
            rejected_agent.decide = lambda: setattr(
                rejected_agent.state, "action", "increase_local_support"
            )
            response = main.run_coordination_tick()

        diagnostics = response["proposal_diagnostics"]
        self.assertEqual([item["status"] for item in diagnostics], ["skipped", "rejected"])
        self.assertTrue(diagnostics[0]["reason"])
        self.assertEqual(diagnostics[1]["proposal_status"], "evaluated")
        self.assertFalse(response["actions"][0]["accepted"])
        self.assertIn("trail_sensed", diagnostics[0])
        self.assertIn("trail_deposited", diagnostics[0])


if __name__ == "__main__":
    unittest.main()
