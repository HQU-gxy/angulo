from flask import Flask, render_template, Response
from pykalman import KalmanFilter
from typing import Tuple
import cv2
import time
import threading
import queue
import collections
import numpy as np

app = Flask(__name__, static_url_path='', static_folder='static')

# alt_cam_url = "rtsp://127.0.0.1:8554/unicast"
alt_cam_url = 0
class AltCamera(object):
    def __init__(self, url): 
        self.url = url
        # self.cap = cv2.VideoCapture(url)

    def gen_frames(self):
        """Generate frame by OpenCV from video soure by camera id"""

        def drawText(text: str,
                    color: Tuple[int, int, int],
                    pos: Tuple[int, int],
                    big=False,
                    console=False):
            if console:
                print(text)

            if big:
                scale = 1
                thickness = 4
            else:
                scale = 0.6
                thickness = 2
            cv2.putText(frame, str(text), org=pos, fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=scale, color=color, thickness=3)

        bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

        time_start = time.time()

        cap = cv2.VideoCapture(self.url)
        success, frame = cap.read()  # read the camera frame
        pts_max = 25
        pts = collections.deque(maxlen=pts_max)
        while True:
            # for cap in caps:
            # # Capture frame-by-frame
            if not success:
                break
            else:
                # ret, buffer = cv2.imencode('.jpg', frame)

                fg_mask = bg_subtractor.apply(frame)
                _, thresh = cv2.threshold(fg_mask, 244, 255, cv2.THRESH_BINARY)
                cv2.erode(thresh, erode_kernel, thresh, iterations=2)
                cv2.dilate(thresh, dilate_kernel, thresh, iterations=2)
                time_total = round(time.time() - time_start, 2)
                contours, hier = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                                cv2.CHAIN_APPROX_SIMPLE)
                if len(contours) > 0:
                    c = max(contours, key=cv2.contourArea)
                    x, y, w, h = cv2.boundingRect(c)
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 0), 2)
                    M = cv2.moments(c)
                    center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
                    cv2.circle(frame, center, 5, (0, 0, 255), -1)
                    pts.appendleft(center)
                    # loop over the set of tracked points
                    # add tail for center point
                    for i in np.arange(1, len(pts)):
                        thickness = int(np.sqrt(pts_max / float(i + 1)) * 2.5)
                        cv2.line(frame, pts[i - 1], pts[i], (0, 0, 255), thickness)

                # for c in contours:
                #     if cv2.contourArea(c) > 1000:
                #         x, y, w, h = cv2.boundingRect(c)
                #         cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 0), 2)
                #         cv2.drawContours(frame, c, 0, (0,255,0), 2)
                drawText(f"total: {time_total}", (0, 255, 0), (120, 40))

                ret, buffer = cv2.imencode('.jpg', frame)
                framebytes = buffer.tobytes()
                yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + framebytes + b'\r\n')
                success, frame = cap.read()
                # concat frame one by one and show result

alt_cam = AltCamera(alt_cam_url)

@app.route('/video_feed/<string:id>/', methods=["GET"])
def video_feed(id):
    return Response(alt_cam.gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
