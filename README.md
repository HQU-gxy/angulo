# La ángulo

A solution to [TI 杯2021年全国大学生电子设计竞赛赛题D-基于互联网的摄像测量系统](https://www.nuedc-training.com.cn/index/news/details/new_id/257) from HQU013.

## Structure

```text
.
├── docs                    # Report
├── README.md
├── src                     # Source code
│   ├── alt.py              # Alternate camera
│   ├── app.py              # Main program
│   ├── cam.py              # Main camera
│   ├── mog.py              # A test program using OpenCV MOG2
│   ├── requirements.txt
│   ├── static              # Website stuff
│   │   ├── css
│   │   ├── deg             # Audio files for degree
│   │   ├── favicon.ico
│   │   ├── js
│   │   └── length          # Audio files for length
│   └── templates           # HTML templates
│       ├── index.html
│       └── local.html
└── utils
    ├── iflytek             # A tool to download audio files from iflytek TTS API
    └── services            # Systemd services
```

## What is missing

I don't want to upload the audio files to the repository since they are too big, but you can
generate them by running `utils/iflytek`.

The audio files should be in the `src/static/deg` and `src/static/length` folders as follows.

```text
src/static
├── deg
│   ├── 0deg.mp3
│   ├── 1deg.mp3
│   ├── 2deg.mp3
│   │   ...
│   └── 90deg.mp3
└── length
    ├── 40cm.mp3
    ├── 41cm.mp3
    ├── 42cm.mp3
    │   ...
    └── 160cm.mp3
```

### JavaScript Library Used

Maybe you also want to running it without Internet connection, for which you should change the libraries URL in `src/templates`.

I don't want to include these JavsScript libraries in the repository since they are redundant.
I know I should have used NPM as package manager but I'm lazy.

- [math.js | an extensive math library for JavaScript and Node.js](https://mathjs.org/)
- [Papa Parse - Powerful CSV Parser for JavaScript](https://www.papaparse.com/)
- [Bootstrap · The most popular HTML, CSS, and JS library in the world.](https://getbootstrap.com/)

## Usage

Grab two or three Raspberry Pi and connect them to the same network with router/switch/WIFI.
Change the hostname of one Raspberry Pi to `main-cam` and the other to `alt-cam`. The domain is resolved by the [avahi](https://www.avahi.org/) with mDNS,
so you can use `main-cam.local` or `alt-cam.local` to access them.

The default port number is `5001`.

## Useful Links

### Flask Capture

- [GitHub - akmamun/multiple-camera-stream: Multiple Camera CCTV/RTSP/Video Streaming with Flask and OpenCV](https://github.com/akmamun/multiple-camera-stream)
- [GitHub - NakulLakhotia/Live-Streaming-using-OpenCV-Flask: A Flask Web-App to stream live from local webcam or CCTV (rtsp link)](https://github.com/NakulLakhotia/Live-Streaming-using-OpenCV-Flask)
- [GitHub - wenyuanw/facemask-detection-RaspberryPi: mask detection, Raspberry Pi, MLX90614, Python, Flask, OpenCV, video stream，树莓派，口罩佩戴检测，人工智能、温度检测](https://github.com/wenyuanw/facemask-detection-RaspberryPi)
- [GitHub - EbenKouao/pi-camera-stream-flask: Create your own live camera stream using a Raspberry Pi 4](https://github.com/EbenKouao/pi-camera-stream-flask)
- [GitHub - burningion/poor-mans-deep-learning-camera: Build a thin client deep learning camera with the Raspberry Pi, Flask, and YOLO](https://github.com/burningion/poor-mans-deep-learning-camera)
- [OpenCV视频分析-Meanshift、Camshift&运动轨迹绘制 - 知乎](https://zhuanlan.zhihu.com/p/71840019)

### pendulum

- [Python x OpenCV x math pendulum = gravitational acceleration - YouTube](https://www.youtube.com/watch?v=HlnGRJhO-9I)
- [GitHub - bartekpacia/pendulum](https://github.com/bartekpacia/pendulum)
- [Angle Finder using OpenCV Python (2020) p.1 - YouTube](https://www.youtube.com/watch?v=NmRt9kdUefk)
- [GitHub - arantxax/pendulumtracker: Script to indentify a simple pendulum's movement (velocity, acceleration and so on).](https://github.com/arantxax/pendulumtracker)
- [AINT308 Task 2 - Open CV pendulum tracker - YouTube](https://www.youtube.com/watch?v=sqGeK1Bl9FA)

### OpenCV Guide

- [OpenCV: OpenCV modules](https://docs.opencv.org/4.4.0/)
- [OpenCV 101: A practical guide to the Open Computer Vision Library](https://casis.llnl.gov/seminars/opencv)
- [一小时学习python和opencv #python #opencv - YouTube](https://www.youtube.com/watch?v=HHVPK1GqV54)
- [Object Tracking using OpenCV (C++/Python)](https://learnopencv.com/object-tracking-using-opencv-cpp-python/)
- [OpenCV Object Tracking - PyImageSearch](https://www.pyimagesearch.com/2018/07/30/opencv-object-tracking/)
- [OpenCV Track Object Movement - PyImageSearch](https://www.pyimagesearch.com/2015/09/21/opencv-track-object-movement/)
- [Object Tracking with Opencv and Python - YouTube](https://www.youtube.com/watch?v=O3b8lVF93jU)
- [Tracking Objects | OpenCV Python Tutorials for Beginners 2020 - YouTube](https://www.youtube.com/watch?v=1FJWXOO1SRI)
- [OpenCV Vehicle Detection, Tracking, and Speed Estimation - PyImageSearch](https://www.pyimagesearch.com/2019/12/02/opencv-vehicle-detection-tracking-and-speed-estimation/)
- [How do I detect the speed of a car with opencv and python?](https://www.researchgate.net/post/How_do_I_detect_the_speed_of_a_car_with_opencv_and_python)
- [Real-time object detection with deep learning and OpenCV - PyImageSearch](https://www.pyimagesearch.com/2017/09/18/real-time-object-detection-with-deep-learning-and-opencv/)
- [Speed and Distance Estimation using Opencv python - YouTube](https://www.youtube.com/watch?v=DIxcLghsQ4Q)
- [Basic motion detection and tracking with Python and OpenCV - PyImageSearch](https://www.pyimagesearch.com/2015/05/25/basic-motion-detection-and-tracking-with-python-and-opencv/)
- [Detect Speed with With Raspberry Pi and a Camera - OpenCV - YouTube](https://www.youtube.com/watch?v=n2WT3Qb0SIU)

### Pre-compiled OpenCV

- [prepkg/opencv-raspberrypi: Precompiled OpenCV 4.5.4 binaries for Raspberry Pi 3 & 4](https://github.com/prepkg/opencv-raspberrypi)
- [dlime/Faster_OpenCV_4_Raspberry_Pi: A pre-compiled version of OpenCV 4 for Raspberry Pi optimized for deep learning / computer vision..](https://github.com/dlime/Faster_OpenCV_4_Raspberry_Pi)

### Dlib

- [Install Precompiled Dlib on Raspberry Pi | Lindevs](https://lindevs.com/install-precompiled-dlib-on-raspberry-pi/)
- [charlielito/install-dlib-python-windows: Easy installation of dlib python bindings in windows](https://github.com/charlielito/install-dlib-python-windows)

### Web Camera

- [misterjtc/raspberrypi_security: RaspberryPi Configuration to use v4l2rtspserver and Shinobi](https://github.com/misterjtc/raspberrypi_security)
- [mpromonet/v4l2rtspserver: RTSP Server for V4L2 device capture supporting HEVC/H264/JPEG/VP8/VP9](https://github.com/mpromonet/v4l2rtspserver)
- [How To Add Raspberry Pi RTSP Camera Stream To Home Assistant – Siytek](https://siytek.com/raspberry-pi-rtsp-to-home-assistant/)

```bash
v4l2rtspserver -W 640 -H 480 -F 24 -P 8554 /dev/video0
```

### UV4L

- [UV4L – (advanced) Projects](https://www.linux-projects.org/uv4l/)
- [Raspberry Pi h264 RTSP Low Latency Camera Instructions — Ben Software Forum](https://www.bensoftware.com/forum/discussion/3254/raspberry-pi-h264-rtsp-low-latency-camera-instructions)
- [Installation for ARM (Raspberry Pi) – (advanced) Projects](https://www.linux-projects.org/uv4l/installation/)

### Rasp

1. wpa_supplicant
2. ssh
3. [raspbian | 镜像站使用帮助 | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/help/raspbian/)
4. raspi-config

```bash
sudo apt-get install cmake liblog4cpp5-dev libv4l-dev git -y
```

[Install OpenCV 4 on Raspberry Pi 4 and Raspbian Buster - PyImageSearch](https://www.pyimagesearch.com/2019/09/16/install-opencv-4-on-raspberry-pi-4-and-raspbian-buster/)

192.168.137.73
192.168.137.167

```bash
sudo systemctl stop v4l2rtspserver
```

### Config video

```bash
/lib/systemd/system/v4l2rtspserver.service
```

[UV4L deletes all /dev/video* and can't pick H.264 stream of the UVC USB camera - Raspberry Pi Forums](https://forums.raspberrypi.com/viewtopic.php?t=240200)

```bash
v4l2-ctl --list-devices
```

```bash
for d in /dev/video* ; do echo $d ; v4l2-ctl --device=$d -D --list-formats  ; echo '===============' ; done
```

```bash
v4l2-ctl --device=/dev/video0 -D --list-formats
```

```bash
rfkill block wifi
```

```bash
uv4l_raspicam.service
```

### Bootstrap

[html - How do i make Bootstrap columns responsive on all devices? - Stack Overflow](https://stackoverflow.com/questions/39645768/how-do-i-make-bootstrap-columns-responsive-on-all-devices/39653352)

### Object Tracking

#### MOG background subtractor

[PacktPublishing/Learning-OpenCV-4-Computer-Vision-with-Python-Third-Edition: Learning OpenCV 4 Computer Vision with Python 3 – Third Edition, published by Packt](https://github.com/PacktPublishing/Learning-OpenCV-4-Computer-Vision-with-Python-Third-Edition)

#### KNN background subtractor

#### MeanShift

The proto-objects identified by the saliency detector will
serve as input to the mean-shift tracker.

[python - Choosing the correct upper and lower HSV boundaries for color detection with`cv::inRange` (OpenCV) - Stack Overflow](https://stackoverflow.com/questions/10948589/choosing-the-correct-upper-and-lower-hsv-boundaries-for-color-detection-withcv)

**OBJECT MUST STAY IN ROI BEFORE CAPTURE!**

#### CamShift

#### Optical Flow

#### error while decoding mb bytestream opencv

- [python - OpenCV cv2.VideoCapture() stopping to read RTSP IP camera - Stack Overflow](https://stackoverflow.com/questions/54754291/opencv-cv2-videocapture-stopping-to-read-rtsp-ip-camera)
- [opencv - ffmpeg RTSP error while decoding MB - Stack Overflow](https://stackoverflow.com/questions/50063707/ffmpeg-rtsp-error-while-decoding-mb)

FFMPEG Lib does not support H264 videos in the rtsp protocol, so the solution is to write two different threads to process the images of each frame separately, and then another thread to process the images of each frame. 

If you are unable to access the camera or get corrupted frames, you can catch this with cv2.error

adding `?tcp` to the end forces the rtsp connection to run using the tcp protocol instead of the udp protocol which is useful if you do not actively check for any connection problem and therefore you can't afford to have any packet loss.

- [MultiTracker : Multiple Object Tracking using OpenCV (C++/Python) | LearnOpenCV #](https://learnopencv.com/multitracker-multiple-object-tracking-using-opencv-c-python/)
- [Learn Object Tracking in OpenCV Python with Code Examples - MLK - Machine Learning Knowledge](https://machinelearningknowledge.ai/learn-object-tracking-in-opencv-python-with-code-examples/)
- [Object Detection and Tracking in 2020 | by Borijan Georgievski | Netcetera Tech Blog](https://blog.netcetera.com/object-detection-and-tracking-in-2020-f10fb6ff9af3)
- [OpenCV Track Object Movement - PyImageSearch](https://www.pyimagesearch.com/2015/09/21/opencv-track-object-movement/)
- [python - Numpy Two-Dimensional Moving Average - Stack Overflow](https://stackoverflow.com/questions/23000260/numpy-two-dimensional-moving-average)
- [python - Numpy import error Python3 on Raspberry Pi? - Stack Overflow](https://stackoverflow.com/questions/53784520/numpy-import-error-python3-on-raspberry-pi)
- [Kalman filtering for selected points in an image using OpenCV cv2.kalmanFilter class in Python. Returns predicted points.](https://gist.github.com/epiception/ac8195435976f6d2356869589b7157de)
- [javascript - Filter array to have unique values - Stack Overflow](https://stackoverflow.com/questions/38206915/filter-array-to-have-unique-values)
- [Set - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)