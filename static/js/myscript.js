const peroid_url = `http://${window.location.host}/peroid`
const peroid_half_max_len = 20


document.addEventListener('DOMContentLoaded', function () {
  init()
})

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

function filterPeriod(orig_peroid){
  if (orig_peroid.length > Math.floor(peroid_half_max_len/2)){
    const filter_peroid = filterOutliers(orig_peroid)
    if (filter_peroid.length != orig_peroid.length){
      console.log("orig",orig_peroid)
      console.log("filterd", filter_peroid)
    }
    return filter_peroid
  } else {
    return orig_peroid
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


function init() {
  console.log("LOADED!")

  // Calculate Average
  const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
  async function subscribe_peroid() {
    let response = await fetch(peroid_url);

    if (response.status == 502) {
      // 状态 502 是连接超时错误，
      // 连接挂起时间过长时可能会发生，
      // 远程服务器或代理会关闭它
      // 让我们重新连接
      await subsccribe_peroid();
    } else if (response.status != 200) {
      console.error(response.statusText);
      // 一秒后重新连接
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_peroid();
    } else {
      let data = await response.json()
      let peroid = filterPeriod(data.peroid)
      const table = document.getElementById("main-peroid-tab")
      table.replaceChildren()
      if (peroid.length > 0) {
        generateTable(table, peroid)
        document.getElementById("main-avg").innerHTML = average(peroid)
      }
      // 再次调用 subscribe() 以获取下一条消息
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe_peroid();
    }
  }

  // fetch(peroid_url).then(res=> res.json()).then(data => {
  //   console.log(data)
  //   document.getElementById("main-peroid").innerHTML = data.peroid
  // })

  
  subscribe_peroid()
  document.getElementById("refresh").addEventListener("click", (e) => {
    fetch(peroid_url).then(res => res.json()).then(data => {
      console.log(data)
      document.getElementById("main-peroid").innerHTML = data.peroid
      document.getElementById("main-avg").innerHTML = average(data.peroid)
    })
  })
}