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
    const animal = checkout('asset', 'animal', animalId);
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
