const peroid_url = "http://192.168.137.161:5000/peroid"
function init() {
  console.log("LOADED!")

  const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

  fetch('http://192.168.137.161:5000/peroid').then(res=> res.json()).then(data => {
    console.log(data)
    document.getElementById("main-peroid").innerHTML = data.peroid
  })
  
  document.getElementById("refresh").addEventListener("click", (e) => {
    fetch('http://192.168.137.161:5000/peroid').then(res=> res.json()).then(data => {
      console.log(data)
      document.getElementById("main-peroid").innerHTML = data.peroid
      document.getElementById("main-avg").innerHTML = average(data.peroid)
    })
  })
}