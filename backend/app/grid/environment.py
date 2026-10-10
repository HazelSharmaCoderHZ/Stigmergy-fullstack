import pandapower as pp
import pandapower.networks as pn

from app.models.grid import GridState, BusState, LineState


class GridEnvironment:
    """IEEE-14 bus AC power-flow simulation environment."""

    def __init__(self):
        self.network = pn.case14()

    def run_power_flow(self):
        pp.runpp(self.network)
        return self.network.converged

    def get_grid_state(self) -> GridState:
        if not self.network.converged:
            raise RuntimeError("Power flow has not converged.")

        net = self.network
        buses = []

        for index, row in net.res_bus.iterrows():
            bus_id = int(index)

            generation = 0.0
            if len(net.gen):
                gen_rows = net.gen.index[net.gen.bus == bus_id]
                if len(gen_rows):
                    generation += float(net.res_gen.loc[gen_rows, "p_mw"].sum())

            if len(net.ext_grid):
                ext_rows = net.ext_grid.index[net.ext_grid.bus == bus_id]
                if len(ext_rows):
                    generation += float(net.res_ext_grid.loc[ext_rows, "p_mw"].sum())

            if len(net.sgen):
                sgen_rows = net.sgen.index[net.sgen.bus == bus_id]
                if len(sgen_rows):
                    generation += float(net.res_sgen.loc[sgen_rows, "p_mw"].sum())

            load = 0.0
            if len(net.load):
                load_rows = net.load.index[net.load.bus == bus_id]
                if len(load_rows):
                    load = float(net.res_load.loc[load_rows, "p_mw"].sum())

            buses.append(
                BusState(
                    id=bus_id,
                    voltage_pu=float(row.vm_pu),
                    angle_deg=float(row.va_degree),
                    nominal_voltage_kv=float(net.bus.at[bus_id, "vn_kv"]),
                    generation_mw=generation,
                    load_mw=load,
                )
            )

        lines = []
        for index, row in net.res_line.iterrows():
            lines.append(
                LineState(
                    id=int(index),
                    from_bus=int(net.line.at[index, "from_bus"]),
                    to_bus=int(net.line.at[index, "to_bus"]),
                    loading_percent=float(row.loading_percent),
                    p_from_mw=float(row.p_from_mw),
                    p_to_mw=float(row.p_to_mw),
                )
            )

        total_generation_mw = float(net.res_gen.p_mw.sum() + net.res_ext_grid.p_mw.sum())
        if len(net.sgen):
            total_generation_mw += float(net.res_sgen.p_mw.sum())
        total_load_mw = float(net.res_load.p_mw.sum())

        return GridState(
            network="IEEE-14",
            converged=bool(net.converged),
            bus_count=len(buses),
            line_count=len(lines),
            total_generation_mw=total_generation_mw,
            total_load_mw=total_load_mw,
            min_voltage_pu=min(bus.voltage_pu for bus in buses),
            max_voltage_pu=max(bus.voltage_pu for bus in buses),
            max_line_loading_percent=max((line.loading_percent for line in lines), default=0.0),
            buses=buses,
            lines=lines,
        )

    def get_topology(self) -> list[tuple[int, int]]:
        connections = []
        for _, row in self.network.line.iterrows():
            connections.append((int(row.from_bus), int(row.to_bus)))
        for _, row in self.network.trafo.iterrows():
            connections.append((int(row.hv_bus), int(row.lv_bus)))
        return connections
