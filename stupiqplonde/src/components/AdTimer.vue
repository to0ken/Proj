<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  timeToAd?: number; // Время до рекламы в секундах (по умолчанию 5 минут)
  waitTime?: number; // Время ожидания перед закрытием в секундах (по умолчанию 10)
}>();

const emit = defineEmits<{
  adClosed: []; // Событие: реклама закрыта
}>();

const TIME_TO_AD = props.timeToAd ?? 10*60;
const WAIT_TIME = props.waitTime ?? 10;

const timeToAd = ref(TIME_TO_AD);
const showAd = ref(false);
const waitTime = ref(WAIT_TIME);

let adTimer: ReturnType<typeof setInterval> | null = null;
let waitTimer: ReturnType<typeof setInterval> | null = null;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const startAdTimer = () => {
  if (adTimer) clearInterval(adTimer);
  adTimer = setInterval(() => {
    if (timeToAd.value > 0) {
      timeToAd.value--;
    } else {
      showAd.value = true;
      startWaitTimer();
      clearInterval(adTimer!);
    }
  }, 1000);
};

const startWaitTimer = () => {
  if (waitTimer) clearInterval(waitTimer);
  waitTimer = setInterval(() => {
    if (waitTime.value > 0) {
      waitTime.value--;
    } else {
      clearInterval(waitTimer!);
    }
  }, 1000);
};

const closeAd = () => {
  if (waitTime.value > 0) return;
  showAd.value = false;
  timeToAd.value = TIME_TO_AD;
  waitTime.value = WAIT_TIME;
  startAdTimer();
  emit("adClosed");
};

onMounted(() => {
  startAdTimer();
});

onUnmounted(() => {
  if (adTimer) clearInterval(adTimer);
  if (waitTimer) clearInterval(waitTimer);
});
</script>

<template>
  <!-- ⏰ ТАЙМЕР -->
  <div v-if="!showAd" class="ad-timer">
    <span class="timer-label">Реклама через:</span>
    <span class="timer-value">{{ formatTime(timeToAd) }}</span>
  </div>

  <!--  РЕКЛАМНЫЙ БАННЕР -->
  <div v-if="showAd" class="ad-overlay">
    <div class="ad-banner">
      <h2 class="ad-title"> Премиум-версия мессенджера</h2>

      <ul class="ad-features">
        <li>✨ Без рекламы навсегда</li>
        <li>🎨 Уникальные темы оформления</li>
        <li>📎 Неограниченный размер файлов</li>
        <li>🔒 Шифрование сообщений</li>
        <li>⚡ Приоритетная поддержка</li>
      </ul>

      <p class="ad-price">
        Всего <strong>299 ₽</strong> в месяц
      </p>

      <p class="ad-subtext">
        Купите премиум, чтобы это окно больше никогда не появлялось
      </p>

      <div class="ad-footer">
        <p v-if="waitTime > 0" class="wait-message">
          Кнопка закрытия будет доступна через:
          <strong class="wait-time">{{ waitTime }} сек</strong>
        </p>

        <button
            class="close-btn"
            :disabled="waitTime > 0"
            @click="closeAd"
        >
          {{ waitTime > 0 ? `Подождите ${waitTime} сек...` : 'Закрыть (X)' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ⏰ СТИЛИ ТАЙМЕРА */
.ad-timer {
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  text-align: center;
  border-bottom: 3px solid #ff0000;
  animation: pulse-border 2s infinite;
}

.timer-label {
  font-size: 18px;
  color: #fff;
  margin-right: 15px;
}

.timer-value {
  font-size: 48px;
  font-weight: bold;
  color: #ff0000;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  animation: blink 1s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-bottom-color: #ff0000; }
  50% { border-bottom-color: #ff6600; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 📢 СТИЛИ РЕКЛАМНОГО БАННЕРА */
.ad-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ad-banner {
  background: linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%);
  border: 3px solid #e73c7e;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.ad-title {
  margin: 0 0 24px;
  font-size: 28px;
  color: #23d5ab;
}

.ad-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
}

.ad-features li {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  color: #e0e0e0;
}

.ad-features li:last-child {
  border-bottom: none;
}

.ad-price {
  font-size: 20px;
  color: #ffeb3b;
  margin: 20px 0 10px;
}

.ad-price strong {
  font-size: 32px;
  color: #ff9800;
}

.ad-subtext {
  color: #8f96a3;
  font-size: 14px;
  margin-bottom: 24px;
}

.ad-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.wait-message {
  color: #ff9800;
  font-size: 16px;
  margin-bottom: 16px;
}

.wait-time {
  color: #ffeb3b;
  font-size: 20px;
  font-family: monospace;
}

.close-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:disabled {
  background: #3a3a50;
  color: #6b7280;
  cursor: not-allowed;
}

.close-btn:not(:disabled) {
  background: linear-gradient(90deg, #e73c7e, #ee7752);
  color: white;
  box-shadow: 0 4px 15px rgba(231, 60, 126, 0.4);
}

.close-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 60, 126, 0.6);
}
</style>