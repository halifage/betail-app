# Livestock UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Field Kit home with livestock-focused screens: Animals list, Animal detail (weight history + health timeline), Quick Weigh-in form, and Quick Health Event form.

**Architecture:** All new screens live in `src/livestock/`. They use the existing `useEntities()` composable (`src/entities/index.js`) for offline-first reads/writes via farmOS JSON:API + IndexedDB. Vue 3 `setup()` within Options API components — consistent with existing code. Routes added to `src/router.js`; drawer updated in `src/shell/AppDrawer.vue`.

**Tech Stack:** Vue 3, Vite, farmOS.js, IndexedDB (existing `src/idb/`), Vue Router, Bootstrap Simplex (farm-* design-system components), CSS custom properties in `src/styles/vars.css`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/livestock/AnimalsScreen.vue` | Active-animals list; replaces Field Kit home |
| Create | `src/livestock/CreateAnimalForm.vue` | New animal form (name, species, sex, DOB, tag) |
| Create | `src/livestock/AnimalDetail.vue` | Animal info + weight history + health timeline + action buttons |
| Create | `src/livestock/WeighInForm.vue` | Weight entry (kg + date) → `log--observation` |
| Create | `src/livestock/HealthEventForm.vue` | Health event (type + notes + withdrawal) → `log--activity` |
| Modify | `src/home/Home.vue` | Replace `<home-widgets>` with `<animals-screen>` |
| Modify | `src/router.js` | Add `/animals/new`, `/animals/:id`, `/animals/:id/weigh-in`, `/animals/:id/health-event` |
| Modify | `src/shell/AppDrawer.vue` | Replace field-module nav list with static livestock links |

---

## Task 1: Router + Nav foundation

**Files:**
- Modify: `src/router.js`
- Modify: `src/shell/AppDrawer.vue`
- Modify: `src/home/Home.vue`

- [ ] **Step 1: Add livestock routes to router.js**

Replace the entire contents of `src/router.js` with:

```js
import { createRouter, createWebHistory } from 'vue-router';
import Login from './login/Login.vue';
import Logout from './login/Logout.vue';
import Home from './home/Home.vue';
import CreateAnimalForm from './livestock/CreateAnimalForm.vue';
import AnimalDetail from './livestock/AnimalDetail.vue';
import WeighInForm from './livestock/WeighInForm.vue';
import HealthEventForm from './livestock/HealthEventForm.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/logout', name: 'Logout', component: Logout },
    { path: '/home', name: 'Home', component: Home },
    { path: '/animals/new', name: 'CreateAnimal', component: CreateAnimalForm },
    { path: '/animals/:id', name: 'AnimalDetail', component: AnimalDetail },
    { path: '/animals/:id/weigh-in', name: 'WeighIn', component: WeighInForm },
    { path: '/animals/:id/health-event', name: 'HealthEvent', component: HealthEventForm },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
});

export default router;
```

- [ ] **Step 2: Update AppDrawer to use static livestock nav**

Replace the second `<farm-list>` block (the dynamic module links) in `src/shell/AppDrawer.vue` with static livestock links. Replace:

```html
    <farm-list>
      <farm-list-item
        v-for="mod in modules"
        :key="`${mod.name}-menu-link`"
        :clickable="true"
        @click="handleRoute(mod.routes[0].path)">
        {{ $t(mod.label) }}
      </farm-list-item>
    </farm-list>
```

with:

```html
    <farm-list>
      <farm-list-item :clickable="true" @click="handleRoute('/home')">
        Animals
      </farm-list-item>
      <farm-list-item :clickable="true" @click="handleRoute('/animals/new')">
        Add Animal
      </farm-list-item>
    </farm-list>
