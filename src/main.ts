import './style.css'
import { bootstrapCameraKit } from '@snap/camera-kit';
import QRCode from 'qrcode';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
// Source - https://stackoverflow.com/a/18479644
// Posted by user1693593, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-10, License - CC BY-SA 3.0



// ─── Main ─────────────────────────────────────────────────────────────────────
(async function () {

  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzczMTUwNzIzLCJzdWIiOiIyNmFhNmQwNi1kODNlLTRmMDEtOTRkMy1lYzE5NjYwMTdjYjV-U1RBR0lOR342NGU4NDc5Yy1iNDA2LTRiNzEtOWQ0Zi0zYmU2OTIyMmQzOWUifQ.NPvAHAl-kW3OP42J5dAIkw0_nLL2B6WjTmcCHt-iOTY'
  });

  const liveRenderTarget = document.getElementById('canvas') as HTMLCanvasElement;

  const session = await cameraKit.createSession({ liveRenderTarget });

  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width:  { ideal: 720 },
      height: { ideal: 1280 },
      aspectRatio: 9 / 16,
    },
  });

  document.addEventListener('click', () => {
    document.documentElement.requestFullscreen();
  });

  await session.setSource(mediaStream);
  await session.play();

  
  const lens = await cameraKit.lensRepository.loadLens(
    'f48ab852-ba11-4a0a-af12-b64a4701a00a',
    '7e39b6a3-2fab-4ad0-80d7-be024c517e7d'
  );
  await session.applyLens(lens);


  

  ////// CAROUSELLLLLLLLLLLLLLLL//////
  // Load all lenses in the group
// const { lenses, errors } = await cameraKit.lensRepository.loadLensGroups([
//   '7e39b6a3-2fab-4ad0-80d7-be024c517e7d'
// ]);
// if (errors.length) console.warn('Some lenses failed to load:', errors);

// // Pre-cache all for faster switching
// await cameraKit.lensRepository.cacheLensContent(lenses);

// // Apply first lens by default
// let currentIndex = 0;
// if (lenses.length > 0) await session.applyLens(lenses[0]);

// // Build carousel
// const carousel   = document.getElementById('carousel')     as HTMLElement;
// const arrowLeft  = document.getElementById('arrow-left')   as HTMLButtonElement;
// const arrowRight = document.getElementById('arrow-right')  as HTMLButtonElement;

// lenses.forEach((lens, index) => {
//   const card = document.createElement('div');
//   card.className = 'lens-card' + (index === 0 ? ' active' : '');

//   // Thumbnail
//   const iconUrl = lens.icons?.[0]?.imageUrl ?? '';
//   if (iconUrl) {
//     const img = document.createElement('img');
//     img.src = iconUrl;
//     img.alt = lens.name;
//     card.appendChild(img);
//   } else {
//     card.style.fontSize = '28px';
//     card.textContent = '🎭';
//   }

//   // Name label
//   const label = document.createElement('div');
//   label.className = 'lens-name';
//   label.textContent = lens.name;
//   card.appendChild(label);

//   card.addEventListener('click', async () => {
//     if (index === currentIndex) return;
//     currentIndex = index;

//     // Update active card
//     document.querySelectorAll('.lens-card').forEach((c, i) => {
//       c.classList.toggle('active', i === index);
//     });

//     // Scroll into view
//     card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

//     await session.applyLens(lenses[index]);
//   });

//   carousel.appendChild(card);
// });


