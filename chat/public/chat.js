const socket = io();

const sendBtn = document.getElementById("send");
const messageBox = document.getElementById("message");
const nameBox = document.getElementById("name");
const chatBox = document.getElementById("chat-box");

sendBtn.addEventListener("click", () => {
  const name = nameBox.value.trim();
  const msg = messageBox.value.trim();
  if (!name || !msg) return;

  socket.emit("chat message", `${name}: ${msg}`);
  messageBox.value = "";
});

socket.on("chat message", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

