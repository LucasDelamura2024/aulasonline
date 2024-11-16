const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Acessar a câmera e o microfone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;

    socket.on('offer', (offer) => {
      peerConnection = new RTCPeerConnection(configuration);
      peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      peerConnection.addStream(localStream);

      peerConnection.createAnswer()
        .then(answer => {
          peerConnection.setLocalDescription(answer);
          socket.emit('answer', answer);
        });

      peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
      };
    });

    socket.on('answer', (answer) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('candidate', (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };
  })
  .catch(error => console.error('Erro ao acessar mídia:', error));

// Chat em tempo real
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
});
