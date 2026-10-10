<div align="center">

# ⚡ StigGrid

### A Stigmergic Multi-Agent Coordination Framework for Decentralized Smart Grid Load Balancing

<p>
  <img src="https://img.shields.io/badge/AI-Multi--Agent-7C3AED?style=for-the-badge&logo=probot&logoColor=white" />
  <img src="https://img.shields.io/badge/Smart%20Grid-IEEE%20Test%20Systems-2563EB?style=for-the-badge&logo=powerbi&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/pandapower-Power%20Flow-F59E0B?style=flat-square" />
</p>

<br>

**Decentralized intelligence for adaptive, safe and resilient power-grid coordination.**

</div>

---

## 🧠 Overview

**StigGrid** is a multi-agent smart-grid coordination framework that explores how decentralized agents can coordinate without relying on direct agent-to-agent communication.

Instead of continuously negotiating with each other, agents interact indirectly through a shared **digital pheromone trail**.

> **Sense → Signal → Read → Decide → Verify → Act**

Each grid agent:

1. 👁️ Senses its local electrical environment
2. 🧪 Deposits a signal into the shared stigmergic trail
3. 📡 Reads signals left by nearby agents
4. 🤖 Determines an adaptive corrective action
5. 🛡️ Passes the action through a hard safety-verification layer
6. ⚡ Executes the action only if the electrical constraints remain valid

This creates an adaptive coordination mechanism inspired by **stigmergy in biological systems**.

---

# 🎯 Problem

Traditional smart-grid control approaches commonly rely on:

- Centralized optimization
- Direct communication between agents
- Predefined control policies
- Continuous coordination overhead

These approaches can become difficult to scale as the number of grid nodes and autonomous controllers increases.

**StigGrid explores an alternative:**

> Can decentralized agents coordinate effectively by leaving and sensing information in the environment rather than directly communicating with one another?

---

# 💡 Core Idea

```text
                  ┌───────────────────────┐
                  │      SMART GRID       │
                  │   IEEE Test Network   │
                  └───────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  LOCAL SENSING  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AGENT DECISION │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  DIGITAL PHEROMONE   │
                  │       TRAIL           │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       Nearby agents                 Trail decay
       sense signal                 + diffusion
              │                             │
              └──────────────┬──────────────┘
                             ▼
                    ┌─────────────────┐
                    │ PROPOSE ACTION  │
                    └────────┬────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   🛡️ SAFETY GATE       │
                │      pandapower        │
                └───────────┬────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
                   SAFE          UNSAFE
                     │             │
                     ▼             ▼
                  EXECUTE        REJECT