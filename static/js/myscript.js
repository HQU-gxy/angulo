const period_url = `http://${window.location.host}/period`
const points_url = `http://${window.location.host}/extreme_points`
const alt_host = "alt-cam.local:5001"
const alt_period_url = `http://${alt_host}/period`
const alt_points_url = `http://${alt_host}/extreme_points`
// should the same as python period half max len
// const PERIOD_HALF_MAX_LEN = 20
const pts_set = new Set()
const period_set = new Set()
const alt_period_set = new Set()
const alt_pts_set = new Set()

const main_length_filtered = new Set()
const alt_length_filtered = new Set()

const MAX_BIN = 64

const OUTLINER_MIN = 10
const PERIOD_FETCH_INTERVAL = 1000
const POINT_FETCH_INTERVAL = 1000

const FINAL_LEN_FILTERED_LENGTH_MIN = 4
const FINAL_LEN_FILTERED_LENGTH_MAX = 7
let var_filtered_length = FINAL_LEN_FILTERED_LENGTH_MAX

let isMainPtsCalc = false
let isAltPtsCalc = false
let isPeriodCalc = false

let calcLength = 0
let calcAngle = 0

let main_diff = 0
let alt_diff = 0
// 3cm diff of tube
const DIFF = 0.075

const STD_MAX = 0.3
const STD_MIN = 0.15
let var_std = STD_MIN

const LIMIT_TIME = 25000

let time_ms = 0
let angle_time_ms = 0

const startAudio = new Audio('start.mp3')

function setDisplayMain(){
  document.getElementById("main-frame").classList.remove('d-none')
  document.getElementById("main-frame").classList.remove('col-sm-6')
  document.getElementById("alt-frame").classList.add('d-none')
}

function setDisplayAlt(){
  document.getElementById("alt-frame").classList.remove('d-none')
  document.getElementById("alt-frame").classList.remove('col-sm-6')
  document.getElementById("main-frame").classList.add('d-none')
}

function setDisplayBoth(){
  document.getElementById("alt-frame").classList.remove('d-none')
  document.getElementById("main-frame").classList.remove('d-none')
  document.getElementById("alt-frame").classList.add('col-sm-6')
  document.getElementById("main-frame").classList.add('col-sm-6')
}

function init_btn() {
  angle_timer()
  timer()
  const btn = document.getElementById("init_btn")
  btn.innerHTML = "Initialized"
  btn.classList.add("btn-primary")
  startAudio.play()
}

function split_array_in_half(arr){
  const list = arr.sort(function(a,b){return a-b})
  const half = Math.ceil(list.length / 2);    
  return [list.slice(0, half), list.slice(-half)]
}

function timer(){
  const interval = setInterval(()=>{
    time_ms += 100
    // console.log(time_ms)
    document.getElementById("total-time").innerHTML = `${time_ms/1000}s`
    if (isPeriodCalc == true) {
      const btn = document.getElementById("init_btn")
      btn.innerHTML = "Success"
      btn.classList.remove("btn-primary")
      btn.classList.add("btn-success")
      clearInterval(interval)
      const lengthAudio = new Audio(`length/${(calcLength*100).toFixed(0)}cm.mp3`)
      lengthAudio.play()
    }
  }, 100)
  return interval
}

function angle_timer(){
  const interval = setInterval(()=>{
    angle_time_ms += 100
    // console.log(time_ms)
    document.getElementById("total-angle-time").innerHTML = `${angle_time_ms/1000}s`
    if (isMainPtsCalc && isAltPtsCalc == true) {
      const btn = document.getElementById("init_btn")
      btn.innerHTML = "Success"
      btn.classList.remove("btn-primary")
      btn.classList.add("btn-success")
      clearInterval(interval)
      const angleAudio = new Audio(`deg/${calcAngle.toFixed(0)}deg.mp3`)
      angleAudio.play()
    }
  }, 100)
  return interval
}

// Stupid algorithm
function get_most_bin(array, bins = 64){
  // get the max value of array "array"
  const distance = Math.ceil((array.reduce((a, b) => Math.max(a, b), 0))/bins)
  // console.log(distance)
  const split = Array.from({length: bins}, (_, i) => i * distance)
  // console.log(split)
  const values_splited = Array.from({length: bins}, (_, i) => [])
  array.forEach(number => {
    for (let i = 0; i < bins-1; i++){
      if (number >= split[i] && number <= split[i+1]){
        values_splited[i].push(number)
        break
      }
    }
  })
  // console.log(values_splited)
  const length = Array.from(values_splited, (elem, index) => elem.length)
  // console.log(length)
  // get the max value of array "length"
  const indexOfMax = length.indexOf(length.reduce((a, b) => Math.max(a, b), 0))
  // console.log(indexOfMax)
  return values_splited[indexOfMax]
}

document.addEventListener('DOMContentLoaded', function () {
  init()
})