// Arrow scroll
// arrowLeft.addEventListener('click',  () => carousel.scrollBy({ left: -160, behavior: 'smooth' }));
// arrowRight.addEventListener('click', () => carousel.scrollBy({ left:  160, behavior: 'smooth' }));
////// END OF CAROUSELLL /////////
  // ── Resize canvas ─────────────────────────────────────────────────────────
  function resizeCanvas() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const ratio   = 9 / 16;
    if (screenW / screenH > ratio) {
      liveRenderTarget.style.height = '100vh';
      liveRenderTarget.style.width  = `${screenH * ratio}px`;
      liveRenderTarget.style.left   = `${(screenW - screenH * ratio) / 2}px`;
    } else {
      liveRenderTarget.style.width  = '100vw';
      liveRenderTarget.style.height = `${screenW / ratio}px`;
      liveRenderTarget.style.top    = '0';
      liveRenderTarget.style.left   = '0';
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
 
  // ── UI elements ───────────────────────────────────────────────────────────
  const status           = document.getElementById('status')            as HTMLElement;
  const qrPanel          = document.getElementById('qr-panel')          as HTMLElement;
  const qrCanvas         = document.getElementById('qr-canvas')         as HTMLCanvasElement;
  const countdown        = document.getElementById('countdown')         as HTMLElement;
  const handCursor       = document.getElementById('hand-cursor')       as HTMLElement;
  const victoryIndicator = document.getElementById('victory-indicator') as HTMLElement;
  const thumbsCountdown  = document.getElementById('thumbs-countdown')  as HTMLElement;
//  const debugOverlay     = document.getElementById('debug-overlay')     as HTMLElement;
 
  // ── Auto-close QR ─────────────────────────────────────────────────────────
  let autoCloseTimer:    ReturnType<typeof setTimeout>;
  let countdownInterval: ReturnType<typeof setInterval>;
 
  function startAutoClose() {
    clearTimeout(autoCloseTimer);
    clearInterval(countdownInterval);
    let secondsLeft = 30;
    countdown.textContent = `Closing in ${secondsLeft}s`;
    countdownInterval = setInterval(() => {
      secondsLeft--;
      countdown.textContent = `Closing in ${secondsLeft}s`;
      if (secondsLeft <= 0) clearInterval(countdownInterval);
    }, 1000);
    autoCloseTimer = setTimeout(() => {
      qrPanel.classList.remove('visible');
      clearInterval(countdownInterval);
    }, 30_000);
  }
 
  // ── Capture ───────────────────────────────────────────────────────────────
  let isCapturing = false;
 
  async function doCapture() {
    if (isCapturing) return;
    isCapturing = true;
    status.textContent = '⏳ Uploading...';
    try {
      const imageBase64 = await captureFrame(liveRenderTarget);
      const publicUrl   = await uploadToImgBB(imageBase64);
      await QRCode.toCanvas(qrCanvas, publicUrl, { width: 120, margin: 1, errorCorrectionLevel: 'Q' });
      qrCanvas.style.width  = '120px';
      qrCanvas.style.height = '120px';
      qrPanel.classList.add('visible');
      status.textContent = '';
      startAutoClose();
    } catch (err) {
      console.error(err);
      status.textContent = '❌ Upload failed.';
    } finally {
      isCapturing = false;
    }
  }
 
  // ── Victory countdown ─────────────────────────────────────────────────────
  let countdownActive   = false;
  let victoryStartTime: number | null = null;
  const VICTORY_HOLD_MS = 2000;
 
  function startCountdownCapture() {
    if (countdownActive || isCapturing) return;
    countdownActive = true;
    victoryIndicator.style.display = 'none';
 
    let secondsLeft = 3;
    thumbsCountdown.style.display = 'block';
    thumbsCountdown.textContent   = String(secondsLeft);
 
    const tick = setInterval(() => {
      secondsLeft--;
      thumbsCountdown.style.animation = 'none';
      thumbsCountdown.offsetHeight;
      thumbsCountdown.style.animation = 'pop 0.3s ease-out';
 
      if (secondsLeft > 0) {
        thumbsCountdown.textContent = String(secondsLeft);
      } else {
        clearInterval(tick);
        thumbsCountdown.textContent = '📸';
        setTimeout(() => {
          thumbsCountdown.style.display = 'none';
          countdownActive = false;
          doCapture();
        }, 400);
      }
    }, 1000);
  }
 
  // ── Hand Detection setup ──────────────────────────────────────────────────
  const inputVideo = document.getElementById('input-video') as HTMLVideoElement;
  inputVideo.srcObject = mediaStream;
 
  try {
    await inputVideo.play();
    console.log('✅ inputVideo playing');
  } catch (e) {
    console.error('❌ inputVideo play failed:', e);
    return;
  }
 
  await new Promise<void>(resolve => {
    const check = () => {
      if (inputVideo.readyState >= 2 && inputVideo.currentTime > 0) {
        console.log('✅ inputVideo has frames');
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
 
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  );
 
  let handLandmarker: HandLandmarker;
  try {
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence:  0.5,
      minTrackingConfidence:      0.5,
    });
    console.log('✅ HandLandmarker GPU');
  } catch {
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence:  0.5,
      minTrackingConfidence:      0.5,
    });
    console.log('✅ HandLandmarker CPU');
  }
 
  // ── Victory sign detector — RELAXED thresholds ───────────────────────────
  function isVictorySign(landmarks: any[]): boolean {
    const indexTip  = landmarks[8];
    const indexMcp  = landmarks[5];
    const middleTip = landmarks[12];
    const middleMcp = landmarks[9];
    const ringTip   = landmarks[16];
    const ringPip   = landmarks[14];
    const pinkyTip  = landmarks[20];
    const pinkyPip  = landmarks[18];
    // const thumbTip  = landmarks[4];
    // const thumbIp   = landmarks[3];
 
    // Extended: tip is higher (lower Y value) than mcp
    // Relaxed threshold from 0.08 → 0.04 to be more forgiving
    const indexUp     = indexTip.y  < indexMcp.y  - 0.04;
    const middleUp    = middleTip.y < middleMcp.y - 0.04;
 
    // Curled: tip is lower (higher Y value) than pip
    const ringCurled  = ringTip.y  > ringPip.y  - 0.02;
    const pinkyCurled = pinkyTip.y > pinkyPip.y - 0.02;
    // const thumbCurled = thumbTip.y > thumbIp.y  - 0.02;
 const thumbCurled = true;
    return indexUp && middleUp && ringCurled && pinkyCurled && thumbCurled;
  }
 
  // ── Detection loop ────────────────────────────────────────────────────────
  let lastVideoTime = -1;
 
  function detectHands() {
    if (inputVideo.readyState < 2) { requestAnimationFrame(detectHands); return; }
    if (inputVideo.currentTime === lastVideoTime) { requestAnimationFrame(detectHands); return; }
    lastVideoTime = inputVideo.currentTime;
 
    const now     = performance.now();
    const results = handLandmarker.detectForVideo(inputVideo, now);
 
    if (results.landmarks?.length > 0) {
      const landmarks = results.landmarks[0];
      const tip = landmarks[8];
 
      const sx = (1 - tip.x) * window.innerWidth;
      const sy = tip.y * window.innerHeight;
 
      handCursor.style.display = 'block';
      handCursor.style.left    = `${sx}px`;
      handCursor.style.top     = `${sy}px`;
 
      // ── DEBUG: show live values on screen ─────────────────────────────
  //     const indexTip  = landmarks[8];
  //     const indexMcp  = landmarks[5];
  //     const middleTip = landmarks[12];
  //     const middleMcp = landmarks[9];
  //     const ringTip   = landmarks[16];
  //     const ringPip   = landmarks[14];
  //     const pinkyTip  = landmarks[20];
  //     const pinkyPip  = landmarks[18];
  //     // const thumbTip  = landmarks[4];
  //     // const thumbIp   = landmarks[3];
 
  //     const indexUp     = indexTip.y  < indexMcp.y  - 0.04;
  //     const middleUp    = middleTip.y < middleMcp.y - 0.04;
  //     const ringCurled  = ringTip.y   > ringPip.y   - 0.02;
  //     const pinkyCurled = pinkyTip.y  > pinkyPip.y  - 0.02;
  //    // const thumbCurled = thumbTip.y  > thumbIp.y   - 0.02;
  //    // const victory     = indexUp && middleUp && ringCurled && pinkyCurled && thumbCurled;
  // const victory     = indexUp && middleUp && ringCurled && pinkyCurled;
  //     debugOverlay.innerHTML = `
  //       <b style="color:${victory ? '#0f0' : '#ff0'}">
  //         ${victory ? '✌️ VICTORY DETECTED' : '👁 Watching...'}
  //       </b><br>
  //       index up: <b style="color:${indexUp ? '#0f0' : '#f00'}">${indexUp}</b>
  //       (tip.y ${indexTip.y.toFixed(3)} vs mcp.y ${indexMcp.y.toFixed(3)})<br>
  //       middle up: <b style="color:${middleUp ? '#0f0' : '#f00'}">${middleUp}</b>
  //       (tip.y ${middleTip.y.toFixed(3)} vs mcp.y ${middleMcp.y.toFixed(3)})<br>
  //       ring curled: <b style="color:${ringCurled ? '#0f0' : '#f00'}">${ringCurled}</b>
  //       (tip.y ${ringTip.y.toFixed(3)} vs pip.y ${ringPip.y.toFixed(3)})<br>
  //       pinky curled: <b style="color:${pinkyCurled ? '#0f0' : '#f00'}">${pinkyCurled}</b>
  //       (tip.y ${pinkyTip.y.toFixed(3)} vs pip.y ${pinkyPip.y.toFixed(3)})<br>
  //   `;
 
      // ── Victory sign trigger ───────────────────────────────────────────
      if (isVictorySign(landmarks) && !isCapturing && !countdownActive) {
        if (victoryStartTime === null) victoryStartTime = now;
        const held     = now - victoryStartTime;
        const progress = Math.min(held / VICTORY_HOLD_MS, 1);
        victoryIndicator.style.display = 'block';
        victoryIndicator.style.opacity = String(0.4 + progress * 0.6);
        victoryIndicator.textContent   = '✌️ Hold...';
        if (held >= VICTORY_HOLD_MS) {
          victoryStartTime = null;
          victoryIndicator.style.display = 'none';
          startCountdownCapture();
        }
      } else if (!countdownActive) {
        victoryStartTime = null;
        victoryIndicator.style.display = 'none';
      }
 
    } else {
      handCursor.style.display       = 'none';
      // debugOverlay.textContent       = '🤚 No hand detected';
      // debugOverlay.style.color       = '#aaa';
      if (!countdownActive) {
        victoryStartTime               = null;
        victoryIndicator.style.display = 'none';
      }
    }
 
    requestAnimationFrame(detectHands);
  }
 
  console.log('🚀 Starting hand detection...');
  detectHands();
 
})();
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
function captureFrame(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Capture failed'));
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror   = reject;
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}
 