```

Also remove the `modules: fieldModules` from `data()` and the `import fieldModules` since they're no longer used. In `src/shell/AppDrawer.vue`, remove:

```js
import fieldModules from '../field-modules';
```

And in `data()`, remove `modules: fieldModules,`.

- [ ] **Step 3: Build to verify no import errors**

```bash
cd packages/field-kit && npm run build
```

Expected: build completes. If missing import errors appear for the new `.vue` files, create empty placeholder files:

```bash
mkdir -p src/livestock
touch src/livestock/CreateAnimalForm.vue src/livestock/AnimalDetail.vue \
      src/livestock/WeighInForm.vue src/livestock/HealthEventForm.vue
```

Then build again — expect success (empty components are valid in Vue 3).

- [ ] **Step 4: Commit**

```bash
git add src/router.js src/shell/AppDrawer.vue src/livestock/
git commit -m "feat: add livestock routes and update nav drawer"
```

---

## Task 2: Animals list screen

**Files:**
- Create: `src/livestock/AnimalsScreen.vue`
- Modify: `src/home/Home.vue`

- [ ] **Step 1: Create AnimalsScreen.vue**

Create `src/livestock/AnimalsScreen.vue`:

```vue
<template>
  <farm-main>
    <app-bar-options title="Animals" />
    <div class="animals-container">
      <farm-stack space="s" v-if="animals.length > 0">
        <farm-card
          v-for="animal in animals"
          :key="animal.id"
          class="animal-card"
          @click="$router.push(`/animals/${animal.id}`)"
        >
          <farm-stack space="xs">
            <strong class="animal-name">{{ animal.name || 'Unnamed' }}</strong>
            <farm-inline space="s">
              <farm-text size="s" v-if="speciesName(animal)">
                {{ speciesName(animal) }}
              </farm-text>
              <farm-text size="s" v-if="animal.sex">
                {{ animal.sex === 'M' ? 'Male' : 'Female' }}
              </farm-text>
              <farm-text size="s" v-if="animal.tag && animal.tag.length">
                #{{ animal.tag[0].id }}
              </farm-text>
            </farm-inline>
          </farm-stack>
        </farm-card>
      </farm-stack>

      <farm-card v-else>
        <farm-stack space="s">
          <strong>No animals yet</strong>
          <farm-text size="s">Tap + to add your first animal.</farm-text>
        </farm-stack>
      </farm-card>
    </div>

    <button class="fab" @click="$router.push('/animals/new')" aria-label="Add animal">+</button>
  </farm-main>
</template>

<script>
import { useRoute } from 'vue-router';
import useEntities from '../entities';

export default {
  name: 'AnimalsScreen',
  setup() {
    const { checkout } = useEntities();
    // Checkout all active animal assets; reactive array updates as IDB+remote sync
    const animals = checkout('asset', { type: 'animal', status: 'active' });
    return { animals };
  },
  methods: {
    speciesName(animal) {
      const types = animal.animal_type;
      if (!types || !types.length) return '';
      // animal_type is a relationship array; name comes through after sync
      return types[0]?.name || '';
    },
  },
};
</script>

<style scoped>
.animals-container {
  padding: var(--s);
  padding-bottom: 5rem; /* room for FAB */
}

.animal-card {
  cursor: pointer;
}
.animal-card:active {
  opacity: 0.8;
}

.animal-name {
  font-size: 1.1rem;
}

.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: var(--primary);
  color: var(--white);
  font-size: 1.75rem;
  line-height: 1;
  border: none;
  box-shadow: var(--shadow-strong);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fab:active {
  transform: scale(0.93);
}
</style>
```

- [ ] **Step 2: Update Home.vue to render AnimalsScreen**

Replace the entire contents of `src/home/Home.vue` with:

```vue
<template>
  <animals-screen />
</template>

<script>
import AnimalsScreen from '../livestock/AnimalsScreen.vue';

export default {
  name: 'HomeScreen',
  components: { AnimalsScreen },
};
</script>
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Manual verify**

