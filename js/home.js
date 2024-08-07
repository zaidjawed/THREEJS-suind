import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer, RenderPass, EffectPass, SelectiveBloomEffect } from 'postprocessing';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import bgTexturePath from '../assets/bg2.jpg';
import data from './data.json';

import {
  instancedModelsArr,
  tooltipArr,
  tweenAnimation,
  selectedForBloom,
  count,
  backBtnEl,
  containerEl,
  statusEl,
  flightHourEl,
  batteryStatusEl,
  locationEl,
  missionEl,
  idEl,
  maintenanceLogsEl,
  canvas,
  canvasSize,
  frameInterval,
  loaderEl
} from './constant';


let activeToolTipIndex = -1;
let activeDroneIndex = -1;
let delta = 0;

const clock = new THREE.Clock(true);

//=======================================================
// SCENE, CAMERA AND CONTROLS
//=======================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a3d62');
const camera = new THREE.PerspectiveCamera(70, canvasSize.x / canvasSize.y, 0.2, 1000);
camera.position.set(8, -15, 0);
camera.lookAt(0, 0, 0);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.minDistance = 10;
controls.target.set(0, 0, 0);
controls.enabled = false;


//=======================================================
// LIGHTS
//=======================================================
addLights();

//=======================================================
// RENDERER
//=======================================================
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(canvasSize.x, canvasSize.y);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;


//=======================================================
// SKYBOX
//=======================================================
const skyBoxGeometry = new THREE.SphereGeometry(100);
const skykBoxMaterial = new THREE.MeshStandardMaterial({
  side: THREE.BackSide,
  emissive: new THREE.Color(0x000000),
  emissiveIntensity: 0.1,
  color: new THREE.Color(0xffffff)
});
const skyBox = new THREE.Mesh(skyBoxGeometry, skykBoxMaterial);
skyBox.rotation.set(0, 0, Math.PI / 180 * -47);
scene.add(skyBox);

//=======================================================
// RAYCASTER
//=======================================================
const raycaster = new THREE.Raycaster();
const mousePointer = new THREE.Vector2();

//=======================================================
// POST PROCESSING
//=======================================================
const selectiveBloom = new SelectiveBloomEffect(scene, camera, {
  intensity: 15,
  luminanceThreshold: 0.1,
  mipmapBlur: true,
  radius: 0.7,
});
selectiveBloom.selection = selectedForBloom;
selectedForBloom.clear();

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
composer.addPass(new EffectPass(camera, selectiveBloom));


//=======================================================
// LOADERS
//=======================================================
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
  console.log("start", url, itemsLoaded, itemsTotal);
}

loadingManager.onLoad = () => {
  console.log("loaded");
  hideLoader();
  updateScene();
}

const textureLoader = new THREE.TextureLoader(loadingManager);
const skyboxTexture = textureLoader.load(bgTexturePath);
skyboxTexture.encoding = THREE.sRGBEncoding;
skykBoxMaterial.map = skyboxTexture;

const gltfLoader = new GLTFLoader(loadingManager);

gltfLoader.load(
  './assets/scene.gltf',
  function (gltf) {
    const dummy = new THREE.Object3D();
    const cols = 3, spacing = 3;
    const parts = [];

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        parts.push({
          geometry: child.geometry,
          material: child.material,
          position: child.position.clone(),
          rotation: child.rotation.clone(),
          scale: child.scale.clone(),
        });

        selectedForBloom.add(child);
      }
    });

    parts.forEach((part) => {
      instancedModelsArr.push(new THREE.InstancedMesh(part.geometry, part.material, count + 1))
    });

    for (let i = 0; i < count + 1; i++) {
      const x = 0;
      const z = (i % cols - 1) * spacing;
      const y = Math.floor(i / cols - 1) * spacing;

      const instancePosition = new THREE.Vector3(x, y, z);

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        const instancedMesh = instancedModelsArr[j];
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;

        if (i !== count) {
          dummy.position.set(x, y, z);
          dummy.rotation.copy(part.rotation);
          dummy.rotation.y += Math.PI / 2;
          dummy.rotation.x += Math.PI;

          dummy.scale.copy(part.scale);
          dummy.position.add(instancePosition);
        }
        else {
          dummy.position.set(40, 0, 0);
          dummy.rotation.copy(part.rotation);
          dummy.rotation.x -= Math.PI / 2;
          dummy.scale.copy(part.scale);
        }

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        if (j === 0 && i !== count) {
          const messageBox = document.createElement('div');
          messageBox.dataset.tooltip = `#${i + 1} ${data.drones[i].status} - ${data.drones[i].battery_status}`;
          messageBox.className = 'tooltip';
          const extraClassName = data.drones[i].status === 'Available' ? 'success' : data.drones[i].status === 'In-flight' ? 'info' : 'danger'
          messageBox.classList.add(extraClassName);
          document.body.appendChild(messageBox);
          tooltipArr.push(messageBox);

          const screenPosition = toScreenPosition(dummy.position);
          tooltipArr[i].style.left = `${screenPosition.x - 30}px`;
          tooltipArr[i].style.top = `${screenPosition.y - 25}px`;
        }
      }
    }

    instancedModelsArr.forEach((instancedMesh) => {
      scene.add(instancedMesh);
    });

  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);


