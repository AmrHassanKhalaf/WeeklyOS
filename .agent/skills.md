# 🚀 WeeklyOS – Skills & System Specification (skills.md)

## 🧠 Overview

WeeklyOS is an AI-powered productivity operating system that helps users:

* Capture tasks (Brain Dump)
* Distribute them across a week (1-3-5 system)
* Execute daily work (Focused Day)
* Evaluate performance (Weekly Evaluation)
* Improve using AI (Multi-provider AI system)

---

## 🧩 Core Capabilities

### 1. Task Management System

* Create, edit, delete tasks
* Assign tasks to days
* Priority system:

  * High (1)
  * Medium (3)
  * Low (5)
* Task status tracking (done / pending)

---

### 2. Brain Dump System

* Add unstructured tasks quickly
* Bulk task creation
* Tagging support
* Send tasks to Weekly Distribution
* Drag & drop integration

---

### 3. Weekly Distribution System (Core)

* 7-day layout
* Each day contains:

  * 1 high priority task
  * 3 medium tasks
  * 5 low tasks
* Drag & drop tasks across days
* Inline editing
* Mark rest days
* Overload detection (visual)

---

### 4. Focused Day System

* Show tasks for a single day
* Highlight main task
* Deep work mode (distraction-free)
* Optional Pomodoro timer
* Task completion tracking

---

### 5. Weekly Evaluation System

* Weekly completion score (%)
* Tasks completed vs planned
* Reflection sections:

  * Good
  * Bad
  * Lessons
* Compare with previous weeks

---

## 🤖 AI System (Multi-Provider Architecture)

### 1. AI Abstraction Layer

* Unified interface for multiple providers:

  * OpenAI
  * Gemini
  * Grok

---

### 2. Multi-Provider Support

* Select provider manually
* Auto mode (smart selection)
* Fallback system between providers

---

### 3. API Key Management

* Multiple API keys per user
* Keys linked to provider
* Enable/disable keys
* Secure storage (server-side only)

---

### 4. AI Capabilities

* Plan Week (Brain Dump → Structured tasks)
* Optimize Schedule
* Analyze Productivity
* Suggest Focus Tasks
* Detect overload & burnout

---

### 5. AI Request Structure

```json
{
  "type": "plan_week | optimize | analyze | focus",
  "input": "user input",
  "context": {
    "tasks": [],
    "week": {},
    "history": {}
  }
}
```

---

## 🔄 Real-Time Sync

* Supabase Realtime
* Sync across devices:

  * Mobile
  * Desktop
  * Tablet
* Instant UI updates

---

## 🔐 Authentication & Security

* Supabase Auth
* Email/password login
* Session persistence
* Row Level Security (RLS):

```sql
auth.uid() = user_id
```

---

## 🗄️ Database Structure

### users (auth)

* id
* email

### weeks

* id
* user_id
* week_number
* year
* score

### tasks

* id
* user_id
* week_id
* title
* day
* priority
* status

### brain_dump

* id
* user_id
* content

### daily_logs

* id
* user_id
* date
* completion_rate

### ai_keys

* id
* user_id
* provider
* api_key

### ai_settings

* user_id
* default_provider
* fallback_enabled

---

## 🧭 App Structure & Pages

### Authentication

* /auth/signin
* /auth/signup

---

### Main Pages

* /dashboard
* /focused-day
* /brain-dump
* /weekly-distribution
* /weekly-evaluation
* /ai
* /settings

---

## 🔁 User Flow

Brain Dump
↓
Weekly Distribution
↓
Focused Day
↓
Weekly Evaluation
↓
AI Improvement

---

## 🎨 UI/UX Principles

* Minimal design
* Fast interactions
* No clutter
* Clear hierarchy
* Strong feedback (checkboxes, animations)

---

## ⚡ Advanced Features (Future)

* AI auto scheduling
* Productivity insights
* Gamification (streaks, levels)
* Weekly reports
* Offline support

---

## 🧠 Tech Stack

* Frontend: React
* Backend: Supabase (Auth, DB, Realtime)
* AI: OpenAI / Gemini / Grok
* State Management: Zustand / Redux

---

## 💀 Product Vision

WeeklyOS is not a simple task manager.

It is:

> An AI-powered productivity operating system that helps users think, plan, execute, and improve continuously.
