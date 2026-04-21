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
          fields.birthdate = this.form.birthdate;
        }
        if (this.form.animalTypeId) {
          fields.animal_type = [{
            id: this.form.animalTypeId,
            type: 'taxonomy_term--animal_type',
          }];
        }
        if (this.form.tagId.trim()) {
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