// from https://github.com/crosstyan/EcgServer/blob/55d3530dd3c0f907576bf3920f4645b62fcbd6a0/js/client.js
function openSaveFileDialog (data, filename, mimetype) {
    if (!data) return;

    var blob = data.constructor !== Blob
      ? new Blob([data], {type: mimetype || 'application/octet-stream'})
      : data ;

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
      return;
    }

    var lnk = document.createElement('a'),
        url = window.URL,
        objectURL;

    if (mimetype) {
      lnk.type = mimetype;
    }

    lnk.download = filename || 'untitled';
    lnk.href = objectURL = url.createObjectURL(blob);
    lnk.dispatchEvent(new MouseEvent('click'));
    setTimeout(url.revokeObjectURL.bind(url, objectURL));
}

/*
extreme_point = {
    "point": center, // should be (y,x)
    "timestamp": time.time(),
    "isLeft2right": False,
}
*/
function export_points(set){
    const points_obj_seq = []
    for (let point of Array.from(set)){
      const obj = {
        x: point.point[0],
        y: point.point[1],
        time: point.timestamp
      }
      points_obj_seq.push(obj)
    }
    // console.log(pts_set)
    // console.log(Array.from(pts_set))
    const exportedCsvStr=Papa.unparse(points_obj_seq)
    openSaveFileDialog(exportedCsvStr,"points.csv","text/csv")
}

function export_period(){
    const period_obj_seq = []
    for (let time of Array.from(period_set)){
      const obj = {
        time: time
      }
      period_obj_seq.push(obj)
    }
    const exportedCsvStr=Papa.unparse(period_obj_seq)
    openSaveFileDialog(exportedCsvStr,"period.csv","text/csv")
}

function outlinerFilter(someArray) {

  if(someArray.length < OUTLINER_MIN)
    return someArray;

  let values, q1, q3, iqr, maxValue, minValue;

  values = someArray.slice().sort( (a, b) => a - b);//copy array fast and sort

  if((values.length / 4) % 1 === 0){//find quartiles
    q1 = 1/2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
    q3 = 1/2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
  } else {
    q1 = values[Math.floor(values.length / 4 + 1)];
    q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
  }

  iqr = q3 - q1;
  maxValue = q3 + iqr * 1.5;
  minValue = q1 - iqr * 1.5;

  const filtered = values.filter((x) => (x >= minValue) && (x <= maxValue))
  const difference = someArray.filter(x => !filtered.includes(x))
  if (difference.length != 0){
    console.log("outlinerFilter Diff", difference)
  }
  return filtered
}

function generateTable(tab, ary) {
  for (let [index, element] of ary.entries()) {
    let row = tab.insertRow()
    let cell_order = row.insertCell()
    let cell_content = row.insertCell()
    cell_order.appendChild(document.createTextNode(index))
    cell_content.appendChild(document.createTextNode(element))
  }
}
async function subscribe_period() {
  if (isPeriodCalc === false){
    const response = await fetch(period_url);

    if (response.status == 502) {
      await subsccribe_period();
    } else if (response.status != 200) {
      console.error(response.statusText);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_period();
    } else {
      const data = await response.json()
      const period = data.period
      if (time_ms > LIMIT_TIME) {
        var_filtered_length = FINAL_LEN_FILTERED_LENGTH_MIN
        var_std = STD_MAX
      }
      if (period.length > 0) {
        const length_array = period.map(time => ((time*2)/(2*Math.PI)) ** 2 * 9.8 - DIFF)
        const length_array_in_range = length_array.filter(len => (len > 0.4 && len < 1.6))
        const filtered_length = outlinerFilter(length_array_in_range)
        if (filtered_length.length > 0) {
          const length = math.mean(filtered_length)
          const std = math.std(filtered_length)
          document.getElementById("main-avg").innerHTML = `STD: ${std}`
          if(std < var_std && std > 0){
            main_length_filtered.add(length)
            console.log("main", main_length_filtered)
            // if time bigger than 20s
            if (main_length_filtered.size >= var_filtered_length){
              const length_ary = Array.from(main_length_filtered)
              const length_mid = math.median(length_ary)
              calcLength = length_mid
              document.getElementById("total-length").innerHTML = `${length_mid.toFixed(3)}m`
              isPeriodCalc = true
            }
            document.getElementById("main-length").innerHTML = `Length: ${length.toFixed(3)}m`
          } else {
            document.getElementById("main-length").innerHTML = `Length: Calculating (${length.toFixed(3)}m)`
          }
        }
      }
      // Hold a second
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_period();
    }
  }
}