async function uploadToImgBB(base64: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', base64);
  const res = await fetch('https://api.imgbb.com/1/upload?key=6a5e9536c4c93264e11babc427c340fd', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`ImgBB error: ${res.status}`);
  const json = await res.json();
  return json.data.url;
}
 

//////CAROUSELLLLLLLLLLLLLLLLLLLLLL ///////
// let mediaStream: MediaStream;

// async function init() {
//   const liveRenderTarget = document.getElementById(
//     'canvas'
//   ) as HTMLCanvasElement;
//   const cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzczMTUwNzIzLCJzdWIiOiIyNmFhNmQwNi1kODNlLTRmMDEtOTRkMy1lYzE5NjYwMTdjYjV-U1RBR0lOR342NGU4NDc5Yy1iNDA2LTRiNzEtOWQ0Zi0zYmU2OTIyMmQzOWUifQ.NPvAHAl-kW3OP42J5dAIkw0_nLL2B6WjTmcCHt-iOTY' });
//   const session = await cameraKit.createSession({ liveRenderTarget });
//    mediaStream = await navigator.mediaDevices.getUserMedia({
//    video: {
//     width: { ideal: 720 },
//     height: { ideal: 1280 },
//     aspectRatio: 9 / 16
//   }

// });
//   const { lenses } = await cameraKit.lensRepository.loadLensGroups([
//     '7e39b6a3-2fab-4ad0-80d7-be024c517e7d',
//   ]);
  
