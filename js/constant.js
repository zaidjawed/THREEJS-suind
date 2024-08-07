import { Selection } from "postprocessing";
import data from './data.json';

//Constant
const instancedModelsArr = [];
const tooltipArr = [];

const tweenAnimation = new Set();
const selectedForBloom = new Selection();

const count = data.drones.length;

const backBtnEl = document.getElementById("backBtn");
const containerEl = document.getElementById("container");
const statusEl = document.getElementById("status");
const flightHourEl = document.getElementById("flightHour");
const batteryStatusEl = document.getElementById("batteryStatus");
const locationEl = document.getElementById("location");
const missionEl = document.getElementById("mission");
const idEl = document.getElementById("id");
const maintenanceLogsEl = document.getElementById("maintenanceLogs");
const canvas = document.getElementById("canvas");
const loaderEl = document.getElementById("loader");

const canvasSize = {
  x: window.innerWidth,
  y: window.innerHeight
}

const targetFPS = 60;
const frameInterval = 1 / targetFPS;

export {
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
}