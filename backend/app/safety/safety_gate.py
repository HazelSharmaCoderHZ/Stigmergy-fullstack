
import copy
import math

import pandapower as pp


class SafetyGate:
    """Validate generator actions before committing them to the live grid."""

    def __init__(self, min_voltage_pu=0.94, max_voltage_pu=1.06):
        if (
            not math.isfinite(min_voltage_pu)
            or not math.isfinite(max_voltage_pu)
            or min_voltage_pu >= max_voltage_pu
        ):
            raise ValueError(
                "Voltage limits must be finite and "
                "min_voltage_pu must be less than max_voltage_pu"
            )

        self.min_voltage_pu = float(min_voltage_pu)
        self.max_voltage_pu = float(max_voltage_pu)

    @staticmethod
    def _violation(value, lower, upper):
        return max(lower - value, 0.0, value - upper)

    @staticmethod
    def _response(
        accepted,
        reason,
        agent_id,
        generator_id,
        previous_p_mw=None,
        accepted_p_mw=None,
    ):
        """Return a consistent response for accepted and rejected actions."""
        return {
            "accepted": accepted,
            "reason": reason,
            "agent_id": agent_id,
            "generator_id": generator_id,
            "previous_p_mw": previous_p_mw,
            "accepted_p_mw": accepted_p_mw,
        }

    def _check_network(self, before, after):
        tolerance = 1e-6

        # 1. Check bus voltage violations.
        for bus_id, row in after.bus.iterrows():
            old_v = float(before.res_bus.at[bus_id, "vm_pu"])
            new_v = float(after.res_bus.at[bus_id, "vm_pu"])

            if not math.isfinite(old_v) or not math.isfinite(new_v):
                return False, (
                    f"Bus {bus_id}: non-finite voltage detected"
                )

            lower = max(
                self.min_voltage_pu,
                float(row["min_vm_pu"]),
            )
            upper = min(
                self.max_voltage_pu,
                float(row["max_vm_pu"]),
            )

            if lower > upper:
                return False, (
                    f"Bus {bus_id}: configured voltage limits "
                    "have no valid intersection"
                )

            old_violation = self._violation(old_v, lower, upper)
            new_violation = self._violation(new_v, lower, upper)

            if new_violation > old_violation + tolerance:
                return False, (
                    f"Bus {bus_id}: voltage violation worsened; "
                    f"voltage {old_v:.8f} -> {new_v:.8f} pu; "
                    f"violation {old_violation:.8f} -> "
                    f"{new_violation:.8f} pu; "
                    f"allowed range [{lower:.4f}, {upper:.4f}] pu"
                )

        # 2. Check transmission-line overload violations.
        for line_id, row in after.line.iterrows():
            old_loading = float(
                before.res_line.at[line_id, "loading_percent"]
            )
            new_loading = float(
                after.res_line.at[line_id, "loading_percent"]
            )
            limit = float(row["max_loading_percent"])

            if (
                not math.isfinite(old_loading)
                or not math.isfinite(new_loading)
                or not math.isfinite(limit)
                or limit < 0
            ):
                return False, (
                    f"Line {line_id}: invalid loading or thermal limit"
                )

            old_violation = max(old_loading - limit, 0.0)
            new_violation = max(new_loading - limit, 0.0)

            if new_violation > old_violation + tolerance:
                return False, (
                    f"Line {line_id}: overload worsened; "
                    f"loading {old_loading:.6f}% -> "
                    f"{new_loading:.6f}%; limit {limit:.6f}%"
                )

        # 3. Check transformer overload violations.
        for trafo_id, row in after.trafo.iterrows():
            old_loading = float(
                before.res_trafo.at[trafo_id, "loading_percent"]
            )
            new_loading = float(
                after.res_trafo.at[trafo_id, "loading_percent"]
            )
            limit = float(row["max_loading_percent"])

            if (
                not math.isfinite(old_loading)
                or not math.isfinite(new_loading)
                or not math.isfinite(limit)
                or limit < 0
            ):
                return False, (
                    f"Transformer {trafo_id}: "
                    "invalid loading or thermal limit"
                )

            old_violation = max(old_loading - limit, 0.0)
            new_violation = max(new_loading - limit, 0.0)

            if new_violation > old_violation + tolerance:
                return False, (
                    f"Transformer {trafo_id}: overload worsened; "
                    f"loading {old_loading:.6f}% -> "
                    f"{new_loading:.6f}%; limit {limit:.6f}%"
                )

        return True, (
            "Accepted: no voltage or loading violation worsened"
        )

    def evaluate_generator_action(
        self,
        environment,
        generator_id,
        target_p_mw,
        agent_id="system",
    ):
        live_network = environment.network

        # 1. Validate the generator identifier.
        if (
            isinstance(generator_id, bool)
            or not isinstance(generator_id, int)
            or generator_id not in live_network.gen.index
        ):
            return self._response(
                False,
                f"Generator {generator_id} does not exist or has an invalid ID",
                agent_id,
                generator_id,
            )

        # 2. Validate the target value.
        try:
            target_p_mw = float(target_p_mw)
        except (TypeError, ValueError, OverflowError):
            return self._response(
                False,
                "Target power must be a finite number",
                agent_id,
                generator_id,
            )

        if not math.isfinite(target_p_mw):
            return self._response(
                False,
                "Target power must be a finite number",
                agent_id,
                generator_id,
            )

        # 3. Read the current generator setpoint.
        previous_p_mw = float(
            live_network.gen.at[generator_id, "p_mw"]
        )

        if not math.isfinite(previous_p_mw):
            return self._response(
                False,
                "Current generator output is not finite",
                agent_id,
                generator_id,
                previous_p_mw,
            )

        # 4. Reject no-op actions explicitly.
        if math.isclose(
            previous_p_mw,
            target_p_mw,
            rel_tol=0.0,
            abs_tol=1e-9,
        ):
            return self._response(
                False,
                (
                    "Rejected: target equals current generator output; "
                    "no action needed"
                ),
                agent_id,
                generator_id,
                previous_p_mw,
                None,
            )

        # 5. Validate generator operating limits.
        gen_row = live_network.gen.loc[generator_id]

        try:
            minimum = float(gen_row["min_p_mw"])
            maximum = float(gen_row["max_p_mw"])
        except (TypeError, ValueError, OverflowError):
            return self._response(
                False,
                "Generator operating limits are invalid",
                agent_id,
                generator_id,
                previous_p_mw,
            )

        if (
            not math.isfinite(minimum)
            or not math.isfinite(maximum)
            or minimum > maximum
        ):
            return self._response(
                False,
                "Generator operating limits are invalid or non-finite",
                agent_id,
                generator_id,
                previous_p_mw,
            )

        if not minimum <= target_p_mw <= maximum:
            return self._response(
                False,
                (
                    f"Target {target_p_mw:.6f} MW is outside "
                    f"generator limits [{minimum:.6f}, "
                    f"{maximum:.6f}] MW"
                ),
                agent_id,
                generator_id,
                previous_p_mw,
            )

        # 6. Run baseline and candidate power flows on separate copies.
        baseline = copy.deepcopy(live_network)
        candidate = copy.deepcopy(live_network)

        try:
            pp.runpp(baseline)

            if not baseline.converged:
                return self._response(
                    False,
                    "Baseline power flow did not converge",
                    agent_id,
                    generator_id,
                    previous_p_mw,
                )

            candidate.gen.at[generator_id, "p_mw"] = target_p_mw
            pp.runpp(candidate)

            if not candidate.converged:
                return self._response(
                    False,
                    "Candidate power flow did not converge",
                    agent_id,
                    generator_id,
                    previous_p_mw,
                )

        except Exception as exc:
            return self._response(
                False,
                f"Power flow failed: {type(exc).__name__}: {exc}",
                agent_id,
                generator_id,
                previous_p_mw,
            )

        # 7. Enforce the non-worsening safety policy.
        accepted, reason = self._check_network(
            baseline,
            candidate,
        )

        if not accepted:
            # The live network remains unchanged.
            return self._response(
                False,
                reason,
                agent_id,
                generator_id,
                previous_p_mw,
                None,
            )

        # 8. Commit the candidate only after all checks pass.
        environment.network = candidate

        return self._response(
            True,
            reason,
            agent_id,
            generator_id,
            previous_p_mw,
            float(target_p_mw),
        )
