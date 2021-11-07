const period_url = `http://${window.location.host}/period`
const points_url = `http://${window.location.host}/extreme_points`
const alt_host = "192.168.137.200:5001"
const alt_points_url = `http://${alt_host}/extreme_points`
// should the same as python period half max len
const period_half_max_len = 20
const pts_set = new Set()
const period_set = new Set()
const alt_period_set = new Set()
const alt_pts_set = new Set()
const MAX_BIN = 64

let isMainPtsCalc = false
let isAltPtsCalc = false
let isMainPeriodCalc = false
let isAltPeriodCalc = false

let main_diff = 0
let alt_diff = 0
// 3cm diff of tube
const DIFF = 0.03

function split_array_in_half(arr){
  const list = arr.sort(function(a,b){return a-b})
  const half = Math.ceil(list.length / 2);    
  return [list.slice(0, half), list.slice(-half)]
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

function filterOutliers(someArray) {

  if(someArray.length < 4)
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

  return values.filter((x) => (x >= minValue) && (x <= maxValue));
}

function filterPeriod(orig_period){
  if (orig_period.length > Math.floor(period_half_max_len/2)){
    const filter_period = filterOutliers(orig_period)
    // if (filter_period.length != orig_period.length){
    //   console.log("orig",orig_period)
    //   console.log("filterd", filter_period)
    // }
    return filter_period
  } else {
    return orig_period
  }
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
  const response = await fetch(period_url);

  if (response.status == 502) {
    // 状态 502 是连接超时错误，
    // 连接挂起时间过长时可能会发生，
    // 远程服务器或代理会关闭它
    // 让我们重新连接
    await subsccribe_period();
  } else if (response.status != 200) {
    console.error(response.statusText);
    // 一秒后重新连接
    await new Promise(resolve => setTimeout(resolve, 1000));
    await subscribe_period();
  } else {
    const data = await response.json()
    const period = filterPeriod(data.period)
    period.forEach(time => period_set.add(time))
    // Table
    // const table = document.getElementById("main-period-tab")
    // table.replaceChildren()
    if (period.length > 0) {
      // generateTable(table, period)
      const T_avg = math.mean(period) * 2
      const length = (T_avg/(2*Math.PI)) ** 2 * 9.8 - DIFF
      const std = math.std(period)
      document.getElementById("main-avg").innerHTML = `Period: ${T_avg.toFixed(3)}s STD: ${std}`
      if(std < 0.1){
        document.getElementById("main-length").innerHTML = `Length: ${length.toFixed(3)}m`
      } else {
        document.getElementById("main-length").innerHTML = `Length: Calculating (${length.toFixed(3)}m)`
      }
    }
    // 再次调用 subscribe() 以获取下一条消息
    // Hold a second
    await new Promise(resolve => setTimeout(resolve, 1000));
    await subscribe_period();
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
            console.log("deg", angle_degrees)
          }
        }
      }
      // console.log("points", pts_set)
      // console.log("pts set", pts_set)

      // 再次调用 subscribe() 以获取下一条消息
      // Hold a second
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_pts();
    }
  }
}

async function subscribe_alt_pts() {
  if(isAltPtsCalc == false){
    // console.log("Subscribe Points!")
    const response = await fetch(alt_points_url);
    // console.log(response);

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
          console.log("alt", left_most_bin, right_most_bin)
          const left_average = math.mean(left_most_bin)
          const right_average = math.mean(right_most_bin)
          alt_diff = right_average - left_average
          console.log("alt", left_average, right_average, alt_diff)
          isAltPtsCalc = true
          if (isMainPtsCalc && isAltPtsCalc == true) {
            const angle_radians = Math.atan(main_diff/alt_diff)
            const angle_degrees = Math.degrees(angle_radians)
            console.log("deg", angle_degrees)
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_alt_pts();
    }
  }
}

function init() {
  console.log("LOADED!")

  // Calculate Average
  subscribe_period()
  subscribe_pts()
  subscribe_alt_pts()
}