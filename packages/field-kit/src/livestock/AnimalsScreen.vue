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
import useEntities from '../entities';

export default {
  name: 'AnimalsScreen',
  setup() {
    const { checkout } = useEntities();
    const animals = checkout('asset', { type: 'asset--animal', status: 'active' });
    return { animals };
  },
  methods: {
    speciesName(animal) {
      const types = animal.animal_type;
      if (!types || !types.length) return '';
      return types[0]?.name || '';
    },
  },
};
</script>

<style scoped>
.animals-container {
  padding: var(--s);
  padding-bottom: 5rem;
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
