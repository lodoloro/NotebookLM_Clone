function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendQuestion() {

    const input = document.getElementById("question");

    const question = input.value.trim();

    if(question === "") return;

    addMessage("user", question);

    input.value = "";

    const thinking = addThinkingMessage();

    const response = await fetch("/ask", {

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            question
        })

    });

    thinking.remove();

const data = await response.json();

const bubble = addMessage("assistant", "");

await typeMessage(bubble, data.answer);

}

function addMessage(role, text){

    const chat = document.getElementById("chatMessages");

    const welcome = chat.querySelector(".welcome");

    if(welcome){

        welcome.remove();

    }

    const message = document.createElement("div");

    message.className = `message ${role}`;

    message.innerHTML = `

        <div class="bubble">

            ${text}

        </div>

    `;

chat.appendChild(message);

chat.scrollTop = chat.scrollHeight;

return message.querySelector(".bubble");

}

async function uploadFile(file = null) {

    const fileInput = document.getElementById("pdfFile");
    const status = document.getElementById("uploadStatus");

    // If no file was passed (clicked Upload button),
    // use the selected file from the file input.
    if (!file) {
        file = fileInput.files[0];
    }

    if (!file) {
        status.textContent = "Please select a file first.";
        return;
    }

    const formData = new FormData();

    formData.append("pdf", file);

    setUploadStatus("📤 Uploading document...");

const response = await fetch("/upload", {
    method: "POST",
    body: formData
});

setUploadStatus("🔍 Processing document...");
await sleep(350);

setUploadStatus("🧠 Creating AI embeddings...");
await sleep(350);

setUploadStatus("💾 Saving document...");
await sleep(250);

const data = await response.json();

if (response.ok) {

    setUploadStatus("✅ Upload complete!");

setTimeout(() => {

    setUploadStatus("");

}, 2500);

    loadDocuments();

} else {

    setUploadStatus("❌ Upload failed: " + data.error);

}
}

async function loadDocuments() {

    const response = await fetch("/documents");

    const documents = await response.json();

    const list = document.getElementById("documentList");

    list.innerHTML = "";

    documents.forEach(doc => {

        const div = document.createElement("div");

        div.className = "document";

div.innerHTML = `
    <span class="document-name" title="${doc.filename}">
        ${doc.filename}
    </span>

    <button onclick="deleteDocument(${doc.id})">
        🗑️
    </button>
`;

        list.appendChild(div);

    });

}


async function deleteDocument(id) {

    if (!confirm("Delete this document?")) {
        return;
    }

    const response = await fetch(`/documents/${id}`, {
        method: "DELETE"
    });

    const data = await response.json();

    alert(data.message);

    loadDocuments();

}

function addThinkingMessage() {

    const chat = document.getElementById("chatMessages");

    const message = document.createElement("div");

    message.className = "message assistant";

    message.innerHTML = `
        <div class="bubble thinking">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    return message;

}

async function typeMessage(element, text, speed = 18) {

    element.textContent = "";

    let i = 0;

    while (i < text.length) {

        element.textContent += text.charAt(i);

        i++;

        element.parentElement.parentElement.scrollTop =
            element.parentElement.parentElement.scrollHeight;

        await sleep(speed);

    }

}

const dragOverlay = document.getElementById("dragOverlay");


document.addEventListener("dragover", (e) => {

    e.preventDefault();

    dragOverlay.style.display = "flex";

});


document.addEventListener("dragleave", (e) => {

    if (e.clientX === 0 && e.clientY === 0) {
        dragOverlay.style.display = "none";
    }

});


document.addEventListener("drop", (e) => {

    e.preventDefault();

    dragOverlay.style.display = "none";


    const file = e.dataTransfer.files[0];


    if(file){

        uploadFile(file);

    }

});

document.getElementById("question").addEventListener("keydown", function(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendQuestion();

    }

});

function setUploadStatus(text) {
    document.getElementById("uploadStatus").textContent = text;
}

loadDocuments();

fetch("/new-chat", {
    method: "POST"
});

let cameraStream;

async function openCamera(){

    cameraStream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                facingMode:"environment"
            }

        });

    const video = document.getElementById("cameraVideo");

    video.srcObject = cameraStream;

    document.getElementById("cameraModal").style.display = "flex";

}

function closeCamera(){

    if(cameraStream){

        cameraStream.getTracks().forEach(track=>track.stop());

    }

    document.getElementById("cameraModal").style.display="none";

}

async function capturePhoto(){

    const video = document.getElementById("cameraVideo");

    const canvas = document.getElementById("cameraCanvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas
        .getContext("2d")
        .drawImage(video,0,0);

    canvas.toBlob(async blob=>{

        const file = new File(

            [blob],

            "camera_scan.png",

            {

                type:"image/png"

            }

        );

        closeCamera();

        await uploadFile(file);

    });

}