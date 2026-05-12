// ==================== 改这2个 ====================
const SITE_PWD = "07101209"; // 改成你自己的网页访问密码
const WORKER_URL = "https://broken-shape-4b33.wylleomessi.workers.dev"; // 你的Cloudflare地址
// =================================================

let messages = [];

function checkPwd() {
const val = document.getElementById("pwdInput").value.trim();
if (val === SITE_PWD) {
document.getElementById("loginWrap").style.display = "none";
document.getElementById("chatWrap").style.display = "flex";
} else {
alert("密码错误");
}
}

function toggleDark() {
document.body.classList.toggle("dark");
}

function clearChat() {
messages = [];
document.getElementById("msgBox").innerHTML = "";
}

function addMsg(html, isUser) {
const box = document.getElementById("msgBox");
const div = document.createElement("div");
div.className = isUser ? "msg-item user-msg" : "msg-item bot-msg";
div.innerHTML = html;
box.appendChild(div);
box.scrollTop = box.scrollHeight;
return div;
}

function copyText(txt) {
navigator.clipboard.writeText(txt);
alert("已复制");
}

async function uploadFile() {
const file = document.getElementById("fileInput").files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = async function(e) {
let text = "";
if (file.name.endsWith(".txt")) {
text = e.target.result;
} else if (file.name.endsWith(".docx")) {
const res = await mammoth.extractRawText({ arrayBuffer: e.target.result });
text = res.value;
}
if (text.length > 45000) text = text.slice(0, 45000);
document.getElementById("userInput").value = text;
};
file.name.endsWith(".txt") ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
}

async function sendMsg() {
const input = document.getElementById("userInput");
const text = input.value.trim();
if (!text) return;
input.value = "";
addMsg(`<div class="msg-content">${text}</div>`, true);
messages.push({ role: "user", content: text });

const aiDom = addMsg(`<div class="msg-content">思考中...</div>`, false);
const contentDom = aiDom.querySelector(".msg-content");
contentDom.innerText = "";
let fullText = "";

try {
const res = await fetch(WORKER_URL, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ messages })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
const { done, value } = await reader.read();
if (done) break;
const chunk = decoder.decode(value);
const lines = chunk.split("\n").filter(i => i.startsWith("data: "));
for (let line of lines) {
const data = line.replace("data: ", "").trim();
if (data === "[DONE]") continue;
try {
const json = JSON.parse(data);
if (json.choices?.[0]?.delta?.content) {
fullText += json.choices[0].delta.content;
contentDom.innerText = fullText;
}
} catch (e) {}
}
}
aiDom.innerHTML = `<div class="msg-content">${fullText}</div><div class="copy-btn" onclick="copyText(\`${fullText}\`)">复制</div>`;
messages.push({ role: "assistant", content: fullText });
} catch (e) {
contentDom.innerText = "请求失败，请重试";
}
}

document.getElementById("userInput").addEventListener("keydown", e => {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
sendMsg();
}
});
