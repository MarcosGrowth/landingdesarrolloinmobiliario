(function () {
  'use strict';

  const isMobile = window.innerWidth < 900;

  function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 50; i++) {
      const y = (i / 50) * 512;
      ctx.strokeStyle = `rgba(${50 + Math.floor(Math.random() * 40)},${30 + Math.floor(Math.random() * 20)},8,0.35)`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(i) * 10);
      for (let x = 0; x < 512; x += 8) {
        ctx.lineTo(x, y + Math.sin(x / 28 + i) * 7 + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createConcreteTexture(baseColor) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColor || '#2a3040';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const alpha = Math.random() * 0.06;
      const size = Math.random() * 2;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }

  function buildInterior(scene) {
    const woodTex = createWoodTexture();
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(4, 4);

    const wallTex = createConcreteTexture('#1e2838');
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 2);

    const ceilTex = createConcreteTexture('#161e2a');

    const floorMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.45, metalness: 0.05 });
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.0, color: 0x1a2535 });
    const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.95, color: 0x111820 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0.05,
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 1.2,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f1c2e, roughness: 0.6 });
    const moldMat  = new THREE.MeshStandardMaterial({ color: 0x0d1826, roughness: 0.9 });

    const RW = 14, RD = 18, RH = 5;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.1, RD), floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.1, RD), ceilMat);
    ceil.position.set(0, RH, 0);
    scene.add(ceil);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, 0.2), wallMat);
    backWall.position.set(0, RH / 2, -RD / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, RH, RD), wallMat);
    leftWall.position.set(-RW / 2, RH / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, RH, RD), wallMat);
    rightWall.position.set(RW / 2, RH / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    const winW = 4.5, winH = 2.8, sillH = 1.0;
    const winPositions = [
      { x: 0, z: RW / 2 },
      { x: -3.2, z: RW / 2 },
      { x: 3.2, z: RW / 2 },
    ];
    winPositions.forEach(wp => {
      const glassGeo = new THREE.BoxGeometry(winW, winH, 0.05);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(wp.x, sillH + winH / 2, wp.z);
      scene.add(glass);

      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, 0.1, 0.08), frameMat);
      topFrame.position.set(wp.x, sillH + winH + 0.05, wp.z);
      scene.add(topFrame);
      const botFrame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, 0.1, 0.08), frameMat);
      botFrame.position.set(wp.x, sillH - 0.05, wp.z);
      scene.add(botFrame);
      const lFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, winH + 0.1, 0.08), frameMat);
      lFrame.position.set(wp.x - winW / 2 - 0.05, sillH + winH / 2, wp.z);
      scene.add(lFrame);
      const rFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, winH + 0.1, 0.08), frameMat);
      rFrame.position.set(wp.x + winW / 2 + 0.05, sillH + winH / 2, wp.z);
      scene.add(rFrame);
    });

    const moldingPositions = [RH * 0.1, RH * 0.9];
    moldingPositions.forEach(my => {
      const mold = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.4, 0.06, 0.08), moldMat);
      mold.position.set(0, my, -RD / 2 + 0.18);
      scene.add(mold);
      const moldL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, RD - 0.4), moldMat);
      moldL.position.set(-RW / 2 + 0.18, my, 0);
      scene.add(moldL);
    });

    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x1a2f4a, roughness: 0.8 });
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 1.4), sofaMat);
    sofaBase.position.set(-2, 0.25, -4);
    sofaBase.castShadow = true;
    scene.add(sofaBase);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, 0.3), sofaMat);
    sofaBack.position.set(-2, 0.95, -4.55);
    sofaBack.castShadow = true;
    scene.add(sofaBack);

    const tableMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.5, metalness: 0.1 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), tableMat);
    tableTop.position.set(-2, 0.62, -2.8);
    scene.add(tableTop);

    const lampMat  = new THREE.MeshStandardMaterial({ color: 0x2a3a50, roughness: 0.5, metalness: 0.4 });
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xfff0cc, roughness: 0.9, emissive: 0xfff0cc, emissiveIntensity: 0.3 });
    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), lampMat);
    lampPole.position.set(3, 0.8, -4.5);
    scene.add(lampPole);
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.28, 0.35, 16), shadeMat);
    lampShade.position.set(3, 1.75, -4.5);
    scene.add(lampShade);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.08, 16), lampMat);
    lampBase.position.set(3, 0.04, -4.5);
    scene.add(lampBase);
  }

  function initScene() {
    const canvas = document.getElementById('bg-canvas');

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040d1a, 0.028);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);

    const ambient = new THREE.AmbientLight(0x1a2a4a, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.1);
    keyLight.position.set(8, 12, 8);
    keyLight.castShadow = !isMobile;
    if (!isMobile) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.camera.left = -12;
      keyLight.shadow.camera.right = 12;
      keyLight.shadow.camera.top = 12;
      keyLight.shadow.camera.bottom = -12;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.4);
    fillLight.position.set(-8, 4, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa44, 0.5);
    rimLight.position.set(-4, 10, -14);
    scene.add(rimLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e8, 1.8);
    sunLight.position.set(6, 8, 9);
    scene.add(sunLight);

    const lampLight = new THREE.PointLight(0xffeeaa, 1.0, 10);
    lampLight.position.set(3, 1.7, -4.5);
    scene.add(lampLight);

    const winGlow = new THREE.PointLight(0x88ccff, 0.7, 8);
    winGlow.position.set(0, 2.5, 7.5);
    scene.add(winGlow);

    buildInterior(scene);

    const cameraPath = [
      { pos: new THREE.Vector3(0, 3.2, 10),  target: new THREE.Vector3(0, 1.5, 0)   },
      { pos: new THREE.Vector3(3.5, 2.5, 7), target: new THREE.Vector3(-1, 1.8, 0)  },
      { pos: new THREE.Vector3(6, 1.8, 3),   target: new THREE.Vector3(0, 2.2, -3)  },
      { pos: new THREE.Vector3(4, 1.2, 5),   target: new THREE.Vector3(-1, 2.0, 0)  },
      { pos: new THREE.Vector3(1, 6, 9),     target: new THREE.Vector3(0, 1.0, 0)   },
    ];

    let currentScroll = 0;
    let targetScroll  = 0;

    window.addEventListener('scroll', () => {
      const scrollTop  = window.scrollY || document.documentElement.scrollTop;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docHeight > 0 ? scrollTop / docHeight : 0;
    });

    const targetVec = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);

      currentScroll += (targetScroll - currentScroll) * 0.04;

      const totalPoints = cameraPath.length - 1;
      const scrollIndex = currentScroll * totalPoints;
      const fromIndex   = Math.min(Math.floor(scrollIndex), totalPoints - 1);
      const toIndex     = Math.min(fromIndex + 1, totalPoints);
      const t           = scrollIndex - fromIndex;

      camera.position.lerpVectors(cameraPath[fromIndex].pos, cameraPath[toIndex].pos, t);
      targetVec.lerpVectors(cameraPath[fromIndex].target, cameraPath[toIndex].target, t);

      const time = Date.now() * 0.0003;
      camera.position.x += Math.sin(time) * 0.055;
      camera.position.y += Math.cos(time * 0.7) * 0.022;

      camera.lookAt(targetVec);

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  try {
    if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
    initScene();
  } catch (e) {
    const canvas = document.getElementById('bg-canvas');
    if (canvas) canvas.style.display = 'none';
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.style.backgroundImage = "url('assets/edificio.jpg')";
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    }
  }
})();