//=======================================================
// TICK FUNCTIONS
//=======================================================

function updateScene() {
  requestAnimationFrame(updateScene);
  delta += clock.getDelta();

  if (delta >= frameInterval) {
    tick();
    delta = delta % frameInterval;
  }
}

function tick() {
  if (activeDroneIndex === -1) {
    updatePositionOfDrone();
  }
  else {
    rotateMainDrone();
  }

  for (let tween of tweenAnimation) {
    if (tween.isPlaying()) tween.update();
    else tween.start();
  }

  controls.update();
  composer.render();
}


//=======================================================
// EVENT LISTERNER
//=======================================================
window.addEventListener('mousemove', (e) => {
  mousePointer.x = e.clientX / canvasSize.x * 2 - 1;
  mousePointer.y = - (e.clientY / canvasSize.y) * 2 + 1;

  raycaster.setFromCamera(mousePointer, camera);
  const intersectedObject = raycaster.intersectObjects(instancedModelsArr, false);

  if (intersectedObject.length == 0) {
    document.body.style.cursor = "unset";

    if (activeToolTipIndex != -1) {
      tooltipArr[activeToolTipIndex].classList.remove('active');
      activeToolTipIndex = -1;
    }

    return;
  }

  let obj = intersectedObject[0];
  const instanceId = obj.instanceId;
  if (instanceId == null) return;

  if (activeToolTipIndex != -1) {
    tooltipArr[activeToolTipIndex].classList.remove('active');
  }

  activeToolTipIndex = instanceId;
  tooltipArr[activeToolTipIndex].classList.add('active');

  document.body.style.cursor = "pointer"
});

window.addEventListener('click', () => {
  if (activeToolTipIndex === -1) return;
  focusOnMainDrone();
});

backBtnEl.addEventListener('click', () => {
  unfocusFromMainDrone();
});


//=======================================================
// HELPER FUNCTIONS
//=======================================================

function hideLoader() {
  loaderEl.classList.add('hide');
}

function focusOnMainDrone() {
  activeDroneIndex = activeToolTipIndex;
  document.body.style.cursor = "unset";
  raycaster.layers.disableAll();
  toggleTooltip(false);

  const droneData = data.drones[activeDroneIndex];
  statusEl.innerHTML = droneData.status;
  flightHourEl.innerHTML = `${droneData.flight_hours} hour`;
  batteryStatusEl.innerHTML = droneData.battery_status;
  locationEl.innerHTML = `${droneData.last_known_location[0]}, ${droneData.last_known_location[1]}`;
  missionEl.innerHTML = droneData.current_mission;
  idEl.innerHTML = `#Drone${activeDroneIndex + 1}`;

  maintenanceLogsEl.innerHTML = droneData.maintenance_logs.map((val, i) => (
    `<div class="item">
        <p class="desc">${val.description}</p>
        <div class="subtitle">
          <span class="date">${val.date}</span> | <span class="name">${val.technician}</span>
        </div>
      </div>`
  )).join("");

  const focusCamera = getTween(controls.target, { x: 50, y: -2, z: 10 }, 2000);
  tweenAnimation.add(focusCamera);
  focusCamera.onComplete(() => {
    tweenAnimation.delete(focusCamera);
    toggleInfo(true);
  });

  const moveCamera = getTween(camera.position, { x: 36, y: 1, z: -1.8 }, 1000, 500);
  tweenAnimation.add(moveCamera);
  moveCamera.onComplete(() => tweenAnimation.delete(moveCamera));

  const rotateSkybox = getTween(skyBox.rotation, { x: 0, y: Math.PI / 180 * -24, z: Math.PI / 180 * 10 }, 2000);
  tweenAnimation.add(rotateSkybox);
  rotateSkybox.onComplete(() => tweenAnimation.delete(rotateSkybox));
}

