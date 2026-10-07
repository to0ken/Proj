<script setup lang="ts">
import type { User } from "./types/user.ts";
import type { Message } from "./types/messages.ts";
import type { Reaction } from "./types/reactions.ts";
import type { Theme } from "./themes.ts";
import Database from "@tauri-apps/plugin-sql";

import MessageList from "./components/MessageList.vue";
import MessageComposer from "./components/MessageComposer.vue";
import EmojiPanel from "./components/EmojiPanel.vue";
import AppHeader from "./components/AppHeader.vue";
import AdTimer from "./components/AdTimer.vue";
import ThemeSwitcher from "./components/ThemeSwitcher.vue";

import { computed, onMounted, onUnmounted, ref } from "vue";

const currentTheme = ref<Theme>("rainbow");

const applyTheme = (theme: Theme) => {
  currentTheme.value = theme;
  document.documentElement.setAttribute("data-theme", theme);
};

// C:\Users\Komp7\Documents\koval\Proj\Proj\stupiqplonde
type EmojiTarget =
  | { kind: "composer" }
  | { kind: "reaction"; messageId: number };

const AVATARS_KEY = "avatars";
const users = ref<User[]>([
  { id: 1, name: "Oleg", avatar: "" },
  { id: 2, name: "Kirill", avatar: "" },
]);

const currentUser = ref<User>(users.value[0]);


const editingMessage = ref<Message | null>(null);

const showCelebration = ref(false);

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const confettiColors = ['#146ff5', '#dd1a8f', '#ee6f40', '#3adcc8', '#8154e2', '#8b4513'];
const coinColors = ['#ffd700', '#daa520', '#c0c0c0', '#dcdcdc'];

// Генерируем массивы для v-for (оптимизировано: 100 конфетти вместо 400 для производительности)
const confettiItems = Array.from({ length: 100 }, (_, i) => ({
  id: `c-${i}`,
  left: random(0, 100),
  width: random(5, 15),
  height: random(3, 6),
  color: confettiColors[random(0, 5)],
  delay: randomFloat(0, 2),
  duration: randomFloat(3, 5),
  rotation: random(0, 360)
}));

const coinItems = Array.from({ length: 30 }, (_, i) => ({
  id: `coin-${i}`,
  left: random(0, 100),
  size: random(20, 28),
  color: coinColors[random(0, 3)],
  delay: randomFloat(0, 3),
  duration: randomFloat(2, 4)
}));

const dollarItems = Array.from({ length: 50 }, (_, i) => ({
  id: `d-${i}`,
  left: random(0, 100),
  size: random(40, 80),
  delay: randomFloat(0, 3.5),
  duration: randomFloat(4, 8),
  rotationOrigin: `right ${random(-45, -15)}px`
}));

function triggerCelebration() {
  showCelebration.value = true;
  // Скрываем эффект через 6 секунд, чтобы он не работал вечно и не грузил память
  setTimeout(() => {
    showCelebration.value = false;
  }, 6000);
}

function startEditing(message: Message) {
  editingMessage.value = { ...message };
}

function cancelEditing() {
  editingMessage.value = null;
}

async function updateMessage(id: number, body: string) {
  if (!db) return;
  await db.execute(
      "UPDATE messages SET body = $1 WHERE id = $2",
      [body, id]
  );
  editingMessage.value = null;
  await loadChat();
}
function loadAvatars() {
  try {
    const saved = JSON.parse(localStorage.getItem(AVATARS_KEY) ?? "{}") as Record<
      string,
      string
    >;

    for (const user of users.value) {
      const avatar = saved[user.id];
      if (typeof avatar === "string") user.avatar = avatar;
    }
  } catch {
    return;
  }
}

function selectUser(user: User) {
  currentUser.value = user;
}

function setAvatar(user: User, path: string) {
  user.avatar = path;

  const saved: Record<number, string> = {};
  for (const item of users.value) {
    saved[item.id] = item.avatar;
  }
  localStorage.setItem(AVATARS_KEY, JSON.stringify(saved));
}

const messages = ref<Message[]>([]);
const reactions = ref<Reaction[]>([]);
const status = ref("Подключение...");
const emojiTarget = ref<EmojiTarget | null>(null);
const composerInsertEmoji = ref<string | null>(null);

let db: Database | null = null;

const emojiPanelTitle = computed(() => {
  if (emojiTarget.value?.kind === "reaction") {
    return "Реакция на сообщение";
  }

  return "Вставить в сообщение";
});

async function loadMessages(/*chat_id: number*/) {
  if (!db) return;

  messages.value = await db.select<Message[]>(
    "SELECT id, author, type, body, attachment, created_at FROM messages ORDER BY id ASC",
      /*[chat_id]*/
  );
}

async function loadReactions() {
  if (!db) return;

  reactions.value = await db.select<Reaction[]>(
    "SELECT id, message_id, emoji, author FROM message_reactions ORDER BY id ASC",
  );
}

async function loadChat() {
  await Promise.all([loadMessages(), loadReactions()]);
}

async function sendMessage(body: string) {
  if (!db) return;

  await db.execute("INSERT INTO messages (author, body) VALUES ($1, $2)", [
    currentUser.value.name,
    body,
  ]);
  await loadChat();

  triggerCelebration();
}

async function toggleReaction(messageId: number, emoji: string) {
  if (!db) return;

  const existing = reactions.value.find(
    (reaction) =>
      reaction.message_id === messageId &&
      reaction.emoji === emoji &&
      reaction.author === currentUser.value.name,
  );

  if (existing) {
    await db.execute("DELETE FROM message_reactions WHERE id = $1", [
      existing.id,
    ]);
  } else {
    try {
      await db.execute(
        "INSERT INTO message_reactions (message_id, emoji, author) VALUES ($1, $2, $3)",
        [messageId, emoji, currentUser.value.name],
      );
    } catch (error) {
      console.error(error);
    }
  }

  await loadReactions();
}

