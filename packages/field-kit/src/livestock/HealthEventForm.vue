<template>
  <farm-main>
    <app-bar-options title="Health Event" nav="back" />
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
    const animal = checkout('asset', 'asset--animal', animalId);
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

        const ref = this.add('log', 'log--activity', fields);
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