function unfocusFromMainDrone() {
  activeDroneIndex = -1;
  raycaster.layers.enableAll();
  toggleInfo(false);

  const focusCamera = getTween(controls.target, { x: 0, y: 0, z: 0 }, 2000);
  tweenAnimation.add(focusCamera);
  focusCamera.onComplete(() => {
    tweenAnimation.delete(focusCamera);
    toggleTooltip(true);
  });

  const moveCamera = getTween(camera.position, { x: 8, y: -15, z: 0 }, 1000, 500);
  tweenAnimation.add(moveCamera);
  moveCamera.onComplete(() => tweenAnimation.delete(moveCamera));

  const rotateSkybox = getTween(skyBox.rotation, { x: 0, y: 0, z: Math.PI / 180 * -47 }, 2000);
  tweenAnimation.add(rotateSkybox);
  rotateSkybox.onComplete(() => tweenAnimation.delete(rotateSkybox));
}

function toggleTooltip(shouldShow) {
  for (let val of tooltipArr) {
    if (shouldShow) val.classList.remove('hide');
    else val.classList.add('hide');
  }
}

function toggleInfo(shouldShow) {
  if (shouldShow) containerEl.classList.remove('hide');
  else containerEl.classList.add('hide');
}

function updatePositionOfDrone() {
  for (let i = 0; i < count; i++) {
    const time = clock.getElapsedTime();

    const yDisplacement = Math.cos(time * Math.PI) * 0.003;
    const zDisplacement = Math.sin(time * Math.PI) * 0.003;

    const instanceDisplacement = new THREE.Vector3(0, yDisplacement, zDisplacement);
    let dummy = new THREE.Object3D();

    for (let j = 0; j < instancedModelsArr.length; j++) {
      const instancedMesh = instancedModelsArr[j];
      const transform = getInstanceTransform(instancedMesh, i);

      dummy.position.copy(transform.position);
      dummy.rotation.copy(transform.rotation);
      dummy.scale.copy(transform.scale);

      dummy.position.add(instanceDisplacement);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

function rotateMainDrone() {
  for (let j = 0; j < instancedModelsArr.length; j++) {
    const instancedMesh = instancedModelsArr[j];
    const transform = getInstanceTransform(instancedMesh, count);

    const dummy = new THREE.Object3D();
    dummy.position.copy(transform.position);
    dummy.rotation.copy(transform.rotation);
    dummy.scale.copy(transform.scale);

    dummy.rotation.z += 0.01;

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(count, dummy.matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;
  }
}

function getTween(target, to, playTime, delay = 0, animation = TWEEN.Easing.Quadratic.InOut) {
  return new TWEEN.Tween(target, false)
    .to(to, playTime)
    .easing(animation)
    .delay(delay)
}

function getInstanceTransform(instancedMesh, index) {
  const dummy = new THREE.Object3D();

  instancedMesh.getMatrixAt(index, dummy.matrix);
  dummy.matrix.decompose(dummy.position, dummy.rotation, dummy.scale);
  return {
    position: dummy.position.clone(),
    rotation: dummy.rotation.clone(),
    scale: dummy.scale.clone(),
  };
}

function toScreenPosition(position) {
  const width = canvasSize.x;
  const height = canvasSize.y;

  var vector = new THREE.Vector3(position.x, position.y, position.z);
  vector.project(camera);

  vector.x = (vector.x + 1) * width / 2;
  vector.y = - (vector.y - 1) * height / 2;
  vector.z = 0;

  return {
    x: vector.x,
    y: vector.y
  };
}

function addLights() {
  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  camera.add(pointLight);

  const topDirectionalLight = new THREE.DirectionalLight(0xffa500, 1.5);
  topDirectionalLight.position.set(5, 10, 7.5);
  topDirectionalLight.castShadow = true;
  scene.add(topDirectionalLight);

  const rightDirectionalLight = new THREE.DirectionalLight(0xffa500, 1);
  rightDirectionalLight.position.set(0, 0, 10);
  rightDirectionalLight.target.position.set(0, 0, 0);
  scene.add(rightDirectionalLight);

  const backDirectionalLight = new THREE.DirectionalLight(0xffa500, 1);
  backDirectionalLight.position.set(-5, 10, -7.5);
  backDirectionalLight.target.position.set(3, 0, 0);
  scene.add(backDirectionalLight);
}