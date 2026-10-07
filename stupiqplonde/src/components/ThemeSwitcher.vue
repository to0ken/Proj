<script setup lang="ts">
import { ref, onMounted } from "vue";
import { themes, type Theme, getSavedTheme, saveTheme } from "../themes";

const emit = defineEmits<{
  themeChanged: [theme: Theme];
}>();

const currentTheme = ref<Theme>(getSavedTheme());
const isOpen = ref(false);

const selectTheme = (theme: Theme) => {
  currentTheme.value = theme;
  saveTheme(theme);
  emit("themeChanged", theme);
  isOpen.value = false;
};

onMounted(() => {
  emit("themeChanged", currentTheme.value); // сохран темы
});
</script>

<template>
  <div class="theme-switcher">
    <button class="theme-btn" @click="isOpen = !isOpen">
      <span class="theme-emoji">{{ themes[currentTheme].emoji }}</span>
      <span class="theme-name">{{ themes[currentTheme].name }}</span>
    </button>

    <div v-if="isOpen" class="theme-dropdown">
      <button
          v-for="(config, key) in themes"
          :key="key"
          class="theme-option"
          :class="{ 'theme-option--active': key === currentTheme }"
          @click="selectTheme(key as Theme)"
      >
        <span class="theme-option-emoji">{{ config.emoji }}</span>
        <span>{{ config.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
}

.theme-emoji {
  font-size: 18px;
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(30, 30, 47, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  min-width: 180px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-option--active {
  background: rgba(255, 255, 255, 0.15);
  font-weight: 600;
}

.theme-option-emoji {
  font-size: 18px;
}
</style>