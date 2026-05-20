(function () {
  'use strict';

  const isMobile = window.innerWidth < 900;

  // Meshes to fade out as camera enters the building
  const exteriorMeshes = [];

  /* ────────────────────────────────────────────
     TEXTURE GENERATORS
  ──────────────────────────────────────────── */

  function createConcreteTexture(r, g, b) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3500; i++) {
      const px = Math.random() * 256;
      const py = Math.random() * 256;
      const v  = Math.random() > 0.5 ? 255 : 0;
      ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (Math.random() * 0.045) + ')';
      ctx.fillRect(px, py, 1 + Math.random(), 1 + Math.random());
    }
    return new THREE.CanvasTexture(c);
  }

  function createWoodTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 55; i++) {
      const y = (i / 55) * 512;
      const alpha = 0.12 + Math.random() * 0.22;
      const dark  = Math.floor(Math.random() * 30);
      ctx.strokeStyle = 'rgba(' + dark + ',' + dark + ',' + dark + ',' + alpha + ')';
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(i) * 8);
      for (let x = 0; x < 512; x += 6) {
        ctx.lineTo(x, y + Math.sin(x / 24 + i) * 6 + (Math.random() - 0.5) * 2.5);
      }
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  function createTileTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c0b090';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(100,85,60,0.35)';
    ctx.lineWidth = 2;
    const ts = 128;
    for (let x = 0; x <= 512; x += ts) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += ts) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  function createGlassTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0,   'rgba(140,180,220,0.7)');
    grad.addColorStop(0.5, 'rgba(100,150,200,0.4)');
    grad.addColorStop(1,   'rgba(160,200,240,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    // subtle reflection streak
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(80, 256);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  /* ────────────────────────────────────────────
     BUILDING CONSTANTS
  ──────────────────────────────────────────── */

  var FLOORS  = 9;
  var FH      = 3.8;          // floor height (m)
  var BW      = 10;            // building width
  var BD      = 8;             // building depth
  var BH      = FLOORS * FH;  // total height ~34.2

  /* ────────────────────────────────────────────
     EXTERIOR BUILDING
     Reference: dark charcoal tower, vertical slats,
     balconies w/ plants, warmly lit ground-floor lobby
  ──────────────────────────────────────────── */

  function buildExterior(scene) {

    // Ground plane (asphalt)
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x10141c, roughness: 0.97, metalness: 0.0,
    });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalk strip (concrete)
    var swMat = new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 0.92 });
    var sw = new THREE.Mesh(new THREE.BoxGeometry(90, 0.1, 16), swMat);
    sw.position.set(0, 0.05, 12);
    sw.receiveShadow = true;
    scene.add(sw);

    // Background city buildings
    var bgMat = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.97 });
    var bgWinMat = new THREE.MeshStandardMaterial({
      color: 0xfff4c0, emissive: 0xfff0a0, emissiveIntensity: 0.4,
      transparent: true, opacity: 0.6,
    });
    var bgDefs = [
      { x: -28, h: 24, w: 14, d: 10, z: -4 },
      { x:  30, h: 18, w: 15, d: 10, z: -3 },
      { x: -52, h: 40, w: 12, d: 10, z: -2 },
      { x:  50, h: 32, w: 14, d: 10, z: -2 },
      { x:   0, h: 11, w: 26, d: 10, z: -20 },
      { x: -24, h: 30, w: 11, d: 10, z: -20 },
      { x:  24, h: 22, w: 11, d: 10, z: -20 },
      { x: -65, h: 20, w: 10, d: 10, z: -2 },
      { x:  65, h: 26, w: 10, d: 10, z: -2 },
    ];
    bgDefs.forEach(function (b) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bgMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      scene.add(mesh);
      // Random lit windows on bg buildings
      for (var wf = 0; wf < Math.floor(b.h / 3.5); wf++) {
        for (var wc = 0; wc < 2; wc++) {
          if (Math.random() > 0.45) {
            var winM = new THREE.Mesh(
              new THREE.BoxGeometry(1.2, 1.6, 0.05),
              bgWinMat.clone()
            );
            winM.position.set(
              b.x + (wc - 0.5) * (b.w * 0.4),
              wf * 3.5 + 2,
              b.z + b.d / 2 + 0.01
            );
            scene.add(winM);
          }
        }
      }
    });

    // Main building facade material (dark charcoal)
    var conTex = createConcreteTexture(28, 32, 46);
    var facadeMat = new THREE.MeshStandardMaterial({
      color: 0x1c2232, roughness: 0.72, metalness: 0.12, map: conTex,
    });

    // Building core body
    var body = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), facadeMat);
    body.position.set(0, BH / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    exteriorMeshes.push(body);

    // Vertical facade slats (reference: thin metallic verticals)
    var slatMat = new THREE.MeshStandardMaterial({
      color: 0x28303e, roughness: 0.38, metalness: 0.55,
    });
    var SLATS = 22;
    for (var s = 0; s < SLATS; s++) {
      var sx = -BW / 2 + (s + 0.5) * (BW / SLATS);
      // Front slats
      var slatF = new THREE.Mesh(new THREE.BoxGeometry(0.07, BH * 0.90, 0.2), slatMat);
      slatF.position.set(sx, BH * 0.51, BD / 2 + 0.1);
      scene.add(slatF);
      exteriorMeshes.push(slatF);
    }

    // Glass texture for windows
    var glTex   = createGlassTexture();
    var glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x6699bb, metalness: 0.08, roughness: 0.06,
      transparent: true, opacity: 0.58, map: glTex,
    });
    var litMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e0, emissive: 0xfff4b0,
      emissiveIntensity: 0.65, transparent: true, opacity: 0.88,
    });

    // Per-floor: windows + balconies + floor dividers
    for (var f = 0; f < FLOORS; f++) {
      var fy   = f * FH + FH * 0.52;
      var isLit = Math.random() > 0.30;

      // 3 windows on front facade
      [-3, 0, 3].forEach(function (wx) {
        var wMat = (isLit && Math.random() > 0.2) ? litMat.clone() : glassMat.clone();
        var win  = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.5, 0.06), wMat);
        win.position.set(wx, fy, BD / 2 + 0.02);
        scene.add(win);
        exteriorMeshes.push(win);
        // Window frame
        var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.6 });
        var frameH   = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.08), frameMat);
        frameH.position.set(wx, fy + 1.3,  BD / 2 + 0.03);
        scene.add(frameH);
        var frameH2 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.08), frameMat);
        frameH2.position.set(wx, fy - 1.3, BD / 2 + 0.03);
        scene.add(frameH2);
      });

      // Side windows (right face)
      if (f > 0) {
        var swMat2 = (isLit && Math.random() > 0.35) ? litMat.clone() : glassMat.clone();
        var sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 1.5), swMat2);
        sideWin.position.set(BW / 2 + 0.02, fy, 0);
        scene.add(sideWin);
        exteriorMeshes.push(sideWin);
      }

      // Balcony slab + railing (floors 1-7)
      if (f > 0 && f < FLOORS - 2) {
        var balSlab = new THREE.Mesh(
          new THREE.BoxGeometry(BW * 0.76, 0.14, 1.7), facadeMat.clone()
        );
        balSlab.position.set(0, f * FH + 0.07, BD / 2 + 0.85);
        balSlab.castShadow = true;
        scene.add(balSlab);
        exteriorMeshes.push(balSlab);

        // Glass railing
        var railMat = new THREE.MeshStandardMaterial({
          color: 0x88aabb, metalness: 0.65, roughness: 0.15,
          transparent: true, opacity: 0.35,
        });
        var rail = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.76, 0.72, 0.04), railMat);
        rail.position.set(0, f * FH + 0.5, BD / 2 + 1.68);
        scene.add(rail);
        exteriorMeshes.push(rail);

        // Balcony plant (small sphere, dark green)
        if (f % 2 === 0) {
          var plantMat  = new THREE.MeshStandardMaterial({ color: 0x1a3814, roughness: 0.9 });
          var potMat    = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.8 });
          [-3.5, 0, 3.5].forEach(function (px) {
            var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.3, 8), potMat);
            pot.position.set(px, f * FH + 0.29, BD / 2 + 0.9);
            scene.add(pot);
            exteriorMeshes.push(pot);
            var plant = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 6), plantMat);
            plant.position.set(px, f * FH + 0.68, BD / 2 + 0.9);
            scene.add(plant);
            exteriorMeshes.push(plant);
          });
        }
      }

      // Horizontal floor divider
      var divMat = new THREE.MeshStandardMaterial({ color: 0x22283a, roughness: 0.6 });
      var div = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.4, 0.12, BD + 0.4), divMat);
      div.position.set(0, f * FH, 0);
      scene.add(div);
      exteriorMeshes.push(div);
    }

    // Rooftop: terrace + pergola-style structure (reference: rooftop garden)
    var roofTerMat = new THREE.MeshStandardMaterial({ color: 0x1c3018, roughness: 0.9 });
    var roofTer = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.6, 0.5, BD + 0.6), roofTerMat);
    roofTer.position.set(0, BH + 0.25, 0);
    scene.add(roofTer);
    exteriorMeshes.push(roofTer);

    // Rooftop vertical elements (pergola)
    var pergMat = new THREE.MeshStandardMaterial({ color: 0x28303e, roughness: 0.45, metalness: 0.5 });
    for (var pi = 0; pi < 6; pi++) {
      var px2 = -BW * 0.4 + pi * (BW * 0.8 / 5);
      var pBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, BD * 0.55), pergMat);
      pBeam.position.set(px2, BH + 1.75, 0);
      scene.add(pBeam);
      exteriorMeshes.push(pBeam);
    }

    // Rooftop greenery (several plants)
    var roofPlantMat = new THREE.MeshStandardMaterial({ color: 0x254a20, roughness: 0.9 });
    [-3.5, -1.5, 1.5, 3.5].forEach(function (px3) {
      var rp = new THREE.Mesh(new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 8, 6), roofPlantMat);
      rp.position.set(px3, BH + 1.0, (Math.random() - 0.5) * 3);
      scene.add(rp);
      exteriorMeshes.push(rp);
    });

    // Ground floor lobby (warm interior, visible through the front glass)
    var lobbyMat = new THREE.MeshStandardMaterial({
      color: 0x3a2e18, emissive: 0x2a1e08, emissiveIntensity: 0.6,
    });
    var lobbyBack = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.5, FH - 0.4, 0.14), lobbyMat);
    lobbyBack.position.set(0, FH / 2, -BD / 2 + 0.1);
    scene.add(lobbyBack);
    // Lobby floor (warm timber)
    var lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.4, 0.06, BD - 0.3), new THREE.MeshStandardMaterial({ color: 0x6a4e28, roughness: 0.4 }));
    lobbyFloor.position.set(0, 0.06, 0);
    scene.add(lobbyFloor);

    // Trees flanking building (reference: tall trees on both sides)
    var trunkMat2  = new THREE.MeshStandardMaterial({ color: 0x28180a, roughness: 0.95 });
    var foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x1c3e16, roughness: 0.92 });
    var treeDefs = [
      { x: -8,  z: 10, h: 9,  r: 2.2 },
      { x: -13, z: 13, h: 12, r: 2.6 },
      { x: -18, z: 10, h: 8,  r: 2.0 },
      { x: -22, z: 12, h: 10, r: 1.8 },
      { x:  8,  z: 10, h: 10, r: 2.4 },
      { x:  13, z: 13, h: 11, r: 2.5 },
      { x:  18, z: 10, h: 8,  r: 2.0 },
      { x:  22, z: 12, h: 9,  r: 1.9 },
    ];
    treeDefs.forEach(function (td) {
      var trunk2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.24, td.h, 8), trunkMat2
      );
      trunk2.position.set(td.x, td.h / 2, td.z);
      scene.add(trunk2);
      var foliage2 = new THREE.Mesh(
        new THREE.SphereGeometry(td.r, 9, 7), foliageMat2
      );
      foliage2.position.set(td.x, td.h + td.r * 0.55, td.z);
      scene.add(foliage2);
    });

    // Street lamps
    var lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x222832, roughness: 0.5 });
    [-14, 14].forEach(function (lx) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8), lampPoleMat);
      pole.position.set(lx, 2.75, 16);
      scene.add(pole);
      var lamp3d = new THREE.PointLight(0xfff4cc, 1.0, 20);
      lamp3d.position.set(lx, 5.6, 16);
      scene.add(lamp3d);
    });

    // Lobby warm light
    var lobbyLight = new THREE.PointLight(0xffcc88, 1.4, 16);
    lobbyLight.position.set(0, 2.2, 1.5);
    scene.add(lobbyLight);
  }

  /* ────────────────────────────────────────────
     INTERIOR ROOM
     Reference: dark teal walls, wood + marble TV wall,
     olive sectional sofa, white pendant lamp,
     large city-view windows on right wall
  ──────────────────────────────────────────── */

  function buildInterior(scene) {
    // Room sits at floor index 3 (4th floor) inside the building
    var FIDX = 3;
    var IY   = FIDX * FH + 0.06; // room floor Y position
    var IH   = FH - 0.18;         // interior ceiling height
    var IW   = BW - 0.44;         // room width (inside walls)
    var ID   = BD - 0.44;         // room depth

    var woodTex  = createWoodTexture();
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(2, 1);

    var tileTex  = createTileTexture();
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(3, 2);

    // Room materials matching reference render
    var darkTealMat = new THREE.MeshStandardMaterial({
      color: 0x18292a, roughness: 0.88,
      map: createConcreteTexture(24, 41, 42),
    });
    var floorMat2 = new THREE.MeshStandardMaterial({
      color: 0xb0a078, roughness: 0.32, metalness: 0.04, map: tileTex,
    });
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a18, roughness: 0.42, map: woodTex,
    });
    var marbleMat = new THREE.MeshStandardMaterial({
      color: 0x181820, roughness: 0.18, metalness: 0.18,
      map: createConcreteTexture(22, 22, 30),
    });
    var ceilMat2 = new THREE.MeshStandardMaterial({ color: 0x161e1e, roughness: 0.92 });
    var winGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x80c8e8, transparent: true, opacity: 0.16,
      roughness: 0.04, metalness: 0.06,
    });

    // Floor
    var iFloor = new THREE.Mesh(new THREE.BoxGeometry(IW, 0.1, ID), floorMat2);
    iFloor.position.set(0, IY + 0.05, 0);
    iFloor.receiveShadow = true;
    scene.add(iFloor);

    // Ceiling with recessed track
    var iCeil = new THREE.Mesh(new THREE.BoxGeometry(IW, 0.1, ID), ceilMat2);
    iCeil.position.set(0, IY + IH, 0);
    scene.add(iCeil);

    // Back wall (dark teal painted)
    var backW = new THREE.Mesh(new THREE.BoxGeometry(IW, IH, 0.12), darkTealMat);
    backW.position.set(0, IY + IH / 2, -ID / 2 + 0.07);
    backW.receiveShadow = true;
    scene.add(backW);

    // Right wall: bottom + top strips (rest is windows)
    var rwBot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.88, ID), darkTealMat);
    rwBot.position.set(IW / 2 - 0.05, IY + 0.44, 0);
    scene.add(rwBot);
    var rwTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, ID), darkTealMat);
    rwTop.position.set(IW / 2 - 0.05, IY + IH - 0.12, 0);
    scene.add(rwTop);

    // Window glass panes on right wall (floor-to-ceiling city view)
    var winCount = 4;
    for (var wi = 0; wi < winCount; wi++) {
      var wz = -ID / 2 + (wi + 0.5) * (ID / winCount);
      var wGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, IH - 1.12, ID / winCount - 0.22),
        winGlassMat.clone()
      );
      wGlass.position.set(IW / 2 - 0.02, IY + 0.88 + (IH - 1.12) / 2, wz);
      scene.add(wGlass);
      // Window frame
      var winFMat = new THREE.MeshStandardMaterial({ color: 0x141c1c, roughness: 0.5 });
      var wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, IH - 1.12, 0.07), winFMat);
      wFrame.position.set(IW / 2 - 0.01, IY + 0.88 + (IH - 1.12) / 2, wz - ID / winCount / 2 + 0.04);
      scene.add(wFrame);
    }

    // Left wall: marble + wood joinery (TV feature wall)
    // Full left wall fill
    var leftW = new THREE.Mesh(new THREE.BoxGeometry(0.1, IH, ID), darkTealMat);
    leftW.position.set(-IW / 2 + 0.05, IY + IH / 2, 0);
    scene.add(leftW);

    // Marble accent (dark stone, left portion - covers TV area)
    var marblePan = new THREE.Mesh(new THREE.BoxGeometry(0.15, IH * 0.92, ID * 0.44), marbleMat);
    marblePan.position.set(-IW / 2 + 0.1, IY + IH * 0.49, -ID * 0.2);
    scene.add(marblePan);

    // TV on marble wall (dark rectangle)
    var tvMat = new THREE.MeshStandardMaterial({ color: 0x060810, roughness: 0.2, metalness: 0.8 });
    var tv = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 2.0), tvMat);
    tv.position.set(-IW / 2 + 0.22, IY + 1.65, -ID * 0.22);
    scene.add(tv);

    // Wood panel (joinery cabinet, right portion of left wall)
    var woodPan = new THREE.Mesh(new THREE.BoxGeometry(0.15, IH * 0.88, ID * 0.5), woodMat);
    woodPan.position.set(-IW / 2 + 0.1, IY + IH * 0.47, ID * 0.18);
    scene.add(woodPan);

    // Shelf on wood panel
    var shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a3016, roughness: 0.4 });
    [-0.4, 0.0, 0.4].forEach(function (sy) {
      var shelf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 1.4), shelfMat);
      shelf.position.set(-IW / 2 + 0.18, IY + IH * 0.47 + sy, ID * 0.18);
      scene.add(shelf);
    });

    // Olive green sectional sofa (matching reference)
    var sofaMat2 = new THREE.MeshStandardMaterial({ color: 0x58683a, roughness: 0.82 });
    var sofaCushMat = new THREE.MeshStandardMaterial({ color: 0x647842, roughness: 0.86 });
    // Main seat
    var sofaMain = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.52, 1.45), sofaMat2);
    sofaMain.position.set(0.9, IY + 0.26, 0.3);
    sofaMain.castShadow = true;
    scene.add(sofaMain);
    // L-extension
    var sofaExt = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.52, 0.72), sofaMat2);
    sofaExt.position.set(2.2, IY + 0.26, -0.62);
    scene.add(sofaExt);
    // Sofa back
    var sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.72, 0.22), sofaMat2);
    sofaBack.position.set(0.9, IY + 0.88, 0.92);
    scene.add(sofaBack);
    // Seat cushions
    for (var ci = 0; ci < 3; ci++) {
      var cush = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 1.2), sofaCushMat);
      cush.position.set(-0.7 + ci * 0.95, IY + 0.55, 0.28);
      scene.add(cush);
    }
    // Throw pillows
    var pillowMat = new THREE.MeshStandardMaterial({ color: 0xc8c0a0, roughness: 0.9 });
    [-0.2, 1.1].forEach(function (pilX) {
      var pillow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.35, 0.1), pillowMat);
      pillow.position.set(pilX, IY + 0.86, 0.82);
      pillow.rotation.z = (Math.random() - 0.5) * 0.15;
      scene.add(pillow);
    });

    // White oval coffee table (reference: organic white/ivory)
    var tableMat2 = new THREE.MeshStandardMaterial({ color: 0xddd8c8, roughness: 0.28 });
    var tableTop2 = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 22), tableMat2);
    tableTop2.scale.z = 0.66;
    tableTop2.position.set(0.7, IY + 0.11, -0.72);
    scene.add(tableTop2);
    // Book on table (yellow, reference shows yellow book)
    var bookMat = new THREE.MeshStandardMaterial({
      color: 0xf0c020, emissive: 0xa08010, emissiveIntensity: 0.1, roughness: 0.8,
    });
    var book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.22), bookMat);
    book.position.set(0.6, IY + 0.155, -0.72);
    book.rotation.y = 0.25;
    scene.add(book);

    // Small orange table lamp (reference: red/orange lamp on table)
    var orangeMat = new THREE.MeshStandardMaterial({
      color: 0xcc3310, emissive: 0xaa2208, emissiveIntensity: 0.35, roughness: 0.6,
    });
    var orangeLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.28, 10), orangeMat);
    orangeLamp.position.set(0.1, IY + 0.19, -0.68);
    scene.add(orangeLamp);

    // White pendant lamp (reference: conical white shade hanging from ceiling)
    var pendCordMat = new THREE.MeshStandardMaterial({ color: 0x0e1414, roughness: 0.4 });
    var pendShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf0ede4, roughness: 0.5,
      emissive: 0xfff8e8, emissiveIntensity: 0.22,
      side: THREE.DoubleSide,
    });
    var pendCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), pendCordMat);
    pendCord.position.set(-0.2, IY + IH - 0.58, -0.15);
    scene.add(pendCord);
    var pendShade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 18, 1, true), pendShadeMat);
    pendShade.rotation.x = Math.PI;
    pendShade.position.set(-0.2, IY + IH - 1.18, -0.15);
    scene.add(pendShade);
    // Pendant lamp socket
    var socketMat = new THREE.MeshStandardMaterial({ color: 0x111a1a, roughness: 0.3, metalness: 0.8 });
    var socket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), socketMat);
    socket.position.set(-0.2, IY + IH - 1.02, -0.15);
    scene.add(socket);

    // Abstract painting on back wall (reference: colorful abstract)
    var artMat = new THREE.MeshStandardMaterial({
      color: 0xc89040, emissive: 0x402010, emissiveIntensity: 0.25, roughness: 0.75,
    });
    var art = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.06), artMat);
    art.position.set(0.3, IY + IH * 0.62, -ID / 2 + 0.08);
    scene.add(art);
    // Art frame
    var artFrMat = new THREE.MeshStandardMaterial({ color: 0x0e1212, roughness: 0.5, metalness: 0.4 });
    var artFr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.04), artFrMat);
    artFr.position.set(0.3, IY + IH * 0.62, -ID / 2 + 0.06);
    scene.add(artFr);

    // Indoor plant on shelf (reference: vase with plant on wood shelving)
    var vaseMat2 = new THREE.MeshStandardMaterial({ color: 0x222018, roughness: 0.75 });
    var vase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.32, 10), vaseMat2);
    vase2.position.set(-IW / 2 + 0.22, IY + IH * 0.47 + 0.36, ID * 0.14);
    scene.add(vase2);
    var leafMat2 = new THREE.MeshStandardMaterial({ color: 0x264a1e, roughness: 0.92 });
    var leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), leafMat2);
    leaves2.position.set(-IW / 2 + 0.22, IY + IH * 0.47 + 0.62, ID * 0.14);
    scene.add(leaves2);

    // Rug under sofa and coffee table
    var rugMat = new THREE.MeshStandardMaterial({ color: 0x9a9070, roughness: 0.98 });
    var rug = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 2.8), rugMat);
    rug.position.set(0.8, IY + 0.08, -0.2);
    scene.add(rug);

    // Interior lighting
    var pendLight = new THREE.PointLight(0xfff4d0, 2.8, 16);
    pendLight.position.set(-0.2, IY + IH - 1.2, -0.15);
    scene.add(pendLight);

    var winLight2 = new THREE.PointLight(0x88bbdd, 1.6, 12);
    winLight2.position.set(IW / 2 - 0.5, IY + 1.6, 0);
    scene.add(winLight2);

    var fillInterior = new THREE.PointLight(0x1a3030, 0.6, 18);
    fillInterior.position.set(0, IY + IH * 0.5, 0);
    scene.add(fillInterior);
  }

  /* ────────────────────────────────────────────
     CAMERA PATH
     Phase 1 (0–52%):  180° orbital arc around building
     Phase 2 (52–67%): Sweep back to front entrance approach
     Phase 3 (67–80%): Enter lobby and rise to 4th floor
     Phase 4 (80–100%): Interior room exploration
  ──────────────────────────────────────────── */

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  var _tmpA = new THREE.Vector3();
  var _tmpB = new THREE.Vector3();

  function getCameraState(scrollT) {

    // ── Phase 1: 180° arc (right-front → left-back) ──
    if (scrollT <= 0.52) {
      var t  = scrollT / 0.52;
      var et = smoothStep(t);
      // Start angle: right-front quadrant (-35°)
      // End angle after 185° sweep: left-back
      var startAngle = -Math.PI / 5.2;
      var angle      = startAngle + et * (Math.PI * 1.04);
      var radius     = 68 - et * 24;   // closes in from 68 → 44
      var elev       = 22 - et * 16;   // drops from 22 → 6
      var lookY      = BH * 0.52 - et * (BH * 0.3);
      return {
        pos:    new THREE.Vector3(Math.sin(angle) * radius, elev, Math.cos(angle) * radius),
        target: new THREE.Vector3(0, lookY, 0),
      };
    }

    // ── Phase 2: Sweep back to front entrance ──
    if (scrollT <= 0.67) {
      var t2  = (scrollT - 0.52) / 0.15;
      var et2 = easeInOut(t2);
      // Arc end position
      var arcAngle = -Math.PI / 5.2 + Math.PI * 1.04;
      var arcR     = 44;
      _tmpA.set(Math.sin(arcAngle) * arcR, 6, Math.cos(arcAngle) * arcR);
      _tmpB.set(0, 4.2, 22);
      var pos2    = _tmpA.clone().lerp(_tmpB, et2);
      var tgtA    = new THREE.Vector3(0, BH * 0.4, 0);
      var tgtB    = new THREE.Vector3(0, 3.5, 0);
      var target2 = tgtA.clone().lerp(tgtB, et2);
      return { pos: pos2, target: target2 };
    }

    // ── Phase 3: Enter lobby and rise ──
    if (scrollT <= 0.80) {
      var t3  = (scrollT - 0.67) / 0.13;
      var et3 = smoothStep(t3);
      var fromPos3 = new THREE.Vector3(0, 4.2, 20);
      // Inside building at apartment level
      var toPos3   = new THREE.Vector3(1.8, 3 * FH + 2.4, 3.2);
      var pos3     = fromPos3.clone().lerp(toPos3, et3);
      var tgtA3    = new THREE.Vector3(0, 3.2, 5);
      var tgtB3    = new THREE.Vector3(0, 3 * FH + 2.2, -1);
      var target3  = tgtA3.clone().lerp(tgtB3, et3);
      return { pos: pos3, target: target3 };
    }

    // ── Phase 4: Interior room exploration ──
    var t4  = (scrollT - 0.80) / 0.20;
    var et4 = smoothStep(t4);
    var iY  = 3 * FH + 2.2;
    var intWps = [
      { pos: new THREE.Vector3(1.8, iY, 3.2),   target: new THREE.Vector3(0,  iY, -0.8) },
      { pos: new THREE.Vector3(2.6, iY, 1.0),   target: new THREE.Vector3(-1, iY, -2.0) },
      { pos: new THREE.Vector3(2.2, iY - 0.3, -0.8), target: new THREE.Vector3(-2.5, iY - 0.2, -3.2) },
    ];
    var total4 = intWps.length - 1;
    var idx4   = Math.min(Math.floor(et4 * total4), total4 - 1);
    var lt4    = et4 * total4 - idx4;
    var pos4   = intWps[idx4].pos.clone().lerp(intWps[idx4 + 1].pos, lt4);
    var tgt4   = intWps[idx4].target.clone().lerp(intWps[idx4 + 1].target, lt4);
    return { pos: pos4, target: tgt4 };
  }

  /* ────────────────────────────────────────────
     INIT
  ──────────────────────────────────────────── */

  function initScene() {
    var canvas = document.getElementById('bg-canvas');

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040d1a, 0.016);

    var camera = new THREE.PerspectiveCamera(
      54, window.innerWidth / window.innerHeight, 0.1, 350
    );

    // Lights
    var ambient2 = new THREE.AmbientLight(0x18243a, 0.55);
    scene.add(ambient2);

    var sun = new THREE.DirectionalLight(0xfff4e0, 0.90);
    sun.position.set(25, 45, 20);
    if (!isMobile) {
      sun.castShadow = true;
      sun.shadow.mapSize.width  = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.near   = 1;
      sun.shadow.camera.far    = 180;
      sun.shadow.camera.left   = -35;
      sun.shadow.camera.right  = 35;
      sun.shadow.camera.top    = 45;
      sun.shadow.camera.bottom = -10;
    }
    scene.add(sun);

    var fill = new THREE.DirectionalLight(0x4466aa, 0.32);
    fill.position.set(-20, 12, -12);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xffaa44, 0.22);
    rim.position.set(0, 18, -35);
    scene.add(rim);

    // Build scene
    buildExterior(scene);
    buildInterior(scene);

    // Scroll tracking
    var currentScroll = 0;
    var targetScroll  = 0;
    window.addEventListener('scroll', function () {
      var top  = window.scrollY || document.documentElement.scrollTop;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docH > 0 ? top / docH : 0;
    }, { passive: true });

    // Exterior opacity tracking
    var extOpacity = 1.0;
    var idleT      = 0;

    function animate() {
      requestAnimationFrame(animate);
      currentScroll += (targetScroll - currentScroll) * 0.038;
      idleT = Date.now() * 0.00018;

      var state = getCameraState(currentScroll);

      // Subtle idle breathing drift
      camera.position.copy(state.pos);
      camera.position.x += Math.sin(idleT) * 0.07;
      camera.position.y += Math.cos(idleT * 0.65) * 0.03;
      camera.lookAt(state.target);

      // Fade exterior meshes as camera enters building (scroll > 0.63)
      var targetExt;
      if (currentScroll > 0.63) {
        targetExt = Math.max(1 - (currentScroll - 0.63) / 0.18, 0.04);
      } else {
        targetExt = 1.0;
      }
      extOpacity += (targetExt - extOpacity) * 0.055;

      if (Math.abs(extOpacity - targetExt) > 0.005) {
        for (var i = 0; i < exteriorMeshes.length; i++) {
          var m = exteriorMeshes[i];
          if (m.material) {
            m.material.transparent = true;
            m.material.opacity = extOpacity;
          }
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  try {
    if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
    initScene();
  } catch (e) {
    var canvas2 = document.getElementById('bg-canvas');
    if (canvas2) canvas2.style.display = 'none';
    var hero2 = document.querySelector('.hero');
    if (hero2) {
      hero2.style.backgroundImage = "url('assets/edificio.jpg')";
      hero2.style.backgroundSize  = 'cover';
      hero2.style.backgroundPosition = 'center';
    }
  }
})();