function closeEmojiPanel() {
  emojiTarget.value = null;
}

function openComposerEmoji() {
  if (emojiTarget.value?.kind === "composer") {
    closeEmojiPanel();
    return;
  }

  emojiTarget.value = { kind: "composer" };
}

function openReactionEmoji(messageId: number) {
  if (
    emojiTarget.value?.kind === "reaction" &&
    emojiTarget.value.messageId === messageId
  ) {
    closeEmojiPanel();
    return;
  }

  emojiTarget.value = { kind: "reaction", messageId };
}

function onEmojiSelect(emoji: string) {
  const target = emojiTarget.value;
  if (!target) return;

  if (target.kind === "composer") {
    composerInsertEmoji.value = emoji;
    return;
  }

  closeEmojiPanel();
  void toggleReaction(target.messageId, emoji);
}

function onEmojiInserted() {
  composerInsertEmoji.value = null;
}

// async function sendImage(path: string){
//   if(!db)
//     return;
//   if (!activeChat.value)
//     return;
//
//   await db.execute(
//       `
//       INSERT INTO messages
//           (
//            chat_id,
//            author,
//            type,
//            body,
//            attachment
//           )
//
//         VALUES
//             (
//              $1,
//              $2,
//              $3,
//              $4,
//              $5
//             )
//       `,
//       [
//           activeChat.value.id,
//           currentUser.value.name,
//           "image",
//           null,
//           path
//       ]
//   );
//
//   await loadMessages(
//       activeChat.value.id
//   )
// }

function onDocumentPointerDown(event: PointerEvent) {
  if (!emojiTarget.value) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  if (
    target.closest(".emoji-panel, .composer, .quick-reactions, .reaction")
  ) {
    return;
  }

  closeEmojiPanel();
}
function onAdClosed() {
  console.log("Реклама закрыта, таймер перезапущен");
}

onMounted(async () => {
  loadAvatars();
  window.addEventListener("pointerdown", onDocumentPointerDown);

  try {
    db = await Database.load("sqlite:messanger.db");
    await db.execute("PRAGMA foreign_keys = ON");
    await loadChat();
    status.value = "История сохраняется локально";
  } catch (error) {
    console.error(error);
    status.value = "Ошибка подключения к базе";
  }
});

onUnmounted(() => {
  window.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <main class="app" :data-theme="currentTheme">>
    <div class="top-bar">
      <ThemeSwitcher @theme-changed="applyTheme" />
    </div>


    <AdTimer
        :time-to-ad=" 10 * 60"
        :wait-time="10"
        @ad-closed="onAdClosed"
    />

    <AppHeader
        :status="status"
        :users="users"
        :current-user="currentUser"
        @select="selectUser"
        @set-avatar="setAvatar"
    />
    <section class="chat">
      <div class="chat-info">
        <h2>Первый чат</h2>
        <p>локальный мессенджер</p>
      </div>
      <MessageList
          :messages="messages"
          :reactions="reactions"
          :users="users"
          :current-user-name="currentUser.name"
          :reaction-message-id="emojiTarget?.kind === 'reaction' ? emojiTarget.messageId : null"
          :editing-message-id="editingMessage?.id ?? null"
          @toggle-reaction="toggleReaction"
          @request-reaction="openReactionEmoji"
          @request-edit="startEditing"
      />
      <EmojiPanel
          v-if="emojiTarget"
          :title="emojiPanelTitle"
          @select="onEmojiSelect"
          @close="closeEmojiPanel"
      />
      <MessageComposer
          :insert-emoji="composerInsertEmoji"
          :emoji-open="emojiTarget?.kind === 'composer'"
          :editing-message="editingMessage"
          @send="sendMessage"
          @update="updateMessage"
          @cancel-edit="cancelEditing"
          @request-emoji="openComposerEmoji"
          @emoji-inserted="onEmojiInserted"
      />


    </section>

    <div v-if="showCelebration" class="celebration-container">
      <!-- Монеты -->
      <div
          v-for="item in coinItems"
          :key="item.id"
          class="falling-coin"
          :style="{
          left: item.left + '%',
          width: item.size + 'px',
          height: item.size + 'px',
          backgroundColor: item.color,
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's'
        }"
      >
        <span>$</span>
      </div>

      <div
          v-for="item in dollarItems"
          :key="item.id"
          class="falling-dollar"
          :style="{
          left: item.left + '%',
          width: item.size + 'px',
          height: item.size + 'px',
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's',
          transformOrigin: item.rotationOrigin
        }"
      ></div>

      <!-- Конфетти -->
      <div
          v-for="item in confettiItems"
          :key="item.id"
          class="falling-confetti"
          :style="{
          left: item.left + '%',
          width: item.width + 'px',
          height: item.height + 'px',
          backgroundColor: item.color,
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's',
          transform: `rotate(${item.rotation}deg)`
        }"
      ></div>
    </div>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
:global(html[data-theme="rainbow"]) {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #f09819, #ee7752);
  background-size: 400% 400%;
  animation: rainbow-gradient 15s ease infinite;
}

:global(html[data-theme="pink"]) {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
}

:global(html[data-theme="blue"]) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@keyframes rainbow-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

:global(body) {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f2f3f5;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/*  ВЕРХНЯЯ ПАНЕЛЬ С ПЕРЕКЛЮЧАТЕЛЕМ ТЕМ */
.top-bar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-info {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(143, 150, 163, 0.5);
}

.chat-info h2 {
  margin: 0;
  font-size: 16px;
}

.chat-info p {
  margin: 5px 0 0;
  color: #cfd2d9;
  font-size: 13px;
}


</style>