//   session.applyLens(lenses[0]);

//   await setCameraKitSource(session);

//   attachCamerasToSelect(session);
//   attachLensesCarousel(lenses, session);
// }

// //   document.addEventListener("click", () => {
// //   document.documentElement.requestFullscreen();
// // });
// async function setCameraKitSource(
//   session: CameraKitSession,
//   deviceId?: string
// ) {
//   if (mediaStream) {
//     session.pause();
//     mediaStream.getVideoTracks()[0].stop();
//   }

//   mediaStream = await navigator.mediaDevices.getUserMedia({
//     video: { deviceId },
//   });

//   const source = createMediaStreamSource(mediaStream);

//   await session.setSource(source);

//   source.setTransform(Transform2D.MirrorX);

//   session.play();
// }

// async function attachCamerasToSelect(session: CameraKitSession) {
//   const cameraSelect = document.getElementById('cameras') as HTMLSelectElement;
//   const devices = await navigator.mediaDevices.enumerateDevices();
//   const cameras = devices.filter(({ kind }) => kind === 'videoinput');

//   cameras.forEach((camera) => {
//     const option = document.createElement('option');
//     option.value = camera.deviceId;
//     option.text = camera.label;
//     cameraSelect.appendChild(option);
//   });

//   cameraSelect.addEventListener('change', (event) => {
//     const deviceId = (event.target as HTMLSelectElement).selectedOptions[0]
//       .value;
//     setCameraKitSource(session, deviceId);
//   });
// }

// // ---------------------- NEW VISUAL CAROUSEL ----------------------
// async function attachLensesCarousel(lenses: Lens[], session: CameraKitSession) {
//   const carouselContainer = document.getElementById('lenses-carousel') as HTMLDivElement;

//   if (!carouselContainer) {
//     console.error('No element with id "lenses-carousel" found!');
//     return;
//   }