Deploy to Vercel (push to `develop`) and open the PWA. After login:
- `/home` should show "Animals" header
- Animals created in farmOS (Cattle/Sheep/Goat from seed-data are taxonomy terms, not animals — the list is empty until you create one) — empty state card shows "No animals yet"
- + FAB button visible in bottom right

- [ ] **Step 5: Commit**

```bash
git add src/livestock/AnimalsScreen.vue src/home/Home.vue
git commit -m "feat: livestock home screen with animals list"
```

---

## Task 3: Create Animal form

**Files:**
- Create: `src/livestock/CreateAnimalForm.vue`

- [ ] **Step 1: Create CreateAnimalForm.vue**

Create `src/livestock/CreateAnimalForm.vue`:

```vue
<template>
  <farm-main>
    <app-bar-options title="New Animal" />
    <div class="form-container">
      <farm-card>
        <farm-stack space="s">

          <div class="field">
            <label class="field-label">Name *</label>
            <input
              v-model="form.name"
              type="text"
              class="form-control"
              placeholder="e.g. Bessie"
              autocomplete="off"
            />
          </div>

          <div class="field">
            <label class="field-label">Species</label>
            <select v-model="form.animalTypeId" class="form-select">
              <option value="">— Select —</option>
              <option
                v-for="t in animalTypes"
                :key="t.id"
                :value="t.id"
              >{{ t.name }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label">Sex</label>
            <select v-model="form.sex" class="form-select">
              <option value="">— Unknown —</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label">Date of Birth</label>
            <input v-model="form.birthdate" type="date" class="form-control" />
          </div>

          <div class="field">
            <label class="field-label">Tag Number</label>
            <input
              v-model="form.tagId"
              type="text"
              class="form-control"
              placeholder="e.g. NZ-1234"
              autocomplete="off"
            />
          </div>

          <div v-if="error" class="alert alert-danger">{{ error }}</div>

          <button
            class="btn btn-primary btn-lg w-100"
            @click="save"
            :disabled="saving || !form.name.trim()"
          >
            {{ saving ? 'Saving…' : 'Save Animal' }}
          </button>

          <button class="btn btn-link w-100" @click="$router.back()">
            Cancel
          </button>

        </farm-stack>
      </farm-card>
    </div>
  </farm-main>
</template>

<script>
import useEntities from '../entities';

export default {
  name: 'CreateAnimalForm',
  setup() {
    const { add, commit, checkout } = useEntities();
    // Load animal types (Cattle, Sheep, Goat) from farmOS taxonomy
    const animalTypes = checkout('taxonomy_term', { type: 'animal_type' });
    return { add, commit, animalTypes };
  },
  data() {
    return {
      saving: false,
      error: '',
      form: {
        name: '',
        animalTypeId: '',
        sex: '',
        birthdate: '',
        tagId: '',
      },
    };
  },
  methods: {
    async save() {
      if (!this.form.name.trim()) return;
      this.saving = true;
      this.error = '';
      try {
        const fields = {
          name: this.form.name.trim(),
          status: 'active',
        };
        if (this.form.sex) {
          fields.sex = this.form.sex;
        }
        if (this.form.birthdate) {
          // farmOS expects ISO 8601 date string
          fields.birthdate = this.form.birthdate;
        }
        if (this.form.animalTypeId) {
          fields.animal_type = [{
            id: this.form.animalTypeId,
            type: 'taxonomy_term--animal_type',
          }];
        }
        if (this.form.tagId.trim()) {
          // intrinsic tag: id is the tag number, tag_type is the tag scheme
          fields.tag = [{ id: this.form.tagId.trim(), tag_type: 'eid' }];
        }
        const ref = this.add('asset', 'animal', fields);
        await this.commit(ref);
        this.$router.push('/home');
      } catch (e) {
        this.error = e.message || 'Failed to save. Try again.';
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.form-container {
  padding: var(--s);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--xxs);
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.form-control,
.form-select {
  font-size: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--light);
  border-radius: 4px;
  background: var(--white);
  color: var(--dark);
  width: 100%;
}

.form-control:focus,
.form-select:focus {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.btn-lg {
  padding: 0.85rem;
  font-size: 1.05rem;
}

.w-100 {
  width: 100%;
}

.alert-danger {
  color: var(--red);
  background: var(--red-light);
  border-radius: 4px;
  padding: var(--xs) var(--s);
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Manual verify**

- Open PWA → tap + FAB → `/animals/new` form appears
- Species dropdown shows Cattle / Sheep / Goat (loaded from farmOS taxonomy via IDB after initial login sync)
- Fill name "Test Cow", select Cattle, tap "Save Animal"
- Returns to `/home`; "Test Cow" appears in the animals list

- [ ] **Step 4: Commit**

```bash
git add src/livestock/CreateAnimalForm.vue
git commit -m "feat: create animal form with species/sex/dob/tag fields"
```

---

## Task 4: Animal detail screen

**Files:**
- Create: `src/livestock/AnimalDetail.vue`

- [ ] **Step 1: Create AnimalDetail.vue**

Create `src/livestock/AnimalDetail.vue`:

```vue
<template>
  <farm-main>
    <app-bar-options :title="animal.name || 'Animal'" />
    <div class="detail-container">
      <farm-stack space="s">

        <!-- Info card -->
        <farm-card>
          <farm-stack space="xs">
            <div class="info-row" v-if="animalTypeName">
              <span class="info-label">Species</span>
              <span>{{ animalTypeName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sex</span>
              <span>{{ sexLabel }}</span>
            </div>
            <div class="info-row" v-if="animal.birthdate">
              <span class="info-label">Born</span>
              <span>{{ birthdateLabel }}</span>
            </div>
            <div class="info-row" v-if="animal.tag && animal.tag.length">
              <span class="info-label">Tag</span>
              <span>{{ animal.tag[0].id }}</span>
            </div>
          </farm-stack>
        </farm-card>

        <!-- Action buttons -->
        <farm-inline space="s">
          <button
            class="btn btn-primary action-btn"
            @click="$router.push(`/animals/${animalId}/weigh-in`)"
          >
            + Weight
          </button>
          <button
            class="btn btn-secondary action-btn"
            @click="$router.push(`/animals/${animalId}/health-event`)"
          >
            + Health
          </button>
        </farm-inline>

        <!-- Weight history -->
        <h3 class="section-heading">Weights</h3>
        <template v-if="weightLogs.length > 0">
          <farm-card v-for="log in weightLogs" :key="log.id" class="log-card">
            <farm-inline>
              <span>{{ log.name }}</span>
              <span class="log-date">{{ formatDate(log.timestamp) }}</span>
            </farm-inline>
          </farm-card>
        </template>
        <farm-text size="s" v-else>No weight records yet.</farm-text>

        <!-- Health timeline -->
        <h3 class="section-heading">Health Events</h3>
        <template v-if="healthLogs.length > 0">
          <farm-card v-for="log in healthLogs" :key="log.id" class="log-card">
            <farm-inline>
              <span>{{ log.name }}</span>
              <span class="log-date">{{ formatDate(log.timestamp) }}</span>
            </farm-inline>
          </farm-card>
        </template>
        <farm-text size="s" v-else>No health records yet.</farm-text>

      </farm-stack>
    </div>
  </farm-main>
</template>

<script>
import { useRoute } from 'vue-router';
import useEntities from '../entities';

export default {
  name: 'AnimalDetail',
  setup() {
    const route = useRoute();
    const { checkout } = useEntities();
    const animalId = route.params.id;
    // Single animal reference — reactive, updates from IDB then remote
    const animal = checkout('asset', 'animal', animalId);
    // All logs for this animal — both observation (weight) and activity (health)
    const allLogs = checkout('log', { 'asset.id': animalId });
    return { animal, allLogs, animalId };
  },
  computed: {
    weightLogs() {
      return Array.from(this.allLogs)
        .filter(l => l.type === 'log--observation')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    },
    healthLogs() {
      return Array.from(this.allLogs)
        .filter(l => l.type === 'log--activity' || l.type === 'log--medical')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    },
    animalTypeName() {
      const types = this.animal.animal_type;
      if (!types || !types.length) return '';
      return types[0]?.name || '';
    },
    sexLabel() {
      if (this.animal.sex === 'M') return 'Male';
      if (this.animal.sex === 'F') return 'Female';
      return 'Unknown';
    },
    birthdateLabel() {
      if (!this.animal.birthdate) return '';
      return new Date(this.animal.birthdate).toLocaleDateString();
    },
  },
  methods: {
    formatDate(ts) {
      if (!ts) return '';
      // farmOS timestamps are Unix seconds
      return new Date(Number(ts) * 1000).toLocaleDateString();
    },
  },
};
</script>

<style scoped>
.detail-container {
  padding: var(--s);
  padding-bottom: 2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--xxs) 0;
  border-bottom: 1px solid var(--light);
}
.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: var(--subtle);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-btn {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
}

.section-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: var(--xs) 0 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.log-card {
  padding: var(--xs) var(--s);
}

.log-date {
  color: var(--subtle);
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Manual verify**

- Tap "Test Cow" on the animals list → opens `/animals/:id`
- Info card shows species, sex, born, tag (whichever fields were set)
- "+ Weight" and "+ Health" buttons visible
- "No weight records yet" / "No health records yet" placeholders show

- [ ] **Step 4: Commit**

```bash
git add src/livestock/AnimalDetail.vue
git commit -m "feat: animal detail screen with weight and health history"
```

---

## Task 5: Weigh-in form

**Files:**
- Create: `src/livestock/WeighInForm.vue`

- [ ] **Step 1: Create WeighInForm.vue**

Create `src/livestock/WeighInForm.vue`:

```vue
<template>
  <farm-main>
    <app-bar-options title="Add Weight" />
    <div class="form-container">
      <farm-card>
        <farm-stack space="s">

          <div class="field">
            <label class="field-label">Weight (kg) *</label>
            <input
              v-model="form.weight"
              type="number"
              step="0.1"
              min="0"
              max="9999"
              class="form-control input-xl"
              placeholder="e.g. 320"
              inputmode="decimal"
            />
          </div>

          <div class="field">
            <label class="field-label">Date</label>
            <input v-model="form.date" type="date" class="form-control" />
          </div>

          <div v-if="error" class="alert alert-danger">{{ error }}</div>

          <button
            class="btn btn-primary btn-lg w-100"
            @click="save"
            :disabled="saving || !form.weight"
          >
            {{ saving ? 'Saving…' : 'Save Weight' }}
          </button>

          <button class="btn btn-link w-100" @click="$router.back()">
            Cancel
          </button>

        </farm-stack>
      </farm-card>
    </div>
  </farm-main>
</template>

<script>
import { useRoute } from 'vue-router';
import useEntities from '../entities';

export default {
  name: 'WeighInForm',
  setup() {
    const route = useRoute();
    const { add, commit, checkout } = useEntities();
    const animalId = route.params.id;
    // Load animal for name display in log
    const animal = checkout('asset', 'animal', animalId);
    return { add, commit, animal, animalId };
  },
  data() {
    return {
      saving: false,
      error: '',
      form: {
        weight: '',
        // Default to today in YYYY-MM-DD format
        date: new Date().toISOString().split('T')[0],
      },
    };
  },
  methods: {
    async save() {
      const weight = parseFloat(this.form.weight);
      if (!weight || weight <= 0) return;
      this.saving = true;
      this.error = '';
      try {
        // Parse date at noon local time to avoid UTC-offset day shifts
        const [y, m, d] = this.form.date.split('-').map(Number);
        const timestamp = Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
        const animalName = this.animal.name || 'Animal';
        const ref = this.add('log', 'observation', {
          name: `Weight: ${weight} kg`,
          timestamp,
          status: 'done',
          asset: [{ id: this.animalId, type: 'asset--animal' }],
          notes: { value: `${animalName} weighed ${weight} kg`, format: 'default' },
        });
        await this.commit(ref);
        this.$router.push(`/animals/${this.animalId}`);
      } catch (e) {
        this.error = e.message || 'Failed to save. Try again.';
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.form-container {
  padding: var(--s);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--xxs);
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.form-control {
  font-size: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--light);
  border-radius: 4px;
  background: var(--white);
  color: var(--dark);
  width: 100%;
}

.input-xl {
  font-size: 2rem;
  padding: 0.75rem;
  text-align: center;
  font-weight: 700;
}

.form-control:focus {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.btn-lg {
  padding: 0.85rem;
  font-size: 1.05rem;
}

.w-100 { width: 100%; }

.alert-danger {
  color: var(--red);
  background: var(--red-light);
  border-radius: 4px;
  padding: var(--xs) var(--s);
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Manual verify**

- Navigate to an animal detail → tap "+ Weight"
- Form opens with large numeric input and today's date
- Enter a weight (e.g. 320) → tap "Save Weight"
- Returns to animal detail; weight log "Weight: 320 kg" appears in the Weights section
- In farmOS admin at `https://farm.betail.local`, confirm the observation log exists under Records → Logs

- [ ] **Step 4: Commit**

```bash
git add src/livestock/WeighInForm.vue
git commit -m "feat: weigh-in form creating observation log with weight in kg"
```

---

## Task 6: Health Event form

**Files:**
- Create: `src/livestock/HealthEventForm.vue`

- [ ] **Step 1: Create HealthEventForm.vue**

Create `src/livestock/HealthEventForm.vue`:

```vue
<template>
  <farm-main>
    <app-bar-options title="Health Event" />
    <div class="form-container">
      <farm-card>
        <farm-stack space="s">

          <div class="field">
            <label class="field-label">Event Type *</label>
            <div class="type-buttons">
              <button
                v-for="t in eventTypes"
                :key="t.value"
                class="type-btn"
                :class="{ active: form.eventType === t.value }"
                @click="form.eventType = t.value"
              >{{ t.label }}</button>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Product / Notes</label>
            <textarea
              v-model="form.notes"
              class="form-control"
              rows="3"
              placeholder="e.g. 5-in-1 vaccine, 2 mL subcutaneous"
            ></textarea>
          </div>

          <div class="field">
            <label class="field-label">Date</label>
            <input v-model="form.date" type="date" class="form-control" />
          </div>

          <div class="field">
            <label class="field-label">Withdrawal Until (optional)</label>
            <input v-model="form.withdrawalDate" type="date" class="form-control" />
            <span class="field-hint">Leave blank if no withdrawal period</span>
          </div>

          <div v-if="error" class="alert alert-danger">{{ error }}</div>

          <button
            class="btn btn-primary btn-lg w-100"
            @click="save"
            :disabled="saving"
          >
            {{ saving ? 'Saving…' : 'Save Health Event' }}
          </button>

          <button class="btn btn-link w-100" @click="$router.back()">
            Cancel
          </button>

        </farm-stack>
      </farm-card>
    </div>
  </farm-main>
</template>

<script>
import { useRoute } from 'vue-router';
import useEntities from '../entities';

export default {
  name: 'HealthEventForm',
  setup() {
    const route = useRoute();
    const { add, commit, checkout } = useEntities();
    const animalId = route.params.id;
    const animal = checkout('asset', 'animal', animalId);
    return { add, commit, animal, animalId };
  },
  data() {
    return {
      saving: false,
      error: '',
      eventTypes: [
        { value: 'vaccination', label: 'Vaccination' },
        { value: 'treatment', label: 'Treatment' },
        { value: 'observation', label: 'Observation' },
      ],
      form: {
        eventType: 'vaccination',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        withdrawalDate: '',
      },
    };
  },
  methods: {
    async save() {
      this.saving = true;
      this.error = '';
      try {
        const [y, m, d] = this.form.date.split('-').map(Number);
        const timestamp = Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
        const animalName = this.animal.name || 'Animal';
        const label = this.eventTypes.find(t => t.value === this.form.eventType)?.label || 'Health';
        const logName = `${label}: ${animalName}`;

        // Build notes, appending withdrawal date if set
        let notesText = this.form.notes.trim();
        if (this.form.withdrawalDate) {
          const wdFormatted = new Date(this.form.withdrawalDate).toLocaleDateString();
          notesText += (notesText ? '\n' : '') + `Withdrawal until: ${wdFormatted}`;
        }

        const fields = {
          name: logName,
          timestamp,
          status: 'done',
          asset: [{ id: this.animalId, type: 'asset--animal' }],
        };
        if (notesText) {
          fields.notes = { value: notesText, format: 'default' };
        }

        const ref = this.add('log', 'activity', fields);
        await this.commit(ref);
        this.$router.push(`/animals/${this.animalId}`);
      } catch (e) {
        this.error = e.message || 'Failed to save. Try again.';
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.form-container {
  padding: var(--s);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--xxs);
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.field-hint {
  font-size: 0.8rem;
  color: var(--subtle);
}

.type-buttons {
  display: flex;
  gap: var(--xs);
}

.type-btn {
  flex: 1;
  padding: 0.65rem var(--xs);
  border: 2px solid var(--light);
  border-radius: 4px;
  background: var(--white);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.type-btn.active {
  border-color: var(--primary);
  background: var(--accent-primary);
  color: var(--primary);
}

.form-control {
  font-size: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--light);
  border-radius: 4px;
  background: var(--white);
  color: var(--dark);
  width: 100%;
}

.form-control:focus {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

textarea.form-control {
  resize: vertical;
  min-height: 5rem;
}

.btn-lg {
  padding: 0.85rem;
  font-size: 1.05rem;
}

.w-100 { width: 100%; }

.alert-danger {
  color: var(--red);
  background: var(--red-light);
  border-radius: 4px;
  padding: var(--xs) var(--s);
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Manual verify**

- Navigate to animal detail → tap "+ Health"
- Event type buttons: Vaccination / Treatment / Observation
- Fill product notes and optional withdrawal date → tap "Save Health Event"
- Returns to animal detail; log appears in "Health Events" section (e.g. "Vaccination: Test Cow")
- In farmOS admin → Records → Logs → confirm activity log created with correct asset and notes

- [ ] **Step 4: Offline smoke test**

- Open animal detail
- Enable airplane mode (or disable Wi-Fi)
- Add a weight → returns to detail, weight appears (from IDB — not synced yet)
- Re-enable network
- Refresh animal detail — weight log should still be present and now synced (visible in farmOS admin)

- [ ] **Step 5: Commit and push**

```bash
git add src/livestock/HealthEventForm.vue
git commit -m "feat: health event form with type/notes/withdrawal creating activity log"
git push origin develop
```

Vercel will auto-deploy. The full livestock UI is live.

---

## Verification Checklist

After all tasks complete, run this end-to-end check:

- [ ] Login from Vercel PWA to `farm.betail.local`
- [ ] Animals list shows (empty state when no animals)
- [ ] Tap + → create Cattle animal "Bessie" with DOB and tag
- [ ] Bessie appears in list; tap → detail screen shows species, sex, born, tag
- [ ] Add weight 350 kg → appears in Weights section with today's date
- [ ] Add vaccination "Deccovac 5-in-1", withdrawal 2 weeks → appears in Health Events
- [ ] Airplane mode → add weight 355 kg → appears locally
- [ ] Restore network → weight 355 kg syncs → visible in farmOS admin at `https://farm.betail.local`
- [ ] Log out → log in on another device → all records present
