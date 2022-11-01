let localPeer;
let remotePeer;
let localStream
const startButton = querySelector('button#startButton')
const sendButton = querySelector('button#callButton')
const closeButton = querySelector('button#hangupButton')
startButton.onclick = start
sendButton.onclick = call
closeButton.onclick = close

function start() {
  const constraints = {
    video: true,
    audio: false,
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return
  } else {
    navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream)

    btnStart.disabled = true
    btnCall.disabled = false
    btnHangup.disabled = true
  }
}

function gotMediaStream(stream) {
  localVideo.srcObject = stream
  localStream = stream
}

function call() {
  const offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
  }

  localPeer = new RTCPeerConnection()
  remotePeer = new RTCPeerConnection()

  localPeer.onicecandidate = (e) => {
    remotePeer.addIceCandidate(e.candidate)
    console.log('localPeer ICE candidate:', e.candidate)
  }

  remotePeer.onicecandidate = (e) => {
    localPeer.addIceCandidate(e.candidate)
    console.log('remotePeer ICE candidate:', e.candidate)
  }

  remotePeer.ontrack = gotRemoteStream

  localStream.getTracks().forEach((track) => {
    localPeer.addTrack(track, localStream)
  })

  //after create localpeer offer update localDescription first
  localPeer.createOffer(offerOptions).then(gotLocalDescription)

  btnCall.disabled = true
  btnHangup.disabled = false
}

function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0]
  }
}

function gotLocalDescription(desc) {
  localPeer.setLocalDescription(desc)
  // 2. 通過 Signaling server 將包含 Bob SDP 的offer 發送給 Alice
  // 3. Alice 收到 offer 後呼叫 setRemoteDescription 設定 Bob 的 SDP
  remotePeer.setRemoteDescription(desc)
  // 4. Alice 呼叫 RTCPeerConnection.createAnswer 建立一個 answer
  remotePeer.createAnswer().then(gotAnswerDescription)
}

function gotAnswerDescription(desc) {
  remotePeer.setLocalDescription(desc)
  // 5. 通過 Signaling server 將包含 Alice SDP 的 answer 發送給 Bob
  // 6. Bob 收到 answer  後呼叫 setRemoteDescription 設定 Alice 的SDP
  localPeer.setRemoteDescription(desc)
}

function close() {
  localPeer.close()
  remotePeer.close()
  localPeer = null
  remotePeer = null

  btnCall.disabled = false
  btnHangup.disabled = true
}