async function subscribe_alt_period() {
  if (isPeriodCalc === false){
    const response = await fetch(alt_period_url);

    if (response.status == 502) {
      await subscribe_alt_period();
    } else if (response.status != 200) {
      console.error(response.statusText);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_alt_period();
    } else {
      const data = await response.json()
      const period = data.period
      if (time_ms > LIMIT_TIME) {
        var_filtered_length = FINAL_LEN_FILTERED_LENGTH_MIN
        var_std = STD_MAX
      }
      if (period.length > 0) {
        const length_array = period.map(time => ((time*2)/(2*Math.PI)) ** 2 * 9.8 - DIFF)
        const length_array_in_range = length_array.filter(len => (len > 0.4 && len < 1.6))
        const filtered_length = outlinerFilter(length_array_in_range)
        if (filtered_length.length > 0) {
          const length = math.mean(filtered_length)
          const std = math.std(filtered_length)
          document.getElementById("alt-avg").innerHTML = `STD: ${std}`
          if(std < var_std && std > 0){
            alt_length_filtered.add(length)
            console.log("alt", alt_length_filtered)
            if (alt_length_filtered.size >= var_filtered_length){
              const length_ary = Array.from(alt_length_filtered)
              const length_mid = math.median(length_ary)
              calcLength = length_mid
              document.getElementById("total-length").innerHTML = `${length_mid.toFixed(3)}m`
              isPeriodCalc = true
            }
            document.getElementById("alt-length").innerHTML = `Length: ${length.toFixed(3)}m`
          } else {
            document.getElementById("alt-length").innerHTML = `Length: Calculating (${length.toFixed(3)}m)`
          }
        }
      }
      // Hold a second
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_alt_period();
    }
  }
}

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
}

/*
wrapped by "points"
extreme_point = {
    "point": center, // should be (y,x)
    "timestamp": time.time(),
    "isLeft2right": False,
}
*/
async function subscribe_pts() {
  if(isMainPtsCalc == false){
    // console.log("Subscribe Points!")
    const response = await fetch(points_url);
    // console.log(response);

    if (response.status == 502) {
      await subsccribe_pts();
    } else if (response.status != 200) {
      console.error(response.statusText);
      // 一秒后重新连接
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_pts();
    } else {
      const data = await response.json()
      const pts = data.points
      // console.log("points", pts)
      if (isMainPtsCalc == false) {
        if (pts_set.size < 100){
          pts.forEach(point => pts_set.add(point.point))
        } else {
          const points_arr = Array.from(pts_set).map(point => point[0])
          // console.log(points_arr)
          const splited = split_array_in_half(points_arr)
          const left_most_bin = get_most_bin(splited[0])
          const right_most_bin = get_most_bin(splited[1])
          // console.log(left_most_bin, right_most_bin)
          const left_average = math.mean(left_most_bin)
          const right_average = math.mean(right_most_bin)
          main_diff = right_average - left_average
          console.log("main",left_average, right_average, main_diff)
          isMainPtsCalc = true
          if (isMainPtsCalc && isAltPtsCalc == true) {
            const angle_radians = Math.atan(main_diff/alt_diff)
            const angle_degrees = Math.degrees(angle_radians)
            calcAngle = angle_degrees
            console.log(angle_degrees)
            document.getElementById("total-angle").innerHTML = `${angle_degrees}&deg;`
          }
        }
      }

      // Hold a second
      await new Promise(resolve => setTimeout(resolve, PERIOD_FETCH_INTERVAL));
      await subscribe_pts();
    }
  }
}

async function subscribe_alt_pts() {
  if(isAltPtsCalc == false){
    // console.log("Subscribe Points!")
    const response = await fetch(alt_points_url);

    if (response.status == 502) {
      await subscribe_alt_pts();
    } else if (response.status != 200) {
      console.error(response.statusText);
      // 一秒后重新连接
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_alt_pts();
    } else {
      const data = await response.json()
      const pts = data.points
      if (isAltPtsCalc == false) {
        if (alt_pts_set.size < 100){
          pts.forEach(point => alt_pts_set.add(point.point))
        } else {
          const points_arr = Array.from(alt_pts_set).map(point => point[0])
          // console.log(points_arr)
          const splited = split_array_in_half(points_arr)
          const left_most_bin = get_most_bin(splited[0])
          const right_most_bin = get_most_bin(splited[1])
          // console.log("alt", left_most_bin, right_most_bin)
          const left_average = math.mean(left_most_bin)
          const right_average = math.mean(right_most_bin)
          alt_diff = right_average - left_average
          console.log("alt", left_average, right_average, alt_diff)
          isAltPtsCalc = true
          if (isMainPtsCalc && isAltPtsCalc == true) {
            const angle_radians = Math.atan(main_diff/alt_diff)
            const angle_degrees = Math.degrees(angle_radians)
            calcAngle = angle_degrees
            console.log(angle_degrees)
            document.getElementById("total-angle").innerHTML = `${angle_degrees}&deg;`
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, PERIOD_FETCH_INTERVAL));
      await subscribe_alt_pts();
    }
  }
}

function init() {
  console.log("LOADED!")

  // Calculate Average
  subscribe_period()
  subscribe_alt_period()
  subscribe_pts()
  subscribe_alt_pts()
}