import './style.css'
import { bootstrapCameraKit } from '@snap/camera-kit';
import QRCode from 'qrcode';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
// Source - https://stackoverflow.com/a/18479644
// Posted by user1693593, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-10, License - CC BY-SA 3.0

// import {
 
//   CameraKitSession,
//   createMediaStreamSource,
//   Transform2D,
//   type Lens,
// } from '@snap/camera-kit';

 


// ─── Imports — must all be at the top ────────────────────────────────────────


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
    '156e89e1-541b-4fd0-9b87-648c063ab2f6',
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
  // ── Resize canvas to fill portrait screen ──────────────────────────────────
  function resizeCanvas() {
    const screenW     = window.innerWidth;
    const screenH     = window.innerHeight;
    const targetRatio = 9 / 16;
    const screenRatio = screenW / screenH;

    if (screenRatio > targetRatio) {
      liveRenderTarget.style.height = '100vh';
      liveRenderTarget.style.width  = `${screenH * targetRatio}px`;
      liveRenderTarget.style.left   = `${(screenW - screenH * targetRatio) / 2}px`;
    } else {
      liveRenderTarget.style.width  = '100vw';
      liveRenderTarget.style.height = `${screenW / targetRatio}px`;
      liveRenderTarget.style.top    = '0';
      liveRenderTarget.style.left   = '0';
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── UI elements ────────────────────────────────────────────────────────────
  const captureBtn  = document.getElementById('capture-btn') as HTMLButtonElement;
  const status      = document.getElementById('status')      as HTMLElement;
  const qrPanel     = document.getElementById('qr-panel')    as HTMLElement;
  const qrCanvas    = document.getElementById('qr-canvas')   as HTMLCanvasElement;
  const countdown   = document.getElementById('countdown')   as HTMLElement;

  // ── Auto-close QR panel ────────────────────────────────────────────────────
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

  // ── Capture logic ──────────────────────────────────────────────────────────
  // FIX: separate isCapturing flag so hand detection can't re-trigger
  // while a capture is already in progress
  let isCapturing = false;

  async function doCapture() {
    if (isCapturing) return;   // ← prevents hand detection double-trigger
    isCapturing = true;
    captureBtn.disabled = true;
    status.textContent = '⏳ Uploading your photo...';

    try {
      const imageBase64 = await captureFrame(liveRenderTarget);
      const publicUrl   = await uploadToImgBB(imageBase64);

      // FIX: width was 20 — far too small. 120 matches the CSS wrapper size.
      await QRCode.toCanvas(qrCanvas, publicUrl, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: 'Q',
      });
      qrCanvas.style.width  = '120px';
      qrCanvas.style.height = '120px';

      qrPanel.classList.add('visible');
      status.textContent = '';
      startAutoClose();
    } catch (err) {
      console.error(err);
      status.textContent = '❌ Upload failed. Please try again.';
    } finally {
      captureBtn.disabled = false;
      isCapturing = false;
    }
  }

  // Keep normal click working too
  captureBtn.addEventListener('click', doCapture);

  // ── Hand Detection ─────────────────────────────────────────────────────────
  const inputVideo = document.getElementById('input-video') as HTMLVideoElement;
  inputVideo.srcObject = mediaStream;
  // Wait for video to actually have frame data and be playing
await new Promise<void>(resolve => {
  const check = () => {
    if (inputVideo.readyState >= 2 && inputVideo.currentTime > 0) {
      console.log('✅ inputVideo has live frames');
      resolve();
    } else {
      setTimeout(check, 100);
    }
  };
  inputVideo.play().then(check).catch(e => console.error('video play failed:', e));
});

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence:  0.6,
    minTrackingConfidence:      0.5,
  });

  const handCursor   = document.getElementById('hand-cursor')           as HTMLElement;
  const progressRing = document.querySelector('#progress-ring circle')  as SVGCircleElement;

  const RING_CIRC        = 245;
  const HOVER_TRIGGER_MS = 1500;

  let hoverStartTime: number | null = null;
  let lastVideoTime = -1;

  function isInsideButton(x: number, y: number): boolean {
    const b = captureBtn.getBoundingClientRect();
    return x >= b.left - 20 && x <= b.right  + 20 &&
           y >= b.top  - 20 && y <= b.bottom + 20;
  }

  function setRingProgress(progress: number) {
    progressRing.style.strokeDashoffset = String(RING_CIRC * (1 - progress));
  }

  function detectHands() {
    if (inputVideo.readyState < 2) { requestAnimationFrame(detectHands); return; }
    if (inputVideo.currentTime === lastVideoTime) { requestAnimationFrame(detectHands); return; }
    lastVideoTime = inputVideo.currentTime;

    const now     = performance.now();
    const results = handLandmarker.detectForVideo(inputVideo, now);

    if (results.landmarks?.length > 0) {
      const tip = results.landmarks[0][8]; // index fingertip

      // Flip X because the webcam feed is mirrored
      const sx = (1 - tip.x) * window.innerWidth;
      const sy = tip.y * window.innerHeight;

      handCursor.style.display = 'block';
      handCursor.style.left    = `${sx}px`;
      handCursor.style.top     = `${sy}px`;

      if (isInsideButton(sx, sy) && !isCapturing) {
        captureBtn.classList.add('hovered');
        handCursor.style.background = 'rgba(255,100,0,0.9)';

        if (hoverStartTime === null) hoverStartTime = now;

        const progress = Math.min((now - hoverStartTime) / HOVER_TRIGGER_MS, 1);
        setRingProgress(progress);

        if (progress >= 1) {
          hoverStartTime = null;
          setRingProgress(0);
          doCapture(); // FIX: call doCapture() directly, not captureBtn.click()
        }
      } else {
        captureBtn.classList.remove('hovered');
        handCursor.style.background = 'rgba(255,252,0,0.85)';
        hoverStartTime = null;
        setRingProgress(0);
      }
    } else {
      handCursor.style.display = 'none';
      captureBtn.classList.remove('hovered');
      hoverStartTime = null;
      setRingProgress(0);
    }

    requestAnimationFrame(detectHands);
  }

  detectHands();

})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function captureFrame(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas capture failed'));
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
  const res = await fetch(`https://api.imgbb.com/1/upload?key=6a5e9536c4c93264e11babc427c340fd`, {
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
