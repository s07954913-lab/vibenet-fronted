const socket = io();
let myUsername = '';
let typingTimeout;

function joinChat() {
  const input = document.getElementById('usernameInput');
  const username = input.value.trim();
  if (!username) { input.style.borderColor = 'red'; return; }
  myUsername = username;
  socket.emit('join', username);
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('chatScreen').classList.remove('hidden');
  document.getElementById('myName').textContent = '👤 ' + username;
  document.getElementById('messageInput').focus();
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message) return;
  socket.emit('send_message', { message });
  socket.emit('stop_typing');
  input.value = '';
  clearTimeout(typingTimeout);
}

function handleKey(e) { if (e.key === 'Enter') sendMessage(); }

function handleTyping() {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => { socket.emit('stop_typing'); }, 1500);
}

socket.on('receive_message', (data) => {
  const isMe = data.username === myUsername;
  const messages = document.getElementById('messages');
  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${isMe ? 'me' : 'other'}`;
  if (!isMe) {
    const name = document.createElement('div');
    name.className = 'msg-username';
    name.textContent = data.username;
    wrapper.appendChild(name);
  }
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = data.message;
  wrapper.appendChild(bubble);
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = data.time;
  wrapper.appendChild(time);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('user_joined', (data) => { addSystemMessage(data.message); updateUserList(data.users); });
socket.on('user_left', (data) => { addSystemMessage(data.message); updateUserList(data.users); });
socket.on('user_typing', (username) => { document.getElementById('typingIndicator').textContent = `✍️ ${username} likh raha hai...`; });
socket.on('stop_typing', () => { document.getElementById('typingIndicator').textContent = ''; });

function addSystemMessage(text) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function updateUserList(users) {
  const ul = document.getElementById('userList');
  ul.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = '🟢 ' + user;
    if (user === myUsername) li.style.color = '#6c63ff';
    ul.appendChild(li);
  });
}

document.getElementById('usernameInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinChat();
});