//   let currentLensIndex = 0;

//   function updateHighlight(index: number) {
//     const imgs = carouselContainer.querySelectorAll('img');
//     imgs.forEach((img, i) => {
//       img.style.border = i === index ? '3px solid #fff' : '2px solid transparent';
//       img.style.transform = i === index ? 'scale(1.1)' : 'scale(1)';
//     });
//   }

//   lenses.forEach((lens, index) => {
//     const thumb = document.createElement('img');
//    // thumb.src = lens.thumbnailUrl || ''; // if your lens has a thumbnail URL
//     thumb.alt = lens.name;
//     thumb.style.width = '10px';
//     thumb.style.height = '10px';
//     thumb.style.borderRadius = '1px';
//     thumb.style.cursor = 'pointer';
//     thumb.style.margin = '0 3px';
//     thumb.style.border = index === 0 ? '3px solid #fff' : '2px solid transparent';
//     thumb.style.transition = 'all 0.2s';

//     thumb.addEventListener('click', () => {
//       session.applyLens(lens);
//       currentLensIndex = index;
//       updateHighlight(index);
//     });

//     carouselContainer.appendChild(thumb);
//   });

//   // Initial highlight
//   updateHighlight(currentLensIndex);
// }
// init();



/////// selection ?////////////////////////////////
// let mediaStream: MediaStream;


// async function init() {
//   const liveRenderTarget = document.getElementById(
//     'canvas'
//   ) as HTMLCanvasElement;
//   const cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzczMTUwNzIzLCJzdWIiOiIyNmFhNmQwNi1kODNlLTRmMDEtOTRkMy1lYzE5NjYwMTdjYjV-U1RBR0lOR342NGU4NDc5Yy1iNDA2LTRiNzEtOWQ0Zi0zYmU2OTIyMmQzOWUifQ.NPvAHAl-kW3OP42J5dAIkw0_nLL2B6WjTmcCHt-iOTY'});
//   const session = await cameraKit.createSession({ liveRenderTarget });
//    mediaStream = await navigator.mediaDevices.getUserMedia({
//    video: {
//     width: { ideal: 720 },
//     height: { ideal: 1280 },
//     aspectRatio:  9/ 16
//   }

// });
//   const { lenses } = await cameraKit.lensRepository.loadLensGroups([
//     '7e39b6a3-2fab-4ad0-80d7-be024c517e7d',
//   ]);

//   session.applyLens(lenses[0]);

//   await setCameraKitSource(session);

//   attachCamerasToSelect(session);
//   attachLensesToSelect(lenses, session);
// }

// async function setCameraKitSource(
//   session: CameraKitSession,
//   deviceId?: string
// ) {
//   if (mediaStream) {
//     session.pause();
//     mediaStream.getVideoTracks()[0].stop();
//   }

//   mediaStream = await navigator.mediaDevices.getUserMedia({
//     video: { deviceId },
//   });

//   const source = createMediaStreamSource(mediaStream);

//   await session.setSource(source);

//   source.setTransform(Transform2D.MirrorX);

//   session.play();
// }

// async function attachCamerasToSelect(session: CameraKitSession) {
//   const cameraSelect = document.getElementById('cameras') as HTMLSelectElement;
//   const devices = await navigator.mediaDevices.enumerateDevices();
//   const cameras = devices.filter(({ kind }) => kind === 'videoinput');

//   cameras.forEach((camera) => {
//     const option = document.createElement('option');

//     option.value = camera.deviceId;
//     option.text = camera.label;

//     cameraSelect.appendChild(option);
//   });

//   cameraSelect.addEventListener('change', (event) => {
//     const deviceId = (event.target as HTMLSelectElement).selectedOptions[0]
//       .value;

//     setCameraKitSource(session, deviceId);
//   });
// }

// async function attachLensesToSelect(lenses: Lens[], session: CameraKitSession) {
//   const lensSelect = document.getElementById('lenses') as HTMLSelectElement;

//   lenses.forEach((lens) => {
//     const option = document.createElement('option');

//     option.value = lens.id;
//     option.text = lens.name;

//     lensSelect.appendChild(option);
//   });

//   lensSelect.addEventListener('change', (event) => {
//     const lensId = (event.target as HTMLSelectElement).selectedOptions[0].value;
//     const lens = lenses.find((lens) => lens.id === lensId);

//     if (lens) session.applyLens(lens);
//   });
// }

// init();




// import typescriptLogo from './typescript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.ts'

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
