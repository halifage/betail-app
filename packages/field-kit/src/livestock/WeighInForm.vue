<template>
  <farm-main>
    <app-bar-options title="Add Weight" nav="back" />
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
    const animal = checkout('asset', 'asset--animal', animalId);
    return { add, commit, animal, animalId };
  },
  data() {
    return {
      saving: false,
      error: '',
      form: {
        weight: '',
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
        const [y, m, d] = this.form.date.split('-').map(Number);
        const timestamp = Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
        const animalName = this.animal.name || 'Animal';
        const ref = this.add('log', 'log--observation', {
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
